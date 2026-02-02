export interface LocationInfo {
  city: string;
  country: string;
}

/**
 * Fetches the city and country name for a given set of coordinates using Nominatim API.
 */
export async function fetchLocationFromCoords(lat: number, lng: number): Promise<LocationInfo> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'FrostRoom/1.0' // Nominatim requires a User-Agent
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }

    const data = await response.json();

    const address = data.address || {};
    const city = address.city || address.town || address.village || address.suburb || address.city_district || 'Unknown City';
    const country = address.country || 'Unknown Country';

    return { city, country };
  } catch (error) {
    console.error('Nominatim Geocoding Error:', error);
    return { city: 'Unknown City', country: 'Remote Territory' };
  }
}

/**
 * Backwards compatibility wrapper for fetchCountryFromCoords
 */
export async function fetchCountryFromCoords(lat: number, lng: number): Promise<string> {
  const { country } = await fetchLocationFromCoords(lat, lng);
  return country;
}
