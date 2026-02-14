/**
 * API URL configuration with production fallback.
 * When REACT_APP_BACKEND_URL is not set, uses production Render backend
 * for bookaride.co.nz so Google auth and API calls work.
 */
const RENDER_BACKEND = 'https://bookaride-backend.onrender.com';

const getBackendUrl = () => {
  const env = process.env.REACT_APP_BACKEND_URL;
  if (env && env !== 'undefined') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || '';
    if (origin.includes('bookaride.co.nz')) {
      return RENDER_BACKEND;
    }
    // Local dev: use Render backend so API calls work without proxy
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return RENDER_BACKEND;
    }
    return origin;
  }
  return '';
};

export const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
