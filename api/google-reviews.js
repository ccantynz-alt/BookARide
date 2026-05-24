/**
 * GET /api/google-reviews
 * Return cached Google reviews for display on the website.
 */
const { findOne } = require('./_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    // Check for cached reviews in database
    const cached = await findOne('cache', { key: 'google_reviews' });
    if (cached && cached.reviews) {
      return res.status(200).json({
        reviews: cached.reviews,
        rating: cached.rating || 5.0,
        total_reviews: cached.total_reviews || cached.reviews.length,
        cached: true,
      });
    }

    // No cached reviews — return empty
    return res.status(200).json({
      reviews: [],
      rating: 5.0,
      total_reviews: 0,
      cached: false,
    });
  } catch (err) {
    console.error('Google reviews error:', err.message);
    return res.status(200).json({ reviews: [], rating: 5.0, total_reviews: 0 });
  }
};
