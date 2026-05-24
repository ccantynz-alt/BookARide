/**
 * POST /api/validate-promo
 * Validate a promo/discount code.
 */
const { findOne } = require('./_lib/db');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, detail: 'Promo code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check database for promo codes
    const promo = await findOne('promo_codes', { code: normalizedCode });
    if (!promo) {
      return res.status(200).json({ valid: false, detail: 'Invalid promo code' });
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, detail: 'This promo code has expired' });
    }

    // Check usage limit
    if (promo.max_uses && promo.use_count >= promo.max_uses) {
      return res.status(200).json({ valid: false, detail: 'This promo code has been fully redeemed' });
    }

    // Check if active
    if (promo.active === false) {
      return res.status(200).json({ valid: false, detail: 'This promo code is no longer active' });
    }

    // Calculate discount amount based on subtotal from frontend
    const subtotal = parseFloat(req.body.subtotal) || 0;
    const discountType = promo.discount_type || 'percentage';
    const discountValue = parseFloat(promo.discount_value) || 0;
    let discountAmount = 0;
    if (subtotal > 0) {
      if (discountType === 'percentage') {
        discountAmount = Math.round(((subtotal * discountValue) / 100) * 100) / 100;
      } else if (discountType === 'fixed') {
        discountAmount = Math.min(discountValue, subtotal);
      }
    }

    return res.status(200).json({
      valid: true,
      code: normalizedCode,
      discount_type: discountType,
      discount_value: discountValue,
      discountAmount: discountAmount,
      description: promo.description || '',
    });
  } catch (err) {
    console.error('Promo validation error:', err.message);
    return res.status(500).json({ valid: false, detail: 'Error validating promo code' });
  }
};
