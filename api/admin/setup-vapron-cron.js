/**
 * GET /api/admin/setup-vapron-cron — one-time registration of the
 * daily SEO agent cron job with Vapron (Craig authorised 2026-06-10).
 *
 * Designed so Craig can run it from a browser without touching a
 * terminal — the keys never leave Vercel env vars.
 *
 * Auth (either works):
 *   - ?secret=<CRON_SECRET>  (same shared secret the cron job uses)
 *   - Authorization: Bearer <admin JWT>
 *
 * Idempotent: asks Vapron for existing cron jobs first and skips
 * creation when ours is already registered.
 */
const jwt = require('jsonwebtoken');
const { vapronCall } = require('../_lib/vapron');

const CRON_NAME = 'bookaride-daily-seo-agent';
const SITE_URL = 'https://bookaride.co.nz';

function isAuthorized(req) {
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && req.query.secret === expectedSecret) return true;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ') && process.env.JWT_SECRET_KEY) {
    try {
      jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET_KEY);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  if (!isAuthorized(req)) {
    return res.status(401).json({ detail: 'Unauthorized — append ?secret=<CRON_SECRET> or use an admin login token' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ detail: 'CRON_SECRET is not set in Vercel env vars — set it first, then retry' });
  }
  if (!process.env.VAPRON_API_KEY) {
    return res.status(500).json({ detail: 'VAPRON_API_KEY is not set in Vercel env vars — set it first, then retry' });
  }

  try {
    // Idempotency: skip if the job already exists. If Vapron's list
    // endpoint is unavailable we still proceed — worst case is a
    // duplicate job, which the response tells the admin to check.
    let alreadyRegistered = false;
    let listChecked = false;
    const list = await vapronCall('customerCron.list', {}, { method: 'GET' });
    if (list.ok && Array.isArray(list.data)) {
      listChecked = true;
      alreadyRegistered = list.data.some((job) => job?.name === CRON_NAME);
    }

    if (alreadyRegistered) {
      return res.status(200).json({
        status: 'already_registered',
        message: `The '${CRON_NAME}' cron job already exists in Vapron — nothing to do. The daily SEO report runs at 6 AM NZ standard time.`,
      });
    }

    const created = await vapronCall('customerCron.create', {
      name: CRON_NAME,
      schedule: '0 18 * * *',
      endpoint: `${SITE_URL}/api/cron/daily-seo-agent?secret=${encodeURIComponent(cronSecret)}`,
    });

    if (!created.ok) {
      return res.status(502).json({
        status: 'failed',
        message: `Vapron rejected the cron registration: ${created.error}`,
        next_steps: 'Check VAPRON_API_KEY is the rotated key and the Vapron account has cron access.',
      });
    }

    return res.status(200).json({
      status: 'registered',
      message: 'Daily SEO agent cron registered with Vapron (18:00 UTC = 6 AM NZST, daily).',
      duplicate_check_ran: listChecked,
      next_steps: 'The daily SEO report should arrive in the admin inbox tomorrow morning. If you run this endpoint again it will not create a duplicate.',
    });
  } catch (err) {
    console.error('CRITICAL: Vapron cron setup failed:', err.message);
    return res.status(500).json({ status: 'failed', message: 'Cron setup threw an error — see Vercel logs.' });
  }
};
