import { NextRequest, NextResponse } from 'next/server'
import { getWeather } from '@/lib/weather'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const zipCode = searchParams.get('zipCode')

  if (!zipCode) {
    return NextResponse.json({ error: 'Zip code required' }, { status: 400 })
  }

  try {
    const weather = await getWeather(zipCode)
    return NextResponse.json(weather)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weather' },
      { status: 500 }
    )
  }
}
