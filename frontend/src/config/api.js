/**
 * API URL configuration.
 *
 * STAGING (frontend-only): API is served from /api on the same Vercel domain.
 * PRODUCTION (legacy): API is served from the Render backend.
 *
 * Set REACT_APP_API_MODE=local to use same-origin /api routes (serverless).
 * Set REACT_APP_BACKEND_URL to override with a specific backend URL.
 * Default: uses Render backend for backward compatibility.
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
  // Serverless mode: API routes are on the same domain
  if (process.env.REACT_APP_API_MODE === 'local') {
    return ''; // Empty string = same origin, so /api/... goes to same domain
  }

  const env = process.env.REACT_APP_BACKEND_URL;
  if (env && env !== 'undefined') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || '';
    if (isPartnerOrigin(origin)) return RENDER_BACKEND;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return RENDER_BACKEND;
    if (origin.includes('vercel.app')) return RENDER_BACKEND;
    return origin;
  }
  return '';
};

export const RENDER_BACKEND_URL = RENDER_BACKEND;
export const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
