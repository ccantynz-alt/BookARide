/**
 * GET /api/sitemap.xml
 *
 * Serves the dynamically-generated sitemap with TODAY's lastmod date for
 * every URL in TRACKED_PAGES. The daily SEO cron used to generate this
 * string and throw it away — now it's actually served, signalling
 * freshness to Google every time it crawls.
 *
 * Vercel rewrite (/sitemap.xml -> /api/sitemap.xml) means the sitemap
 * lives at the standard /sitemap.xml URL even though it's served by
 * this serverless function.
 */
const { generateSitemap } = require('./_lib/seo-agent');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const xml = generateSitemap();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Cache for 1 hour at the edge so we don't regenerate on every crawl.
    // Google typically checks sitemaps at most a few times per day.
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('CRITICAL: sitemap.xml generation failed:', err.message);
    return res.status(500).json({ detail: `Sitemap generation failed: ${err.message}` });
  }
};
