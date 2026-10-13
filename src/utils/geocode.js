// Simple geocoding helper using OpenStreetMap Nominatim (free, no API key needed).
// Returns: { lat: number, lng: number }

const CAVITE_BOUNDS = {
  north: 14.60,
  south: 13.80,
  west: 120.50,
  east: 121.10,
};

function inCavite(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= CAVITE_BOUNDS.south &&
    lat <= CAVITE_BOUNDS.north &&
    lng >= CAVITE_BOUNDS.west &&
    lng <= CAVITE_BOUNDS.east
  );
}

function cleanAddress(addr) {
  let a = addr.trim();
  // Remove common noisy tokens (Block/Lot/Phase/etc.) to improve geocoding hit rate
  a = a.replace(/\b(Block|Blk|Lot|Lt|Phase|Ph|Unit|#)\b\s*\d+[A-Za-z-]?/gi, '').replace(/\s{2,}/g, ' ').trim();
  return a;
}

function buildAddressCandidates(address) {
  const base = address.trim();
  const cleaned = cleanAddress(base);
  const candidates = [base, cleaned];

  if (!/cavite/i.test(cleaned)) candidates.push(`${cleaned}, Cavite, Philippines`);
  else if (!/philippines/i.test(cleaned)) candidates.push(`${cleaned}, Philippines`);

  return Array.from(new Set(candidates.filter(Boolean)));
}

function pickOsmResult(results = []) {
  return results
    .map((result) => ({
      result,
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
      importance: Number(result.importance) || 0,
    }))
    .filter((entry) => inCavite(entry.lat, entry.lng))
    .sort((a, b) => b.importance - a.importance)[0] || null;
}

export async function geocodeAddress(address) {
  const query = address?.trim();
  if (!query) throw new Error('Address is required');

  const candidates = buildAddressCandidates(query);

  const tryOsm = async (q) => {
    const viewbox = `${CAVITE_BOUNDS.west},${CAVITE_BOUNDS.north},${CAVITE_BOUNDS.east},${CAVITE_BOUNDS.south}`;
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ph&bounded=1&viewbox=${encodeURIComponent(viewbox)}&limit=5&q=${encodeURIComponent(q)}`;
    const osmRes = await fetch(osmUrl, { headers: { 'Accept-Language': 'en' } });
    if (!osmRes.ok) throw new Error('Failed to geocode address');
    const osm = await osmRes.json();
    if (Array.isArray(osm) && osm.length) {
      const best = pickOsmResult(osm);
      if (!best) return null;
      return { lat: best.lat, lng: best.lng, formattedAddress: best.result?.display_name || q };
    }
    return null;
  };

  for (const candidate of candidates) {
    const osmHit = await tryOsm(candidate);
    if (osmHit) return osmHit;
  }

  throw new Error('Address not found');
}

// Reverse geocoding helper. Returns a human-readable address string or null if not found.
export async function reverseGeocode(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const tryOsm = async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
    try {
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.display_name || null;
    } catch {
      return null;
    }
  };

  return await tryOsm();
}
