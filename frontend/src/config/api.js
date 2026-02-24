/**
 * API URL configuration with production fallback.
 * One booking form for all domains: bookaride.co.nz, airportshuttleservice.co.nz,
 * hibiscustoairport.co.nz, aucklandshuttles.co.nz, bookaridenz.com.
 * All use the same Render backend so the same form works everywhere.
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
  const env = process.env.REACT_APP_BACKEND_URL;
  if (env && env !== 'undefined') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || '';
    if (isPartnerOrigin(origin)) {
      return RENDER_BACKEND;
    }
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return RENDER_BACKEND;
    }
    return origin;
  }
  return '';
};

export const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
