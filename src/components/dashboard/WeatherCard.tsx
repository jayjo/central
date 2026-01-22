'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface WeatherData {
  temp: number
  condition: string
  description: string
  icon: string
  city: string
}

export function WeatherCard({ zipCode }: { zipCode?: string | null }) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!zipCode) {
      setLoading(false)
      return
    }

    fetch(`/api/weather?zipCode=${zipCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error('Weather API error:', data.error)
          setError(data.error)
        } else {
          setWeather(data)
        }
      })
      .catch((err) => {
        console.error('Weather fetch error:', err)
        setError(err.message || 'Failed to load weather')
      })
      .finally(() => setLoading(false))
  }, [zipCode])

  if (!zipCode) {
    return (
      <Card className="justify-start">
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add your zip code in settings to see weather
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="justify-start">
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card className="justify-start">
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || 'Unable to load weather'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="justify-between">
      <CardHeader>
        <CardTitle>Weather</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {weather.icon && (
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.condition}
              className="w-16 h-16"
              onError={(e) => {
                // Hide icon if it fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div>
            <div className="text-3xl font-bold">{weather.temp}°F</div>
            <div className="text-sm text-muted-foreground capitalize">
              {weather.description}
            </div>
            <div className="text-sm text-muted-foreground">{weather.city}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
