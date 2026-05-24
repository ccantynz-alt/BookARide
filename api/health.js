/**
 * GET /api/health
 * Health check endpoint — reports which integrations are configured.
 * Replaces: Python backend GET /api/health
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const googleKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim();
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || '';

  return res.status(200).json({
    status: 'healthy',
    platform: 'vercel-serverless',
    timestamp: new Date().toISOString(),
    services: {
      google_maps: googleKey ? `${googleKey.substring(0, 8)}***` : 'NOT SET',
      stripe: stripeKey ? `${stripeKey.substring(0, 8)}***` : 'NOT SET',
      mailgun: process.env.MAILGUN_API_KEY ? 'configured' : 'NOT SET',
      database: process.env.DATABASE_URL ? 'configured' : 'NOT SET',
      twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'NOT SET',
    },
    hint: 'If any service shows NOT SET, add it in Vercel > Settings > Environment Variables',
  });
};
