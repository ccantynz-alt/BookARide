"""
Tax treaty engine — bilateral treaty lookup and withholding rate calculations.

Covers all six bilateral combinations of the four supported jurisdictions
(US, NZ, AU, UK) with real withholding tax rates for dividends, interest,
and royalties.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
#  Treaty data — real withholding rates
# ════════════════════════════════════════════════════════════════════

# Each treaty entry maps (country_a, country_b) -> income_type -> rate.
# Rates are the TREATY rate (reduced from domestic).  All rates in %.
# "domestic" sub-key holds the default domestic withholding rate for
# the source country on that income type.

TREATIES: Dict[Tuple[str, str], Dict[str, Any]] = {
    ("US", "NZ"): {
        "name": "United States — New Zealand Income Tax Treaty",
        "signed": "1982-07-23",
        "in_force": "1983-11-02",
        "dividends": {
            "treaty_rate": Decimal("15"),
            "portfolio_rate": Decimal("15"),
            "direct_rate": Decimal("5"),        # ≥10% ownership
            "domestic_us": Decimal("30"),
            "domestic_nz": Decimal("30"),
            "notes": "5% for direct investment (>=10% ownership), 15% portfolio",
        },
        "interest": {
            "treaty_rate": Decimal("10"),
            "domestic_us": Decimal("30"),
            "domestic_nz": Decimal("15"),
            "notes": "10% withholding; government interest exempt",
        },
        "royalties": {
            "treaty_rate": Decimal("10"),
            "domestic_us": Decimal("30"),
            "domestic_nz": Decimal("15"),
            "notes": "10% withholding on gross royalties",
        },
    },
    ("US", "AU"): {
        "name": "United States — Australia Income Tax Treaty",
        "signed": "1982-08-06",
        "in_force": "1983-10-31",
        "dividends": {
            "treaty_rate": Decimal("15"),
            "portfolio_rate": Decimal("15"),
            "direct_rate": Decimal("5"),
            "domestic_us": Decimal("30"),
            "domestic_au": Decimal("30"),
            "notes": "5% for >=10% ownership; franking credits may apply (AU)",
        },
        "interest": {
            "treaty_rate": Decimal("10"),
            "domestic_us": Decimal("30"),
            "domestic_au": Decimal("10"),
            "notes": "10% withholding; certain financial institution interest exempt",
        },
        "royalties": {
            "treaty_rate": Decimal("5"),
            "domestic_us": Decimal("30"),
            "domestic_au": Decimal("30"),
            "notes": "5% on gross royalties",
        },
    },
    ("US", "UK"): {
        "name": "United States — United Kingdom Income Tax Treaty",
        "signed": "2001-07-24",
        "in_force": "2003-03-31",
        "dividends": {
            "treaty_rate": Decimal("15"),
            "portfolio_rate": Decimal("15"),
            "direct_rate": Decimal("0"),
            "domestic_us": Decimal("30"),
            "domestic_uk": Decimal("0"),
            "notes": "0% for >=80% ownership with LOB; 5% for >=10%; 15% portfolio",
        },
        "interest": {
            "treaty_rate": Decimal("0"),
            "domestic_us": Decimal("30"),
            "domestic_uk": Decimal("20"),
            "notes": "0% withholding on interest under the treaty",
        },
        "royalties": {
            "treaty_rate": Decimal("0"),
            "domestic_us": Decimal("30"),
            "domestic_uk": Decimal("20"),
            "notes": "0% withholding on royalties under the treaty",
        },
    },
    ("NZ", "AU"): {
        "name": "New Zealand — Australia Double Tax Agreement",
        "signed": "2009-06-26",
        "in_force": "2010-03-19",
        "dividends": {
            "treaty_rate": Decimal("15"),
            "portfolio_rate": Decimal("15"),
            "direct_rate": Decimal("5"),
            "domestic_nz": Decimal("30"),
            "domestic_au": Decimal("30"),
            "notes": "5% for >=10% ownership; franking credits for AU dividends",
        },
        "interest": {
            "treaty_rate": Decimal("10"),
            "domestic_nz": Decimal("15"),
            "domestic_au": Decimal("10"),
            "notes": "10% withholding; government/central bank interest exempt",
        },
        "royalties": {
            "treaty_rate": Decimal("5"),
            "domestic_nz": Decimal("15"),
            "domestic_au": Decimal("30"),
            "notes": "5% on gross royalties",
        },
    },
    ("NZ", "UK"): {
        "name": "New Zealand — United Kingdom Double Tax Convention",
        "signed": "1983-07-04",
        "in_force": "1984-03-20",
        "dividends": {
            "treaty_rate": Decimal("15"),
            "portfolio_rate": Decimal("15"),
            "direct_rate": Decimal("15"),
            "domestic_nz": Decimal("30"),
            "domestic_uk": Decimal("0"),
            "notes": "15% withholding; no reduced rate for direct investment",
        },
        "interest": {
            "treaty_rate": Decimal("10"),
            "domestic_nz": Decimal("15"),
            "domestic_uk": Decimal("20"),
            "notes": "10% withholding on interest",
        },
        "royalties": {
            "treaty_rate": Decimal("10"),
            "domestic_nz": Decimal("15"),
            "domestic_uk": Decimal("20"),
            "notes": "10% withholding on gross royalties",
        },
    },
    ("AU", "UK"): {
        "name": "Australia — United Kingdom Double Tax Convention",
        "signed": "2003-08-21",
        "in_force": "2003-12-17",
        "dividends": {
            "treaty_rate": Decimal("15"),
            "portfolio_rate": Decimal("15"),
            "direct_rate": Decimal("5"),
            "domestic_au": Decimal("30"),
            "domestic_uk": Decimal("0"),
            "notes": "5% for >=10% ownership; 15% portfolio; AU franking credits apply",
        },
        "interest": {
            "treaty_rate": Decimal("10"),
            "domestic_au": Decimal("10"),
            "domestic_uk": Decimal("20"),
            "notes": "10% withholding; government interest exempt",
        },
        "royalties": {
            "treaty_rate": Decimal("5"),
            "domestic_au": Decimal("30"),
            "domestic_uk": Decimal("20"),
            "notes": "5% on gross royalties",
        },
    },
}


# ════════════════════════════════════════════════════════════════════
#  Data classes
# ════════════════════════════════════════════════════════════════════


@dataclass
class TreatyInfo:
    """Summary of a tax treaty between two countries."""
    country_a: str
    country_b: str
    treaty_name: str
    signed_date: str
    in_force_date: str
    dividend_rate: Decimal
    interest_rate: Decimal
    royalty_rate: Decimal
    notes: Dict[str, str] = field(default_factory=dict)


@dataclass
class WithholdingResult:
    """Result of a withholding tax calculation under a treaty."""
    source_country: str
    recipient_country: str
    income_type: str
    gross_amount: Decimal
    domestic_rate: Decimal
    treaty_rate: Decimal
    domestic_withholding: Decimal
    treaty_withholding: Decimal
    savings: Decimal
    net_amount_domestic: Decimal
    net_amount_treaty: Decimal
    treaty_name: str
    notes: str = ""


# ════════════════════════════════════════════════════════════════════
#  Treaty Engine
# ════════════════════════════════════════════════════════════════════


class TreatyEngine:
    """Tax treaty lookup and withholding rate calculator.

    Covers all six bilateral combinations of US, NZ, AU, and UK with
    real treaty-negotiated withholding rates.
    """

    def _normalize_key(self, country_a: str, country_b: str) -> Tuple[str, str]:
        """Return the canonical key for a country pair."""
        a, b = country_a.upper(), country_b.upper()
        # Try both orderings
        if (a, b) in TREATIES:
            return (a, b)
        if (b, a) in TREATIES:
            return (b, a)
        raise ValueError(f"No treaty found between {a} and {b}")

    def find_treaty(self, country_a: str, country_b: str) -> TreatyInfo:
        """Look up the treaty between two countries.

        Args:
            country_a: First country code (US, NZ, AU, UK).
            country_b: Second country code.

        Returns:
            A :class:`TreatyInfo` with treaty details.

        Raises:
            ValueError: If no treaty exists between the two countries.
        """
        key = self._normalize_key(country_a, country_b)
        treaty = TREATIES[key]

        return TreatyInfo(
            country_a=key[0],
            country_b=key[1],
            treaty_name=treaty["name"],
            signed_date=treaty["signed"],
            in_force_date=treaty["in_force"],
            dividend_rate=treaty["dividends"]["treaty_rate"],
            interest_rate=treaty["interest"]["treaty_rate"],
            royalty_rate=treaty["royalties"]["treaty_rate"],
            notes={
                "dividends": treaty["dividends"]["notes"],
                "interest": treaty["interest"]["notes"],
                "royalties": treaty["royalties"]["notes"],
            },
        )

    def calculate_benefit(
        self,
        source_country: str,
        recipient_country: str,
        income_type: str,
        gross_amount: Decimal,
        *,
        is_direct_investment: bool = False,
    ) -> WithholdingResult:
        """Calculate the treaty benefit for a cross-border payment.

        Args:
            source_country: Country from which income is paid.
            recipient_country: Country of the income recipient.
            income_type: One of ``dividends``, ``interest``, ``royalties``.
            gross_amount: Gross payment amount.
            is_direct_investment: Whether the recipient has >= 10%
                ownership (applies reduced dividend rate).

        Returns:
            A :class:`WithholdingResult` with domestic vs treaty comparison.
        """
        income_type = income_type.lower()
        if income_type not in ("dividends", "interest", "royalties"):
            raise ValueError(f"Unsupported income type: {income_type}")

        key = self._normalize_key(source_country, recipient_country)
        treaty = TREATIES[key]
        income_data = treaty[income_type]

        # Determine domestic rate for the source country
        source_upper = source_country.upper()
        domestic_key = f"domestic_{source_upper.lower()}"
        domestic_rate = income_data.get(domestic_key, Decimal("30"))

        # Determine treaty rate
        if income_type == "dividends" and is_direct_investment:
            treaty_rate = income_data.get("direct_rate", income_data["treaty_rate"])
        else:
            treaty_rate = income_data["treaty_rate"]

        # Calculate withholding
        domestic_pct = domestic_rate / Decimal("100")
        treaty_pct = treaty_rate / Decimal("100")

        domestic_withholding = (gross_amount * domestic_pct).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        treaty_withholding = (gross_amount * treaty_pct).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        savings = domestic_withholding - treaty_withholding

        return WithholdingResult(
            source_country=source_upper,
            recipient_country=recipient_country.upper(),
            income_type=income_type,
            gross_amount=gross_amount,
            domestic_rate=domestic_rate,
            treaty_rate=treaty_rate,
            domestic_withholding=domestic_withholding,
            treaty_withholding=treaty_withholding,
            savings=savings,
            net_amount_domestic=gross_amount - domestic_withholding,
            net_amount_treaty=gross_amount - treaty_withholding,
            treaty_name=treaty["name"],
            notes=income_data.get("notes", ""),
        )

    def get_withholding_reduction(
        self,
        source_country: str,
        recipient_country: str,
        income_type: str,
    ) -> Dict[str, Decimal]:
        """Return the withholding rate reduction available under a treaty.

        Args:
            source_country: Country from which income is paid.
            recipient_country: Country of the income recipient.
            income_type: One of ``dividends``, ``interest``, ``royalties``.

        Returns:
            A dict with ``domestic_rate``, ``treaty_rate``, and
            ``reduction`` (all in percentage points).
        """
        income_type = income_type.lower()
        if income_type not in ("dividends", "interest", "royalties"):
            raise ValueError(f"Unsupported income type: {income_type}")

        key = self._normalize_key(source_country, recipient_country)
        treaty = TREATIES[key]
        income_data = treaty[income_type]

        source_upper = source_country.upper()
        domestic_key = f"domestic_{source_upper.lower()}"
        domestic_rate = income_data.get(domestic_key, Decimal("30"))
        treaty_rate = income_data["treaty_rate"]

        return {
            "domestic_rate": domestic_rate,
            "treaty_rate": treaty_rate,
            "reduction": domestic_rate - treaty_rate,
        }

    def list_all_treaties(self) -> List[TreatyInfo]:
        """Return info for all six bilateral treaties."""
        results = []
        for (a, b) in TREATIES:
            results.append(self.find_treaty(a, b))
        return results
