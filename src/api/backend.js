import axios from 'axios';
import { getToken } from '../utils/auth';

// Hardening: Ensure cookies are sent with all requests globally.
// sameSite: 'none' and credentials: true are mandatory for cross-domain cookies
// (e.g., when the frontend is on Cloudflare Pages and the backend is on Render).
axios.defaults.withCredentials = true;

// Sanitize the base URL: remove trailing slashes and ensure proper format.
//
// ⚠️  CRITICAL: The fallback must NEVER resolve to window.location.origin.
//     If it did, api.post('/auth/login') would hit the *frontend* host
//     (e.g., eatywonders.com/auth/login), which has no such route — causing
//     the browser to execute a hard navigation instead of a silent XHR.
const getBaseUrl = () => {
  // 1. Prioritize explicitly defined API URL from .env / Cloudflare Pages env var
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }

  // 2. Local dev shortcut: React on :3000 → Express on :4000
  const origin = window.location.origin;
  if (origin.includes('localhost:3000') || origin.includes('127.0.0.1:3000')) {
    return origin.replace(':3000', ':4000');
  }

  // 3. REACT_APP_API_URL is required in all non-localhost environments.
  //    Returning the frontend origin here would silently break ALL API calls
  //    by routing them back to the React host. Fail loudly instead.
  console.error(
    '[API] REACT_APP_API_URL is not defined. ' +
    'All API requests will fail. ' +
    'Set this variable in your Cloudflare Pages environment settings ' +
    'and redeploy. Expected value: https://eaty-api.onrender.com'
  );
  return ''; // Empty baseURL → Axios throws a Network Error immediately, visible in DevTools
};

export const API_BASE_URL = getBaseUrl();

// Mapbox Token: Fetched from .env (local) or Cloud Provider (Railway/Vercel)
export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Security: Enable cookies for HttpOnly JWT storage
});

// Attach Bearer token if present (legacy support + cookie fallback)
// Cookies are sent automatically; this provides fallback for legacy tokens
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Dual-Identity Pattern: Inject impersonation header if active
  const impersonatedId = localStorage.getItem('impersonatedUserId');
  if (impersonatedId) {
    config.headers = config.headers || {};
    config.headers['x-impersonate-user-id'] = impersonatedId;
  }

  return config;
});

// Global error interceptor for production debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Maintenance Mode Detection: Intercept 503 errors and check for maintenance flag
    if (error?.response?.status === 503 && error?.response?.data?.maintenance === true && typeof window !== 'undefined') {
      const path = window.location.pathname;
      
      // Feature Fix: Do not redirect if we are already on an admin-related page
      // This allows admins to stay in the dashboard or login gateway even if APIs return 503
      if (path.startsWith('/admin') || path.startsWith('/admin-gateway-secure')) {
        console.warn('[Maintenance] 503 received on admin path, skipping redirect');
        return Promise.reject(error);
      }

      if (path !== '/maintenance') {
        window.location.assign('/maintenance');
      }
    }

    const isConnectivityError = !error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error';
    if (isConnectivityError) {
      console.error('API Connectivity Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
