/**
 * GET /api/admin/urgent-returns
 *
 * Returns return-trip bookings happening in the next 24 hours so admin
 * can dispatch drivers. Used by ReturnsOverviewPanel.jsx.
 */
const { findMany } = require('../_lib/db');
const { verifyAdmin } = require('../_lib/auth');

function parseDateString(dateStr) {
  if (!dateStr) return null;
  // Accept YYYY-MM-DD or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    // Pull all bookings that have a return trip configured (we filter in JS
    // because returnDate is in JSONB and could be either format).
    const all = await findMany('bookings', {}, { limit: 2000 });
    const now = new Date();
    const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const urgent = [];
    for (const b of all) {
      if (!b.bookReturn || !b.returnDate || !b.returnTime) continue;
      if (b.status === 'cancelled' || b.cancellation_requested) continue;

      const returnDate = parseDateString(b.returnDate);
      if (!returnDate) continue;

      // Combine date + time
      const [hh, mm] = String(b.returnTime).split(':').map(n => parseInt(n, 10));
      if (Number.isNaN(hh)) continue;
      const returnAt = new Date(returnDate.getTime() + (hh * 60 + (mm || 0)) * 60 * 1000);

      if (returnAt < now || returnAt > horizon) continue;

      const minutesAway = Math.round((returnAt.getTime() - now.getTime()) / 60000);
      let urgency = 'OK';
      if (minutesAway <= 60) urgency = 'LEAVE NOW';
      else if (minutesAway <= 180) urgency = 'LEAVE SOON';

      urgent.push({
        booking_id: b.id,
        referenceNumber: b.referenceNumber,
        name: b.name || ((b.firstName || '') + ' ' + (b.lastName || '')).trim() || 'Customer',
        pickupAddress: b.pickupAddress,
        dropoffAddress: b.dropoffAddress,
        returnDate: b.returnDate,
        returnTime: b.returnTime,
        minutes_until_return: minutesAway,
        urgency,
      });
    }

    urgent.sort((a, b) => a.minutes_until_return - b.minutes_until_return);
    return res.status(200).json({ urgent_returns: urgent, count: urgent.length });
  } catch (err) {
    console.error('Urgent returns error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
