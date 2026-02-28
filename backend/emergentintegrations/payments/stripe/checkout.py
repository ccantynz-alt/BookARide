"""
Local compatibility shim for deployments that do NOT have the Emergent platform package.
This satisfies imports in backend/server.py:
  from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

This implementation uses the official `stripe` python library if available.
If Stripe keys are not configured, the methods raise helpful errors instead of crashing import-time.
"""

import os
from typing import Any, Dict, Optional

try:
    import stripe  # type: ignore
except Exception as e:  # pragma: no cover
    stripe = None  # type: ignore


try:
    from pydantic import BaseModel
except Exception as e:  # pragma: no cover
    BaseModel = object  # type: ignore


class CheckoutSessionRequest(BaseModel):
    amount_total: int
    currency: str = "nzd"
    success_url: str
    cancel_url: str
    # optional fields commonly used in server.py
    customer_email: Optional[str] = None
    metadata: Dict[str, Any] = {}
    mode: str = "payment"
    description: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str


class CheckoutStatusResponse(BaseModel):
    session_id: str
    status: str
    payment_status: str
    amount_total: Optional[int] = None
    currency: Optional[str] = None
    metadata: Dict[str, Any] = {}


class WebhookResponse(BaseModel):
    status: str
    event_type: Optional[str] = None
    session_id: Optional[str] = None
    payment_status: Optional[str] = None
    metadata: Dict[str, Any] = {}


class StripeCheckout:
    def __init__(self, api_key: str, webhook_url: str = ""):
        self.api_key = api_key
        self.webhook_url = webhook_url

        if stripe is None:
            raise RuntimeError("stripe library is not available. Add 'stripe' to requirements.txt.")

        stripe.api_key = api_key

    async def create_checkout_session(self, req: CheckoutSessionRequest) -> CheckoutSessionResponse:
        if not self.api_key or self.api_key.strip() == "":
            raise RuntimeError("STRIPE_SECRET_KEY is not set.")

        session = stripe.checkout.Session.create(
            mode=getattr(req, "mode", "payment"),
            line_items=[
                {
                    "price_data": {
                        "currency": req.currency,
                        "product_data": {
                            "name": req.description or "BookARide booking",
                        },
                        "unit_amount": int(req.amount_total),
                    },
                    "quantity": 1,
                }
            ],
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            customer_email=getattr(req, "customer_email", None),
            metadata=getattr(req, "metadata", {}) or {},
        )

        return CheckoutSessionResponse(session_id=session.id, url=session.url)

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        if not self.api_key or self.api_key.strip() == "":
            raise RuntimeError("STRIPE_SECRET_KEY is not set.")

        session = stripe.checkout.Session.retrieve(session_id)
        return CheckoutStatusResponse(
            session_id=session.id,
            status=getattr(session, "status", "") or "",
            payment_status=getattr(session, "payment_status", "") or "",
            amount_total=getattr(session, "amount_total", None),
            currency=getattr(session, "currency", None),
            metadata=getattr(session, "metadata", {}) or {},
        )

    async def handle_webhook(self, body: bytes, signature: str) -> WebhookResponse:
        # Render should set STRIPE_WEBHOOK_SECRET if you want signature verification
        secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
        if not secret:
            # Don't crash the whole app if not configured; just report.
            return WebhookResponse(status="ignored_no_webhook_secret")

        event = stripe.Webhook.construct_event(payload=body, sig_header=signature, secret=secret)
        event_type = getattr(event, "type", None)

        session_id = None
        payment_status = None
        metadata = {}
        try:
            obj = event.data.object
            session_id = getattr(obj, "id", None)
            payment_status = getattr(obj, "payment_status", None)
            metadata = dict(getattr(obj, "metadata", {}) or {})
        except Exception:
            pass

        return WebhookResponse(
            status="ok",
            event_type=event_type,
            session_id=session_id,
            payment_status=payment_status,
            metadata=metadata,
        )