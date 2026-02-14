/**
 * API URL configuration with production fallback.
 * When REACT_APP_BACKEND_URL is not set (e.g. in Vercel), uses current origin
 * so API calls go to same domain (e.g. https://www.bookaride.co.nz/api).
 */
const getBackendUrl = () => {
  const env = process.env.REACT_APP_BACKEND_URL;
  if (env && env !== 'undefined') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
