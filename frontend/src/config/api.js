/**
 * API URL configuration.
 *
 * VERCEL SERVERLESS MODE (REACT_APP_API_MODE=local):
 *   All /api/* calls go to same-origin Vercel serverless functions.
 *   No separate backend needed — everything runs on one Vercel project.
 *
 * LEGACY MODE (default, for backward compatibility during transition):
 *   All /api/* calls go to the Render backend.
 *
 * Set REACT_APP_API_MODE=local in Vercel environment variables to switch.
 * Set REACT_APP_BACKEND_URL to override with a specific URL.
 */
const RENDER_BACKEND = 'https://bookaride-backend.onrender.com';

const PARTNER_ORIGINS = [
  'bookaride.co.nz',
  'airportshuttleservice.co.nz',
  'hibiscustoairport.co.nz',
  'aucklandshuttles.co.nz',
  'bookaridenz.com'
];

const isPartnerOrigin = (origin) =>
  PARTNER_ORIGINS.some((d) => origin.includes(d));

const getBackendUrl = () => {
  // Serverless mode: API routes are on the same Vercel domain
  if (import.meta.env.VITE_API_MODE === 'local') {
    return ''; // Empty = same origin, /api/* goes to Vercel serverless
  }

  // Explicit override
  const env = import.meta.env.VITE_BACKEND_URL;
  if (env && env !== 'undefined') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }

  // Auto-detect: partner domains and localhost use Render backend
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || '';
    if (isPartnerOrigin(origin)) return RENDER_BACKEND;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return RENDER_BACKEND;
    // Vercel preview deployments: use same-origin if API functions exist
    if (origin.includes('vercel.app')) return '';
    return origin;
  }
  return '';
};

export const RENDER_BACKEND_URL = RENDER_BACKEND;
export const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
