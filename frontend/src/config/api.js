/**
 * API URL configuration.
 * One booking form for all domains: bookaride.co.nz, airportshuttleservice.co.nz,
 * hibiscustoairport.co.nz, aucklandshuttles.co.nz, bookaridenz.com.
 * All use the same backend at api.bookaride.co.nz.
 */
const BACKEND = 'https://api.bookaride.co.nz';

const getBackendUrl = () => {
  const env = process.env.REACT_APP_BACKEND_URL;
  if (env && env !== 'undefined') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }
  return BACKEND;
};

export const RENDER_BACKEND_URL = BACKEND;
export const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
