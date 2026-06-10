/**
 * Vapron platform client — Craig authorised 2026-06-10.
 *
 * Vapron provides email, cron triggering, the AI gateway, and OTP
 * verification for BookARide. Hosting stays on Vercel, payments stay
 * on Stripe, maps stay on Google Maps.
 *
 * All calls go to the tRPC API with a Bearer key. The key is the
 * rotated VAPRON_API_KEY set in the Vercel dashboard — never hardcode
 * a key in this repo.
 */

const VAPRON_BASE = 'https://api.vapron.ai/api/trpc';

/**
 * Call a Vapron tRPC procedure. Mutations are POSTs with a
 * { json: params } envelope; queries are GETs.
 * Returns { ok, status, data, error } and never throws.
 */
async function vapronCall(procedure, params = {}, { method = 'POST' } = {}) {
  const apiKey = (process.env.VAPRON_API_KEY || '').trim();
  if (!apiKey) {
    console.error(`CRITICAL: Vapron call '${procedure}' skipped — VAPRON_API_KEY not set in environment`);
    return { ok: false, status: 0, data: null, error: 'VAPRON_API_KEY not set' };
  }

  try {
    const url = `${VAPRON_BASE}/${procedure}`;
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };
    if (method === 'POST') {
      options.body = JSON.stringify({ json: params });
    }

    const res = await fetch(url, options);
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      const message = payload?.error?.json?.message || payload?.error?.message || `HTTP ${res.status}`;
      console.error(`CRITICAL: Vapron '${procedure}' failed: ${message}`);
      return { ok: false, status: res.status, data: null, error: message };
    }

    // tRPC responses wrap the result; unwrap both plain and superjson shapes
    const data = payload?.result?.data?.json ?? payload?.result?.data ?? payload;
    return { ok: true, status: res.status, data, error: null };
  } catch (err) {
    console.error(`CRITICAL: Vapron '${procedure}' threw: ${err.message}`);
    return { ok: false, status: 0, data: null, error: err.message };
  }
}

/**
 * Run an LLM completion through the Vapron AI gateway.
 * Same Claude Haiku model as before — only the transport changed.
 * Returns the reply text, or null on any failure so callers can fall
 * back to their static replies exactly as they did with the direct API.
 */
async function aiComplete({ system, messages, maxTokens = 500, model = 'claude-haiku-4-5-20251001' }) {
  const params = { model, messages, max_tokens: maxTokens };
  if (system) params.system = system;

  const result = await vapronCall('aiGateway.complete', params);
  if (!result.ok) return null;

  const d = result.data;
  const text =
    d?.content?.[0]?.text ?? // Anthropic-style response
    d?.choices?.[0]?.message?.content ?? // OpenAI-style response
    d?.text ??
    d?.completion ??
    (typeof d === 'string' ? d : null);

  if (!text || typeof text !== 'string') {
    console.error(`CRITICAL: Vapron AI gateway returned an unrecognised response shape: ${JSON.stringify(d).slice(0, 300)}`);
    return null;
  }
  return text.trim();
}

module.exports = { vapronCall, aiComplete };
