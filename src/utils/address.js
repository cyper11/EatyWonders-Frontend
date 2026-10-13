// Helpers to present listing addresses cleanly. Display-only: stored data is untouched.

// Cavite's cities and municipalities.
export const CAVITE_TOWNS = [
  'Alfonso', 'Amadeo', 'Bacoor', 'Carmona', 'Cavite City', 'Dasmariñas', 'General Emilio Aguinaldo',
  'General Mariano Alvarez', 'General Trias', 'Imus', 'Indang', 'Kawit', 'Magallanes', 'Maragondon',
  'Mendez', 'Naic', 'Noveleta', 'Rosario', 'Silang', 'Tagaytay', 'Tanza', 'Ternate', 'Trece Martires',
];

export const normalizeText = (v) =>
  String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Google "plus codes" such as "7WR6+3QV" (optionally followed by a comma).
const PLUS_CODE = /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}\b,?/gi;

/**
 * "7WR6+3QV, 304 Crisanto M. De Los Reyes Ave, General Trias, Philippines, 4107"
 *  -> "304 Crisanto M. De Los Reyes Ave, General Trias"
 */
export function cleanAddress(address) {
  if (!address) return '';
  let s = String(address)
    .replace(PLUS_CODE, '')
    .replace(/\bPhilippines\b/gi, '')
    .replace(/\b\d{4}\b(?=\s*(,|$|Cavite\b))/g, ''); // 4-digit PH postal codes

  const seen = new Set();
  const parts = s
    .split(',')
    .map((p) => p.replace(/\s{2,}/g, ' ').trim())
    .filter((p) => {
      if (!p) return false;
      const key = normalizeText(p);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return parts.join(', ');
}

/** The Cavite town named in an address, e.g. "General Trias", or '' if none. */
export function townFromAddress(address) {
  const a = normalizeText(address);
  if (!a) return '';
  return CAVITE_TOWNS.find((t) => a.includes(normalizeText(t))) || '';
}
