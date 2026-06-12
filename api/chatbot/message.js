/**
 * POST /api/chatbot/message
 * AI chatbot for customer questions about bookings and services.
 * Claude Haiku via the Vapron AI gateway — same as email support.
 */
const { aiComplete } = require('../_lib/vapron');
const { getDb, insertOne } = require('../_lib/db');

// Ensure the chatbot_logs table exists. Memoised so the DDL runs at most
// once per warm serverless instance. CREATE TABLE IF NOT EXISTS is cheap
// and idempotent, so the rate limit works without manual database setup.
let tableReady = null;
function ensureChatbotTable() {
  if (!tableReady) {
    const sql = getDb();
    tableReady = sql(
      `CREATE TABLE IF NOT EXISTS chatbot_logs (
         id TEXT PRIMARY KEY,
         data JSONB NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    ).catch(err => {
      tableReady = null; // allow a retry next invocation
      throw err;
    });
  }
  return tableReady;
}

// Rate limit: max 20 AI messages per session per hour (CLAUDE.md section 12).
// Backed by the chatbot_logs table so it survives serverless cold starts.
// Falls open (allows the message) if the check itself errors — we never
// want a logging hiccup to break customer support.
async function isRateLimited(sessionKey) {
  if (!sessionKey) return false;
  try {
    await ensureChatbotTable();
    const sql = getDb();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const rows = await sql(
      `SELECT COUNT(*) as cnt FROM chatbot_logs WHERE data->>'session' = $1 AND created_at >= $2`,
      [sessionKey, since]
    );
    return parseInt(rows[0]?.cnt || '0', 10) >= 20;
  } catch (err) {
    console.error('Chatbot rate-limit check failed (allowing message):', err.message);
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { message, sessionId } = req.body || {};
    if (!message) {
      return res.status(400).json({ detail: 'message is required' });
    }

    // Key the limit on the client session, falling back to caller IP.
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const sessionKey = String(sessionId || ip);

    if (await isRateLimited(sessionKey)) {
      return res.status(200).json({
        reply: 'You have sent a lot of messages in a short time. Please email info@bookaride.co.nz or call 021 743 321 and our team will help you directly.',
        source: 'rate-limited',
      });
    }

    // Record this message for the rolling-hour window (best effort).
    await insertOne('chatbot_logs', {
      id: require('crypto').randomUUID(),
      session: sessionKey,
      message: String(message).slice(0, 500),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Chatbot log insert failed (continuing):', err.message));

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
