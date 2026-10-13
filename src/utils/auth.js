// Simple auth helpers using localStorage
// SECURITY NOTE: JWT tokens are now stored in HttpOnly cookies (server-side)
// localStorage only stores non-sensitive user metadata for UI display

const TOKEN_KEY = 'tg_token'; // Legacy support - will be phased out
const USER_KEY = 'tg_user';

export const setAuth = (token, user) => {
  // Token is now in HttpOnly cookie (handled by server)
  // Only store user metadata in localStorage for UI display
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Keep legacy/manual token support for admin impersonation flow
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('token', token);
  } else {
    // If no token provided (cookie-based auth), clear legacy tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
  }
};

export const getToken = () => {
  // Legacy support: return token from localStorage if exists
  // Primary auth is now via HttpOnly cookie (handled automatically by browser)
  return localStorage.getItem('token') || localStorage.getItem(TOKEN_KEY) || '';
};

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('admin_backup_token');
  localStorage.removeItem(USER_KEY);
};

export const isOwner = () => (getUser()?.role === 'owner');
export const isAdmin = () => (getUser()?.role === 'admin');
