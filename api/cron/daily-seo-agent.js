/**
 * GET /api/cron/daily-seo-agent
 *
 * Daily SEO automation. Runs once per day via Vercel Cron Jobs (configured
 * in vercel.json). Performs the following tasks in sequence:
 *
 * 1. Regenerate sitemap.xml with today's lastmod date
 * 2. Submit all page URLs to IndexNow (Bing/Yandex instant indexing)
 * 3. Check that all tracked pages return HTTP 200 (no broken links)
 * 4. Use Claude AI to generate 3 content suggestions for the week
 * 5. Email a full report to the admin inbox
 *
 * Security: This endpoint should only be callable by Vercel's cron system.
 * Vercel sends a `x-vercel-cron` header on cron invocations, but it can be
 * spoofed if someone knows the URL. We also accept a CRON_SECRET header
 * for manual testing.
 */

const {
  generateSitemap,
  submitToIndexNow,
  checkPageHealth,
  generateContentSuggestions,
  sendDailyReport,
} = require('../_lib/seo-agent');

module.exports = async function handler(req, res) {
  // Allow both Vercel cron invocations and manual testing with CRON_SECRET
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const providedSecret = req.headers['x-cron-secret'] || req.query.secret;
  const expectedSecret = process.env.CRON_SECRET;
  const isAuthorized = isVercelCron || (expectedSecret && providedSecret === expectedSecret);

  if (!isAuthorized) {
    return res.status(401).json({ detail: 'Unauthorized — cron secret required' });
  }

  console.error('Daily SEO agent starting...');
  const startTime = Date.now();

  const results = {
    sitemap: { ok: false, message: 'Not run', data: null },
    ping: { ok: false, message: 'Not run', data: null },
    health: { ok: false, message: 'Not run', data: null },
    suggestions: { ok: false, message: 'Not run', data: null },
  };

  // 1. Generate sitemap
  try {
    const xml = generateSitemap();
    results.sitemap = {
      ok: true,
      message: `Generated sitemap with ${xml.match(/<url>/g)?.length || 0} URLs`,
      data: null,
    };
  } catch (err) {
    results.sitemap = { ok: false, message: `Sitemap generation failed: ${err.message}`, data: null };
  }

  // 2. Submit all URLs to IndexNow (Bing/Yandex/etc. — Google retired its
  // ping endpoint in 2023 and discovers via the sitemap in robots.txt)
  try {
    results.ping = await submitToIndexNow();
  } catch (err) {
    results.ping = { ok: false, message: `IndexNow submission failed: ${err.message}`, data: null };
  }

  // 3. Check page health
  try {
    results.health = await checkPageHealth();
  } catch (err) {
    results.health = { ok: false, message: `Page health check failed: ${err.message}`, data: null };
  }

  // 4. AI content suggestions (only if we have VAPRON_API_KEY)
  try {
    results.suggestions = await generateContentSuggestions();
  } catch (err) {
    results.suggestions = { ok: false, message: `AI suggestions failed: ${err.message}`, data: null };
  }

  // 5. Send daily report
  let reportSent = false;
  try {
    reportSent = await sendDailyReport(results);
  } catch (err) {
    console.error('Failed to send daily SEO report:', err.message);
  }

  const duration = Date.now() - startTime;
  console.error(`Daily SEO agent finished in ${duration}ms. Report sent: ${reportSent}`);

  return res.status(200).json({
    success: true,
    duration_ms: duration,
    report_sent: reportSent,
    results: {
      sitemap: results.sitemap.ok,
      ping: results.ping.ok,
      health: results.health.ok,
      suggestions: results.suggestions.ok,
    },
    health_data: results.health.data,
  });
};
