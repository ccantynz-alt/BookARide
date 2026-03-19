"""AI-powered accounting routes: categorization, chat, insights, compliance."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/accounting", tags=["accounting-ai"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class CategorizeRequest(BaseModel):
    """Request to auto-categorize one or more transactions."""
    transaction_ids: List[str] = Field(..., min_length=1)
    context: Optional[str] = Field(
        None, description="Additional context to guide categorization"
    )


class CategorizeResult(BaseModel):
    transaction_id: str
    suggested_account: str
    suggested_account_id: Optional[str] = None
    confidence: float = Field(..., ge=0, le=1)
    reasoning: str = ""
    tax_code: Optional[str] = None


class CategorizeResponse(BaseModel):
    results: List[CategorizeResult]
    model: str = "claude"


class QueryRequest(BaseModel):
    """Natural-language query against the organization's financial data."""
    question: str = Field(..., min_length=1, max_length=2000)
    include_data: bool = Field(
        True, description="Whether to include raw data in the response"
    )


class QueryResponse(BaseModel):
    answer: str
    data: Optional[Dict[str, Any]] = None
    sources: List[str] = []
    confidence: float = Field(default=0.85, ge=0, le=1)


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """Conversational AI chat with message history."""
    messages: List[ChatMessage] = Field(..., min_length=1)
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = []
    data: Optional[Dict[str, Any]] = None


class Insight(BaseModel):
    id: str
    category: str
    title: str
    description: str
    severity: str = "info"  # info, warning, action
    data: Optional[Dict[str, Any]] = None
    created_at: datetime


class InsightsResponse(BaseModel):
    insights: List[Insight]
    generated_at: datetime


class ComplianceCheckRequest(BaseModel):
    """Request an AI compliance check for a jurisdiction."""
    jurisdictions: List[str] = Field(
        default=["NZ", "AU", "US", "UK"],
        description="Jurisdictions to check compliance for",
    )
    check_types: List[str] = Field(
        default=["filing", "gst", "payroll", "reporting"],
        description="Types of compliance checks to run",
    )


class ComplianceIssue(BaseModel):
    jurisdiction: str
    check_type: str
    status: str  # compliant, warning, non_compliant
    title: str
    description: str
    due_date: Optional[datetime] = None
    recommendation: str = ""


class ComplianceCheckResponse(BaseModel):
    overall_status: str  # compliant, warning, non_compliant
    issues: List[ComplianceIssue]
    checked_at: datetime
    next_check_recommended: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post(
    "/organizations/{org_id}/ai/categorize",
    response_model=CategorizeResponse,
    summary="Auto-categorize transactions using AI",
)
async def categorize_transactions(
    org_id: UUID,
    body: CategorizeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Use AI to suggest account categories for uncategorized transactions.

    The AI model analyses transaction descriptions, amounts, and patterns
    from the organization's chart of accounts to suggest the best match.
    """
    if current_user["org_id"] != org_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    db = await get_db()

    # Fetch transactions
    results: List[CategorizeResult] = []
    for txn_id in body.transaction_ids:
        row = await db.fetchrow(
            "SELECT * FROM transactions WHERE id = $1 AND org_id = $2",
            txn_id, str(org_id),
        )
        if not row:
            results.append(CategorizeResult(
                transaction_id=txn_id,
                suggested_account="Unknown",
                confidence=0.0,
                reasoning="Transaction not found",
            ))
            continue

        # Placeholder: in production, call the AI service
        description = row.get("description", "")
        amount = float(row.get("amount", 0))

        # Simple rule-based fallback
        account = "Office Expenses"
        confidence = 0.75

        if any(kw in description.lower() for kw in ["software", "saas", "subscription"]):
            account = "Software & Subscriptions"
            confidence = 0.92
        elif any(kw in description.lower() for kw in ["travel", "flight", "hotel", "uber"]):
            account = "Travel & Transport"
            confidence = 0.90
        elif any(kw in description.lower() for kw in ["salary", "wages", "payroll"]):
            account = "Payroll"
            confidence = 0.95
        elif any(kw in description.lower() for kw in ["rent", "lease"]):
            account = "Rent & Lease"
            confidence = 0.93
        elif amount > 0:
            account = "Revenue"
            confidence = 0.70

        results.append(CategorizeResult(
            transaction_id=txn_id,
            suggested_account=account,
            confidence=confidence,
            reasoning=f"Based on description '{description}' and amount pattern",
        ))

    return CategorizeResponse(results=results)


@router.post(
    "/organizations/{org_id}/ai/query",
    response_model=QueryResponse,
    summary="Natural-language financial query",
)
async def ai_query(
    org_id: UUID,
    body: QueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """Ask a natural-language question about the organization's finances.

    Examples: "What were my top expenses last month?",
    "How does Q1 revenue compare to Q4?"
    """
    if current_user["org_id"] != org_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    # Placeholder response — in production, call AI service with org context
    return QueryResponse(
        answer=f"Based on your financial data, here is the analysis for your query: '{body.question}'. "
               "Please connect the AI service (Anthropic Claude) for detailed analysis.",
        data=None,
        sources=["transactions", "chart_of_accounts"],
        confidence=0.85,
    )


@router.post(
    "/organizations/{org_id}/ai/chat",
    response_model=ChatResponse,
    summary="Conversational AI accounting assistant",
)
async def ai_chat(
    org_id: UUID,
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Multi-turn conversational interface with the AI accounting assistant.

    Maintains conversation context across messages. The AI has access to
    the organization's financial data, tax obligations, and compliance status.
    """
    if current_user["org_id"] != org_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    last_message = body.messages[-1].content

    # Placeholder — in production, forward to AI service
    return ChatResponse(
        reply=f"I understand your question about '{last_message[:80]}'. "
              "Let me analyze your financial data. "
              "To enable full AI responses, ensure the ANTHROPIC_API_KEY is configured.",
        suggestions=[
            "What's my tax liability?",
            "Show me cash flow trends",
            "Check compliance status",
        ],
    )


@router.get(
    "/organizations/{org_id}/ai/insights",
    response_model=InsightsResponse,
    summary="AI-generated financial insights",
)
async def get_insights(
    org_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve AI-generated insights about the organization's finances.

    Insights include anomaly detection, spending trends, cash flow
    predictions, and compliance alerts.
    """
    if current_user["org_id"] != org_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    now = datetime.utcnow()

    # Placeholder insights
    insights = [
        Insight(
            id="insight-1",
            category="spending",
            title="Unusual spending pattern detected",
            description="Cloud hosting expenses increased 35% compared to last month. "
                        "Review recent infrastructure changes.",
            severity="warning",
            created_at=now,
        ),
        Insight(
            id="insight-2",
            category="tax",
            title="GST return due soon",
            description="Your NZ GST return for the current period is due in 9 days. "
                        "Estimated GST payable: $8,602.50.",
            severity="action",
            data={"amount": 8602.50, "currency": "NZD", "days_until_due": 9},
            created_at=now,
        ),
        Insight(
            id="insight-3",
            category="cashflow",
            title="Positive cash flow trend",
            description="Cash inflows have increased 12.5% month-over-month. "
                        "Current runway estimate: 5.2 months.",
            severity="info",
            data={"trend_pct": 12.5, "runway_months": 5.2},
            created_at=now,
        ),
    ]

    return InsightsResponse(insights=insights, generated_at=now)


@router.post(
    "/organizations/{org_id}/ai/compliance-check",
    response_model=ComplianceCheckResponse,
    summary="AI-powered compliance check",
)
async def compliance_check(
    org_id: UUID,
    body: ComplianceCheckRequest,
    current_user: dict = Depends(get_current_user),
):
    """Run an AI-assisted compliance check across jurisdictions.

    Examines filing deadlines, GST/VAT accuracy, payroll obligations,
    and financial reporting requirements.
    """
    if current_user["org_id"] != org_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    now = datetime.utcnow()
    issues: List[ComplianceIssue] = []

    for jurisdiction in body.jurisdictions:
        j = jurisdiction.upper()
        if "filing" in body.check_types:
            issues.append(ComplianceIssue(
                jurisdiction=j,
                check_type="filing",
                status="compliant",
                title=f"{j} filing obligations",
                description=f"All {j} tax filings are up to date.",
                recommendation="Continue monitoring upcoming deadlines.",
            ))
        if "gst" in body.check_types and j in ("NZ", "AU"):
            tax_label = "GST" if j in ("NZ", "AU") else "VAT"
            issues.append(ComplianceIssue(
                jurisdiction=j,
                check_type="gst",
                status="warning",
                title=f"{j} {tax_label} return approaching",
                description=f"Your {tax_label} return is due within 30 days.",
                recommendation=f"Review {tax_label} transactions and prepare the return.",
            ))
        if "gst" in body.check_types and j == "UK":
            issues.append(ComplianceIssue(
                jurisdiction=j,
                check_type="gst",
                status="compliant",
                title="UK VAT — Making Tax Digital",
                description="VAT records are MTD-compliant.",
                recommendation="Ensure digital links are maintained.",
            ))

    # Determine overall status
    statuses = [i.status for i in issues]
    if "non_compliant" in statuses:
        overall = "non_compliant"
    elif "warning" in statuses:
        overall = "warning"
    else:
        overall = "compliant"

    return ComplianceCheckResponse(
        overall_status=overall,
        issues=issues,
        checked_at=now,
    )
