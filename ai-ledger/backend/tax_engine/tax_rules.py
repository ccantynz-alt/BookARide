"""
Multi-jurisdiction tax rules engine.

Supports NZ, AU, US, and UK tax calculations with real 2025-2026 rates.
Handles GST, VAT, sales tax, income tax, and corporate tax across all
four jurisdictions.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
#  Tax rate tables — 2025/2026 fiscal years
# ════════════════════════════════════════════════════════════════════

NZ_GST_RATE = Decimal("0.15")  # 15%

NZ_COMPANY_TAX_RATE = Decimal("0.28")  # 28%

NZ_INCOME_BRACKETS_2025 = [
    # (upper_bound, rate)
    (Decimal("15600"), Decimal("0.105")),
    (Decimal("53500"), Decimal("0.175")),
    (Decimal("78100"), Decimal("0.30")),
    (Decimal("180000"), Decimal("0.33")),
    (None, Decimal("0.39")),  # over $180,000
]

AU_GST_RATE = Decimal("0.10")  # 10%

AU_COMPANY_TAX_RATE_SMALL = Decimal("0.25")   # base rate entity (< $50M turnover)
AU_COMPANY_TAX_RATE_LARGE = Decimal("0.30")   # non-base rate entity

AU_INCOME_BRACKETS_2025 = [
    (Decimal("18200"), Decimal("0")),
    (Decimal("45000"), Decimal("0.16")),
    (Decimal("135000"), Decimal("0.30")),
    (Decimal("190000"), Decimal("0.37")),
    (None, Decimal("0.45")),
]

US_FEDERAL_CORP_RATE = Decimal("0.21")  # flat 21%

US_FEDERAL_INCOME_BRACKETS_2025 = [
    # Single filer brackets
    (Decimal("11925"), Decimal("0.10")),
    (Decimal("48475"), Decimal("0.12")),
    (Decimal("103350"), Decimal("0.22")),
    (Decimal("197300"), Decimal("0.24")),
    (Decimal("250525"), Decimal("0.32")),
    (Decimal("626350"), Decimal("0.35")),
    (None, Decimal("0.37")),
]

# Sample state sales tax rates (simplified)
US_STATE_SALES_TAX = {
    "CA": Decimal("0.0725"),
    "NY": Decimal("0.04"),
    "TX": Decimal("0.0625"),
    "FL": Decimal("0.06"),
    "WA": Decimal("0.065"),
    "OR": Decimal("0"),       # no sales tax
    "NH": Decimal("0"),       # no sales tax
    "DE": Decimal("0"),       # no sales tax
    "MT": Decimal("0"),       # no sales tax
    "AK": Decimal("0"),       # no state sales tax
}

UK_VAT_STANDARD_RATE = Decimal("0.20")  # 20%
UK_VAT_REDUCED_RATE = Decimal("0.05")   # 5% (energy, children's car seats, etc.)
UK_VAT_ZERO_RATE = Decimal("0")         # 0% (food, children's clothing, etc.)

UK_CORP_TAX_MAIN_RATE = Decimal("0.25")   # profits > £250,000
UK_CORP_TAX_SMALL_RATE = Decimal("0.19")  # profits ≤ £50,000
# Marginal relief applies between £50,000 and £250,000

UK_INCOME_BRACKETS_2025 = [
    (Decimal("12570"), Decimal("0")),      # personal allowance
    (Decimal("50270"), Decimal("0.20")),    # basic rate
    (Decimal("125140"), Decimal("0.40")),   # higher rate
    (None, Decimal("0.45")),               # additional rate
]


# ════════════════════════════════════════════════════════════════════
#  Data classes
# ════════════════════════════════════════════════════════════════════


@dataclass
class TaxCalculationResult:
    """Result of a tax calculation."""
    jurisdiction: str
    tax_type: str
    gross_amount: Decimal
    tax_amount: Decimal
    net_amount: Decimal
    effective_rate: Decimal
    breakdown: List[Dict[str, Any]] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)


@dataclass
class GSTReturn:
    """NZ GST return data."""
    period_start: date
    period_end: date
    total_sales: Decimal
    gst_on_sales: Decimal
    total_purchases: Decimal
    gst_on_purchases: Decimal
    gst_payable: Decimal
    adjustments: Decimal = Decimal("0")


@dataclass
class BASReturn:
    """Australian Business Activity Statement."""
    period_start: date
    period_end: date
    total_sales: Decimal
    gst_on_sales: Decimal
    total_purchases: Decimal
    gst_on_purchases: Decimal
    payg_withheld: Decimal
    payg_instalments: Decimal
    net_gst: Decimal
    total_payable: Decimal


@dataclass
class VATReturn:
    """UK VAT return (Making Tax Digital compatible)."""
    period_start: date
    period_end: date
    vat_due_sales: Decimal       # Box 1
    vat_due_acquisitions: Decimal  # Box 2
    total_vat_due: Decimal       # Box 3
    vat_reclaimed: Decimal       # Box 4
    net_vat: Decimal             # Box 5
    total_sales_ex_vat: Decimal  # Box 6
    total_purchases_ex_vat: Decimal  # Box 7
    total_supplies_eu: Decimal   # Box 8
    total_acquisitions_eu: Decimal  # Box 9


@dataclass
class FilingDeadline:
    """Tax filing deadline."""
    jurisdiction: str
    tax_type: str
    period: str
    due_date: date
    description: str
    is_overdue: bool = False


# ════════════════════════════════════════════════════════════════════
#  Tax Rules Engine
# ════════════════════════════════════════════════════════════════════


class TaxRulesEngine:
    """Multi-jurisdiction tax rules engine.

    Provides tax calculation, return preparation, and filing deadline
    tracking for NZ, AU, US, and UK jurisdictions.
    """

    # ── Core calculation ──────────────────────────────────────────

    def calculate_tax(
        self,
        amount: Decimal,
        jurisdiction: str,
        tax_type: str = "income",
        *,
        is_company: bool = False,
        state: Optional[str] = None,
        is_small_entity: bool = True,
    ) -> TaxCalculationResult:
        """Calculate tax for a given amount and jurisdiction.

        Args:
            amount: The gross/taxable amount.
            jurisdiction: Two-letter code (NZ, AU, US, UK).
            tax_type: One of ``income``, ``gst``, ``vat``, ``sales_tax``, ``corporate``.
            is_company: If True, apply corporate tax rates.
            state: US state code for state-level taxes.
            is_small_entity: For AU/UK, whether the small-entity rate applies.

        Returns:
            A :class:`TaxCalculationResult` with the computed values.
        """
        jurisdiction = jurisdiction.upper()

        if tax_type in ("gst", "vat", "sales_tax"):
            return self._calculate_indirect_tax(amount, jurisdiction, state=state)

        if tax_type == "corporate" or is_company:
            return self._calculate_corporate_tax(
                amount, jurisdiction, is_small_entity=is_small_entity
            )

        return self._calculate_income_tax(amount, jurisdiction)

    # ── Indirect taxes (GST / VAT / Sales Tax) ────────────────────

    def _calculate_indirect_tax(
        self,
        amount: Decimal,
        jurisdiction: str,
        *,
        state: Optional[str] = None,
    ) -> TaxCalculationResult:
        rates = {
            "NZ": NZ_GST_RATE,
            "AU": AU_GST_RATE,
            "UK": UK_VAT_STANDARD_RATE,
        }

        if jurisdiction == "US":
            rate = US_STATE_SALES_TAX.get(state or "CA", Decimal("0.0725"))
            tax_type_label = f"Sales Tax ({state or 'CA'})"
        else:
            rate = rates.get(jurisdiction, Decimal("0"))
            labels = {"NZ": "GST", "AU": "GST", "UK": "VAT"}
            tax_type_label = labels.get(jurisdiction, "Tax")

        tax = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return TaxCalculationResult(
            jurisdiction=jurisdiction,
            tax_type=tax_type_label,
            gross_amount=amount + tax,
            tax_amount=tax,
            net_amount=amount,
            effective_rate=rate * 100,
            breakdown=[{"rate": str(rate * 100), "amount": str(tax)}],
        )

    # ── Corporate tax ─────────────────────────────────────────────

    def _calculate_corporate_tax(
        self,
        profit: Decimal,
        jurisdiction: str,
        *,
        is_small_entity: bool = True,
    ) -> TaxCalculationResult:
        if jurisdiction == "NZ":
            rate = NZ_COMPANY_TAX_RATE
        elif jurisdiction == "AU":
            rate = AU_COMPANY_TAX_RATE_SMALL if is_small_entity else AU_COMPANY_TAX_RATE_LARGE
        elif jurisdiction == "US":
            rate = US_FEDERAL_CORP_RATE
        elif jurisdiction == "UK":
            if profit <= Decimal("50000"):
                rate = UK_CORP_TAX_SMALL_RATE
            elif profit >= Decimal("250000"):
                rate = UK_CORP_TAX_MAIN_RATE
            else:
                # Marginal relief calculation
                fraction = (Decimal("250000") - profit) / Decimal("200000")
                marginal = UK_CORP_TAX_MAIN_RATE * profit - fraction * Decimal("0.015") * (Decimal("250000") - profit)
                tax = marginal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                effective = (tax / profit * 100).quantize(Decimal("0.01"))
                return TaxCalculationResult(
                    jurisdiction=jurisdiction,
                    tax_type="Corporation Tax (marginal relief)",
                    gross_amount=profit,
                    tax_amount=tax,
                    net_amount=profit - tax,
                    effective_rate=effective,
                    breakdown=[{"note": "Marginal relief applied", "amount": str(tax)}],
                )
        else:
            rate = Decimal("0")

        tax = (profit * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return TaxCalculationResult(
            jurisdiction=jurisdiction,
            tax_type="Corporate Tax",
            gross_amount=profit,
            tax_amount=tax,
            net_amount=profit - tax,
            effective_rate=rate * 100,
            breakdown=[{"rate": str(rate * 100), "amount": str(tax)}],
        )

    # ── Income tax (progressive brackets) ─────────────────────────

    def _calculate_income_tax(
        self,
        income: Decimal,
        jurisdiction: str,
    ) -> TaxCalculationResult:
        brackets_map = {
            "NZ": NZ_INCOME_BRACKETS_2025,
            "AU": AU_INCOME_BRACKETS_2025,
            "US": US_FEDERAL_INCOME_BRACKETS_2025,
            "UK": UK_INCOME_BRACKETS_2025,
        }
        brackets = brackets_map.get(jurisdiction, [])

        total_tax = Decimal("0")
        breakdown = []
        prev_bound = Decimal("0")

        for upper, rate in brackets:
            if income <= prev_bound:
                break
            if upper is None:
                taxable = income - prev_bound
            else:
                taxable = min(income, upper) - prev_bound
            tax_at_bracket = (taxable * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_tax += tax_at_bracket
            breakdown.append({
                "bracket": f"{prev_bound}-{upper or 'above'}",
                "rate": str(rate * 100),
                "taxable": str(taxable),
                "tax": str(tax_at_bracket),
            })
            prev_bound = upper if upper else income

        effective = (total_tax / income * 100).quantize(Decimal("0.01")) if income else Decimal("0")
        return TaxCalculationResult(
            jurisdiction=jurisdiction,
            tax_type="Income Tax",
            gross_amount=income,
            tax_amount=total_tax,
            net_amount=income - total_tax,
            effective_rate=effective,
            breakdown=breakdown,
        )

    # ── GST Return (NZ) ──────────────────────────────────────────

    def calculate_gst_return(
        self,
        period_start: date,
        period_end: date,
        sales: Decimal,
        purchases: Decimal,
        adjustments: Decimal = Decimal("0"),
    ) -> GSTReturn:
        """Prepare an NZ GST return.

        Args:
            period_start: First day of the GST period.
            period_end: Last day of the GST period.
            sales: Total GST-inclusive sales.
            purchases: Total GST-inclusive purchases.
            adjustments: Any manual adjustments.

        Returns:
            A :class:`GSTReturn` with computed values.
        """
        gst_on_sales = (sales * NZ_GST_RATE / (1 + NZ_GST_RATE)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        gst_on_purchases = (purchases * NZ_GST_RATE / (1 + NZ_GST_RATE)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        gst_payable = gst_on_sales - gst_on_purchases + adjustments

        return GSTReturn(
            period_start=period_start,
            period_end=period_end,
            total_sales=sales,
            gst_on_sales=gst_on_sales,
            total_purchases=purchases,
            gst_on_purchases=gst_on_purchases,
            gst_payable=gst_payable.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            adjustments=adjustments,
        )

    # ── BAS Return (AU) ──────────────────────────────────────────

    def calculate_bas(
        self,
        period_start: date,
        period_end: date,
        sales: Decimal,
        purchases: Decimal,
        payg_withheld: Decimal = Decimal("0"),
        payg_instalments: Decimal = Decimal("0"),
    ) -> BASReturn:
        """Prepare an Australian Business Activity Statement.

        Args:
            period_start: First day of the BAS period.
            period_end: Last day of the BAS period.
            sales: Total GST-inclusive sales.
            purchases: Total GST-inclusive purchases.
            payg_withheld: PAYG withholding amount.
            payg_instalments: PAYG instalment amount.

        Returns:
            A :class:`BASReturn` with computed values.
        """
        gst_on_sales = (sales * AU_GST_RATE / (1 + AU_GST_RATE)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        gst_on_purchases = (purchases * AU_GST_RATE / (1 + AU_GST_RATE)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        net_gst = gst_on_sales - gst_on_purchases
        total_payable = net_gst + payg_withheld + payg_instalments

        return BASReturn(
            period_start=period_start,
            period_end=period_end,
            total_sales=sales,
            gst_on_sales=gst_on_sales,
            total_purchases=purchases,
            gst_on_purchases=gst_on_purchases,
            payg_withheld=payg_withheld,
            payg_instalments=payg_instalments,
            net_gst=net_gst.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            total_payable=total_payable.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        )

    # ── VAT Return (UK, Making Tax Digital) ───────────────────────

    def calculate_vat_return(
        self,
        period_start: date,
        period_end: date,
        sales_ex_vat: Decimal,
        purchases_ex_vat: Decimal,
        eu_supplies: Decimal = Decimal("0"),
        eu_acquisitions: Decimal = Decimal("0"),
    ) -> VATReturn:
        """Prepare a UK VAT return (Making Tax Digital format).

        Args:
            period_start: First day of the VAT period.
            period_end: Last day of the VAT period.
            sales_ex_vat: Total sales excluding VAT.
            purchases_ex_vat: Total purchases excluding VAT.
            eu_supplies: Total value of supplies to EU.
            eu_acquisitions: Total value of acquisitions from EU.

        Returns:
            A :class:`VATReturn` with the nine-box values.
        """
        vat_due_sales = (sales_ex_vat * UK_VAT_STANDARD_RATE).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        vat_due_acquisitions = (eu_acquisitions * UK_VAT_STANDARD_RATE).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        total_vat_due = vat_due_sales + vat_due_acquisitions
        vat_reclaimed = (purchases_ex_vat * UK_VAT_STANDARD_RATE).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        net_vat = total_vat_due - vat_reclaimed

        return VATReturn(
            period_start=period_start,
            period_end=period_end,
            vat_due_sales=vat_due_sales,
            vat_due_acquisitions=vat_due_acquisitions,
            total_vat_due=total_vat_due,
            vat_reclaimed=vat_reclaimed,
            net_vat=net_vat.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            total_sales_ex_vat=sales_ex_vat,
            total_purchases_ex_vat=purchases_ex_vat,
            total_supplies_eu=eu_supplies,
            total_acquisitions_eu=eu_acquisitions,
        )

    # ── Filing deadlines ──────────────────────────────────────────

    def get_filing_deadlines(
        self,
        jurisdictions: Optional[List[str]] = None,
        as_of: Optional[date] = None,
    ) -> List[FilingDeadline]:
        """Return upcoming tax filing deadlines for the given jurisdictions.

        Args:
            jurisdictions: List of country codes.  Defaults to all four.
            as_of: Reference date for determining overdue status.
                Defaults to today.

        Returns:
            A list of :class:`FilingDeadline` objects sorted by due date.
        """
        today = as_of or date.today()
        jurs = [j.upper() for j in (jurisdictions or ["NZ", "AU", "US", "UK"])]
        deadlines: List[FilingDeadline] = []

        year = today.year

        if "NZ" in jurs:
            deadlines.extend([
                FilingDeadline("NZ", "GST", f"Q3 {year}", date(year, 5, 28),
                               "GST return — two-monthly filer"),
                FilingDeadline("NZ", "GST", f"Q4 {year}", date(year, 7, 28),
                               "GST return — two-monthly filer"),
                FilingDeadline("NZ", "Income Tax", f"FY{year}",
                               date(year, 4, 7) if today.month <= 4 else date(year + 1, 4, 7),
                               "Individual / company income tax return"),
                FilingDeadline("NZ", "FBT", f"Q4 {year}", date(year, 7, 31),
                               "Fringe Benefit Tax annual return"),
            ])

        if "AU" in jurs:
            deadlines.extend([
                FilingDeadline("AU", "BAS", f"Q3 {year}", date(year, 4, 28),
                               "Business Activity Statement — quarterly"),
                FilingDeadline("AU", "BAS", f"Q4 {year}", date(year, 7, 28),
                               "Business Activity Statement — quarterly"),
                FilingDeadline("AU", "Income Tax", f"FY{year}",
                               date(year, 10, 31),
                               "Company income tax return"),
                FilingDeadline("AU", "STP", "Ongoing", date(year, 7, 14),
                               "Single Touch Payroll finalisation"),
            ])

        if "US" in jurs:
            deadlines.extend([
                FilingDeadline("US", "Corporate Tax", f"FY{year}", date(year, 4, 15),
                               "Federal corporate tax return (Form 1120)"),
                FilingDeadline("US", "Estimated Tax", f"Q2 {year}", date(year, 6, 15),
                               "Estimated tax payment — Q2"),
                FilingDeadline("US", "Estimated Tax", f"Q3 {year}", date(year, 9, 15),
                               "Estimated tax payment — Q3"),
                FilingDeadline("US", "Sales Tax", "Monthly", date(year, today.month % 12 + 1, 20),
                               "State sales tax return (varies by state)"),
            ])

        if "UK" in jurs:
            deadlines.extend([
                FilingDeadline("UK", "VAT", f"Q1 {year}", date(year, 5, 7),
                               "VAT return — Making Tax Digital"),
                FilingDeadline("UK", "VAT", f"Q2 {year}", date(year, 8, 7),
                               "VAT return — Making Tax Digital"),
                FilingDeadline("UK", "Corporation Tax", f"FY{year}", date(year, 10, 1),
                               "Corporation Tax return (CT600)"),
                FilingDeadline("UK", "Self Assessment", f"FY{year - 1}", date(year, 1, 31),
                               "Self Assessment tax return"),
            ])

        # Mark overdue
        for d in deadlines:
            d.is_overdue = d.due_date < today

        # Sort by due date
        deadlines.sort(key=lambda d: d.due_date)
        return deadlines
