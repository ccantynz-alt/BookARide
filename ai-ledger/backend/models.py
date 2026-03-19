"""
AI Ledger — Pydantic models for every accounting entity.

Design principles:
- ``Decimal`` for all monetary amounts (never ``float``).
- ``datetime`` for all timestamps / dates.
- Separate Create / Update / Response schemas so internal fields
  (``id``, ``created_at``, ``password_hash``) are never leaked or
  accidentally writable.
- Enum classes for every domain-specific finite set.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ════════════════════════════════════════════════════════════════════
#  Enums
# ════════════════════════════════════════════════════════════════════


class AccountType(str, Enum):
    """Top-level account classification (double-entry)."""
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class JournalStatus(str, Enum):
    DRAFT = "draft"
    POSTED = "posted"
    VOIDED = "voided"


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    VOIDED = "voided"
    WRITTEN_OFF = "written_off"


class InvoiceType(str, Enum):
    INVOICE = "invoice"
    CREDIT_NOTE = "credit_note"
    QUOTE = "quote"


class ContactType(str, Enum):
    CUSTOMER = "customer"
    SUPPLIER = "supplier"
    BOTH = "both"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    MATCHED = "matched"
    RECONCILED = "reconciled"
    EXCLUDED = "excluded"


class Jurisdiction(str, Enum):
    US = "US"
    NZ = "NZ"
    AU = "AU"
    UK = "UK"


class Currency(str, Enum):
    USD = "USD"
    NZD = "NZD"
    AUD = "AUD"
    GBP = "GBP"


# ════════════════════════════════════════════════════════════════════
#  Organization
# ════════════════════════════════════════════════════════════════════


class OrganizationCreate(BaseModel):
    """Payload to create a new organization / tenant."""
    name: str = Field(..., min_length=1, max_length=200)
    jurisdiction: Jurisdiction
    base_currency: Currency
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    jurisdiction: Jurisdiction
    base_currency: Currency
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════════
#  User
# ════════════════════════════════════════════════════════════════════


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=200)
    role: str = Field(default="member", pattern=r"^(owner|admin|member|viewer)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user representation — never exposes ``password_hash``."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    email: str
    full_name: str
    role: str
    mfa_enabled: bool = False
    created_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════════
#  Chart of Accounts
# ════════════════════════════════════════════════════════════════════


class ChartOfAccountCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    account_type: AccountType
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    tax_code_id: Optional[UUID] = None
    is_system: bool = False


class ChartOfAccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    tax_code_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class ChartOfAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    code: str
    name: str
    account_type: AccountType
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    tax_code_id: Optional[UUID] = None
    is_system: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════════
#  Journal Entries
# ════════════════════════════════════════════════════════════════════


class JournalLineCreate(BaseModel):
    account_id: UUID
    debit: Decimal = Field(default=Decimal("0.00"), ge=0)
    credit: Decimal = Field(default=Decimal("0.00"), ge=0)
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    tax_code_id: Optional[UUID] = None


class JournalLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    journal_entry_id: UUID
    account_id: UUID
    debit: Decimal
    credit: Decimal
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    tax_code_id: Optional[UUID] = None


class JournalEntryCreate(BaseModel):
    date: datetime
    reference: Optional[str] = Field(None, max_length=100)
    narration: Optional[str] = None
    lines: List[JournalLineCreate] = Field(..., min_length=2)


class JournalEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    date: datetime
    reference: Optional[str] = None
    narration: Optional[str] = None
    status: JournalStatus
    lines: List[JournalLineResponse] = []
    created_by: UUID
    created_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════════
#  Invoices
# ════════════════════════════════════════════════════════════════════


class InvoiceLineCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal
    account_id: UUID
    tax_code_id: Optional[UUID] = None
    discount_percent: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)


class InvoiceLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    invoice_id: UUID
    description: str
    quantity: Decimal
    unit_price: Decimal
    account_id: UUID
    tax_code_id: Optional[UUID] = None
    discount_percent: Decimal
    line_total: Decimal
    tax_amount: Decimal


class InvoiceCreate(BaseModel):
    invoice_type: InvoiceType = InvoiceType.INVOICE
    contact_id: UUID
    issue_date: datetime
    due_date: datetime
    currency: Currency
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    lines: List[InvoiceLineCreate] = Field(..., min_length=1)


class InvoiceUpdate(BaseModel):
    due_date: Optional[datetime] = None
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    status: Optional[InvoiceStatus] = None


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    invoice_number: str
    invoice_type: InvoiceType
    contact_id: UUID
    issue_date: datetime
    due_date: datetime
    currency: Currency
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: InvoiceStatus
    subtotal: Decimal
    tax_total: Decimal
    total: Decimal
    amount_paid: Decimal
    amount_due: Decimal
    lines: List[InvoiceLineResponse] = []
    created_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════════
#  Contacts
# ════════════════════════════════════════════════════════════════════


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_type: ContactType
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    default_currency: Optional[Currency] = None
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_type: Optional[ContactType] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    default_currency: Optional[Currency] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    name: str
    contact_type: ContactType
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    default_currency: Optional[Currency] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════════
#  Bank Accounts & Transactions
# ════════════════════════════════════════════════════════════════════


class BankAccount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    account_name: str
    account_number_masked: str
    institution_name: str
    currency: Currency
    current_balance: Decimal
    linked_account_id: Optional[UUID] = None
    feed_provider: Optional[str] = None
    feed_connection_id: Optional[str] = None
    is_active: bool
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class BankTransaction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bank_account_id: UUID
    org_id: UUID
    transaction_date: datetime
    posted_date: Optional[datetime] = None
    amount: Decimal
    description: str
    reference: Optional[str] = None
    category: Optional[str] = None
    status: TransactionStatus
    matched_journal_id: Optional[UUID] = None
    ai_suggested_account_id: Optional[UUID] = None
    ai_confidence: Optional[Decimal] = None
    created_at: datetime


# ════════════════════════════════════════════════════════════════════
#  Tax
# ════════════════════════════════════════════════════════════════════


class TaxCode(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    code: str
    name: str
    rate: Decimal
    jurisdiction: Jurisdiction
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TaxReturn(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    jurisdiction: Jurisdiction
    period_start: datetime
    period_end: datetime
    tax_collected: Decimal
    tax_paid: Decimal
    net_tax: Decimal
    status: str  # draft, filed, paid
    filed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════════
#  Tax Treaties
# ════════════════════════════════════════════════════════════════════


class TaxTreaty(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    jurisdiction_a: Jurisdiction
    jurisdiction_b: Jurisdiction
    treaty_name: str
    withholding_rate_dividends: Optional[Decimal] = None
    withholding_rate_interest: Optional[Decimal] = None
    withholding_rate_royalties: Optional[Decimal] = None
    effective_from: datetime
    notes: Optional[str] = None


class TreatyApplication(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    treaty_id: UUID
    contact_id: UUID
    income_type: str
    gross_amount: Decimal
    treaty_rate: Decimal
    tax_withheld: Decimal
    applied_at: datetime
    notes: Optional[str] = None


# ════════════════════════════════════════════════════════════════════
#  Audit Log
# ════════════════════════════════════════════════════════════════════


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    user_id: UUID
    action: str
    entity_type: str
    entity_id: Optional[UUID] = None
    changes: Optional[dict[str, Any]] = None
    ip_address: Optional[str] = None
    request_id: Optional[str] = None
    created_at: datetime


# ════════════════════════════════════════════════════════════════════
#  Auth Token
# ════════════════════════════════════════════════════════════════════


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user_id
    org_id: str
    role: str
    exp: datetime


# ════════════════════════════════════════════════════════════════════
#  Pagination
# ════════════════════════════════════════════════════════════════════

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    page: int = Field(..., ge=1)
    per_page: int = Field(..., ge=1, le=200)
    total: int = Field(..., ge=0)
    items: List[T]

    @property
    def total_pages(self) -> int:
        if self.per_page == 0:
            return 0
        return (self.total + self.per_page - 1) // self.per_page

    @property
    def has_next(self) -> bool:
        return self.page < self.total_pages

    @property
    def has_prev(self) -> bool:
        return self.page > 1
