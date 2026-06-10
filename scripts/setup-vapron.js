/**
 * One-time Vapron setup — registers the daily SEO agent cron job.
 *
 * Vapron cron replaced Vercel Cron (Craig authorised 2026-06-10).
 * Run this once after rotating the Vapron API key:
 *
 *   VAPRON_API_KEY=vpk_xxx CRON_SECRET=yyy node scripts/setup-vapron.js
 *
 * CRON_SECRET must match the value set in Vercel env vars — the cron
 * handler rejects requests without it. After running, verify the
 * daily SEO report lands in the admin inbox the next morning (6 AM
 * NZ standard time).
 */

const SITE_URL = 'https://bookaride.co.nz';

async function main() {
  const apiKey = (process.env.VAPRON_API_KEY || '').trim();
  const cronSecret = (process.env.CRON_SECRET || '').trim();

  if (!apiKey) {
    console.error('VAPRON_API_KEY is required. Usage: VAPRON_API_KEY=vpk_xxx CRON_SECRET=yyy node scripts/setup-vapron.js');
    process.exit(1);
  }
  if (!cronSecret) {
    console.error('CRON_SECRET is required — it must match the CRON_SECRET env var in Vercel, otherwise the cron endpoint will return 401.');
    process.exit(1);
  }

  const res = await fetch('https://api.vapron.ai/api/trpc/customerCron.create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: {
        name: 'bookaride-daily-seo-agent',
        schedule: '0 18 * * *',
        endpoint: `${SITE_URL}/api/cron/daily-seo-agent?secret=${encodeURIComponent(cronSecret)}`,
      },
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`Vapron cron registration failed (HTTP ${res.status}):`, JSON.stringify(body));
    process.exit(1);
  }

  console.error('Daily SEO agent cron registered with Vapron (18:00 UTC = 6 AM NZST daily).');
  console.error('Verify: the daily SEO report should arrive in the admin inbox tomorrow morning.');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
