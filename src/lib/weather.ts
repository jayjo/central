export interface WeatherData {
  temp: number
  condition: string
  description: string
  icon: string
  city: string
}

// Convert zip code to latitude/longitude using Open-Meteo geocoding
async function getCoordinatesFromZip(zipCode: string): Promise<{ latitude: number; longitude: number; city: string }> {
  // First, try to geocode the zip code
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zipCode)}&count=1&language=en&format=json`
  
  const geocodeResponse = await fetch(geocodeUrl)
  const geocodeData = await geocodeResponse.json()

  if (geocodeData.results && geocodeData.results.length > 0) {
    const result = geocodeData.results[0]
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.name || zipCode,
    }
  }

  // Fallback: Try with US zip code format
  const usGeocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zipCode + ', US')}&count=1&language=en&format=json`
  const usGeocodeResponse = await fetch(usGeocodeUrl)
  const usGeocodeData = await usGeocodeResponse.json()

  if (usGeocodeData.results && usGeocodeData.results.length > 0) {
    const result = usGeocodeData.results[0]
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.name || zipCode,
    }
  }

  throw new Error(`Could not find location for zip code: ${zipCode}`)
}

// Map weather codes to conditions (WMO Weather interpretation codes)
// Reference: https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
function getWeatherCondition(code: number): { condition: string; description: string; icon: string } {
  // Clear sky
  if (code === 0) return { condition: 'Clear', description: 'Clear sky', icon: '01d' }
  
  // Mainly clear, partly cloudy, overcast
  if (code === 1) return { condition: 'Clear', description: 'Mainly clear', icon: '01d' }
  if (code === 2) return { condition: 'Clouds', description: 'Partly cloudy', icon: '02d' }
  if (code === 3) return { condition: 'Clouds', description: 'Overcast', icon: '04d' }
  
  // Fog
  if (code >= 45 && code <= 48) return { condition: 'Fog', description: 'Foggy', icon: '50d' }
  
  // Drizzle
  if (code >= 51 && code <= 57) return { condition: 'Rain', description: 'Drizzle', icon: '09d' }
  
  // Rain
  if (code >= 61 && code <= 67) return { condition: 'Rain', description: 'Rainy', icon: '10d' }
  
  // Snow
  if (code >= 71 && code <= 77) return { condition: 'Snow', description: 'Snowy', icon: '13d' }
  
  // Rain showers
  if (code >= 80 && code <= 82) return { condition: 'Rain', description: 'Rain showers', icon: '09d' }
  
  // Snow showers
  if (code >= 85 && code <= 86) return { condition: 'Snow', description: 'Snow showers', icon: '13d' }
  
  // Thunderstorm
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' }
  
  // Default
  return { condition: 'Clouds', description: 'Cloudy', icon: '03d' }
}

export async function getWeather(zipCode: string): Promise<WeatherData> {
  try {
    // Get coordinates from zip code
    const { latitude, longitude, city } = await getCoordinatesFromZip(zipCode)

    // Get current weather from Open-Meteo
    // Using current_weather for simple current conditions
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`
    
    const response = await fetch(weatherUrl)
    const data = await response.json()

    if (!response.ok || data.error) {
      throw new Error(data.reason || 'Failed to fetch weather data')
    }

    const current = data.current
    const weatherInfo = getWeatherCondition(current.weather_code)

    return {
      temp: Math.round(current.temperature_2m),
      condition: weatherInfo.condition,
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      city: city,
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch weather')
  }
}
