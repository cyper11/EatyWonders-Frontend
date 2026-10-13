const THEME_STORAGE_KEY = 'theme';

export function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme() {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'dark' || value === 'light' ? value : null;
}

export function applyTheme(theme) {
  const resolved = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', resolved);
  
  // Apply 'dark' class for Tailwind CSS compatibility
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, resolved);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  return resolved;
}

export function getActiveTheme() {
  if (typeof document === 'undefined') return 'light';
  const value = document.documentElement.getAttribute('data-theme');
  return value === 'dark' ? 'dark' : 'light';
}

export function initTheme() {
  if (typeof document === 'undefined') return 'light';
  const stored = getStoredTheme();
  const initial = stored || getSystemTheme();
  return applyTheme(initial);
}

export function toggleTheme() {
  const next = getActiveTheme() === 'dark' ? 'light' : 'dark';
  return applyTheme(next);
}

