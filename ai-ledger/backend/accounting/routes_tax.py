"""Tax management routes: tax codes, returns, treaties, compliance, withholding."""

from datetime import datetime, date
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/api/accounting", tags=["accounting-tax"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TaxCodeCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    rate: float = Field(..., ge=0, le=100)
    jurisdiction: str = Field(..., min_length=2)
    tax_type: str = Field(default="GST")  # GST, VAT, sales_tax, etc.
    description: Optional[str] = None
    is_active: bool = True


class TaxReturnCalculateRequest(BaseModel):
    period_start: date
    period_end: date
    return_type: str = Field(...)  # GST, BAS, VAT
    filing_basis: str = Field(default="accrual")  # accrual, cash


class TaxReturnFileRequest(BaseModel):
    filing_reference: Optional[str] = None
    filed_date: Optional[date] = None
    notes: Optional[str] = None


class TreatyAnalysisRequest(BaseModel):
    income_country: str = Field(..., min_length=2, max_length=10)
    income_type: str  # dividends, interest, royalties, services, etc.
    amount: float = Field(..., gt=0)
    currency: str = Field(default="NZD", min_length=3, max_length=3)


class WithholdingCalculateRequest(BaseModel):
    source_country: str = Field(..., min_length=2, max_length=10)
    recipient_country: str = Field(..., min_length=2, max_length=10)
    income_type: str
    gross_amount: float = Field(..., gt=0)
    currency: str = Field(default="NZD", min_length=3, max_length=3)


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


# Default treaty rates (subset for common NZ treaties)
TREATY_RATES = {
    ("NZ", "AU"): {"dividends": 15, "interest": 10, "royalties": 5},
    ("NZ", "US"): {"dividends": 15, "interest": 10, "royalties": 5},
    ("NZ", "GB"): {"dividends": 15, "interest": 10, "royalties": 10},
    ("NZ", "SG"): {"dividends": 5, "interest": 10, "royalties": 5},
    ("NZ", "JP"): {"dividends": 15, "interest": 10, "royalties": 5},
    ("NZ", "DE"): {"dividends": 15, "interest": 10, "royalties": 10},
    ("NZ", "CA"): {"dividends": 15, "interest": 10, "royalties": 5},
    ("NZ", "CN"): {"dividends": 15, "interest": 10, "royalties": 10},
}

DEFAULT_WITHHOLDING_RATE = 30  # Non-treaty rate


# ---------------------------------------------------------------------------
# Tax Code routes
# ---------------------------------------------------------------------------

@router.get("/organizations/{org_id}/tax-codes")
async def list_tax_codes(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    active_only: bool = True,
):
    org = await verify_org_access(db, org_id, user.id)

    query = "SELECT * FROM tax_codes WHERE org_id = $1"
    params: list = [org_id]
    if active_only:
        query += " AND is_active = $2"
        params.append(True)
    query += " ORDER BY code"

    rows = await db.fetch(query, *params)

    # Also include system defaults for the jurisdiction if no custom codes exist
    if not rows:
        jurisdiction = org.get("jurisdiction", "NZ")
        defaults = _get_default_tax_codes(jurisdiction)
        return {"items": defaults, "source": "defaults", "jurisdiction": jurisdiction}

    return {"items": [dict(r) for r in rows], "source": "custom"}


@router.post("/organizations/{org_id}/tax-codes", status_code=status.HTTP_201_CREATED)
async def create_tax_code(
    org_id: str,
    body: TaxCodeCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)

    existing = await db.fetchrow(
        "SELECT id FROM tax_codes WHERE org_id = $1 AND code = $2", org_id, body.code
    )
    if existing:
        raise HTTPException(status_code=409, detail="Tax code already exists in this organization")

    tax_id = str(uuid4())
    now = datetime.utcnow()
    await db.execute(
        """INSERT INTO tax_codes
           (id, org_id, code, name, rate, jurisdiction, tax_type,
            description, is_active, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)""",
        tax_id, org_id, body.code, body.name, body.rate, body.jurisdiction,
        body.tax_type, body.description, body.is_active, now,
    )
    await audit_log(db, org_id, user.id, "create", "tax_code", tax_id)
    return {"id": tax_id, "code": body.code, "rate": body.rate}


def _get_default_tax_codes(jurisdiction: str) -> list[dict]:
    """Return default tax codes for a jurisdiction."""
    codes = {
        "NZ": [
            {"code": "GST15", "name": "GST 15%", "rate": 15.0, "tax_type": "GST"},
            {"code": "GST0", "name": "GST Zero-Rated", "rate": 0.0, "tax_type": "GST"},
            {"code": "GSTEX", "name": "GST Exempt", "rate": 0.0, "tax_type": "GST"},
        ],
        "AU": [
            {"code": "GST10", "name": "GST 10%", "rate": 10.0, "tax_type": "GST"},
            {"code": "GST0", "name": "GST Free", "rate": 0.0, "tax_type": "GST"},
            {"code": "INPUT", "name": "Input Taxed", "rate": 0.0, "tax_type": "GST"},
        ],
        "GB": [
            {"code": "VAT20", "name": "Standard Rate 20%", "rate": 20.0, "tax_type": "VAT"},
            {"code": "VAT5", "name": "Reduced Rate 5%", "rate": 5.0, "tax_type": "VAT"},
            {"code": "VAT0", "name": "Zero Rate", "rate": 0.0, "tax_type": "VAT"},
        ],
    }
    return codes.get(jurisdiction, [
        {"code": "TAX0", "name": "No Tax", "rate": 0.0, "tax_type": "NONE"},
    ])


# ---------------------------------------------------------------------------
# Tax Return routes
# ---------------------------------------------------------------------------

@router.post("/organizations/{org_id}/tax-returns/calculate")
async def calculate_tax_return(
    org_id: str,
    body: TaxReturnCalculateRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    org = await verify_org_access(db, org_id, user.id)

    if body.period_end < body.period_start:
        raise HTTPException(status_code=400, detail="period_end must be after period_start")

    # Calculate GST/VAT collected on sales
    sales_tax = await db.fetchrow(
        """SELECT COALESCE(SUM(il.tax_amount), 0) as total_tax,
                  COALESCE(SUM(il.subtotal), 0) as total_sales
           FROM invoice_lines il
           JOIN invoices i ON i.id = il.invoice_id
           WHERE i.org_id = $1 AND i.invoice_type = 'sales'
           AND i.status NOT IN ('draft', 'void')
           AND i.date >= $2 AND i.date <= $3""",
        org_id, body.period_start, body.period_end,
    )

    # Calculate GST/VAT on purchases (input credits)
    purchase_tax = await db.fetchrow(
        """SELECT COALESCE(SUM(il.tax_amount), 0) as total_tax,
                  COALESCE(SUM(il.subtotal), 0) as total_purchases
           FROM invoice_lines il
           JOIN invoices i ON i.id = il.invoice_id
           WHERE i.org_id = $1 AND i.invoice_type = 'purchase'
           AND i.status NOT IN ('draft', 'void')
           AND i.date >= $2 AND i.date <= $3""",
        org_id, body.period_start, body.period_end,
    )

    output_tax = float(sales_tax["total_tax"]) if sales_tax else 0.0
    input_tax = float(purchase_tax["total_tax"]) if purchase_tax else 0.0
    net_tax = round(output_tax - input_tax, 2)

    # Save as a draft return
    return_id = str(uuid4())
    now = datetime.utcnow()
    await db.execute(
        """INSERT INTO tax_returns
           (id, org_id, return_type, period_start, period_end, filing_basis,
            output_tax, input_tax, net_tax, total_sales, total_purchases,
            status, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)""",
        return_id, org_id, body.return_type, body.period_start, body.period_end,
        body.filing_basis, output_tax, input_tax, net_tax,
        float(sales_tax["total_sales"]) if sales_tax else 0.0,
        float(purchase_tax["total_purchases"]) if purchase_tax else 0.0,
        "draft", user.id, now, now,
    )

    await audit_log(db, org_id, user.id, "calculate", "tax_return", return_id)
    return {
        "id": return_id,
        "return_type": body.return_type,
        "period": {"start": body.period_start.isoformat(), "end": body.period_end.isoformat()},
        "output_tax": output_tax,
        "input_tax": input_tax,
        "net_tax": net_tax,
        "status": "draft",
        "payable": net_tax > 0,
        "refundable": net_tax < 0,
    }


@router.get("/organizations/{org_id}/tax-returns")
async def list_tax_returns(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    await verify_org_access(db, org_id, user.id)
    offset = (page - 1) * page_size
    rows = await db.fetch(
        """SELECT * FROM tax_returns WHERE org_id = $1
           ORDER BY period_end DESC LIMIT $2 OFFSET $3""",
        org_id, page_size, offset,
    )
    total = await db.fetchval(
        "SELECT count(*) FROM tax_returns WHERE org_id = $1", org_id
    )
    return {"items": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}


@router.get("/organizations/{org_id}/tax-returns/{return_id}")
async def get_tax_return(
    org_id: str,
    return_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    row = await db.fetchrow(
        "SELECT * FROM tax_returns WHERE id = $1 AND org_id = $2", return_id, org_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Tax return not found")
    return dict(row)


@router.post("/organizations/{org_id}/tax-returns/{return_id}/file")
async def file_tax_return(
    org_id: str,
    return_id: str,
    body: TaxReturnFileRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    row = await db.fetchrow(
        "SELECT * FROM tax_returns WHERE id = $1 AND org_id = $2", return_id, org_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Tax return not found")
    if row["status"] == "filed":
        raise HTTPException(status_code=400, detail="Tax return already filed")

    now = datetime.utcnow()
    filed_date = body.filed_date or date.today()
    await db.execute(
        """UPDATE tax_returns SET status = 'filed', filed_date = $1,
           filing_reference = $2, filed_by = $3, notes = $4, updated_at = $5
           WHERE id = $6""",
        filed_date, body.filing_reference, user.id, body.notes, now, return_id,
    )
    await audit_log(db, org_id, user.id, "file", "tax_return", return_id)
    return {"detail": "Tax return marked as filed", "filed_date": filed_date.isoformat()}


# ---------------------------------------------------------------------------
# Tax Treaty routes
# ---------------------------------------------------------------------------

@router.get("/tax-treaties", tags=["accounting-tax"])
async def list_tax_treaties(
    user: User = Depends(get_current_user),
):
    """List available tax treaties (public reference data)."""
    treaties = []
    for idx, ((country_a, country_b), rates) in enumerate(TREATY_RATES.items()):
        treaties.append({
            "id": f"treaty-{country_a}-{country_b}",
            "country_a": country_a,
            "country_b": country_b,
            "rates": rates,
        })
    return {"items": treaties, "total": len(treaties)}


@router.get("/tax-treaties/{treaty_id}", tags=["accounting-tax"])
async def get_tax_treaty(
    treaty_id: str,
    user: User = Depends(get_current_user),
):
    """Get details of a specific tax treaty."""
    # Parse treaty_id like "treaty-NZ-AU"
    parts = treaty_id.split("-")
    if len(parts) != 3 or parts[0] != "treaty":
        raise HTTPException(status_code=404, detail="Treaty not found")

    key = (parts[1], parts[2])
    rates = TREATY_RATES.get(key)
    if not rates:
        # Try reverse
        key = (parts[2], parts[1])
        rates = TREATY_RATES.get(key)

    if not rates:
        raise HTTPException(status_code=404, detail="Treaty not found")

    return {
        "id": treaty_id,
        "country_a": key[0],
        "country_b": key[1],
        "rates": rates,
    }


@router.post("/organizations/{org_id}/treaty-analysis")
async def analyze_treaty_benefits(
    org_id: str,
    body: TreatyAnalysisRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    org = await verify_org_access(db, org_id, user.id)
    org_country = org.get("jurisdiction", "NZ")

    # Look up treaty rate
    key = (org_country, body.income_country)
    rates = TREATY_RATES.get(key)
    if not rates:
        key = (body.income_country, org_country)
        rates = TREATY_RATES.get(key)

    treaty_rate = rates.get(body.income_type, DEFAULT_WITHHOLDING_RATE) if rates else None
    domestic_rate = DEFAULT_WITHHOLDING_RATE

    if treaty_rate is not None:
        withholding_without_treaty = round(body.amount * domestic_rate / 100, 2)
        withholding_with_treaty = round(body.amount * treaty_rate / 100, 2)
        savings = round(withholding_without_treaty - withholding_with_treaty, 2)
    else:
        withholding_without_treaty = round(body.amount * domestic_rate / 100, 2)
        withholding_with_treaty = withholding_without_treaty
        savings = 0

    await audit_log(db, org_id, user.id, "analyze", "treaty", org_id,
                    {"income_country": body.income_country, "income_type": body.income_type})

    return {
        "treaty_exists": treaty_rate is not None,
        "org_country": org_country,
        "income_country": body.income_country,
        "income_type": body.income_type,
        "gross_amount": body.amount,
        "domestic_withholding_rate": domestic_rate,
        "treaty_withholding_rate": treaty_rate,
        "withholding_without_treaty": withholding_without_treaty,
        "withholding_with_treaty": withholding_with_treaty,
        "potential_savings": savings,
        "currency": body.currency,
    }


# ---------------------------------------------------------------------------
# Compliance routes
# ---------------------------------------------------------------------------

@router.get("/organizations/{org_id}/compliance")
async def get_compliance_status(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    org = await verify_org_access(db, org_id, user.id)
    today = date.today()

    # Check overdue tax returns
    overdue_returns = await db.fetchval(
        """SELECT count(*) FROM tax_returns
           WHERE org_id = $1 AND status = 'draft' AND period_end < $2""",
        org_id, today,
    )

    # Check unreconciled bank accounts
    unreconciled_accounts = await db.fetchval(
        """SELECT count(*) FROM bank_accounts ba
           WHERE ba.org_id = $1
           AND NOT EXISTS (
               SELECT 1 FROM reconciliations r
               WHERE r.bank_account_id = ba.id AND r.status = 'completed'
               AND r.statement_date >= $2
           )""",
        org_id, today.replace(day=1),
    )

    # Check unmatched bank transactions
    unmatched_txns = await db.fetchval(
        """SELECT count(*) FROM bank_transactions bt
           JOIN bank_accounts ba ON ba.id = bt.bank_account_id
           WHERE ba.org_id = $1 AND bt.journal_id IS NULL""",
        org_id,
    )

    issues = []
    if overdue_returns and overdue_returns > 0:
        issues.append({"type": "overdue_tax_return", "count": overdue_returns, "severity": "high"})
    if unreconciled_accounts and unreconciled_accounts > 0:
        issues.append({"type": "unreconciled_bank_account", "count": unreconciled_accounts, "severity": "medium"})
    if unmatched_txns and unmatched_txns > 0:
        issues.append({"type": "unmatched_transactions", "count": unmatched_txns, "severity": "low"})

    overall = "compliant" if not issues else (
        "critical" if any(i["severity"] == "high" for i in issues) else "warning"
    )

    return {
        "status": overall,
        "issues": issues,
        "checked_at": datetime.utcnow().isoformat(),
    }


@router.get("/organizations/{org_id}/filing-deadlines")
async def get_filing_deadlines(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    org = await verify_org_access(db, org_id, user.id)
    jurisdiction = org.get("jurisdiction", "NZ")
    today = date.today()

    # Generate upcoming deadlines based on jurisdiction
    deadlines = []
    if jurisdiction == "NZ":
        # GST returns due 28th of month following period
        current_month = today.month
        for i in range(6):
            month = ((current_month + i - 1) % 12) + 1
            year = today.year + ((current_month + i - 1) // 12)
            deadlines.append({
                "type": "GST Return",
                "period": f"{year}-{month:02d}",
                "due_date": f"{year}-{month:02d}-28",
                "jurisdiction": "NZ",
            })
        # Income tax return due 7 April
        tax_year = today.year if today.month >= 4 else today.year - 1
        deadlines.append({
            "type": "Income Tax Return",
            "period": f"{tax_year}-{tax_year + 1}",
            "due_date": f"{tax_year + 1}-04-07",
            "jurisdiction": "NZ",
        })
    elif jurisdiction == "AU":
        # BAS quarterly
        quarters = [(3, "Q3"), (6, "Q4"), (9, "Q1"), (12, "Q2")]
        for end_month, label in quarters:
            year = today.year
            due_day = 28
            due_month = end_month + 1 if end_month < 12 else 1
            due_year = year if end_month < 12 else year + 1
            deadlines.append({
                "type": "BAS",
                "period": f"{year} {label}",
                "due_date": f"{due_year}-{due_month:02d}-{due_day:02d}",
                "jurisdiction": "AU",
            })

    # Filter to upcoming only
    deadlines = [d for d in deadlines if d["due_date"] >= today.isoformat()]
    deadlines.sort(key=lambda d: d["due_date"])

    return {"items": deadlines[:12], "jurisdiction": jurisdiction}


@router.post("/organizations/{org_id}/withholding-calculator")
async def calculate_withholding(
    org_id: str,
    body: WithholdingCalculateRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)

    # Look up treaty rate
    key = (body.source_country, body.recipient_country)
    rates = TREATY_RATES.get(key)
    if not rates:
        key = (body.recipient_country, body.source_country)
        rates = TREATY_RATES.get(key)

    treaty_rate = rates.get(body.income_type) if rates else None
    applicable_rate = treaty_rate if treaty_rate is not None else DEFAULT_WITHHOLDING_RATE

    withholding_amount = round(body.gross_amount * applicable_rate / 100, 2)
    net_amount = round(body.gross_amount - withholding_amount, 2)

    return {
        "source_country": body.source_country,
        "recipient_country": body.recipient_country,
        "income_type": body.income_type,
        "gross_amount": body.gross_amount,
        "treaty_applies": treaty_rate is not None,
        "withholding_rate": applicable_rate,
        "withholding_amount": withholding_amount,
        "net_amount": net_amount,
        "currency": body.currency,
    }
