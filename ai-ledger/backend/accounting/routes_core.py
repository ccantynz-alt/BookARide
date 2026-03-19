"""Core accounting CRUD routes: organizations, chart of accounts, contacts, journals."""

from datetime import datetime, date
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/api/accounting", tags=["accounting-core"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    jurisdiction: str = Field(..., min_length=2, max_length=10)
    base_currency: str = Field(default="NZD", min_length=3, max_length=3)
    fiscal_year_end_month: int = Field(default=3, ge=1, le=12)
    tax_number: Optional[str] = None
    address: Optional[dict] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    jurisdiction: Optional[str] = Field(None, min_length=2, max_length=10)
    base_currency: Optional[str] = Field(None, min_length=3, max_length=3)
    fiscal_year_end_month: Optional[int] = Field(None, ge=1, le=12)
    tax_number: Optional[str] = None
    address: Optional[dict] = None


class AccountCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    account_type: str = Field(...)  # asset, liability, equity, revenue, expense
    parent_id: Optional[str] = None
    description: Optional[str] = None
    tax_code: Optional[str] = None
    is_active: bool = True


class AccountUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    tax_code: Optional[str] = None
    is_active: Optional[bool] = None
    parent_id: Optional[str] = None


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_type: str = Field(...)  # customer, supplier, both
    email: Optional[str] = None
    phone: Optional[str] = None
    tax_number: Optional[str] = None
    address: Optional[dict] = None
    default_account_id: Optional[str] = None
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    tax_number: Optional[str] = None
    address: Optional[dict] = None
    default_account_id: Optional[str] = None
    notes: Optional[str] = None


class JournalLineCreate(BaseModel):
    account_id: str
    description: Optional[str] = None
    debit: float = Field(default=0.0, ge=0)
    credit: float = Field(default=0.0, ge=0)
    contact_id: Optional[str] = None
    tax_code: Optional[str] = None


class JournalCreate(BaseModel):
    date: date
    reference: Optional[str] = None
    narration: Optional[str] = None
    lines: list[JournalLineCreate] = Field(..., min_length=1)


class JournalUpdate(BaseModel):
    date: Optional[date] = None
    reference: Optional[str] = None
    narration: Optional[str] = None
    lines: Optional[list[JournalLineCreate]] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_ACCOUNT_TYPES = {"asset", "liability", "equity", "revenue", "expense"}
VALID_CONTACT_TYPES = {"customer", "supplier", "both"}


async def verify_org_access(db, org_id: str, user_id: str) -> dict:
    """Verify user has access to the organization. Returns the org dict."""
    org = await db.fetchrow(
        "SELECT * FROM organizations WHERE id = $1", org_id
    )
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member = await db.fetchrow(
        "SELECT * FROM org_members WHERE org_id = $1 AND user_id = $2",
        org_id, user_id,
    )
    if not member and org.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied to this organization")
    return dict(org)


async def audit_log(db, org_id: str, user_id: str, action: str, entity_type: str,
                    entity_id: str, details: Optional[dict] = None):
    """Write an entry to the audit trail."""
    await db.execute(
        """INSERT INTO audit_log (id, org_id, user_id, action, entity_type,
           entity_id, details, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
        str(uuid4()), org_id, user_id, action, entity_type, entity_id,
        details or {}, datetime.utcnow(),
    )


# ---------------------------------------------------------------------------
# Organization routes
# ---------------------------------------------------------------------------

@router.post("/organizations", status_code=status.HTTP_201_CREATED)
async def create_organization(
    body: OrganizationCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    org_id = str(uuid4())
    now = datetime.utcnow()
    await db.execute(
        """INSERT INTO organizations
           (id, name, jurisdiction, base_currency, fiscal_year_end_month,
            tax_number, address, owner_id, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)""",
        org_id, body.name, body.jurisdiction, body.base_currency,
        body.fiscal_year_end_month, body.tax_number, body.address or {},
        user.id, now, now,
    )
    # Owner becomes first member
    await db.execute(
        "INSERT INTO org_members (id, org_id, user_id, role, created_at) VALUES ($1,$2,$3,$4,$5)",
        str(uuid4()), org_id, user.id, "owner", now,
    )
    await audit_log(db, org_id, user.id, "create", "organization", org_id)
    return {"id": org_id, "name": body.name, "created_at": now.isoformat()}


@router.get("/organizations")
async def list_organizations(
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * page_size
    rows = await db.fetch(
        """SELECT o.* FROM organizations o
           JOIN org_members m ON m.org_id = o.id
           WHERE m.user_id = $1
           ORDER BY o.name
           LIMIT $2 OFFSET $3""",
        user.id, page_size, offset,
    )
    total = await db.fetchval(
        """SELECT count(*) FROM organizations o
           JOIN org_members m ON m.org_id = o.id
           WHERE m.user_id = $1""",
        user.id,
    )
    return {"items": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}


@router.get("/organizations/{org_id}")
async def get_organization(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    org = await verify_org_access(db, org_id, user.id)
    return org


@router.put("/organizations/{org_id}")
async def update_organization(
    org_id: str,
    body: OrganizationUpdate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.utcnow()

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [org_id] + list(updates.values())
    await db.execute(
        f"UPDATE organizations SET {set_clause} WHERE id = $1", *values
    )
    await audit_log(db, org_id, user.id, "update", "organization", org_id, updates)
    return {"detail": "Organization updated"}


# ---------------------------------------------------------------------------
# Chart of Accounts routes
# ---------------------------------------------------------------------------

@router.post("/organizations/{org_id}/chart-of-accounts", status_code=status.HTTP_201_CREATED)
async def create_account(
    org_id: str,
    body: AccountCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    if body.account_type not in VALID_ACCOUNT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid account_type. Must be one of: {VALID_ACCOUNT_TYPES}")

    # Unique code within org
    existing = await db.fetchrow(
        "SELECT id FROM accounts WHERE org_id = $1 AND code = $2", org_id, body.code
    )
    if existing:
        raise HTTPException(status_code=409, detail="Account code already exists in this organization")

    if body.parent_id:
        parent = await db.fetchrow(
            "SELECT id FROM accounts WHERE id = $1 AND org_id = $2", body.parent_id, org_id
        )
        if not parent:
            raise HTTPException(status_code=404, detail="Parent account not found")

    account_id = str(uuid4())
    now = datetime.utcnow()
    await db.execute(
        """INSERT INTO accounts
           (id, org_id, code, name, account_type, parent_id, description,
            tax_code, is_active, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
        account_id, org_id, body.code, body.name, body.account_type,
        body.parent_id, body.description, body.tax_code, body.is_active, now, now,
    )
    await audit_log(db, org_id, user.id, "create", "account", account_id)
    return {"id": account_id, "code": body.code, "name": body.name}


@router.get("/organizations/{org_id}/chart-of-accounts")
async def list_accounts(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    account_type: Optional[str] = None,
    active_only: bool = True,
):
    await verify_org_access(db, org_id, user.id)
    query = "SELECT * FROM accounts WHERE org_id = $1"
    params: list = [org_id]
    idx = 2

    if active_only:
        query += f" AND is_active = ${idx}"
        params.append(True)
        idx += 1
    if account_type:
        if account_type not in VALID_ACCOUNT_TYPES:
            raise HTTPException(status_code=400, detail="Invalid account_type filter")
        query += f" AND account_type = ${idx}"
        params.append(account_type)
        idx += 1

    query += " ORDER BY code"
    rows = await db.fetch(query, *params)
    accounts = [dict(r) for r in rows]

    # Build tree structure
    account_map = {a["id"]: {**a, "children": []} for a in accounts}
    tree = []
    for acct in accounts:
        if acct.get("parent_id") and acct["parent_id"] in account_map:
            account_map[acct["parent_id"]]["children"].append(account_map[acct["id"]])
        else:
            tree.append(account_map[acct["id"]])

    return {"items": tree, "total": len(accounts)}


@router.put("/organizations/{org_id}/chart-of-accounts/{account_id}")
async def update_account(
    org_id: str,
    account_id: str,
    body: AccountUpdate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    existing = await db.fetchrow(
        "SELECT * FROM accounts WHERE id = $1 AND org_id = $2", account_id, org_id
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")

    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "code" in updates:
        dup = await db.fetchrow(
            "SELECT id FROM accounts WHERE org_id = $1 AND code = $2 AND id != $3",
            org_id, updates["code"], account_id,
        )
        if dup:
            raise HTTPException(status_code=409, detail="Account code already exists")

    updates["updated_at"] = datetime.utcnow()
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [account_id] + list(updates.values())
    await db.execute(f"UPDATE accounts SET {set_clause} WHERE id = $1", *values)
    await audit_log(db, org_id, user.id, "update", "account", account_id, updates)
    return {"detail": "Account updated"}


# ---------------------------------------------------------------------------
# Contact routes
# ---------------------------------------------------------------------------

@router.post("/organizations/{org_id}/contacts", status_code=status.HTTP_201_CREATED)
async def create_contact(
    org_id: str,
    body: ContactCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    if body.contact_type not in VALID_CONTACT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid contact_type. Must be one of: {VALID_CONTACT_TYPES}")

    contact_id = str(uuid4())
    now = datetime.utcnow()
    await db.execute(
        """INSERT INTO contacts
           (id, org_id, name, contact_type, email, phone, tax_number,
            address, default_account_id, notes, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)""",
        contact_id, org_id, body.name, body.contact_type, body.email,
        body.phone, body.tax_number, body.address or {}, body.default_account_id,
        body.notes, now, now,
    )
    await audit_log(db, org_id, user.id, "create", "contact", contact_id)
    return {"id": contact_id, "name": body.name}


@router.get("/organizations/{org_id}/contacts")
async def list_contacts(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    search: Optional[str] = None,
    contact_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    await verify_org_access(db, org_id, user.id)
    query = "SELECT * FROM contacts WHERE org_id = $1"
    count_query = "SELECT count(*) FROM contacts WHERE org_id = $1"
    params: list = [org_id]
    idx = 2

    if contact_type:
        if contact_type not in VALID_CONTACT_TYPES:
            raise HTTPException(status_code=400, detail="Invalid contact_type filter")
        query += f" AND contact_type = ${idx}"
        count_query += f" AND contact_type = ${idx}"
        params.append(contact_type)
        idx += 1

    if search:
        query += f" AND (name ILIKE ${idx} OR email ILIKE ${idx})"
        count_query += f" AND (name ILIKE ${idx} OR email ILIKE ${idx})"
        params.append(f"%{search}%")
        idx += 1

    total = await db.fetchval(count_query, *params)

    offset = (page - 1) * page_size
    query += f" ORDER BY name LIMIT ${idx} OFFSET ${idx+1}"
    params.extend([page_size, offset])

    rows = await db.fetch(query, *params)
    return {"items": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}


@router.get("/organizations/{org_id}/contacts/{contact_id}")
async def get_contact(
    org_id: str,
    contact_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    row = await db.fetchrow(
        "SELECT * FROM contacts WHERE id = $1 AND org_id = $2", contact_id, org_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Contact not found")
    return dict(row)


@router.put("/organizations/{org_id}/contacts/{contact_id}")
async def update_contact(
    org_id: str,
    contact_id: str,
    body: ContactUpdate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    existing = await db.fetchrow(
        "SELECT id FROM contacts WHERE id = $1 AND org_id = $2", contact_id, org_id
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")

    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "contact_type" in updates and updates["contact_type"] not in VALID_CONTACT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid contact_type")

    updates["updated_at"] = datetime.utcnow()
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [contact_id] + list(updates.values())
    await db.execute(f"UPDATE contacts SET {set_clause} WHERE id = $1", *values)
    await audit_log(db, org_id, user.id, "update", "contact", contact_id, updates)
    return {"detail": "Contact updated"}


# ---------------------------------------------------------------------------
# Journal Entry routes
# ---------------------------------------------------------------------------

@router.post("/organizations/{org_id}/journals", status_code=status.HTTP_201_CREATED)
async def create_journal(
    org_id: str,
    body: JournalCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)

    journal_id = str(uuid4())
    now = datetime.utcnow()

    await db.execute(
        """INSERT INTO journals
           (id, org_id, date, reference, narration, status, created_by,
            created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
        journal_id, org_id, body.date, body.reference, body.narration,
        "draft", user.id, now, now,
    )

    for idx, line in enumerate(body.lines):
        await db.execute(
            """INSERT INTO journal_lines
               (id, journal_id, line_number, account_id, description,
                debit, credit, contact_id, tax_code)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
            str(uuid4()), journal_id, idx + 1, line.account_id,
            line.description, line.debit, line.credit, line.contact_id,
            line.tax_code,
        )

    await audit_log(db, org_id, user.id, "create", "journal", journal_id)
    return {"id": journal_id, "status": "draft", "created_at": now.isoformat()}


@router.get("/organizations/{org_id}/journals")
async def list_journals(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    journal_status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    await verify_org_access(db, org_id, user.id)
    query = "SELECT * FROM journals WHERE org_id = $1"
    count_query = "SELECT count(*) FROM journals WHERE org_id = $1"
    params: list = [org_id]
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
    if journal_status:
        query += f" AND status = ${idx}"
        count_query += f" AND status = ${idx}"
        params.append(journal_status)
        idx += 1

    total = await db.fetchval(count_query, *params)

    offset = (page - 1) * page_size
    query += f" ORDER BY date DESC, created_at DESC LIMIT ${idx} OFFSET ${idx+1}"
    params.extend([page_size, offset])

    rows = await db.fetch(query, *params)
    return {"items": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}


@router.get("/organizations/{org_id}/journals/{journal_id}")
async def get_journal(
    org_id: str,
    journal_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    journal = await db.fetchrow(
        "SELECT * FROM journals WHERE id = $1 AND org_id = $2", journal_id, org_id
    )
    if not journal:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    lines = await db.fetch(
        "SELECT * FROM journal_lines WHERE journal_id = $1 ORDER BY line_number",
        journal_id,
    )
    result = dict(journal)
    result["lines"] = [dict(l) for l in lines]
    return result


@router.put("/organizations/{org_id}/journals/{journal_id}")
async def update_journal(
    org_id: str,
    journal_id: str,
    body: JournalUpdate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    journal = await db.fetchrow(
        "SELECT * FROM journals WHERE id = $1 AND org_id = $2", journal_id, org_id
    )
    if not journal:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    if journal["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft journals can be updated")

    updates = body.model_dump(exclude_unset=True, exclude={"lines"})
    updates["updated_at"] = datetime.utcnow()

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [journal_id] + list(updates.values())
    await db.execute(f"UPDATE journals SET {set_clause} WHERE id = $1", *values)

    if body.lines is not None:
        await db.execute("DELETE FROM journal_lines WHERE journal_id = $1", journal_id)
        for idx, line in enumerate(body.lines):
            await db.execute(
                """INSERT INTO journal_lines
                   (id, journal_id, line_number, account_id, description,
                    debit, credit, contact_id, tax_code)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
                str(uuid4()), journal_id, idx + 1, line.account_id,
                line.description, line.debit, line.credit, line.contact_id,
                line.tax_code,
            )

    await audit_log(db, org_id, user.id, "update", "journal", journal_id)
    return {"detail": "Journal updated"}


@router.post("/organizations/{org_id}/journals/{journal_id}/post")
async def post_journal(
    org_id: str,
    journal_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    journal = await db.fetchrow(
        "SELECT * FROM journals WHERE id = $1 AND org_id = $2", journal_id, org_id
    )
    if not journal:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    if journal["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft journals can be posted")

    lines = await db.fetch(
        "SELECT * FROM journal_lines WHERE journal_id = $1", journal_id
    )
    if not lines:
        raise HTTPException(status_code=400, detail="Journal must have at least one line")

    total_debits = sum(float(l["debit"]) for l in lines)
    total_credits = sum(float(l["credit"]) for l in lines)

    if abs(total_debits - total_credits) > 0.005:
        raise HTTPException(
            status_code=400,
            detail=f"Debits ({total_debits:.2f}) must equal credits ({total_credits:.2f})",
        )

    now = datetime.utcnow()
    await db.execute(
        "UPDATE journals SET status = $1, posted_at = $2, posted_by = $3, updated_at = $4 WHERE id = $5",
        "posted", now, user.id, now, journal_id,
    )
    await audit_log(db, org_id, user.id, "post", "journal", journal_id)
    return {"detail": "Journal posted", "posted_at": now.isoformat()}
