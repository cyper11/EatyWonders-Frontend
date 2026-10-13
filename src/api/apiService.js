import api from './backend';

/**
 * Fetches places data based on map bounds and type
 * @param {string} type - Type of place (e.g., 'restaurants')
 * @param {Object} sw - Southwest corner of bounds {lat, lng}
 * @param {Object} ne - Northeast corner of bounds {lat, lng}
 * @returns {Promise<Array>} Array of places data
 */
export const getPlacesData = async (type, sw, ne) => {
  try {
    if (!sw || !ne || typeof sw.lat !== 'number' || typeof sw.lng !== 'number') {
      console.warn('Invalid bounds provided to getPlacesData');
      return [];
    }

    // Calculate center point from bounds
    const lat = (sw.lat + ne.lat) / 2;
    const lng = (sw.lng + ne.lng) / 2;

    // Calculate approximate radius in meters from bounds
    // Using rough estimation: 1 degree of latitude ≈ 111 km
    const latDiff = Math.abs(ne.lat - sw.lat);
    const lngDiff = Math.abs(ne.lng - sw.lng);
    const radius = Math.max(latDiff, lngDiff) * 111000 / 2; // Convert to meters

    const response = await api.get('/api/places', {
      params: {
        type: type || 'restaurants',
        lat,
        lng,
        radius: Math.max(1500, Math.min(radius, 50000)) // Clamp between 1.5km and 50km
      }
    });

    // Return the data array from the response
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching places data:', error);
    return [];
  }
};
