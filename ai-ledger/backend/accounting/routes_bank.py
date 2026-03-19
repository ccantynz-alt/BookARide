"""Bank feed management routes: link accounts, sync transactions, match, reconcile."""

import logging
from datetime import datetime, date
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..database import get_db
from ..models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/accounting", tags=["accounting-bank"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class BankAccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    account_number: str = Field(..., min_length=1)
    bank_name: str = Field(..., min_length=1)
    currency: str = Field(default="NZD", min_length=3, max_length=3)
    ledger_account_id: str  # Linked chart-of-accounts entry
    provider: Optional[str] = None  # e.g. "akahu", "plaid", "manual"
    provider_account_id: Optional[str] = None


class MatchRequest(BaseModel):
    journal_id: str


class CreateAndMatchRequest(BaseModel):
    date: date
    account_id: str  # Expense/revenue account
    description: Optional[str] = None
    contact_id: Optional[str] = None
    tax_code: Optional[str] = None


class BulkCategorizeRequest(BaseModel):
    transaction_ids: list[str] = Field(..., min_length=1, max_length=500)


class ReconciliationCreate(BaseModel):
    bank_account_id: str
    statement_date: date
    statement_balance: float
    start_date: date


class ReconciliationCompleteRequest(BaseModel):
    matched_transaction_ids: list[str]
    adjustment_amount: float = 0.0
    adjustment_account_id: Optional[str] = None
    adjustment_description: Optional[str] = None


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


# ---------------------------------------------------------------------------
# Bank Account routes
# ---------------------------------------------------------------------------

@router.post("/organizations/{org_id}/bank-accounts", status_code=status.HTTP_201_CREATED)
async def link_bank_account(
    org_id: str,
    body: BankAccountCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)

    # Verify ledger account exists
    ledger_acct = await db.fetchrow(
        "SELECT id FROM accounts WHERE id = $1 AND org_id = $2",
        body.ledger_account_id, org_id,
    )
    if not ledger_acct:
        raise HTTPException(status_code=404, detail="Ledger account not found")

    bank_id = str(uuid4())
    now = datetime.utcnow()
    await db.execute(
        """INSERT INTO bank_accounts
           (id, org_id, name, account_number, bank_name, currency,
            ledger_account_id, provider, provider_account_id, balance,
            last_synced_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)""",
        bank_id, org_id, body.name, body.account_number, body.bank_name,
        body.currency, body.ledger_account_id, body.provider,
        body.provider_account_id, 0.0, None, now, now,
    )
    await audit_log(db, org_id, user.id, "create", "bank_account", bank_id)
    return {"id": bank_id, "name": body.name}


@router.get("/organizations/{org_id}/bank-accounts")
async def list_bank_accounts(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    rows = await db.fetch(
        "SELECT * FROM bank_accounts WHERE org_id = $1 ORDER BY name", org_id
    )
    return {"items": [dict(r) for r in rows]}


@router.post("/organizations/{org_id}/bank-accounts/{account_id}/sync")
async def sync_bank_account(
    org_id: str,
    account_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    bank = await db.fetchrow(
        "SELECT * FROM bank_accounts WHERE id = $1 AND org_id = $2", account_id, org_id
    )
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found")

    if not bank.get("provider") or not bank.get("provider_account_id"):
        raise HTTPException(
            status_code=400,
            detail="No provider configured for this bank account. Transactions must be imported manually.",
        )

    # In production, this would call the bank feed provider API (e.g. Akahu, Plaid)
    # and import new transactions. For now, mark as synced.
    now = datetime.utcnow()
    await db.execute(
        "UPDATE bank_accounts SET last_synced_at = $1, updated_at = $2 WHERE id = $3",
        now, now, account_id,
    )
    await audit_log(db, org_id, user.id, "sync", "bank_account", account_id)
    return {"detail": "Sync triggered", "last_synced_at": now.isoformat()}


@router.get("/organizations/{org_id}/bank-accounts/{account_id}/transactions")
async def list_bank_transactions(
    org_id: str,
    account_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    matched: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    await verify_org_access(db, org_id, user.id)
    bank = await db.fetchrow(
        "SELECT id FROM bank_accounts WHERE id = $1 AND org_id = $2", account_id, org_id
    )
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found")

    query = "SELECT * FROM bank_transactions WHERE bank_account_id = $1"
    count_query = "SELECT count(*) FROM bank_transactions WHERE bank_account_id = $1"
    params: list = [account_id]
    idx = 2

    if date_from:
        query += f" AND date >= ${idx}"
        count_query += f" AND date >= ${idx}"
        params.append(date_from)
        idx += 1
    if date_to:
        query += f" AND date <= ${idx}"
        count_query += f" AND date <= ${idx}"
        params.append(date_to)
        idx += 1
    if matched is not None:
        if matched:
            query += f" AND journal_id IS NOT NULL"
            count_query += f" AND journal_id IS NOT NULL"
        else:
            query += f" AND journal_id IS NULL"
            count_query += f" AND journal_id IS NULL"

    total = await db.fetchval(count_query, *params)
    offset = (page - 1) * page_size
    query += f" ORDER BY date DESC LIMIT ${idx} OFFSET ${idx+1}"
    params.extend([page_size, offset])

    rows = await db.fetch(query, *params)
    return {"items": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}


# ---------------------------------------------------------------------------
# Transaction matching
# ---------------------------------------------------------------------------

@router.post("/organizations/{org_id}/bank-transactions/{txn_id}/match")
async def match_transaction(
    org_id: str,
    txn_id: str,
    body: MatchRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)

    txn = await db.fetchrow(
        """SELECT bt.* FROM bank_transactions bt
           JOIN bank_accounts ba ON ba.id = bt.bank_account_id
           WHERE bt.id = $1 AND ba.org_id = $2""",
        txn_id, org_id,
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Bank transaction not found")
    if txn.get("journal_id"):
        raise HTTPException(status_code=400, detail="Transaction already matched")

    journal = await db.fetchrow(
        "SELECT id FROM journals WHERE id = $1 AND org_id = $2", body.journal_id, org_id
    )
    if not journal:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    now = datetime.utcnow()
    await db.execute(
        "UPDATE bank_transactions SET journal_id = $1, matched_at = $2 WHERE id = $3",
        body.journal_id, now, txn_id,
    )
    await audit_log(db, org_id, user.id, "match", "bank_transaction", txn_id,
                    {"journal_id": body.journal_id})
    return {"detail": "Transaction matched", "journal_id": body.journal_id}


@router.post("/organizations/{org_id}/bank-transactions/{txn_id}/create-and-match")
async def create_and_match_transaction(
    org_id: str,
    txn_id: str,
    body: CreateAndMatchRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)

    txn = await db.fetchrow(
        """SELECT bt.*, ba.ledger_account_id FROM bank_transactions bt
           JOIN bank_accounts ba ON ba.id = bt.bank_account_id
           WHERE bt.id = $1 AND ba.org_id = $2""",
        txn_id, org_id,
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Bank transaction not found")
    if txn.get("journal_id"):
        raise HTTPException(status_code=400, detail="Transaction already matched")

    now = datetime.utcnow()
    journal_id = str(uuid4())
    amount = abs(float(txn["amount"]))
    is_debit = float(txn["amount"]) > 0  # Positive = money in

    description = body.description or txn.get("description", "Bank transaction")

    await db.execute(
        """INSERT INTO journals (id, org_id, date, narration, status,
           source_type, source_id, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)""",
        journal_id, org_id, body.date, description, "posted",
        "bank_transaction", txn_id, user.id, now, now,
    )

    bank_ledger_account = txn["ledger_account_id"]

    # Bank account line
    await db.execute(
        """INSERT INTO journal_lines (id, journal_id, line_number, account_id,
           description, debit, credit, contact_id, tax_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
        str(uuid4()), journal_id, 1, bank_ledger_account, description,
        amount if is_debit else 0, 0 if is_debit else amount,
        body.contact_id, None,
    )

    # Category account line (opposite side)
    await db.execute(
        """INSERT INTO journal_lines (id, journal_id, line_number, account_id,
           description, debit, credit, contact_id, tax_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
        str(uuid4()), journal_id, 2, body.account_id, description,
        0 if is_debit else amount, amount if is_debit else 0,
        body.contact_id, body.tax_code,
    )

    # Link transaction to journal
    await db.execute(
        "UPDATE bank_transactions SET journal_id = $1, matched_at = $2 WHERE id = $3",
        journal_id, now, txn_id,
    )

    await audit_log(db, org_id, user.id, "create_and_match", "bank_transaction", txn_id,
                    {"journal_id": journal_id})
    return {"detail": "Journal created and matched", "journal_id": journal_id}


@router.post("/organizations/{org_id}/bank-transactions/bulk-categorize")
async def bulk_categorize_transactions(
    org_id: str,
    body: BulkCategorizeRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """AI-assisted bulk categorization of bank transactions."""
    await verify_org_access(db, org_id, user.id)

    results = []
    for txn_id in body.transaction_ids:
        txn = await db.fetchrow(
            """SELECT bt.* FROM bank_transactions bt
               JOIN bank_accounts ba ON ba.id = bt.bank_account_id
               WHERE bt.id = $1 AND ba.org_id = $2""",
            txn_id, org_id,
        )
        if not txn:
            results.append({"transaction_id": txn_id, "status": "not_found"})
            continue
        if txn.get("journal_id"):
            results.append({"transaction_id": txn_id, "status": "already_matched"})
            continue

        # AI categorization: look up historical matches for similar descriptions
        description = txn.get("description", "")
        similar = await db.fetchrow(
            """SELECT jl.account_id, jl.tax_code, jl.contact_id
               FROM bank_transactions bt2
               JOIN journal_lines jl ON jl.journal_id = bt2.journal_id
               WHERE bt2.id != $1
               AND bt2.bank_account_id = $2
               AND bt2.description ILIKE $3
               AND jl.line_number = 2
               LIMIT 1""",
            txn_id, txn["bank_account_id"], f"%{description[:30]}%",
        )

        if similar:
            results.append({
                "transaction_id": txn_id,
                "status": "suggested",
                "suggested_account_id": similar["account_id"],
                "suggested_tax_code": similar.get("tax_code"),
                "suggested_contact_id": similar.get("contact_id"),
                "confidence": 0.85,
            })
        else:
            results.append({
                "transaction_id": txn_id,
                "status": "no_suggestion",
                "confidence": 0.0,
            })

    await audit_log(db, org_id, user.id, "bulk_categorize", "bank_transaction", org_id,
                    {"count": len(body.transaction_ids)})
    return {"results": results, "total": len(results)}


# ---------------------------------------------------------------------------
# Reconciliation routes
# ---------------------------------------------------------------------------

@router.post("/organizations/{org_id}/reconciliations", status_code=status.HTTP_201_CREATED)
async def start_reconciliation(
    org_id: str,
    body: ReconciliationCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)

    bank = await db.fetchrow(
        "SELECT * FROM bank_accounts WHERE id = $1 AND org_id = $2",
        body.bank_account_id, org_id,
    )
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found")

    recon_id = str(uuid4())
    now = datetime.utcnow()

    # Calculate ledger balance from posted journals
    ledger_balance_row = await db.fetchrow(
        """SELECT COALESCE(SUM(jl.debit) - SUM(jl.credit), 0) as balance
           FROM journal_lines jl
           JOIN journals j ON j.id = jl.journal_id
           WHERE j.org_id = $1 AND j.status = 'posted'
           AND jl.account_id = $2 AND j.date <= $3""",
        org_id, bank["ledger_account_id"], body.statement_date,
    )
    ledger_balance = float(ledger_balance_row["balance"]) if ledger_balance_row else 0.0

    await db.execute(
        """INSERT INTO reconciliations
           (id, org_id, bank_account_id, statement_date, statement_balance,
            ledger_balance, start_date, status, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
        recon_id, org_id, body.bank_account_id, body.statement_date,
        body.statement_balance, ledger_balance, body.start_date,
        "in_progress", user.id, now, now,
    )

    # Fetch unreconciled transactions for this period
    unreconciled = await db.fetch(
        """SELECT * FROM bank_transactions
           WHERE bank_account_id = $1 AND date >= $2 AND date <= $3
           AND reconciled = false
           ORDER BY date""",
        body.bank_account_id, body.start_date, body.statement_date,
    )

    await audit_log(db, org_id, user.id, "create", "reconciliation", recon_id)
    return {
        "id": recon_id,
        "statement_balance": body.statement_balance,
        "ledger_balance": ledger_balance,
        "difference": round(body.statement_balance - ledger_balance, 2),
        "unreconciled_count": len(unreconciled),
        "unreconciled_transactions": [dict(t) for t in unreconciled],
    }


@router.get("/organizations/{org_id}/reconciliations/{recon_id}")
async def get_reconciliation(
    org_id: str,
    recon_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    recon = await db.fetchrow(
        "SELECT * FROM reconciliations WHERE id = $1 AND org_id = $2", recon_id, org_id
    )
    if not recon:
        raise HTTPException(status_code=404, detail="Reconciliation not found")
    return dict(recon)


@router.post("/organizations/{org_id}/reconciliations/{recon_id}/complete")
async def complete_reconciliation(
    org_id: str,
    recon_id: str,
    body: ReconciliationCompleteRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    recon = await db.fetchrow(
        "SELECT * FROM reconciliations WHERE id = $1 AND org_id = $2", recon_id, org_id
    )
    if not recon:
        raise HTTPException(status_code=404, detail="Reconciliation not found")
    if recon["status"] == "completed":
        raise HTTPException(status_code=400, detail="Reconciliation already completed")

    now = datetime.utcnow()

    # Mark selected transactions as reconciled
    for txn_id in body.matched_transaction_ids:
        await db.execute(
            "UPDATE bank_transactions SET reconciled = true, reconciled_at = $1 WHERE id = $2",
            now, txn_id,
        )

    # Create adjustment journal if needed
    adjustment_journal_id = None
    if abs(body.adjustment_amount) > 0.005:
        if not body.adjustment_account_id:
            raise HTTPException(
                status_code=400,
                detail="adjustment_account_id required when adjustment_amount is non-zero",
            )
        adjustment_journal_id = str(uuid4())
        bank = await db.fetchrow(
            "SELECT ledger_account_id FROM bank_accounts WHERE id = $1",
            recon["bank_account_id"],
        )
        desc = body.adjustment_description or "Reconciliation adjustment"

        await db.execute(
            """INSERT INTO journals (id, org_id, date, narration, status,
               source_type, source_id, created_by, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)""",
            adjustment_journal_id, org_id, recon["statement_date"], desc,
            "posted", "reconciliation", recon_id, user.id, now, now,
        )
        is_debit = body.adjustment_amount > 0
        amt = abs(body.adjustment_amount)

        await db.execute(
            """INSERT INTO journal_lines (id, journal_id, line_number, account_id,
               description, debit, credit) VALUES ($1,$2,$3,$4,$5,$6,$7)""",
            str(uuid4()), adjustment_journal_id, 1,
            bank["ledger_account_id"], desc,
            amt if is_debit else 0, 0 if is_debit else amt,
        )
        await db.execute(
            """INSERT INTO journal_lines (id, journal_id, line_number, account_id,
               description, debit, credit) VALUES ($1,$2,$3,$4,$5,$6,$7)""",
            str(uuid4()), adjustment_journal_id, 2,
            body.adjustment_account_id, desc,
            0 if is_debit else amt, amt if is_debit else 0,
        )

    await db.execute(
        """UPDATE reconciliations SET status = 'completed', completed_at = $1,
           completed_by = $2, adjustment_journal_id = $3, updated_at = $4
           WHERE id = $5""",
        now, user.id, adjustment_journal_id, now, recon_id,
    )

    await audit_log(db, org_id, user.id, "complete", "reconciliation", recon_id,
                    {"matched_count": len(body.matched_transaction_ids),
                     "adjustment": body.adjustment_amount})
    return {"detail": "Reconciliation completed", "completed_at": now.isoformat()}
