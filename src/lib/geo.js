/**
 * Calculate Haversine distance between two coordinates in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined ||
      lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) {
    return null
  }

  const nLat1 = parseFloat(lat1)
  const nLon1 = parseFloat(lon1)
  const nLat2 = parseFloat(lat2)
  const nLon2 = parseFloat(lon2)

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return null
  }

  const R = 6371 // Earth radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // rounded to 1 decimal place
}

/**
 * Get current user GPS location via browser API
 */
export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        coords: { latitude: 24.7136, longitude: 46.6753 }, // Riyadh fallback
        isDefault: true,
        error: 'Geolocation is not supported by your browser.'
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          isDefault: false,
          error: null
        })
      },
      (err) => {
        console.warn('Geolocation warning:', err.message)
        resolve({
          coords: { latitude: 24.7136, longitude: 46.6753 },
          isDefault: true,
          error: err.message
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}
