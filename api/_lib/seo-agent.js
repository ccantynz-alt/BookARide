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
const { sendEmail } = require('./mailgun');

const SITE_URL = 'https://bookaride.co.nz';

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

// All pages we want indexed (read from the frontend route table)
const TRACKED_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/book-now', priority: '1.0', changefreq: 'daily' },
  { path: '/services', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/airport-shuttle', priority: '1.0', changefreq: 'daily' },
  { path: '/auckland-airport-shuttle', priority: '1.0', changefreq: 'daily' },
  { path: '/auckland-cbd-to-airport', priority: '1.0', changefreq: 'daily' },
  { path: '/auckland-airport-to-city', priority: '0.9', changefreq: 'weekly' },
  { path: '/north-shore-airport-shuttle', priority: '0.9', changefreq: 'weekly' },
  { path: '/hibiscus-coast-airport-shuttle', priority: '0.9', changefreq: 'weekly' },
  { path: '/auckland-airport-arrivals-guide', priority: '0.8', changefreq: 'weekly' },
  { path: '/new-zealand-travel-checklist', priority: '0.8', changefreq: 'weekly' },
  // CBD suburbs
  { path: '/ponsonby-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/parnell-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/newmarket-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/remuera-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/mt-eden-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/grey-lynn-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/epsom-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/mission-bay-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/viaduct-to-airport', priority: '0.8', changefreq: 'weekly' },
  // Hibiscus Coast / North Shore suburbs
  { path: '/orewa-to-auckland-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/whangaparoa-airport-transfer', priority: '0.8', changefreq: 'weekly' },
  { path: '/takapuna-to-airport', priority: '0.8', changefreq: 'weekly' },
  { path: '/albany-to-airport', priority: '0.8', changefreq: 'weekly' },
];

/**
 * Generate a fresh sitemap.xml from TRACKED_PAGES with today's lastmod date.
 * Returns the XML string. The cron job uploads it to a known location or
 * just makes it available at /api/sitemap (Vercel rewrites can map to this).
 */
function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urls = TRACKED_PAGES.map(p => `  <url>
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
 * Ping Google and Bing to recrawl the sitemap.
 * Both accept GET requests at /ping?sitemap=...
 */
async function pingSearchEngines() {
  const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap.xml`);
  const targets = [
    { name: 'Google', url: `https://www.google.com/ping?sitemap=${sitemapUrl}` },
    { name: 'Bing', url: `https://www.bing.com/ping?sitemap=${sitemapUrl}` },
  ];

  const results = [];
  for (const target of targets) {
    try {
      const res = await fetch(target.url, { method: 'GET' });
      results.push({ engine: target.name, ok: res.ok, status: res.status });
    } catch (err) {
      results.push({ engine: target.name, ok: false, error: err.message });
    }
  }

  const ok = results.every(r => r.ok);
  return {
    ok,
    message: ok ? 'Pinged Google and Bing successfully' : 'Some pings failed',
    data: results,
  };
}

/**
 * Check that all tracked pages return HTTP 200.
 * Reports any 404s or server errors so we can fix broken pages immediately.
 */
async function checkPageHealth() {
  const broken = [];
  let checked = 0;

  for (const page of TRACKED_PAGES) {
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
  }

  return {
    ok: broken.length === 0,
    message: broken.length === 0
      ? `All ${checked} tracked pages return 200 OK`
      : `${broken.length} of ${checked} pages are broken`,
    data: { checked, broken },
  };
}

/**
 * Generate keyword-focused content suggestions using Claude.
 * Returns a list of 3-5 actionable suggestions per run.
 */
async function generateContentSuggestions() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      message: 'ANTHROPIC_API_KEY not set — skipping AI content suggestions',
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

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `Claude API error ${res.status}`, data: text };
    }
    const data = await res.json();
    const suggestions = data.content?.[0]?.text || 'No suggestions returned';
    return { ok: true, message: 'Generated content suggestions via Claude', data: suggestions };
  } catch (err) {
    return { ok: false, message: `Claude API call failed: ${err.message}`, data: null };
  }
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
      ${sectionHtml('2. Search Engine Pings', results.ping)}
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
  pingSearchEngines,
  checkPageHealth,
  generateContentSuggestions,
  sendDailyReport,
};
