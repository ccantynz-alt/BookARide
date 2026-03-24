/**
 * POST /api/chatbot/message
 * AI chatbot for customer questions about bookings and services.
 * Uses Claude API (Haiku) — same as email support.
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ detail: 'message is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback to static responses when Claude API not configured
      return res.status(200).json({
        reply: getStaticReply(message),
        source: 'static',
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
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
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return res.status(200).json({ reply: getStaticReply(message), source: 'static' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || getStaticReply(message);

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
    return 'To cancel or modify a booking, please email support@bookaride.co.nz with your booking reference number.';
  }
  if (lower.includes('airport')) {
    return 'We provide airport transfers to and from Auckland Airport (AKL). Book at bookaride.co.nz/book-now for an instant quote.';
  }
  return 'Thanks for reaching out! For bookings, visit bookaride.co.nz/book-now. For support, email support@bookaride.co.nz. We are happy to help!';
}
