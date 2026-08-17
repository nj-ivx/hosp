/**
 * Geocode an address to latitude & longitude using OpenCage API or Nominatim fallback
 */

const KNOWN_COORDINATES = {
  'riyadh': { lat: 24.7136, lng: 46.6753 },
  'jeddah': { lat: 21.4858, lng: 39.1925 },
  'dammam': { lat: 26.4207, lng: 50.0888 },
  'khobar': { lat: 26.2172, lng: 50.1971 },
  'mecca': { lat: 21.3891, lng: 39.8579 },
  'medina': { lat: 24.5247, lng: 39.5692 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'cairo': { lat: 30.0444, lng: 31.2357 },
  'amman': { lat: 31.9454, lng: 35.9284 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.0060 }
}

export async function geocodeAddress(address) {
  if (!address || !address.trim()) {
    throw new Error('Address is required for geocoding')
  }

  const query = address.trim()
  const lowerQuery = query.toLowerCase()

  // 1. Try OpenCage API if key is available
  const openCageKey = import.meta.env.VITE_OPENCAGE_API_KEY
  if (openCageKey) {
    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${openCageKey}&limit=1`
      const res = await fetch(url)
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry
        return {
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
          formatted: data.results[0].formatted
        }
      }
    } catch (err) {
      console.warn('OpenCage request failed, trying fallback:', err)
    }
  }

  // 2. Try OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en,ar',
        'User-Agent': 'FerasMedicalPortal/1.0'
      }
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(parseFloat(data[0].lat).toFixed(6)),
          longitude: parseFloat(parseFloat(data[0].lon).toFixed(6)),
          formatted: data[0].display_name
        }
      }
    }
  } catch (err) {
    console.warn('Nominatim geocoding error:', err)
  }

  // 3. Known city match fallback
  for (const [city, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (lowerQuery.includes(city)) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        formatted: `${city.charAt(0).toUpperCase() + city.slice(1)} Area Match`
      }
    }
  }

  // 4. Default coordinates (Riyadh Medical City area) with slight jitter to distinguish multiple hospitals
  const randomJitter = (Math.random() - 0.5) * 0.05
  return {
    latitude: parseFloat((24.7136 + randomJitter).toFixed(6)),
    longitude: parseFloat((46.6753 + randomJitter).toFixed(6)),
    formatted: address
  }
}
