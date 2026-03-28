/**
 * API URL configuration.
 * Both frontend and backend are deployed on Vercel.
 * The backend runs as Vercel Serverless Functions at /api/*.
 * For local development, use REACT_APP_BACKEND_URL to override.
 */

const getBackendUrl = () => {
  const env = process.env.REACT_APP_BACKEND_URL;
  if (env && env !== 'undefined') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }
  // In production on Vercel, the backend is on the same domain.
  // API calls go to /api/* which Vercel routes to the Python serverless function.
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export const BACKEND_URL = getBackendUrl();
export const RENDER_BACKEND_URL = BACKEND_URL; // Legacy alias — kept for backward compatibility
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
