/**
 * GET /api/bookings/archived/count
 * Returns the total number of archived bookings.
 */
const { countDocuments } = require('../../_lib/db');
const { verifyAdmin } = require('../../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const total = await countDocuments('bookings_archive');
    return res.status(200).json({ total });
  } catch (err) {
    console.error('Archived count error:', err.message);
    return res.status(500).json({ detail: err.message });
  }
};
