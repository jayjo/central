export interface WeatherData {
  temp: number
  condition: string
  description: string
  icon: string
  city: string
}

export async function getWeather(zipCode: string): Promise<WeatherData> {
  const API_KEY = process.env.OPENWEATHER_API_KEY
  if (!API_KEY) {
    throw new Error('OPENWEATHER_API_KEY not configured')
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zipCode},us&appid=${API_KEY}&units=imperial`

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Weather fetch failed')
  }

  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    city: data.name,
  }
}
