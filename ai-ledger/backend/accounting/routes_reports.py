"""Financial reporting routes: P&L, balance sheet, cash flow, aging, exports."""

import io
import json
import logging
from datetime import datetime, date
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..database import get_db
from ..models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/accounting", tags=["accounting-reports"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ExportRequest(BaseModel):
    report_type: str = Field(...)  # profit_loss, balance_sheet, etc.
    format: str = Field(default="csv")  # csv, pdf, excel
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    currency: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def verify_org_access(db, org_id: str, user_id: str) -> dict:
    org = await db.fetchrow("SELECT * FROM organizations WHERE id = $1", org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    member = await db.fetchrow(
        "SELECT * FROM org_members WHERE org_id = $1 AND user_id = $2", org_id, user_id
    )
    if not member and org.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied to this organization")
    return dict(org)


async def audit_log(db, org_id: str, user_id: str, action: str, entity_type: str,
                    entity_id: str, details: Optional[dict] = None):
    await db.execute(
        """INSERT INTO audit_log (id, org_id, user_id, action, entity_type,
           entity_id, details, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
        str(uuid4()), org_id, user_id, action, entity_type, entity_id,
        details or {}, datetime.utcnow(),
    )


async def get_account_balances(db, org_id: str, date_to: date,
                               date_from: Optional[date] = None,
                               account_types: Optional[list[str]] = None) -> list[dict]:
    """Get balances for accounts by summing posted journal lines."""
    query = """
        SELECT a.id, a.code, a.name, a.account_type, a.parent_id,
               COALESCE(SUM(jl.debit), 0) as total_debit,
               COALESCE(SUM(jl.credit), 0) as total_credit,
               COALESCE(SUM(jl.debit) - SUM(jl.credit), 0) as balance
        FROM accounts a
        LEFT JOIN journal_lines jl ON jl.account_id = a.id
        LEFT JOIN journals j ON j.id = jl.journal_id AND j.status = 'posted'
            AND j.date <= $2
    """
    params: list = [org_id, date_to]
    idx = 3

    if date_from:
        query += f" AND j.date >= ${idx}"
        params.append(date_from)
        idx += 1

    query += " WHERE a.org_id = $1 AND a.is_active = true"

    if account_types:
        placeholders = ", ".join(f"${idx + i}" for i in range(len(account_types)))
        query += f" AND a.account_type IN ({placeholders})"
        params.extend(account_types)
        idx += len(account_types)

    query += " GROUP BY a.id, a.code, a.name, a.account_type, a.parent_id ORDER BY a.code"
    rows = await db.fetch(query, *params)
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Report routes
# ---------------------------------------------------------------------------

@router.get("/organizations/{org_id}/reports/profit-loss")
async def profit_loss_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
    compare_from: Optional[date] = None,
    compare_to: Optional[date] = None,
):
    """Generate Profit & Loss (Income) statement."""
    org = await verify_org_access(db, org_id, user.id)

    revenue = await get_account_balances(db, org_id, date_to, date_from, ["revenue"])
    expenses = await get_account_balances(db, org_id, date_to, date_from, ["expense"])

    # Revenue has natural credit balance, so negate for display
    total_revenue = sum(abs(float(a["balance"])) for a in revenue)
    total_expenses = sum(abs(float(a["balance"])) for a in expenses)
    net_profit = total_revenue - total_expenses

    result = {
        "report": "profit_loss",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "period": {"from": date_from.isoformat(), "to": date_to.isoformat()},
        "revenue": {"accounts": revenue, "total": round(total_revenue, 2)},
        "expenses": {"accounts": expenses, "total": round(total_expenses, 2)},
        "net_profit": round(net_profit, 2),
        "generated_at": datetime.utcnow().isoformat(),
    }

    # Comparison period
    if compare_from and compare_to:
        prev_revenue = await get_account_balances(db, org_id, compare_to, compare_from, ["revenue"])
        prev_expenses = await get_account_balances(db, org_id, compare_to, compare_from, ["expense"])
        prev_total_rev = sum(abs(float(a["balance"])) for a in prev_revenue)
        prev_total_exp = sum(abs(float(a["balance"])) for a in prev_expenses)
        prev_net = prev_total_rev - prev_total_exp

        result["comparison"] = {
            "period": {"from": compare_from.isoformat(), "to": compare_to.isoformat()},
            "revenue": round(prev_total_rev, 2),
            "expenses": round(prev_total_exp, 2),
            "net_profit": round(prev_net, 2),
            "revenue_change": round(total_revenue - prev_total_rev, 2),
            "expense_change": round(total_expenses - prev_total_exp, 2),
            "profit_change": round(net_profit - prev_net, 2),
        }

    await audit_log(db, org_id, user.id, "generate", "report", "profit_loss")
    return result


@router.get("/organizations/{org_id}/reports/balance-sheet")
async def balance_sheet_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    as_of: date = Query(...),
):
    """Generate Balance Sheet as of a specific date."""
    org = await verify_org_access(db, org_id, user.id)

    assets = await get_account_balances(db, org_id, as_of, account_types=["asset"])
    liabilities = await get_account_balances(db, org_id, as_of, account_types=["liability"])
    equity = await get_account_balances(db, org_id, as_of, account_types=["equity"])

    total_assets = sum(float(a["balance"]) for a in assets)
    total_liabilities = abs(sum(float(a["balance"]) for a in liabilities))
    total_equity = abs(sum(float(a["balance"]) for a in equity))

    # Retained earnings = total revenue - total expenses (all time up to as_of)
    revenue = await get_account_balances(db, org_id, as_of, account_types=["revenue"])
    expenses = await get_account_balances(db, org_id, as_of, account_types=["expense"])
    retained_earnings = sum(abs(float(a["balance"])) for a in revenue) - sum(abs(float(a["balance"])) for a in expenses)

    await audit_log(db, org_id, user.id, "generate", "report", "balance_sheet")
    return {
        "report": "balance_sheet",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "as_of": as_of.isoformat(),
        "assets": {"accounts": assets, "total": round(total_assets, 2)},
        "liabilities": {"accounts": liabilities, "total": round(total_liabilities, 2)},
        "equity": {
            "accounts": equity,
            "retained_earnings": round(retained_earnings, 2),
            "total": round(total_equity + retained_earnings, 2),
        },
        "total_liabilities_and_equity": round(total_liabilities + total_equity + retained_earnings, 2),
        "balanced": abs(total_assets - (total_liabilities + total_equity + retained_earnings)) < 0.01,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/reports/cash-flow")
async def cash_flow_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
):
    """Generate Cash Flow statement."""
    org = await verify_org_access(db, org_id, user.id)

    # Cash flow from operations: net profit + non-cash adjustments
    revenue = await get_account_balances(db, org_id, date_to, date_from, ["revenue"])
    expenses = await get_account_balances(db, org_id, date_to, date_from, ["expense"])
    net_profit = sum(abs(float(a["balance"])) for a in revenue) - sum(abs(float(a["balance"])) for a in expenses)

    # Cash movements from bank accounts
    cash_movements = await db.fetch(
        """SELECT a.name, a.code,
               COALESCE(SUM(jl.debit), 0) as cash_in,
               COALESCE(SUM(jl.credit), 0) as cash_out
           FROM accounts a
           JOIN journal_lines jl ON jl.account_id = a.id
           JOIN journals j ON j.id = jl.journal_id
           WHERE a.org_id = $1 AND a.account_type = 'asset'
           AND a.code LIKE '1%'
           AND j.status = 'posted' AND j.date >= $2 AND j.date <= $3
           GROUP BY a.id, a.name, a.code
           ORDER BY a.code""",
        org_id, date_from, date_to,
    )

    total_cash_in = sum(float(m["cash_in"]) for m in cash_movements)
    total_cash_out = sum(float(m["cash_out"]) for m in cash_movements)

    await audit_log(db, org_id, user.id, "generate", "report", "cash_flow")
    return {
        "report": "cash_flow",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "period": {"from": date_from.isoformat(), "to": date_to.isoformat()},
        "operating": {
            "net_profit": round(net_profit, 2),
            "cash_in": round(total_cash_in, 2),
            "cash_out": round(total_cash_out, 2),
            "net_cash_flow": round(total_cash_in - total_cash_out, 2),
        },
        "cash_accounts": [dict(m) for m in cash_movements],
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/reports/trial-balance")
async def trial_balance_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    as_of: date = Query(...),
):
    """Generate Trial Balance."""
    org = await verify_org_access(db, org_id, user.id)
    accounts = await get_account_balances(db, org_id, as_of)

    total_debits = sum(float(a["total_debit"]) for a in accounts)
    total_credits = sum(float(a["total_credit"]) for a in accounts)

    await audit_log(db, org_id, user.id, "generate", "report", "trial_balance")
    return {
        "report": "trial_balance",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "as_of": as_of.isoformat(),
        "accounts": accounts,
        "total_debits": round(total_debits, 2),
        "total_credits": round(total_credits, 2),
        "balanced": abs(total_debits - total_credits) < 0.01,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/reports/general-ledger")
async def general_ledger_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
    account_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """Generate General Ledger report."""
    org = await verify_org_access(db, org_id, user.id)

    query = """
        SELECT jl.*, j.date, j.reference, j.narration, j.status as journal_status,
               a.code as account_code, a.name as account_name
        FROM journal_lines jl
        JOIN journals j ON j.id = jl.journal_id
        JOIN accounts a ON a.id = jl.account_id
        WHERE j.org_id = $1 AND j.status = 'posted'
        AND j.date >= $2 AND j.date <= $3
    """
    count_query = """
        SELECT count(*)
        FROM journal_lines jl
        JOIN journals j ON j.id = jl.journal_id
        WHERE j.org_id = $1 AND j.status = 'posted'
        AND j.date >= $2 AND j.date <= $3
    """
    params: list = [org_id, date_from, date_to]
    idx = 4

    if account_id:
        query += f" AND jl.account_id = ${idx}"
        count_query += f" AND jl.account_id = ${idx}"
        params.append(account_id)
        idx += 1

    total = await db.fetchval(count_query, *params)

    offset = (page - 1) * page_size
    query += f" ORDER BY j.date, j.created_at, jl.line_number LIMIT ${idx} OFFSET ${idx+1}"
    params.extend([page_size, offset])

    rows = await db.fetch(query, *params)

    await audit_log(db, org_id, user.id, "generate", "report", "general_ledger")
    return {
        "report": "general_ledger",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "period": {"from": date_from.isoformat(), "to": date_to.isoformat()},
        "entries": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/reports/aged-receivables")
async def aged_receivables_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    as_of: Optional[date] = None,
):
    """Generate Accounts Receivable aging report."""
    org = await verify_org_access(db, org_id, user.id)
    report_date = as_of or date.today()

    rows = await db.fetch(
        """SELECT i.*, c.name as contact_name
           FROM invoices i
           LEFT JOIN contacts c ON c.id = i.contact_id
           WHERE i.org_id = $1 AND i.invoice_type = 'sales'
           AND i.status NOT IN ('draft', 'void', 'paid')
           AND i.amount_due > 0
           ORDER BY i.due_date""",
        org_id,
    )

    buckets = {"current": [], "1_30": [], "31_60": [], "61_90": [], "over_90": []}
    for inv in rows:
        inv = dict(inv)
        days = (report_date - inv["due_date"]).days
        if days <= 0:
            buckets["current"].append(inv)
        elif days <= 30:
            buckets["1_30"].append(inv)
        elif days <= 60:
            buckets["31_60"].append(inv)
        elif days <= 90:
            buckets["61_90"].append(inv)
        else:
            buckets["over_90"].append(inv)

    summary = {}
    total = 0.0
    for bucket, items in buckets.items():
        bucket_total = sum(float(i.get("amount_due", 0)) for i in items)
        summary[bucket] = {"count": len(items), "total": round(bucket_total, 2), "invoices": items}
        total += bucket_total

    await audit_log(db, org_id, user.id, "generate", "report", "aged_receivables")
    return {
        "report": "aged_receivables",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "as_of": report_date.isoformat(),
        "buckets": summary,
        "total_outstanding": round(total, 2),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/reports/aged-payables")
async def aged_payables_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    as_of: Optional[date] = None,
):
    """Generate Accounts Payable aging report."""
    org = await verify_org_access(db, org_id, user.id)
    report_date = as_of or date.today()

    rows = await db.fetch(
        """SELECT i.*, c.name as contact_name
           FROM invoices i
           LEFT JOIN contacts c ON c.id = i.contact_id
           WHERE i.org_id = $1 AND i.invoice_type = 'purchase'
           AND i.status NOT IN ('draft', 'void', 'paid')
           AND i.amount_due > 0
           ORDER BY i.due_date""",
        org_id,
    )

    buckets = {"current": [], "1_30": [], "31_60": [], "61_90": [], "over_90": []}
    for inv in rows:
        inv = dict(inv)
        days = (report_date - inv["due_date"]).days
        if days <= 0:
            buckets["current"].append(inv)
        elif days <= 30:
            buckets["1_30"].append(inv)
        elif days <= 60:
            buckets["31_60"].append(inv)
        elif days <= 90:
            buckets["61_90"].append(inv)
        else:
            buckets["over_90"].append(inv)

    summary = {}
    total = 0.0
    for bucket, items in buckets.items():
        bucket_total = sum(float(i.get("amount_due", 0)) for i in items)
        summary[bucket] = {"count": len(items), "total": round(bucket_total, 2), "invoices": items}
        total += bucket_total

    await audit_log(db, org_id, user.id, "generate", "report", "aged_payables")
    return {
        "report": "aged_payables",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "as_of": report_date.isoformat(),
        "buckets": summary,
        "total_outstanding": round(total, 2),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/reports/tax-summary")
async def tax_summary_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
):
    """Generate Tax Summary by jurisdiction."""
    org = await verify_org_access(db, org_id, user.id)

    # Tax collected on sales
    sales_tax = await db.fetch(
        """SELECT il.tax_code, tc.name as tax_name, tc.jurisdiction, tc.rate,
                  SUM(il.tax_amount) as total_tax, SUM(il.subtotal) as taxable_amount
           FROM invoice_lines il
           JOIN invoices i ON i.id = il.invoice_id
           LEFT JOIN tax_codes tc ON tc.code = il.tax_code AND tc.org_id = i.org_id
           WHERE i.org_id = $1 AND i.invoice_type = 'sales'
           AND i.status NOT IN ('draft', 'void')
           AND i.date >= $2 AND i.date <= $3
           AND il.tax_code IS NOT NULL
           GROUP BY il.tax_code, tc.name, tc.jurisdiction, tc.rate
           ORDER BY tc.jurisdiction, il.tax_code""",
        org_id, date_from, date_to,
    )

    # Tax on purchases
    purchase_tax = await db.fetch(
        """SELECT il.tax_code, tc.name as tax_name, tc.jurisdiction, tc.rate,
                  SUM(il.tax_amount) as total_tax, SUM(il.subtotal) as taxable_amount
           FROM invoice_lines il
           JOIN invoices i ON i.id = il.invoice_id
           LEFT JOIN tax_codes tc ON tc.code = il.tax_code AND tc.org_id = i.org_id
           WHERE i.org_id = $1 AND i.invoice_type = 'purchase'
           AND i.status NOT IN ('draft', 'void')
           AND i.date >= $2 AND i.date <= $3
           AND il.tax_code IS NOT NULL
           GROUP BY il.tax_code, tc.name, tc.jurisdiction, tc.rate
           ORDER BY tc.jurisdiction, il.tax_code""",
        org_id, date_from, date_to,
    )

    total_output = sum(float(r["total_tax"]) for r in sales_tax)
    total_input = sum(float(r["total_tax"]) for r in purchase_tax)

    await audit_log(db, org_id, user.id, "generate", "report", "tax_summary")
    return {
        "report": "tax_summary",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "period": {"from": date_from.isoformat(), "to": date_to.isoformat()},
        "output_tax": {"items": [dict(r) for r in sales_tax], "total": round(total_output, 2)},
        "input_tax": {"items": [dict(r) for r in purchase_tax], "total": round(total_input, 2)},
        "net_tax": round(total_output - total_input, 2),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/reports/treaty-savings")
async def treaty_savings_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    """Generate Treaty Benefit Summary report."""
    org = await verify_org_access(db, org_id, user.id)

    # Pull from audit log for treaty analysis actions
    query = """
        SELECT details, created_at FROM audit_log
        WHERE org_id = $1 AND entity_type = 'treaty' AND action = 'analyze'
    """
    params: list = [org_id]
    idx = 2
    if date_from:
        query += f" AND created_at >= ${idx}"
        params.append(datetime.combine(date_from, datetime.min.time()))
        idx += 1
    if date_to:
        query += f" AND created_at <= ${idx}"
        params.append(datetime.combine(date_to, datetime.max.time()))
        idx += 1
    query += " ORDER BY created_at DESC"

    rows = await db.fetch(query, *params)

    await audit_log(db, org_id, user.id, "generate", "report", "treaty_savings")
    return {
        "report": "treaty_savings",
        "organization": org.get("name"),
        "analyses": [dict(r) for r in rows],
        "total_analyses": len(rows),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/reports/budget-vs-actual")
async def budget_vs_actual_report(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
):
    """Generate Budget vs Actual comparison report."""
    org = await verify_org_access(db, org_id, user.id)

    # Get budgets for the period
    budgets = await db.fetch(
        """SELECT b.*, a.code as account_code, a.name as account_name, a.account_type
           FROM budgets b
           JOIN accounts a ON a.id = b.account_id
           WHERE b.org_id = $1 AND b.period_start >= $2 AND b.period_end <= $3
           ORDER BY a.code""",
        org_id, date_from, date_to,
    )

    # Get actual amounts
    actuals = await get_account_balances(db, org_id, date_to, date_from)
    actual_map = {a["id"]: a for a in actuals}

    comparisons = []
    for budget in budgets:
        budget = dict(budget)
        actual = actual_map.get(budget.get("account_id"), {})
        actual_amount = abs(float(actual.get("balance", 0)))
        budget_amount = float(budget.get("amount", 0))
        variance = round(budget_amount - actual_amount, 2)
        variance_pct = round((variance / budget_amount * 100), 2) if budget_amount else 0

        comparisons.append({
            "account_code": budget.get("account_code"),
            "account_name": budget.get("account_name"),
            "account_type": budget.get("account_type"),
            "budget": budget_amount,
            "actual": round(actual_amount, 2),
            "variance": variance,
            "variance_percent": variance_pct,
            "over_budget": variance < 0,
        })

    await audit_log(db, org_id, user.id, "generate", "report", "budget_vs_actual")
    return {
        "report": "budget_vs_actual",
        "organization": org.get("name"),
        "currency": org.get("base_currency", "NZD"),
        "period": {"from": date_from.isoformat(), "to": date_to.isoformat()},
        "comparisons": comparisons,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.post("/organizations/{org_id}/reports/export")
async def export_report(
    org_id: str,
    body: ExportRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Export a report in the specified format (CSV, PDF, Excel)."""
    org = await verify_org_access(db, org_id, user.id)

    # Generate the report data
    report_generators = {
        "trial_balance": lambda: get_account_balances(db, org_id, body.date_to or date.today()),
        "general_ledger": lambda: db.fetch(
            """SELECT jl.*, j.date, j.reference, a.code, a.name
               FROM journal_lines jl
               JOIN journals j ON j.id = jl.journal_id
               JOIN accounts a ON a.id = jl.account_id
               WHERE j.org_id = $1 AND j.status = 'posted'
               ORDER BY j.date, jl.line_number""",
            org_id,
        ),
    }

    if body.report_type not in report_generators and body.report_type not in (
        "profit_loss", "balance_sheet", "cash_flow", "aged_receivables",
        "aged_payables", "tax_summary", "treaty_savings", "budget_vs_actual",
    ):
        raise HTTPException(status_code=400, detail=f"Unknown report type: {body.report_type}")

    if body.format == "csv":
        # Generate CSV
        if body.report_type in report_generators:
            data = await report_generators[body.report_type]()
        else:
            data = await get_account_balances(db, org_id, body.date_to or date.today(),
                                              body.date_from)

        rows = [dict(r) for r in data] if data else []
        if not rows:
            raise HTTPException(status_code=404, detail="No data for this report")

        import csv
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
        content = output.getvalue()

        await audit_log(db, org_id, user.id, "export", "report", body.report_type,
                        {"format": "csv"})
        return StreamingResponse(
            io.BytesIO(content.encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={body.report_type}.csv"},
        )

    elif body.format == "excel":
        try:
            import openpyxl
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = body.report_type

            if body.report_type in report_generators:
                data = await report_generators[body.report_type]()
            else:
                data = await get_account_balances(db, org_id, body.date_to or date.today(),
                                                  body.date_from)

            rows = [dict(r) for r in data] if data else []
            if rows:
                headers = list(rows[0].keys())
                ws.append(headers)
                for row in rows:
                    ws.append([str(row.get(h, "")) for h in headers])

            buffer = io.BytesIO()
            wb.save(buffer)
            buffer.seek(0)

            await audit_log(db, org_id, user.id, "export", "report", body.report_type,
                            {"format": "excel"})
            return StreamingResponse(
                buffer,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={body.report_type}.xlsx"},
            )
        except ImportError:
            raise HTTPException(status_code=501, detail="Excel export unavailable: openpyxl not installed")

    elif body.format == "pdf":
        raise HTTPException(status_code=501, detail="PDF report export not yet implemented")

    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use csv, excel, or pdf")
