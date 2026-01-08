
/**
 * Fetches the country name for a given set of coordinates using a client-side friendly API.
 * BigDataCloud's Reverse Geocoding API is used here as it handles browser-based
 * CORS requests more reliably than Nominatim without requiring forbidden headers.
 */
export async function fetchCountryFromCoords(lat: number, lng: number): Promise<string> {
  try {
    // BigDataCloud provides a free, no-key-required client-side reverse geocoding service.
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }

    const data = await response.json();
    
    // The API returns countryName directly in the root object.
    if (data.countryName) {
      return data.countryName;
    }
    
    // Fallback for bodies of water or remote areas where countryName might be empty
    if (data.localityInfo && data.localityInfo.informative) {
      const ocean = data.localityInfo.informative.find((i: any) => i.name.toLowerCase().includes('ocean'));
      if (ocean) return 'International Waters';
    }

    return 'Unknown Region';
  } catch (error) {
    console.error('Deterministic Geocoding Error:', error);
    // If we fail, we return a fallback to prevent the app from appearing broken.
    // 'Remote Territory' is a poetic way of saying the location couldn't be resolved.
    return 'Remote Territory';
  }
}
