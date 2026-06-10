/**
 * POST /api/chatbot/message
 * AI chatbot for customer questions about bookings and services.
 * Claude Haiku via the Vapron AI gateway — same as email support.
 */
const { aiComplete } = require('../_lib/vapron');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ detail: 'message is required' });
    }

    const reply = await aiComplete({
      maxTokens: 300,
      system: `You are the BookaRide NZ customer support chatbot. You help customers with:
- Booking airport transfers and private transfers in Auckland, NZ
- Pricing questions (direct them to bookaride.co.nz/book-now for exact quotes)
- Service area (Auckland, Hibiscus Coast, Hamilton, Tauranga, Whangarei)
- Payment methods (Credit/Debit Card via secure checkout)
- Operating hours (24/7 service available)
Keep replies concise (2-3 sentences max). Be friendly and professional.
NEVER make up specific prices — always direct to the booking form.
NEVER share other customers' information.`,
      messages: [{ role: 'user', content: message }],
    });

    if (!reply) {
      // Falls back to static responses when the AI gateway is
      // unconfigured or errors — same behaviour as before.
      return res.status(200).json({ reply: getStaticReply(message), source: 'static' });
    }

    return res.status(200).json({ reply, source: 'ai' });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    return res.status(200).json({ reply: getStaticReply(req.body?.message || ''), source: 'static' });
  }
};

function getStaticReply(message) {
  const lower = (message || '').toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    return 'For an exact quote, please use our booking form at bookaride.co.nz/book-now — prices are calculated based on your pickup and dropoff locations.';
  }
  if (lower.includes('book') || lower.includes('reserve')) {
    return 'You can book a transfer at bookaride.co.nz/book-now. Just enter your pickup and dropoff addresses and we will give you an instant quote!';
  }
  if (lower.includes('cancel')) {
    return 'To cancel or modify a booking, please email info@bookaride.co.nz with your booking reference number.';
  }
  if (lower.includes('airport')) {
    return 'We provide airport transfers to and from Auckland Airport (AKL). Book at bookaride.co.nz/book-now for an instant quote.';
  }
  return 'Thanks for reaching out! For bookings, visit bookaride.co.nz/book-now. For support, email info@bookaride.co.nz. We are happy to help!';
}
