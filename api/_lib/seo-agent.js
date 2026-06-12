/**
 * api/_lib/seo-agent.js
 *
 * The SEO automation library. Functions used by the daily SEO cron job
 * to keep BookARide ranking #1 in NZ for airport transfer keywords.
 *
 * Each function returns { ok, message, data } so the cron handler can
 * collect results into a summary email.
 */

const { findMany } = require('./db');
const { sendEmail } = require('./email');
const { aiComplete } = require('./vapron');

const SITE_URL = 'https://www.bookaride.co.nz';

// Target keywords we MUST rank #1 for
const TARGET_KEYWORDS = [
  'airport shuttle Auckland',
  'Auckland airport transfer',
  'airport transfer New Zealand',
  'private airport transfer Auckland',
  'Hibiscus Coast airport shuttle',
  'Auckland airport shuttle service',
  'airport pickup Auckland',
  'Auckland to airport',
  'airport to Auckland CBD',
  'cheap airport shuttle Auckland',
];
// All pages we want indexed (static routes + dynamic-slug pages).
// The list lives in ./seo-pages.js — a pure data module shared with the
// build-time prerender (frontend/scripts/prerender.mjs). TRACKED_PAGES is
// re-exported below so existing imports keep working.
const { TRACKED_PAGES, ALL_PAGES } = require('./seo-pages');

// IndexNow key — public by design (must be hosted at /<key>.txt for engines
// to verify ownership), so committing it here is correct, not a leak.
// The matching file lives at frontend/public/6a831ac61c5fcdf2cda15be9ff8a8b0b.txt
const INDEXNOW_KEY = '6a831ac61c5fcdf2cda15be9ff8a8b0b';

/**
 * Generate a fresh sitemap.xml from ALL_PAGES (static + dynamic-slug pages)
 * with today's lastmod date. Served at /sitemap.xml via Vercel rewrite to
 * /api/sitemap.xml.
 */
function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urls = ALL_PAGES.map(p => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Submit every page URL to IndexNow (instant indexing for Bing, Yandex,
 * Seznam, Naver and other participating engines).
 *
 * This replaced the old Google/Bing sitemap "ping" endpoints — Google retired
 * its ping endpoint in June 2023 and Bing followed; both now return errors.
 * Google has no IndexNow support: it discovers via the sitemap referenced in
 * robots.txt (Search Console API integration is the planned upgrade for
 * direct Google submission).
 */
async function submitToIndexNow() {
  const urlList = ALL_PAGES.map(p => `${SITE_URL}${p.path}`);
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.bookaride.co.nz',
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
    // 200 = OK, 202 = accepted (key verification pending) — both are success
    const ok = res.status === 200 || res.status === 202;
    return {
      ok,
      message: ok
        ? `Submitted ${urlList.length} URLs to IndexNow (HTTP ${res.status})`
        : `IndexNow rejected the submission (HTTP ${res.status}) — check the key file at /${INDEXNOW_KEY}.txt`,
      data: { status: res.status, urls_submitted: urlList.length },
    };
  } catch (err) {
    return { ok: false, message: `IndexNow submission failed: ${err.message}`, data: null };
  }
}

/**
 * Check that all pages (static + dynamic) return HTTP 200, in parallel
 * batches so the cron handler stays well inside the serverless time limit.
 * Reports any 404s or server errors so we can fix broken pages immediately.
 */
async function checkPageHealth() {
  const broken = [];
  let checked = 0;
  const BATCH_SIZE = 20;

  for (let i = 0; i < ALL_PAGES.length; i += BATCH_SIZE) {
    const batch = ALL_PAGES.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (page) => {
      try {
        const res = await fetch(`${SITE_URL}${page.path}`, {
          method: 'HEAD',
          redirect: 'follow',
        });
        checked++;
        if (!res.ok) {
          broken.push({ path: page.path, status: res.status });
        }
      } catch (err) {
        broken.push({ path: page.path, error: err.message });
      }
    }));
  }

  return {
    ok: broken.length === 0,
    message: broken.length === 0
      ? `All ${checked} pages return 200 OK`
      : `${broken.length} of ${checked + broken.length} pages are broken`,
    data: { checked, broken },
  };
}

/**
 * Generate keyword-focused content suggestions using Claude.
 * Returns a list of 3-5 actionable suggestions per run.
 */
async function generateContentSuggestions() {
  if (!process.env.VAPRON_API_KEY) {
    return {
      ok: false,
      message: 'VAPRON_API_KEY not set — skipping AI content suggestions',
      data: null,
    };
  }

  const prompt = `You are the SEO strategist for BookARide NZ, a premium airport transfer service in Auckland.

Today's task: Suggest 3 specific, actionable SEO improvements we should make THIS WEEK to rank #1 for these keywords:
${TARGET_KEYWORDS.map(k => `- ${k}`).join('\n')}

For each suggestion give:
1. The exact action (e.g. "Create blog post titled X")
2. Which target keyword it helps
3. Estimated impact (high/medium/low)

Be specific and brutal. No vague advice. Each suggestion should be implementable today.`;

  const suggestions = await aiComplete({
    maxTokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });
  if (!suggestions) {
    return { ok: false, message: 'AI gateway call failed — see Vercel logs', data: null };
  }
  return { ok: true, message: 'Generated content suggestions via Claude', data: suggestions };
}

/**
 * Send the daily SEO report to the admin email address.
 */
async function sendDailyReport(results) {
  const adminEmail = process.env.SEO_REPORT_EMAIL || process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
  const today = new Date().toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const sectionHtml = (title, result) => {
    const statusIcon = result.ok ? '<span style="color:#10b981;">PASS</span>' : '<span style="color:#ef4444;">FAIL</span>';
    let dataHtml = '';
    if (result.data) {
      if (typeof result.data === 'string') {
        dataHtml = `<pre style="background:#f3f4f6; padding:12px; border-radius:6px; white-space:pre-wrap; font-size:12px;">${result.data.replace(/</g, '&lt;')}</pre>`;
      } else {
        dataHtml = `<pre style="background:#f3f4f6; padding:12px; border-radius:6px; white-space:pre-wrap; font-size:12px;">${JSON.stringify(result.data, null, 2)}</pre>`;
      }
    }
    return `
      <div style="margin-bottom:24px; padding:16px; border:1px solid #e5e7eb; border-radius:8px;">
        <h3 style="margin:0 0 8px 0; color:#1a1a1a;">${title} ${statusIcon}</h3>
        <p style="margin:0 0 8px 0; color:#4b5563; font-size:14px;">${result.message}</p>
        ${dataHtml}
      </div>
    `;
  };

  const html = `
    <div style="font-family:Arial,sans-serif; max-width:700px; margin:0 auto; padding:24px;">
      <h1 style="color:#1a1a1a; margin:0 0 4px 0;">BookARide Daily SEO Report</h1>
      <p style="color:#6b7280; margin:0 0 24px 0;">${today}</p>
      ${sectionHtml('1. Sitemap Regeneration', results.sitemap)}
      ${sectionHtml('2. IndexNow Submission', results.ping)}
      ${sectionHtml('3. Page Health Check', results.health)}
      ${sectionHtml('4. AI Content Suggestions', results.suggestions)}
      <p style="color:#9ca3af; font-size:12px; margin-top:32px; text-align:center;">
        Automated daily SEO agent &mdash; runs every day at 6 AM NZ time
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject: `BookARide Daily SEO Report — ${today}`,
    html,
    fromName: 'BookARide SEO Agent',
  });
}

module.exports = {
  TARGET_KEYWORDS,
  TRACKED_PAGES,
  generateSitemap,
  submitToIndexNow,
  checkPageHealth,
  generateContentSuggestions,
  sendDailyReport,
};
