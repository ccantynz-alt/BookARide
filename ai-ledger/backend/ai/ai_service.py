"""
AI Service Layer for AI Ledger Accounting Platform.

Uses Anthropic's Claude API to power intelligent accounting features including
transaction categorization, document extraction, natural language queries,
tax treaty analysis, compliance checking, anomaly detection, and cash flow forecasting.
"""

import json
import logging
import base64
from datetime import datetime, date
from decimal import Decimal
from typing import Any, Optional

import anthropic

logger = logging.getLogger(__name__)


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal types."""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

ACCOUNTANT_SYSTEM_PROMPT = (
    "You are an expert chartered accountant and financial analyst with deep knowledge of "
    "international accounting standards including US GAAP, IFRS, NZ GAAP (NZ IAS / NZ IFRS), "
    "AASB (Australian Accounting Standards), and UK GAAP (FRS 102). You are also well-versed "
    "in tax law across the United States, New Zealand, Australia, and the United Kingdom.\n\n"
    "When providing answers:\n"
    "- Be precise with numbers; never round unless explicitly asked.\n"
    "- Cite the relevant accounting standard or tax provision where applicable.\n"
    "- Include a confidence score (0.0-1.0) indicating how certain you are.\n"
    "- If you are unsure, say so and explain what additional information would help.\n"
    "- Always respond with valid JSON when a structured response is requested."
)

CATEGORIZATION_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "Your task is to categorize bank transactions into the correct chart of accounts. "
    "Consider the transaction description, amount, counterparty, and any historical "
    "categorizations for similar transactions. Return your answer as JSON with keys: "
    "account_id (str), account_name (str), confidence (float 0-1), reasoning (str), "
    "and suggested_tax_code (str or null)."
)

DOCUMENT_EXTRACTION_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "Your task is to extract structured financial data from documents such as receipts, "
    "invoices, bills, and statements. Extract all relevant fields and return them as JSON. "
    "For invoices include: vendor_name, invoice_number, invoice_date, due_date, line_items "
    "(list of description/quantity/unit_price/amount/tax_code), subtotal, tax_amount, total, "
    "currency, payment_terms. For receipts include: vendor_name, date, items, subtotal, "
    "tax_amount, total, payment_method, currency. Always include a confidence score."
)

NL_QUERY_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "Your task is to answer natural language financial questions. You have access to the "
    "organization's financial data context provided below. If the question can be answered "
    "with a SQL query against the ledger, include the SQL. Return JSON with keys: "
    "answer (str), sql (str or null), data (dict or null), confidence (float 0-1), "
    "caveats (list of str)."
)

TREATY_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "Your task is to identify applicable tax treaty benefits for cross-border transactions. "
    "Consider the source country, resident country, income type, and the specific treaty "
    "provisions between those countries. Return JSON with keys: applicable_treaties (list), "
    "each containing: treaty_name (str), article (str), benefit_type (str), "
    "standard_rate (str), treaty_rate (str), saving (str), conditions (list of str), "
    "confidence (float 0-1)."
)

COMPLIANCE_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "Your task is to check an organization's financial data for compliance issues against "
    "the rules of the specified jurisdiction. Identify any missing filings, incorrect tax "
    "treatments, reporting deficiencies, or regulatory concerns. Return JSON with keys: "
    "issues (list), each containing: severity (critical/warning/info), area (str), "
    "description (str), regulation (str), recommendation (str), confidence (float 0-1)."
)

ANOMALY_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "Your task is to detect anomalies in financial transactions that may indicate errors, "
    "fraud, or unusual activity. Analyze the transactions against historical patterns. "
    "Return JSON with keys: anomalies (list), each containing: transaction_id (str), "
    "anomaly_type (str - one of duplicate/unusual_amount/unusual_timing/unusual_counterparty/"
    "round_number/sequence_gap/category_mismatch), severity (high/medium/low), "
    "description (str), confidence (float 0-1), recommended_action (str)."
)

CASHFLOW_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "Your task is to generate a cash flow forecast based on historical transaction data, "
    "outstanding receivables, and upcoming payables. Provide a week-by-week or month-by-month "
    "forecast. Return JSON with keys: forecast_periods (list of period/inflow/outflow/"
    "net/cumulative_balance dicts), assumptions (list of str), risks (list of str), "
    "confidence (float 0-1), methodology (str)."
)

TAX_SUMMARY_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "Your task is to generate a tax summary and preparation guide for a specific "
    "jurisdiction and period. Include estimated tax liability, deductions, credits, "
    "filing requirements, and key deadlines. Return JSON with keys: jurisdiction (str), "
    "period (str), estimated_tax (str), effective_rate (str), taxable_income (str), "
    "deductions (list), credits (list), filing_requirements (list), deadlines (list), "
    "recommendations (list), confidence (float 0-1)."
)

CHAT_SYSTEM_PROMPT = (
    f"{ACCOUNTANT_SYSTEM_PROMPT}\n\n"
    "You are an AI accounting assistant for the AI Ledger platform. Help users with "
    "accounting questions, explain financial concepts, assist with bookkeeping tasks, "
    "and provide guidance on tax and compliance matters. Be conversational but precise. "
    "When referencing specific numbers from the organization's data, cite the source."
)


class AIService:
    """Core AI service that powers all AI features in the AI Ledger platform.

    Uses Claude API (anthropic SDK) for transaction categorization, document OCR,
    natural language queries, treaty analysis, compliance checking, anomaly detection,
    cash flow forecasting, and general accounting chat.
    """

    def __init__(self, api_key: str, model: str | None = None) -> None:
        """Initialize the AI service.

        Args:
            api_key: Anthropic API key.
            model: Claude model to use. Defaults to claude-sonnet-4-20250514 for
                   speed/cost balance.
        """
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model or "claude-sonnet-4-20250514"
        logger.info("AIService initialized with model=%s", self.model)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _serialize(self, obj: Any) -> str:
        """Serialize objects to JSON, handling Decimal and datetime."""
        return json.dumps(obj, cls=DecimalEncoder, default=str)

    def _parse_json_response(self, text: str) -> dict:
        """Extract and parse JSON from Claude's response text.

        Handles cases where the model wraps JSON in markdown code fences.
        """
        cleaned = text.strip()
        if cleaned.startswith("```"):
            # Strip markdown code fences
            lines = cleaned.split("\n")
            # Remove first line (```json or ```) and last line (```)
            start = 1
            end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
            cleaned = "\n".join(lines[start:end])
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.warning("Failed to parse AI response as JSON: %s", exc)
            return {"raw_response": text, "parse_error": str(exc), "confidence": 0.0}

    async def _call_claude(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 4096,
        temperature: float = 0.2,
    ) -> str:
        """Make a call to Claude API with error handling.

        Args:
            system_prompt: The system prompt establishing context and role.
            user_message: The user message containing the task.
            max_tokens: Maximum tokens in response.
            temperature: Sampling temperature (lower = more deterministic).

        Returns:
            The text content of Claude's response.

        Raises:
            AIServiceError: When the API call fails after retries.
        """
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            return response.content[0].text
        except anthropic.AuthenticationError:
            logger.error("Anthropic API authentication failed. Check your API key.")
            raise AIServiceError("Authentication failed. Please check your Anthropic API key.")
        except anthropic.RateLimitError:
            logger.warning("Anthropic API rate limit hit.")
            raise AIServiceError("Rate limit exceeded. Please try again in a moment.")
        except anthropic.APIStatusError as exc:
            logger.error("Anthropic API error: status=%s body=%s", exc.status_code, exc.body)
            raise AIServiceError(f"API error (status {exc.status_code}): {exc.message}")
        except anthropic.APIConnectionError as exc:
            logger.error("Failed to connect to Anthropic API: %s", exc)
            raise AIServiceError("Could not connect to AI service. Please check your network.")
        except Exception as exc:
            logger.exception("Unexpected error calling Claude API")
            raise AIServiceError(f"Unexpected AI service error: {exc}")

    async def _call_claude_with_image(
        self,
        system_prompt: str,
        text_message: str,
        image_base64: str,
        media_type: str = "image/png",
        max_tokens: int = 4096,
    ) -> str:
        """Make a call to Claude API with an image attachment.

        Args:
            system_prompt: The system prompt.
            text_message: The text portion of the user message.
            image_base64: Base64-encoded image data.
            media_type: MIME type of the image.
            max_tokens: Maximum tokens in response.

        Returns:
            The text content of Claude's response.
        """
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.1,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_base64,
                                },
                            },
                            {"type": "text", "text": text_message},
                        ],
                    }
                ],
            )
            return response.content[0].text
        except anthropic.AuthenticationError:
            logger.error("Anthropic API authentication failed.")
            raise AIServiceError("Authentication failed. Please check your Anthropic API key.")
        except anthropic.RateLimitError:
            logger.warning("Anthropic API rate limit hit.")
            raise AIServiceError("Rate limit exceeded. Please try again in a moment.")
        except anthropic.APIStatusError as exc:
            logger.error("Anthropic API error: status=%s", exc.status_code)
            raise AIServiceError(f"API error (status {exc.status_code}): {exc.message}")
        except anthropic.APIConnectionError as exc:
            logger.error("Failed to connect to Anthropic API: %s", exc)
            raise AIServiceError("Could not connect to AI service. Please check your network.")
        except Exception as exc:
            logger.exception("Unexpected error calling Claude API with image")
            raise AIServiceError(f"Unexpected AI service error: {exc}")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def categorize_transaction(
        self,
        transaction: dict,
        chart_of_accounts: list[dict],
        history: list[dict] | None = None,
    ) -> dict:
        """Categorize a bank transaction using AI.

        Args:
            transaction: Transaction data with keys like description, amount,
                         date, counterparty, reference.
            chart_of_accounts: List of account dicts with id, name, type, code.
            history: Optional list of previously categorized similar transactions
                     to inform the model.

        Returns:
            Dict with account_id, account_name, confidence, reasoning,
            suggested_tax_code.
        """
        logger.info(
            "Categorizing transaction: %s (amount=%s)",
            transaction.get("description", "N/A"),
            transaction.get("amount", "N/A"),
        )

        user_message = (
            "Categorize the following bank transaction into the correct account.\n\n"
            f"## Transaction\n{self._serialize(transaction)}\n\n"
            f"## Chart of Accounts\n{self._serialize(chart_of_accounts)}\n\n"
        )
        if history:
            user_message += (
                f"## Historical Categorizations (similar transactions)\n"
                f"{self._serialize(history[-20:])}\n\n"
            )
        user_message += (
            "Return your answer as a JSON object with keys: account_id, account_name, "
            "confidence, reasoning, suggested_tax_code."
        )

        response_text = await self._call_claude(
            CATEGORIZATION_SYSTEM_PROMPT, user_message, max_tokens=1024
        )
        result = self._parse_json_response(response_text)

        # Ensure required fields
        result.setdefault("confidence", 0.0)
        result.setdefault("reasoning", "")
        result.setdefault("suggested_tax_code", None)

        logger.info(
            "Categorized transaction -> account=%s confidence=%.2f",
            result.get("account_name", "unknown"),
            result.get("confidence", 0),
        )
        return result

    async def extract_document_data(
        self,
        document_base64: str,
        document_type: str = "receipt",
        media_type: str = "image/png",
    ) -> dict:
        """Extract structured data from receipt/invoice images using Claude vision.

        Args:
            document_base64: Base64-encoded document image or PDF page.
            document_type: One of 'receipt', 'invoice', 'bill', 'statement',
                          'credit_note', 'purchase_order'.
            media_type: MIME type (image/png, image/jpeg, application/pdf).

        Returns:
            Dict with extracted fields appropriate to the document type,
            plus a confidence score.
        """
        logger.info("Extracting data from %s document", document_type)

        field_guidance = {
            "receipt": (
                "Extract: vendor_name, date, items (list with description, quantity, "
                "unit_price, amount, tax_code), subtotal, tax_amount, total, "
                "payment_method, currency, receipt_number."
            ),
            "invoice": (
                "Extract: vendor_name, vendor_address, vendor_tax_id, invoice_number, "
                "invoice_date, due_date, line_items (list with description, quantity, "
                "unit_price, amount, tax_code, account_code), subtotal, tax_amount, "
                "total, currency, payment_terms, purchase_order_ref, bank_details."
            ),
            "bill": (
                "Extract: supplier_name, bill_number, bill_date, due_date, line_items, "
                "subtotal, tax_amount, total, currency, payment_terms."
            ),
            "statement": (
                "Extract: institution_name, account_number (last 4 digits only), "
                "statement_period_start, statement_period_end, opening_balance, "
                "closing_balance, transactions (list with date, description, amount, "
                "balance), total_debits, total_credits, currency."
            ),
            "credit_note": (
                "Extract: vendor_name, credit_note_number, date, original_invoice_ref, "
                "line_items, subtotal, tax_amount, total, currency, reason."
            ),
            "purchase_order": (
                "Extract: vendor_name, po_number, date, delivery_date, line_items, "
                "subtotal, tax_amount, total, currency, delivery_address, terms."
            ),
        }

        guidance = field_guidance.get(document_type, field_guidance["receipt"])

        text_message = (
            f"This is a {document_type} document. {guidance}\n\n"
            "Return the extracted data as a JSON object. Include a 'confidence' field "
            "(0.0-1.0) indicating overall extraction confidence. If any field is "
            "illegible or missing, set it to null and note it in a 'warnings' list."
        )

        response_text = await self._call_claude_with_image(
            DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
            text_message,
            document_base64,
            media_type=media_type,
            max_tokens=4096,
        )
        result = self._parse_json_response(response_text)
        result.setdefault("confidence", 0.0)
        result.setdefault("document_type", document_type)
        result.setdefault("warnings", [])

        logger.info(
            "Extracted %s data with confidence=%.2f",
            document_type,
            result.get("confidence", 0),
        )
        return result

    async def natural_language_query(
        self,
        query: str,
        org_context: dict,
        user_role: str = "admin",
    ) -> dict:
        """Answer financial questions in natural language.

        Args:
            query: The natural language question, e.g. "What's my revenue this quarter?"
            org_context: Dict with organization info including name, jurisdiction,
                        fiscal_year_end, chart_of_accounts summary, recent_periods, etc.
            user_role: Role of the requesting user (admin/accountant/viewer) to
                      control data sensitivity.

        Returns:
            Dict with answer, sql (if applicable), data, confidence, caveats.
        """
        logger.info("Processing NL query: %s (role=%s)", query[:80], user_role)

        role_restrictions = {
            "admin": "Full access to all financial data.",
            "accountant": "Access to all financial data except payroll details and owner distributions.",
            "viewer": "Read-only access to summary reports. Do not reveal individual transaction details.",
        }

        user_message = (
            f"## Organization Context\n{self._serialize(org_context)}\n\n"
            f"## User Role\n{user_role}: {role_restrictions.get(user_role, role_restrictions['viewer'])}\n\n"
            f"## Question\n{query}\n\n"
            "Return your answer as a JSON object with keys: answer (str), "
            "sql (str or null - PostgreSQL compatible), data (dict or null), "
            "confidence (float 0-1), caveats (list of str).\n\n"
            "The database schema uses JSONB columns. The main tables are: "
            "transactions (id, org_id, data JSONB), accounts (id, org_id, data JSONB), "
            "journals (id, org_id, data JSONB), invoices (id, org_id, data JSONB). "
            "If SQL is applicable, write it for PostgreSQL with JSONB operators."
        )

        response_text = await self._call_claude(
            NL_QUERY_SYSTEM_PROMPT, user_message, max_tokens=4096
        )
        result = self._parse_json_response(response_text)
        result.setdefault("confidence", 0.0)
        result.setdefault("caveats", [])
        result.setdefault("sql", None)
        result.setdefault("data", None)

        logger.info("NL query answered with confidence=%.2f", result.get("confidence", 0))
        return result

    async def identify_treaty_benefits(
        self,
        transaction: dict,
        treaties: list[dict],
        org_jurisdictions: list[str],
    ) -> list[dict]:
        """Identify applicable tax treaty benefits for cross-border transactions.

        Args:
            transaction: Transaction data including amount, income_type,
                        source_country, recipient_country, etc.
            treaties: List of treaty data dicts relevant to the organization.
            org_jurisdictions: List of jurisdiction codes the org operates in.

        Returns:
            List of dicts, each with treaty_name, article, benefit_type,
            standard_rate, treaty_rate, saving, conditions, confidence.
        """
        logger.info(
            "Identifying treaty benefits for transaction: %s -> %s (%s)",
            transaction.get("source_country", "?"),
            transaction.get("recipient_country", "?"),
            transaction.get("income_type", "?"),
        )

        user_message = (
            f"## Transaction\n{self._serialize(transaction)}\n\n"
            f"## Available Treaties\n{self._serialize(treaties)}\n\n"
            f"## Organization Jurisdictions\n{self._serialize(org_jurisdictions)}\n\n"
            "Identify all applicable tax treaty benefits for this cross-border transaction. "
            "Return a JSON object with key 'benefits' containing a list. Each benefit "
            "should have: treaty_name, article, benefit_type, standard_rate, treaty_rate, "
            "saving, conditions (list of str), confidence (float 0-1)."
        )

        response_text = await self._call_claude(
            TREATY_SYSTEM_PROMPT, user_message, max_tokens=4096
        )
        result = self._parse_json_response(response_text)

        benefits = result.get("benefits", result.get("applicable_treaties", []))
        if isinstance(benefits, list):
            for b in benefits:
                b.setdefault("confidence", 0.0)
            return benefits

        logger.warning("Unexpected treaty response format: %s", type(benefits))
        return []

    async def check_compliance(
        self,
        org_data: dict,
        jurisdiction: str,
    ) -> list[dict]:
        """Run AI compliance checks against jurisdiction rules.

        Args:
            org_data: Organization data including financial summaries,
                     filing history, registration details.
            jurisdiction: Jurisdiction code (US, NZ, AU, UK).

        Returns:
            List of compliance issue dicts with severity, area, description,
            regulation, recommendation, confidence.
        """
        logger.info("Running compliance check for jurisdiction=%s", jurisdiction)

        user_message = (
            f"## Organization Data\n{self._serialize(org_data)}\n\n"
            f"## Jurisdiction\n{jurisdiction}\n\n"
            "Run a comprehensive compliance check for this organization against the "
            f"rules and regulations of {jurisdiction}. Check for:\n"
            "- Tax filing compliance and deadlines\n"
            "- GST/VAT/Sales tax registration and reporting requirements\n"
            "- Financial reporting obligations\n"
            "- Withholding tax compliance\n"
            "- Transfer pricing documentation (if applicable)\n"
            "- Anti-money laundering requirements\n"
            "- Record keeping requirements\n\n"
            "Return a JSON object with key 'issues' containing a list. Each issue "
            "should have: severity (critical/warning/info), area, description, "
            "regulation, recommendation, confidence (float 0-1)."
        )

        response_text = await self._call_claude(
            COMPLIANCE_SYSTEM_PROMPT, user_message, max_tokens=4096
        )
        result = self._parse_json_response(response_text)

        issues = result.get("issues", [])
        if isinstance(issues, list):
            for issue in issues:
                issue.setdefault("confidence", 0.0)
                issue.setdefault("severity", "info")
            return issues

        logger.warning("Unexpected compliance response format")
        return []

    async def detect_anomalies(
        self,
        transactions: list[dict],
        historical_patterns: dict | None = None,
    ) -> list[dict]:
        """Detect unusual transactions or patterns that may indicate errors or fraud.

        Args:
            transactions: List of recent transaction dicts to analyze.
            historical_patterns: Optional dict with historical averages, typical
                                amounts, frequency patterns, etc.

        Returns:
            List of anomaly dicts with transaction_id, anomaly_type, severity,
            description, confidence, recommended_action.
        """
        logger.info("Running anomaly detection on %d transactions", len(transactions))

        user_message = (
            f"## Transactions to Analyze\n{self._serialize(transactions[:200])}\n\n"
        )
        if historical_patterns:
            user_message += (
                f"## Historical Patterns\n{self._serialize(historical_patterns)}\n\n"
            )
        user_message += (
            "Analyze these transactions for anomalies. Look for:\n"
            "- Duplicate transactions (same amount, date, description)\n"
            "- Unusually large or small amounts vs. historical norms\n"
            "- Unusual timing (weekends, holidays, outside business hours)\n"
            "- Unusual counterparties or new payees\n"
            "- Round-number transactions that may indicate estimates\n"
            "- Gaps in sequential numbering\n"
            "- Transactions categorized inconsistently with similar past ones\n"
            "- Potential structuring (splitting transactions to stay under thresholds)\n\n"
            "Return a JSON object with key 'anomalies' containing a list. Each anomaly "
            "should have: transaction_id, anomaly_type, severity (high/medium/low), "
            "description, confidence (float 0-1), recommended_action."
        )

        response_text = await self._call_claude(
            ANOMALY_SYSTEM_PROMPT, user_message, max_tokens=4096
        )
        result = self._parse_json_response(response_text)

        anomalies = result.get("anomalies", [])
        if isinstance(anomalies, list):
            for a in anomalies:
                a.setdefault("confidence", 0.0)
                a.setdefault("severity", "low")
            return anomalies

        logger.warning("Unexpected anomaly detection response format")
        return []

    async def forecast_cashflow(
        self,
        historical_data: list[dict],
        receivables: list[dict],
        payables: list[dict],
        forecast_periods: int = 12,
        period_type: str = "weekly",
    ) -> dict:
        """Generate cash flow forecast based on historical patterns.

        Args:
            historical_data: List of historical cash flow data points with
                            date, inflow, outflow, category.
            receivables: Outstanding receivables with expected_date, amount, customer.
            payables: Upcoming payables with due_date, amount, supplier.
            forecast_periods: Number of periods to forecast (default 12).
            period_type: 'weekly' or 'monthly'.

        Returns:
            Dict with forecast_periods (list), assumptions, risks, confidence,
            methodology.
        """
        logger.info(
            "Generating %d-%s cash flow forecast from %d historical data points",
            forecast_periods,
            period_type,
            len(historical_data),
        )

        user_message = (
            f"## Historical Cash Flow Data\n{self._serialize(historical_data[-52:])}\n\n"
            f"## Outstanding Receivables\n{self._serialize(receivables)}\n\n"
            f"## Upcoming Payables\n{self._serialize(payables)}\n\n"
            f"## Forecast Parameters\n"
            f"- Periods: {forecast_periods}\n"
            f"- Period type: {period_type}\n"
            f"- Current date: {date.today().isoformat()}\n\n"
            "Generate a cash flow forecast. Consider seasonal patterns, trends, "
            "and the known receivables/payables. Return a JSON object with keys: "
            "forecast_periods (list of dicts with period, start_date, end_date, "
            "projected_inflow, projected_outflow, net, cumulative_balance), "
            "assumptions (list of str), risks (list of str), confidence (float 0-1), "
            "methodology (str)."
        )

        response_text = await self._call_claude(
            CASHFLOW_SYSTEM_PROMPT, user_message, max_tokens=8192, temperature=0.3
        )
        result = self._parse_json_response(response_text)
        result.setdefault("confidence", 0.0)
        result.setdefault("assumptions", [])
        result.setdefault("risks", [])
        result.setdefault("forecast_periods", [])
        result.setdefault("methodology", "AI-based trend analysis")

        logger.info(
            "Cash flow forecast generated: %d periods, confidence=%.2f",
            len(result.get("forecast_periods", [])),
            result.get("confidence", 0),
        )
        return result

    async def generate_tax_summary(
        self,
        org_id: str,
        jurisdiction: str,
        period: str,
        financial_data: dict | None = None,
    ) -> dict:
        """Generate a tax summary/preparation guide for a jurisdiction and period.

        Args:
            org_id: Organization identifier.
            jurisdiction: Jurisdiction code (US, NZ, AU, UK).
            period: Tax period, e.g. '2025-2026', 'Q1 2026', 'FY2025'.
            financial_data: Optional dict with income, expenses, assets, liabilities
                           for the period.

        Returns:
            Dict with jurisdiction, period, estimated_tax, effective_rate,
            taxable_income, deductions, credits, filing_requirements,
            deadlines, recommendations, confidence.
        """
        logger.info(
            "Generating tax summary for org=%s jurisdiction=%s period=%s",
            org_id,
            jurisdiction,
            period,
        )

        user_message = (
            f"## Organization\norg_id: {org_id}\n\n"
            f"## Jurisdiction\n{jurisdiction}\n\n"
            f"## Period\n{period}\n\n"
        )
        if financial_data:
            user_message += f"## Financial Data\n{self._serialize(financial_data)}\n\n"

        user_message += (
            "Generate a comprehensive tax summary and preparation guide. Include "
            "estimated tax liability, applicable deductions, credits, filing "
            "requirements, key deadlines, and recommendations for tax optimization. "
            "Use current 2025-2026 tax rates for the jurisdiction.\n\n"
            "Return a JSON object with keys: jurisdiction, period, estimated_tax, "
            "effective_rate, taxable_income, deductions (list of name/amount/reference), "
            "credits (list of name/amount/reference), filing_requirements (list), "
            "deadlines (list of description/date), recommendations (list), "
            "confidence (float 0-1)."
        )

        response_text = await self._call_claude(
            TAX_SUMMARY_SYSTEM_PROMPT, user_message, max_tokens=4096
        )
        result = self._parse_json_response(response_text)
        result.setdefault("confidence", 0.0)
        result.setdefault("jurisdiction", jurisdiction)
        result.setdefault("period", period)

        logger.info(
            "Tax summary generated for %s %s with confidence=%.2f",
            jurisdiction,
            period,
            result.get("confidence", 0),
        )
        return result

    async def chat(
        self,
        messages: list[dict],
        org_context: dict | None = None,
    ) -> str:
        """General accounting chat assistant.

        Args:
            messages: List of message dicts with 'role' and 'content' keys,
                     following the Anthropic messages format.
            org_context: Optional organization context to ground responses.

        Returns:
            The assistant's response text.
        """
        logger.info("Chat request with %d messages", len(messages))

        system = CHAT_SYSTEM_PROMPT
        if org_context:
            system += f"\n\n## Organization Context\n{self._serialize(org_context)}"

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=0.4,
                system=system,
                messages=messages,
            )
            reply = response.content[0].text
            logger.info("Chat response generated (%d chars)", len(reply))
            return reply
        except anthropic.AuthenticationError:
            logger.error("Anthropic API authentication failed.")
            raise AIServiceError("Authentication failed. Please check your Anthropic API key.")
        except anthropic.RateLimitError:
            logger.warning("Anthropic API rate limit hit.")
            raise AIServiceError("Rate limit exceeded. Please try again in a moment.")
        except anthropic.APIStatusError as exc:
            logger.error("Anthropic API error: status=%s", exc.status_code)
            raise AIServiceError(f"API error (status {exc.status_code}): {exc.message}")
        except anthropic.APIConnectionError as exc:
            logger.error("Failed to connect to Anthropic API: %s", exc)
            raise AIServiceError("Could not connect to AI service. Please check your network.")
        except Exception as exc:
            logger.exception("Unexpected error in chat")
            raise AIServiceError(f"Unexpected AI service error: {exc}")


class AIServiceError(Exception):
    """Raised when the AI service encounters an error."""

    pass
