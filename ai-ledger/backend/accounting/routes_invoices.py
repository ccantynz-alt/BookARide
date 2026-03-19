"""Invoice management routes: create, send, pay, void, PDF generation."""

import io
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

router = APIRouter(prefix="/api/accounting", tags=["accounting-invoices"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class InvoiceLineCreate(BaseModel):
    description: str = Field(..., min_length=1)
    account_id: str
    quantity: float = Field(default=1.0, gt=0)
    unit_price: float = Field(..., ge=0)
    tax_code: Optional[str] = None
    discount_percent: float = Field(default=0.0, ge=0, le=100)


class InvoiceCreate(BaseModel):
    invoice_type: str = Field(...)  # sales, purchase
    contact_id: str
    date: date
    due_date: date
    reference: Optional[str] = None
    currency: str = Field(default="NZD", min_length=3, max_length=3)
    lines: list[InvoiceLineCreate] = Field(..., min_length=1)
    notes: Optional[str] = None


class InvoiceUpdate(BaseModel):
    contact_id: Optional[str] = None
    date: Optional[date] = None
    due_date: Optional[date] = None
    reference: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    lines: Optional[list[InvoiceLineCreate]] = None
    notes: Optional[str] = None


class RecordPaymentRequest(BaseModel):
    amount: float = Field(..., gt=0)
    date: date
    account_id: str  # Bank/cash account
    reference: Optional[str] = None


class SendInvoiceRequest(BaseModel):
    to_email: str
    subject: Optional[str] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_INVOICE_TYPES = {"sales", "purchase"}


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


async def generate_invoice_number(db, org_id: str, invoice_type: str) -> str:
    prefix = "INV" if invoice_type == "sales" else "BILL"
    count = await db.fetchval(
        "SELECT count(*) FROM invoices WHERE org_id = $1 AND invoice_type = $2",
        org_id, invoice_type,
    )
    return f"{prefix}-{(count or 0) + 1:06d}"


async def calculate_line_amounts(db, org_id: str, line: InvoiceLineCreate) -> dict:
    subtotal = round(line.quantity * line.unit_price, 2)
    discount = round(subtotal * line.discount_percent / 100, 2)
    net = subtotal - discount
    tax_amount = 0.0

    if line.tax_code:
        tax_row = await db.fetchrow(
            "SELECT rate FROM tax_codes WHERE org_id = $1 AND code = $2",
            org_id, line.tax_code,
        )
        if tax_row:
            tax_amount = round(net * float(tax_row["rate"]) / 100, 2)

    return {
        "subtotal": subtotal,
        "discount": discount,
        "net": net,
        "tax_amount": tax_amount,
        "total": round(net + tax_amount, 2),
    }


async def create_invoice_journal(db, org_id: str, user_id: str, invoice: dict):
    """Create the journal entry when an invoice is posted/approved."""
    journal_id = str(uuid4())
    now = datetime.utcnow()

    narration = f"Invoice {invoice['invoice_number']}"
    await db.execute(
        """INSERT INTO journals (id, org_id, date, reference, narration, status,
           source_type, source_id, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
        journal_id, org_id, invoice["date"], invoice["invoice_number"],
        narration, "posted", "invoice", invoice["id"], user_id, now, now,
    )

    # Receivable/payable line
    ar_ap_type = "debit" if invoice["invoice_type"] == "sales" else "credit"
    await db.execute(
        """INSERT INTO journal_lines (id, journal_id, line_number, account_id,
           description, debit, credit, contact_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
        str(uuid4()), journal_id, 1, invoice.get("receivable_account_id", ""),
        narration,
        invoice["total_amount"] if ar_ap_type == "debit" else 0,
        invoice["total_amount"] if ar_ap_type == "credit" else 0,
        invoice["contact_id"],
    )

    return journal_id


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/organizations/{org_id}/invoices", status_code=status.HTTP_201_CREATED)
async def create_invoice(
    org_id: str,
    body: InvoiceCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    if body.invoice_type not in VALID_INVOICE_TYPES:
        raise HTTPException(status_code=400, detail="invoice_type must be 'sales' or 'purchase'")
    if body.due_date < body.date:
        raise HTTPException(status_code=400, detail="due_date cannot be before date")

    # Verify contact exists
    contact = await db.fetchrow(
        "SELECT id FROM contacts WHERE id = $1 AND org_id = $2", body.contact_id, org_id
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    invoice_id = str(uuid4())
    invoice_number = await generate_invoice_number(db, org_id, body.invoice_type)
    now = datetime.utcnow()

    total_amount = 0.0
    total_tax = 0.0
    line_records = []

    for idx, line in enumerate(body.lines):
        amounts = await calculate_line_amounts(db, org_id, line)
        total_amount += amounts["total"]
        total_tax += amounts["tax_amount"]
        line_records.append((idx, line, amounts))

    await db.execute(
        """INSERT INTO invoices
           (id, org_id, invoice_type, invoice_number, contact_id, date,
            due_date, reference, currency, subtotal, tax_amount, total_amount,
            amount_paid, amount_due, status, notes, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)""",
        invoice_id, org_id, body.invoice_type, invoice_number, body.contact_id,
        body.date, body.due_date, body.reference, body.currency,
        round(total_amount - total_tax, 2), round(total_tax, 2),
        round(total_amount, 2), 0.0, round(total_amount, 2),
        "draft", body.notes, user.id, now, now,
    )

    for idx, line, amounts in line_records:
        await db.execute(
            """INSERT INTO invoice_lines
               (id, invoice_id, line_number, description, account_id, quantity,
                unit_price, discount_percent, tax_code, subtotal, tax_amount, total)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)""",
            str(uuid4()), invoice_id, idx + 1, line.description, line.account_id,
            line.quantity, line.unit_price, line.discount_percent, line.tax_code,
            amounts["net"], amounts["tax_amount"], amounts["total"],
        )

    await audit_log(db, org_id, user.id, "create", "invoice", invoice_id)
    return {
        "id": invoice_id,
        "invoice_number": invoice_number,
        "total_amount": round(total_amount, 2),
        "status": "draft",
    }


@router.get("/organizations/{org_id}/invoices")
async def list_invoices(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
    invoice_type: Optional[str] = None,
    invoice_status: Optional[str] = None,
    contact_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    await verify_org_access(db, org_id, user.id)
    query = "SELECT * FROM invoices WHERE org_id = $1"
    count_query = "SELECT count(*) FROM invoices WHERE org_id = $1"
    params: list = [org_id]
    idx = 2

    for val, col in [
        (invoice_type, "invoice_type"), (invoice_status, "status"),
        (contact_id, "contact_id"),
    ]:
        if val:
            query += f" AND {col} = ${idx}"
            count_query += f" AND {col} = ${idx}"
            params.append(val)
            idx += 1

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

    total = await db.fetchval(count_query, *params)
    offset = (page - 1) * page_size
    query += f" ORDER BY date DESC LIMIT ${idx} OFFSET ${idx+1}"
    params.extend([page_size, offset])

    rows = await db.fetch(query, *params)
    return {"items": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}


@router.get("/organizations/{org_id}/invoices/overdue")
async def get_overdue_invoices(
    org_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    today = date.today()
    rows = await db.fetch(
        """SELECT * FROM invoices
           WHERE org_id = $1 AND status NOT IN ('paid', 'void', 'draft')
           AND due_date < $2 AND amount_due > 0
           ORDER BY due_date""",
        org_id, today,
    )
    invoices = [dict(r) for r in rows]

    # Aging buckets
    aging = {"current": [], "1_30": [], "31_60": [], "61_90": [], "over_90": []}
    for inv in invoices:
        days = (today - inv["due_date"]).days
        if days <= 0:
            aging["current"].append(inv)
        elif days <= 30:
            aging["1_30"].append(inv)
        elif days <= 60:
            aging["31_60"].append(inv)
        elif days <= 90:
            aging["61_90"].append(inv)
        else:
            aging["over_90"].append(inv)

    return {
        "total_overdue": sum(float(inv.get("amount_due", 0)) for inv in invoices),
        "count": len(invoices),
        "aging": {k: {"count": len(v), "total": sum(float(i.get("amount_due", 0)) for i in v)}
                  for k, v in aging.items()},
        "invoices": invoices,
    }


@router.get("/organizations/{org_id}/invoices/{invoice_id}")
async def get_invoice(
    org_id: str,
    invoice_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    invoice = await db.fetchrow(
        "SELECT * FROM invoices WHERE id = $1 AND org_id = $2", invoice_id, org_id
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    lines = await db.fetch(
        "SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY line_number",
        invoice_id,
    )
    result = dict(invoice)
    result["lines"] = [dict(l) for l in lines]

    # Include payments
    payments = await db.fetch(
        "SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY date", invoice_id
    )
    result["payments"] = [dict(p) for p in payments]
    return result


@router.put("/organizations/{org_id}/invoices/{invoice_id}")
async def update_invoice(
    org_id: str,
    invoice_id: str,
    body: InvoiceUpdate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    invoice = await db.fetchrow(
        "SELECT * FROM invoices WHERE id = $1 AND org_id = $2", invoice_id, org_id
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft invoices can be updated")

    updates = body.model_dump(exclude_unset=True, exclude={"lines"})
    if body.lines is not None:
        # Recalculate totals
        total_amount = 0.0
        total_tax = 0.0
        await db.execute("DELETE FROM invoice_lines WHERE invoice_id = $1", invoice_id)
        for idx, line in enumerate(body.lines):
            amounts = await calculate_line_amounts(db, org_id, line)
            total_amount += amounts["total"]
            total_tax += amounts["tax_amount"]
            await db.execute(
                """INSERT INTO invoice_lines
                   (id, invoice_id, line_number, description, account_id, quantity,
                    unit_price, discount_percent, tax_code, subtotal, tax_amount, total)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)""",
                str(uuid4()), invoice_id, idx + 1, line.description, line.account_id,
                line.quantity, line.unit_price, line.discount_percent, line.tax_code,
                amounts["net"], amounts["tax_amount"], amounts["total"],
            )
        updates["subtotal"] = round(total_amount - total_tax, 2)
        updates["tax_amount"] = round(total_tax, 2)
        updates["total_amount"] = round(total_amount, 2)
        updates["amount_due"] = round(total_amount - float(invoice.get("amount_paid", 0)), 2)

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = datetime.utcnow()
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [invoice_id] + list(updates.values())
    await db.execute(f"UPDATE invoices SET {set_clause} WHERE id = $1", *values)

    await audit_log(db, org_id, user.id, "update", "invoice", invoice_id)
    return {"detail": "Invoice updated"}


@router.post("/organizations/{org_id}/invoices/{invoice_id}/send")
async def send_invoice(
    org_id: str,
    invoice_id: str,
    body: SendInvoiceRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """Send invoice via email using Mailgun."""
    import httpx
    import os

    org = await verify_org_access(db, org_id, user.id)
    invoice = await db.fetchrow(
        "SELECT * FROM invoices WHERE id = $1 AND org_id = $2", invoice_id, org_id
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    mailgun_api_key = os.environ.get("MAILGUN_API_KEY")
    mailgun_domain = os.environ.get("MAILGUN_DOMAIN")
    if not mailgun_api_key or not mailgun_domain:
        raise HTTPException(status_code=503, detail="Email service not configured")

    subject = body.subject or f"Invoice {invoice['invoice_number']} from {org.get('name', '')}"
    message = body.message or (
        f"Please find attached invoice {invoice['invoice_number']} "
        f"for {invoice['currency']} {invoice['total_amount']:.2f}.\n\n"
        f"Due date: {invoice['due_date']}"
    )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                auth=("api", mailgun_api_key),
                data={
                    "from": f"Accounts <accounts@{mailgun_domain}>",
                    "to": body.to_email,
                    "subject": subject,
                    "text": message,
                },
            )
            resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to send invoice email: {e}")
        raise HTTPException(status_code=502, detail="Failed to send email")

    # Update invoice status
    now = datetime.utcnow()
    if invoice["status"] == "draft":
        await db.execute(
            "UPDATE invoices SET status = $1, sent_at = $2, updated_at = $3 WHERE id = $4",
            "sent", now, now, invoice_id,
        )
        # Create journal entry on first send
        await create_invoice_journal(db, org_id, user.id, dict(invoice))

    await audit_log(db, org_id, user.id, "send", "invoice", invoice_id,
                    {"to_email": body.to_email})
    return {"detail": "Invoice sent", "sent_at": now.isoformat()}


@router.post("/organizations/{org_id}/invoices/{invoice_id}/record-payment")
async def record_payment(
    org_id: str,
    invoice_id: str,
    body: RecordPaymentRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    invoice = await db.fetchrow(
        "SELECT * FROM invoices WHERE id = $1 AND org_id = $2", invoice_id, org_id
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice["status"] == "void":
        raise HTTPException(status_code=400, detail="Cannot record payment on a void invoice")
    if invoice["status"] == "paid":
        raise HTTPException(status_code=400, detail="Invoice already fully paid")

    amount_due = float(invoice.get("amount_due", 0))
    if body.amount > amount_due + 0.005:
        raise HTTPException(status_code=400, detail=f"Payment amount exceeds amount due ({amount_due:.2f})")

    payment_id = str(uuid4())
    now = datetime.utcnow()

    await db.execute(
        """INSERT INTO invoice_payments
           (id, invoice_id, amount, date, account_id, reference, created_by, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
        payment_id, invoice_id, body.amount, body.date, body.account_id,
        body.reference, user.id, now,
    )

    new_paid = float(invoice.get("amount_paid", 0)) + body.amount
    new_due = float(invoice["total_amount"]) - new_paid
    new_status = "paid" if new_due <= 0.005 else "partially_paid"

    await db.execute(
        "UPDATE invoices SET amount_paid = $1, amount_due = $2, status = $3, updated_at = $4 WHERE id = $5",
        round(new_paid, 2), round(max(new_due, 0), 2), new_status, now, invoice_id,
    )

    # Create payment journal entry
    journal_id = str(uuid4())
    ref = f"Payment for {invoice['invoice_number']}"
    await db.execute(
        """INSERT INTO journals (id, org_id, date, reference, narration, status,
           source_type, source_id, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
        journal_id, org_id, body.date, body.reference, ref,
        "posted", "payment", payment_id, user.id, now, now,
    )

    # Debit bank, credit receivable (sales) or debit payable, credit bank (purchase)
    if invoice["invoice_type"] == "sales":
        debit_account = body.account_id
        credit_account = invoice.get("receivable_account_id", body.account_id)
    else:
        debit_account = invoice.get("payable_account_id", body.account_id)
        credit_account = body.account_id

    await db.execute(
        """INSERT INTO journal_lines (id, journal_id, line_number, account_id, description, debit, credit)
           VALUES ($1,$2,$3,$4,$5,$6,$7)""",
        str(uuid4()), journal_id, 1, debit_account, ref, body.amount, 0,
    )
    await db.execute(
        """INSERT INTO journal_lines (id, journal_id, line_number, account_id, description, debit, credit)
           VALUES ($1,$2,$3,$4,$5,$6,$7)""",
        str(uuid4()), journal_id, 2, credit_account, ref, 0, body.amount,
    )

    await audit_log(db, org_id, user.id, "record_payment", "invoice", invoice_id,
                    {"amount": body.amount, "payment_id": payment_id})
    return {"detail": "Payment recorded", "payment_id": payment_id, "new_status": new_status}


@router.post("/organizations/{org_id}/invoices/{invoice_id}/void")
async def void_invoice(
    org_id: str,
    invoice_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    invoice = await db.fetchrow(
        "SELECT * FROM invoices WHERE id = $1 AND org_id = $2", invoice_id, org_id
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice["status"] == "void":
        raise HTTPException(status_code=400, detail="Invoice already voided")
    if invoice["status"] == "paid":
        raise HTTPException(status_code=400, detail="Cannot void a fully paid invoice; create a credit note instead")

    now = datetime.utcnow()
    await db.execute(
        "UPDATE invoices SET status = $1, voided_at = $2, updated_at = $3 WHERE id = $4",
        "void", now, now, invoice_id,
    )

    # Reverse any existing journal entries
    journals = await db.fetch(
        "SELECT id FROM journals WHERE source_type = 'invoice' AND source_id = $1",
        invoice_id,
    )
    for j in journals:
        await db.execute(
            "UPDATE journals SET status = 'reversed', updated_at = $1 WHERE id = $2",
            now, j["id"],
        )

    await audit_log(db, org_id, user.id, "void", "invoice", invoice_id)
    return {"detail": "Invoice voided", "voided_at": now.isoformat()}


@router.get("/organizations/{org_id}/invoices/{invoice_id}/pdf")
async def generate_invoice_pdf(
    org_id: str,
    invoice_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_org_access(db, org_id, user.id)
    invoice = await db.fetchrow(
        "SELECT * FROM invoices WHERE id = $1 AND org_id = $2", invoice_id, org_id
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    org = await db.fetchrow("SELECT * FROM organizations WHERE id = $1", org_id)
    contact = await db.fetchrow("SELECT * FROM contacts WHERE id = $1", invoice["contact_id"])
    lines = await db.fetch(
        "SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY line_number",
        invoice_id,
    )

    # Generate simple PDF using reportlab or similar
    # For now, generate a structured text-based PDF placeholder
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas as pdf_canvas

        buffer = io.BytesIO()
        c = pdf_canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, height - 50, invoice["invoice_type"].upper() + " INVOICE")
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 75, f"Invoice #: {invoice['invoice_number']}")
        c.drawString(50, height - 95, f"Date: {invoice['date']}")
        c.drawString(50, height - 115, f"Due Date: {invoice['due_date']}")

        # Organization
        if org:
            c.drawString(350, height - 75, org.get("name", ""))

        # Contact
        if contact:
            c.drawString(50, height - 150, f"Bill To: {contact.get('name', '')}")
            if contact.get("email"):
                c.drawString(50, height - 170, contact["email"])

        # Lines header
        y = height - 210
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y, "Description")
        c.drawString(300, y, "Qty")
        c.drawString(350, y, "Price")
        c.drawString(420, y, "Tax")
        c.drawString(480, y, "Total")

        c.setFont("Helvetica", 10)
        for line in lines:
            y -= 20
            if y < 100:
                c.showPage()
                y = height - 50
            c.drawString(50, y, str(line.get("description", "")))
            c.drawString(300, y, f"{line.get('quantity', 0):.2f}")
            c.drawString(350, y, f"{line.get('unit_price', 0):.2f}")
            c.drawString(420, y, f"{line.get('tax_amount', 0):.2f}")
            c.drawString(480, y, f"{line.get('total', 0):.2f}")

        # Totals
        y -= 40
        c.setFont("Helvetica-Bold", 12)
        c.drawString(350, y, f"Subtotal: {invoice.get('subtotal', 0):.2f}")
        y -= 20
        c.drawString(350, y, f"Tax: {invoice.get('tax_amount', 0):.2f}")
        y -= 20
        c.drawString(350, y, f"Total: {invoice['currency']} {invoice.get('total_amount', 0):.2f}")

        if invoice.get("notes"):
            y -= 40
            c.setFont("Helvetica", 9)
            c.drawString(50, y, f"Notes: {invoice['notes']}")

        c.save()
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={invoice['invoice_number']}.pdf"
            },
        )
    except ImportError:
        # Fallback: return invoice data as JSON if reportlab is not installed
        logger.warning("reportlab not installed; returning invoice data as JSON instead of PDF")
        invoice_data = dict(invoice)
        invoice_data["lines"] = [dict(l) for l in lines]
        invoice_data["organization"] = dict(org) if org else None
        invoice_data["contact"] = dict(contact) if contact else None
        raise HTTPException(
            status_code=501,
            detail="PDF generation unavailable: reportlab library not installed",
        )
