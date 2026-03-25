"""
Shared email templates for BookARide NZ.

Provides Outlook-compatible, table-based HTML email components used across
all transactional and marketing emails.  Every layout element uses <table>
with inline styles -- no <style> blocks, no flexbox, no border-radius,
no box-shadow, no gradients, no rgba().

Colour palette:
    Gold    #D4AF37
    Dark    #1a1a1a
    White   #ffffff
    Light   #f5f5f5

Exported helpers
----------------
email_wrapper        -- master wrapper (header + body + signature + footer)
email_section        -- titled content section
email_button         -- bulletproof CTA button (table-based)
email_booking_summary -- reusable booking details table
email_price_table    -- pricing breakdown table
email_divider        -- horizontal rule
"""

from __future__ import annotations

import html as _html
from typing import Optional


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
GOLD = "#D4AF37"
DARK = "#1a1a1a"
WHITE = "#ffffff"
LIGHT = "#f5f5f5"
ROW_ALT = "#fafafa"
GREEN = "#22c55e"
AMBER = "#f59e0b"
FONT = "Arial, Helvetica, sans-serif"
TABLE_WIDTH = "600"

SITE_URL = "https://bookaride.co.nz"
BOOK_URL = f"{SITE_URL}/book-now"
CONTACT_URL = f"{SITE_URL}/contact"
TERMS_URL = f"{SITE_URL}/terms"


def _esc(value: object) -> str:
    """HTML-escape a value, returning empty string for None."""
    if value is None:
        return ""
    return _html.escape(str(value))


# ---------------------------------------------------------------------------
# 1. email_wrapper
# ---------------------------------------------------------------------------
def email_wrapper(
    body_html: str,
    preheader: str = "",
    subject_hint: str = "",
) -> str:
    """Wrap *body_html* in a full, Outlook-safe email document.

    Parameters
    ----------
    body_html : str
        The inner content (already table-based HTML).
    preheader : str, optional
        Hidden text that appears in inbox previews.
    subject_hint : str, optional
        Currently unused; reserved for future use.
    """
    preheader_esc = _esc(preheader)

    # Hidden preheader + whitespace padding so it does not leak into the
    # visible body in clients that render hidden text.
    preheader_block = ""
    if preheader_esc:
        preheader_block = (
            '<div style="display:none;font-size:1px;color:#f5f5f5;'
            'line-height:1px;max-height:0px;max-width:0px;opacity:0;'
            f'overflow:hidden;">{preheader_esc}'
            "&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;"
            "&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;"
            "&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;"
            "</div>"
        )

    return f"""\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BookARide NZ</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:{LIGHT};font-family:{FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
{preheader_block}
<!-- Outer wrapper table -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{LIGHT}" style="margin:0;padding:0;">
<tr>
<td align="center" valign="top" style="padding:20px 10px;">
<!-- Inner 600px container -->
<table width="{TABLE_WIDTH}" cellpadding="0" cellspacing="0" border="0" bgcolor="{WHITE}" align="center" style="font-family:{FONT};">

    <!-- ========== HEADER ========== -->
    <tr>
        <td bgcolor="{GOLD}" align="center" style="padding:28px 20px 24px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                    <td align="center" style="font-family:{FONT};font-size:28px;font-weight:bold;color:{WHITE};letter-spacing:2px;">
                        BookARide NZ
                    </td>
                </tr>
                <tr>
                    <td align="center" style="font-family:{FONT};font-size:12px;color:{WHITE};letter-spacing:1px;padding-top:6px;">
                        Auckland's Premier Airport Transfer Service
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- ========== BODY ========== -->
    <tr>
        <td style="padding:0;">
{body_html}
        </td>
    </tr>

    <!-- ========== SIGNATURE ========== -->
    <tr>
        <td style="padding:30px 24px 0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td bgcolor="{LIGHT}" style="padding:0;height:1px;font-size:1px;line-height:1px;" colspan="1">&nbsp;</td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding:20px 24px 24px 24px;font-family:{FONT};font-size:13px;color:#555555;line-height:1.7;">
            &#8212;<br />
            <strong style="color:{DARK};">BookARide NZ</strong><br />
            Auckland's Premier Airport Transfer Service<br />
            Email: <a href="mailto:info@bookaride.co.nz" style="color:{GOLD};text-decoration:none;">info@bookaride.co.nz</a><br />
            Web: <a href="{SITE_URL}" style="color:{GOLD};text-decoration:none;">bookaride.co.nz</a><br />
            <br />
            <a href="{BOOK_URL}" style="color:{GOLD};text-decoration:none;font-weight:bold;">Book your next ride &rarr; bookaride.co.nz/book-now</a>
        </td>
    </tr>

    <!-- ========== FOOTER ========== -->
    <tr>
        <td bgcolor="{DARK}" style="padding:24px 20px;" align="center">
            <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                    <td align="center" style="font-family:{FONT};font-size:12px;color:#999999;line-height:1.6;">
                        &copy; 2026 BookARide NZ. All rights reserved.<br />
                        Auckland, New Zealand
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding-top:12px;font-family:{FONT};font-size:12px;">
                        <a href="{BOOK_URL}" style="color:{GOLD};text-decoration:none;">Book Now</a>
                        &nbsp;&middot;&nbsp;
                        <a href="{CONTACT_URL}" style="color:{GOLD};text-decoration:none;">Contact Us</a>
                        &nbsp;&middot;&nbsp;
                        <a href="{TERMS_URL}" style="color:{GOLD};text-decoration:none;">Terms</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

</table>
<!-- /Inner container -->
</td>
</tr>
</table>
<!-- /Outer wrapper -->
</body>
</html>"""


# ---------------------------------------------------------------------------
# 2. email_section
# ---------------------------------------------------------------------------
def email_section(title: Optional[str], content_html: str) -> str:
    """Return a titled section block for use inside ``email_wrapper``.

    Parameters
    ----------
    title : str or None
        Optional section heading displayed in gold.
    content_html : str
        Inner HTML content for the section.
    """
    title_row = ""
    if title:
        title_esc = _esc(title)
        title_row = f"""\
<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td style="padding:20px 24px 8px 24px;font-family:{FONT};font-size:16px;font-weight:bold;color:{GOLD};">
            {title_esc}
        </td>
    </tr>
</table>"""

    return f"""\
{title_row}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td style="padding:8px 24px 16px 24px;font-family:{FONT};font-size:14px;color:#333333;line-height:1.6;">
{content_html}
        </td>
    </tr>
</table>"""


# ---------------------------------------------------------------------------
# 3. email_button
# ---------------------------------------------------------------------------
def email_button(
    text: str,
    url: str,
    color: str = GOLD,
    text_color: str = WHITE,
) -> str:
    """Return a bulletproof CTA button that renders in Outlook.

    Uses the VML fallback pattern: an outer ``<table>`` with ``bgcolor`` on
    the ``<td>`` gives Outlook its colour, while modern clients honour the
    inline CSS on the ``<a>`` tag.
    """
    text_esc = _esc(text)
    url_esc = _esc(url)

    return f"""\
<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto;">
    <tr>
        <td bgcolor="{color}" align="center" style="padding:14px 30px;font-family:{FONT};font-size:15px;font-weight:bold;">
            <a href="{url_esc}" target="_blank" style="color:{text_color};text-decoration:none;display:inline-block;font-family:{FONT};font-size:15px;font-weight:bold;">
                {text_esc}
            </a>
        </td>
    </tr>
</table>"""


# ---------------------------------------------------------------------------
# 4. email_booking_summary
# ---------------------------------------------------------------------------
def _detail_row(label: str, value: str, bg: str = WHITE) -> str:
    """Single label-value row for a details table."""
    return f"""\
<tr>
    <td bgcolor="{bg}" style="padding:10px 16px;font-family:{FONT};font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;width:140px;" valign="top">
        {_esc(label)}
    </td>
    <td bgcolor="{bg}" style="padding:10px 16px;font-family:{FONT};font-size:14px;color:{DARK};font-weight:500;border-bottom:1px solid #eeeeee;" valign="top">
        {_esc(value)}
    </td>
</tr>"""


def _section_header_row(label: str) -> str:
    """Sub-header row spanning both columns (gold left border)."""
    return f"""\
<tr>
    <td colspan="2" style="padding:20px 0 6px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td bgcolor="#fef9c3" style="padding:10px 16px;font-family:{FONT};font-size:13px;font-weight:bold;color:#713f12;letter-spacing:1px;text-transform:uppercase;border-left:4px solid #eab308;">
                    {_esc(label)}
                </td>
            </tr>
        </table>
    </td>
</tr>"""


def _format_service_type(raw: str) -> str:
    """Human-readable service type."""
    return (raw or "Airport Transfer").replace("-", " ").title()


def _format_date(date_str: str) -> str:
    """Best-effort DD/MM/YYYY formatting."""
    if not date_str:
        return "TBC"
    parts = str(date_str).split("-")
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return str(date_str)


def _format_time(time_str: str) -> str:
    """Best-effort 12-hour formatting."""
    if not time_str:
        return "TBC"
    try:
        parts = str(time_str).split(":")
        hour = int(parts[0])
        minute = parts[1] if len(parts) > 1 else "00"
        suffix = "AM" if hour < 12 else "PM"
        display_hour = hour % 12
        if display_hour == 0:
            display_hour = 12
        return f"{display_hour}:{minute} {suffix}"
    except (ValueError, IndexError):
        return str(time_str)


def email_booking_summary(booking: dict) -> str:
    """Return an Outlook-safe booking details table.

    Handles: date/time, pickup, drop-off, passengers, service type,
    driver (if assigned), return trip, and flight details.

    ``booking`` is a plain dict (as stored in the database).
    """
    rows: list[str] = []
    alt = False

    def _bg() -> str:
        nonlocal alt
        colour = ROW_ALT if alt else WHITE
        alt = not alt
        return colour

    # -- Outbound journey header --
    has_return = bool(booking.get("bookReturn") or booking.get("returnDate"))
    rows.append(_section_header_row("Departure Journey" if has_return else "Journey Details"))

    # Date & time
    rows.append(_detail_row("Date", _format_date(booking.get("date", "")), _bg()))
    rows.append(_detail_row("Pickup Time", _format_time(booking.get("time", "")), _bg()))

    # Pickup / drop-off
    rows.append(_detail_row("Pickup", booking.get("pickupAddress", "N/A"), _bg()))
    rows.append(_detail_row("Drop-off", booking.get("dropoffAddress", "N/A"), _bg()))

    # Passengers
    rows.append(_detail_row("Passengers", str(booking.get("passengers", "1")), _bg()))

    # Service type
    rows.append(_detail_row("Service", _format_service_type(booking.get("serviceType", "")), _bg()))

    # Driver (if assigned)
    driver = booking.get("driverName") or booking.get("driver", {}).get("name") if isinstance(booking.get("driver"), dict) else booking.get("driverName")
    if driver:
        rows.append(_detail_row("Driver", str(driver), _bg()))

    # -- Flight details (outbound) --
    dep_flight = (booking.get("departureFlightNumber") or booking.get("flightNumber") or "").strip()
    arr_flight = (booking.get("arrivalFlightNumber") or "").strip()
    dep_time = (booking.get("departureTime") or "").strip()
    arr_time = (booking.get("arrivalTime") or "").strip()

    if dep_flight or arr_flight:
        rows.append(_section_header_row("Flight Details"))
        alt = False
        if dep_flight:
            label_val = dep_flight
            if dep_time:
                label_val += f" at {_format_time(dep_time)}"
            rows.append(_detail_row("Departure Flight", label_val, _bg()))
        if arr_flight and arr_flight != dep_flight:
            label_val = arr_flight
            if arr_time:
                label_val += f" at {_format_time(arr_time)}"
            rows.append(_detail_row("Arrival Flight", label_val, _bg()))

    # -- Return trip --
    if has_return:
        rows.append(_section_header_row("Return Journey"))
        alt = False
        return_date = booking.get("returnDate", "")
        return_time = booking.get("returnTime", "")
        rows.append(_detail_row("Date", _format_date(return_date), _bg()))
        rows.append(_detail_row("Pickup Time", _format_time(return_time), _bg()))
        # Return pickup is the outbound drop-off and vice-versa
        rows.append(_detail_row("Pickup", booking.get("dropoffAddress", "N/A"), _bg()))
        rows.append(_detail_row("Drop-off", booking.get("pickupAddress", "N/A"), _bg()))

        ret_flight = (booking.get("returnFlightNumber") or booking.get("returnDepartureFlightNumber") or "").strip()
        ret_arr = (booking.get("returnArrivalFlightNumber") or "").strip()
        if ret_flight:
            rows.append(_detail_row("Flight Number", ret_flight, _bg()))
        if ret_arr and ret_arr != ret_flight:
            rows.append(_detail_row("Arrival Flight", ret_arr, _bg()))

    # -- Notes --
    notes = (booking.get("notes") or booking.get("specialRequests") or "").strip()
    if notes:
        rows.append(f"""\
<tr>
    <td colspan="2" style="padding:16px 16px 8px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td bgcolor="#fffbeb" style="padding:12px 16px;font-family:{FONT};font-size:14px;color:#333333;line-height:1.5;border-left:4px solid #eab308;">
                    <strong style="font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Special Instructions</strong><br />
                    {_esc(notes)}
                </td>
            </tr>
        </table>
    </td>
</tr>""")

    row_block = "\n".join(rows)

    return f"""\
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:{FONT};">
{row_block}
</table>"""


# ---------------------------------------------------------------------------
# 5. email_price_table
# ---------------------------------------------------------------------------
def email_price_table(booking: dict) -> str:
    """Return an Outlook-safe pricing breakdown table.

    Reads from ``booking['pricing']`` dict (standard BookARide structure)
    with fallbacks to top-level fields.
    """
    pricing = booking.get("pricing", {})

    distance = pricing.get("distance", booking.get("distance", 0))
    base_price = pricing.get("basePrice", booking.get("basePrice", 0))
    airport_fee = pricing.get("airportFee", 0)
    luggage_fee = pricing.get("oversizedLuggageFee", 0)
    passenger_fee = pricing.get("passengerFee", 0)
    promo_discount = pricing.get("promoDiscount", 0)
    promo_code = pricing.get("promoCode", "")
    stripe_fee = pricing.get("stripeFee", booking.get("stripeFee", 0))
    subtotal = pricing.get("subtotal", 0)
    total_price = pricing.get("totalPrice", booking.get("totalPrice", 0))

    payment_status_raw = (booking.get("payment_status") or "unpaid").lower()
    is_paid = payment_status_raw == "paid"
    badge_bg = GREEN if is_paid else AMBER
    badge_text = "PAID" if is_paid else payment_status_raw.upper()

    rows: list[str] = []

    def _price_row(label: str, amount: float, bold: bool = False, large: bool = False) -> str:
        weight = "bold" if bold else "normal"
        size = "18px" if large else "14px"
        return f"""\
<tr>
    <td style="padding:8px 16px;font-family:{FONT};font-size:14px;color:#555555;border-bottom:1px solid #eeeeee;">
        {_esc(label)}
    </td>
    <td align="right" style="padding:8px 16px;font-family:{FONT};font-size:{size};color:{DARK};font-weight:{weight};border-bottom:1px solid #eeeeee;">
        ${amount:,.2f} NZD
    </td>
</tr>"""

    # Distance (informational, not a dollar amount)
    if distance:
        rows.append(f"""\
<tr>
    <td style="padding:8px 16px;font-family:{FONT};font-size:14px;color:#555555;border-bottom:1px solid #eeeeee;">
        Distance
    </td>
    <td align="right" style="padding:8px 16px;font-family:{FONT};font-size:14px;color:{DARK};border-bottom:1px solid #eeeeee;">
        {float(distance):.1f} km
    </td>
</tr>""")

    # Base price
    if base_price:
        rows.append(_price_row("Base Price", float(base_price)))

    # Add-on fees (only if non-zero)
    if airport_fee:
        rows.append(_price_row("VIP Airport Pickup", float(airport_fee)))
    if luggage_fee:
        rows.append(_price_row("Oversized Luggage", float(luggage_fee)))
    if passenger_fee:
        rows.append(_price_row("Extra Passengers", float(passenger_fee)))

    # Promo discount
    if promo_discount and float(promo_discount) > 0:
        code_label = f"Promo ({promo_code})" if promo_code else "Promo Discount"
        rows.append(f"""\
<tr>
    <td style="padding:8px 16px;font-family:{FONT};font-size:14px;color:#16a34a;border-bottom:1px solid #eeeeee;">
        {_esc(code_label)}
    </td>
    <td align="right" style="padding:8px 16px;font-family:{FONT};font-size:14px;color:#16a34a;font-weight:bold;border-bottom:1px solid #eeeeee;">
        -${float(promo_discount):,.2f} NZD
    </td>
</tr>""")

    # Subtotal (if Stripe fee exists, show subtotal before fee)
    if stripe_fee and float(stripe_fee) > 0 and subtotal:
        rows.append(_price_row("Subtotal", float(subtotal)))

    # Stripe processing fee
    if stripe_fee and float(stripe_fee) > 0:
        rows.append(_price_row("Card Processing Fee", float(stripe_fee)))

    # Total
    rows.append(f"""\
<tr>
    <td style="padding:12px 16px;font-family:{FONT};font-size:16px;color:{DARK};font-weight:bold;">
        Total
    </td>
    <td align="right" style="padding:12px 16px;font-family:{FONT};font-size:20px;color:{DARK};font-weight:bold;">
        ${float(total_price):,.2f} NZD
    </td>
</tr>""")

    # Payment status badge
    rows.append(f"""\
<tr>
    <td style="padding:8px 16px;font-family:{FONT};font-size:14px;color:#555555;">
        Payment Status
    </td>
    <td align="right" style="padding:8px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" align="right">
            <tr>
                <td bgcolor="{badge_bg}" style="padding:4px 14px;font-family:{FONT};font-size:12px;font-weight:bold;color:{WHITE};letter-spacing:1px;">
                    {badge_text}
                </td>
            </tr>
        </table>
    </td>
</tr>""")

    row_block = "\n".join(rows)

    return f"""\
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:{FONT};">
{row_block}
</table>"""


# ---------------------------------------------------------------------------
# 6. email_divider
# ---------------------------------------------------------------------------
def email_divider() -> str:
    """Return a table-based horizontal divider line."""
    return f"""\
<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td style="padding:16px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td bgcolor="#eeeeee" style="height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
                </tr>
            </table>
        </td>
    </tr>
</table>"""
