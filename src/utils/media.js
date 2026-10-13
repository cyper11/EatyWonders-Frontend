import { API_BASE_URL } from '../api/backend';

// Local fallback image. External placeholder hosts are blocked by the site's
// Content-Security-Policy (img-src), so fallbacks must be same-origin.
export const FALLBACK_IMAGE = '/GreenSimpleCleanVeganFoodLogo.png';

export function mediaUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
}

export function isVideo(url) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url || '');
}

// onError handler for <img>: swap to the fallback once, never loop.
export function handleImageError(e) {
  const img = e.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = '1';
  img.src = FALLBACK_IMAGE;
  img.classList.add('object-contain', 'p-6');
}
