import { colorOutlook, type DayForecast } from './weather'
import { distanceKm } from './location'
import { isListed, type ParkReport } from './ontarioParks'
import type { Stage } from './stage'

// "Best right now" and "Best this weekend": the parks with a fall color report, ranked by how
// good the color is, what the weather will do on the days in question and, once the person has
// been located, how far away each one is. Every park carries the reasons for its place, so the
// list explains itself: the stage as a badge, then "Dry Saturday and Sunday" and, once
// located, the distance.

export type When = 'now' | 'weekend'

/** How much each stage is worth on its own. Past peak still has color; patchy has some. */
const STAGE_WORTH: Record<Stage, number> = { peak: 1, near: 0.82, past: 0.45, patchy: 0.35, green: 0.1, bare: 0 }

/** A report older than this counts for less, and says so. */
const STALE_DAYS = 10

export type Ranked = { park: ParkReport; score: number; reasons: string[]; km: number | null }

/** The days a list is about, as YYYY-MM-DD in Ontario time, with their names. */
export function daysFor(when: When, now = new Date()): { date: string; name: string; short: string }[] {
  const local = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }))
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const plus = (n: number) => {
    const d = new Date(local)
    d.setDate(d.getDate() + n)
    return d
  }
  const day = (date: Date, name: string, short = name) => ({ date: iso(date), name, short })
  if (when === 'now') return [day(local, 'today'), day(plus(1), 'tomorrow')]
  const dow = local.getDay() // 0 Sunday … 6 Saturday
  if (dow === 0) return [day(local, 'today')]
  const toSat = 6 - dow
  return toSat === 0 ? [day(local, 'today'), day(plus(1), 'tomorrow')] : [day(plus(toSat), 'Saturday', 'Sat'), day(plus(toSat + 1), 'Sunday', 'Sun')]
}

/** Parks per forecast request. Open-Meteo works through the places in a request one after another
 * (about half a second each), so 46 in one request took over 20 seconds; batches run side by side. */
const BATCH = 8

async function fetchBatch(points: { lat: number; lng: number }[]): Promise<DayForecast[][]> {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(3)).join(','),
    longitude: points.map((p) => p.lng.toFixed(3)).join(','),
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum,wind_gusts_10m_max,weather_code',
    timezone: 'America/Toronto',
    forecast_days: '7',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const json = await res.json()
  return (Array.isArray(json) ? json : [json]).map(({ daily: d }) =>
    (d.time as string[]).map((date, i) => ({
      date,
      tMin: d.temperature_2m_min[i],
      tMax: d.temperature_2m_max[i],
      precipMm: d.precipitation_sum[i],
      gustKmh: d.wind_gusts_10m_max[i],
      weatherCode: d.weather_code[i],
    })),
  )
}

/**
 * One forecast per point (empty where its batch failed), in batches fetched side by side.
 * Fails only if every batch does.
 */
export async function fetchForecasts(points: { lat: number; lng: number }[]): Promise<DayForecast[][]> {
  if (!points.length) return []
  const batches = Array.from({ length: Math.ceil(points.length / BATCH) }, (_, i) => points.slice(i * BATCH, (i + 1) * BATCH))
  const results = await Promise.allSettled(batches.map(fetchBatch))
  if (results.every((r) => r.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason
  return results.flatMap((r, i) => (r.status === 'fulfilled' ? r.value : batches[i].map(() => [])))
}

type DayCall = { word: string; worth: number }

/** What a day's weather means for a visit and for the leaves. */
function judge(day: DayForecast): DayCall {
  if (colorOutlook(day) === 'leaf-drop') return { word: day.gustKmh >= 50 ? 'windy' : 'heavy rain', worth: 0.25 }
  if (day.precipMm >= 5) return { word: 'rain', worth: 0.5 }
  if (day.precipMm >= 1) return { word: 'showers', worth: 0.75 }
  if (day.tMin <= -2) return { word: 'frost', worth: 0.8 }
  return { word: 'dry', worth: 1 }
}

/** Short enough for a phone row: "dry all weekend", "rain Sat, dry Sun", "dry today, showers tomorrow". */
function weatherPhrase(calls: (DayCall & { name: string; short: string })[], when: When): string {
  if (calls.every((c) => c.word === calls[0].word)) {
    if (when === 'weekend' && calls.length > 1) return `${calls[0].word} all weekend`
    return `${calls[0].word} ${calls.map((c) => c.short).join(' and ')}`
  }
  return calls.map((c) => `${c.word} ${c.short}`).join(', ')
}

/** How much nearer is better: no change within 60 km, then less and less, to a floor of 0.3 by about 410 km. */
const nearness = (km: number) => (km <= 60 ? 1 : Math.max(0.3, 1 - (km - 60) / 500))

export function rankParks(
  parks: ParkReport[],
  forecasts: Map<string, DayForecast[]> | null,
  when: When,
  here: { lat: number; lng: number } | null,
  now = new Date(),
): Ranked[] {
  const days = daysFor(when, now)
  return parks
    .filter((p) => p.report && isListed(p))
    .map((park) => {
      // The stage shows as the row's badge, so the reasons start with the weather.
      const reasons: string[] = []
      let score = STAGE_WORTH[park.stage] + (park.colorChange ?? 0) / 1000

      const age = park.reportedAt ? Math.floor((now.getTime() - new Date(park.reportedAt).getTime()) / 86_400_000) : null
      if (age != null && age > STALE_DAYS) {
        score *= 0.8
        reasons.push(`report ${age} days old`)
      }

      const forecast = forecasts?.get(park.id)
      const calls = days.flatMap((d) => {
        const f = forecast?.find((x) => x.date === d.date)
        return f ? [{ ...judge(f), name: d.name, short: d.short }] : []
      })
      if (calls.length) {
        score *= calls.reduce((s, c) => s + c.worth, 0) / calls.length
        const phrase = weatherPhrase(calls, when)
        reasons.unshift(phrase[0].toUpperCase() + phrase.slice(1))
      }

      const km = here ? distanceKm(here.lat, here.lng, park.lat, park.lng) : null
      // The distance itself is shown by the list row, after these reasons.
      if (km != null) score *= nearness(km)
      return { park, score, reasons, km }
    })
    .sort((a, b) => b.score - a.score)
}
