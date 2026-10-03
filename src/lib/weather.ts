// Open-Meteo forecast (free, no key, non-commercial). Swap for ECCC GeoMet
// before a commercial launch; see docs/PLAN.md §2.3.

export type DayForecast = {
  date: string
  tMin: number
  tMax: number
  precipMm: number
  gustKmh: number
  weatherCode: number
}

export type ColorOutlook = 'vivid' | 'leaf-drop' | 'frost' | 'neutral'

export async function fetchForecast(lat: number, lng: number): Promise<DayForecast[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum,wind_gusts_10m_max,weather_code',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const { daily: d } = await res.json()
  return (d.time as string[]).map((date, i) => ({
    date,
    tMin: d.temperature_2m_min[i],
    tMax: d.temperature_2m_max[i],
    precipMm: d.precipitation_sum[i],
    gustKmh: d.wind_gusts_10m_max[i],
    weatherCode: d.weather_code[i],
  }))
}

/**
 * Rule of thumb: cool (not freezing) nights plus dry, mild days give the
 * brightest reds; strong wind or heavy rain strips leaves; a hard frost dulls them.
 */
export function colorOutlook(day: DayForecast): ColorOutlook {
  if (day.gustKmh >= 50 || day.precipMm >= 15) return 'leaf-drop'
  if (day.tMin <= -2) return 'frost'
  if (day.tMin > 0 && day.tMin <= 8 && day.tMax >= 12 && day.precipMm < 2) return 'vivid'
  return 'neutral'
}

export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 67 || (code >= 80 && code <= 82)) return '🌧️'
  if (code <= 77 || code === 85 || code === 86) return '🌨️'
  return '⛈️'
}
