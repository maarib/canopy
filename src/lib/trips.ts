import { useSyncExternalStore } from 'react'

// Trips: saved regions, parks, trails and places, organised by day. Stored on the device
// (localStorage) so they work without an account; shared as a self-contained link.

export type StopRef = `${'region' | 'park' | 'trail' | 'place'}:${string}`

export type TripItem = { ref: StopRef; day: number }

export type Trip = {
  id: string
  name: string
  /** YYYY-MM-DD, optional until the user picks dates. */
  startDate: string | null
  days: number
  items: TripItem[]
  createdAt: number
  updatedAt: number
}

const KEY = 'canopy:trips:v1'
const listeners = new Set<() => void>()
let trips: Trip[] = load()

function load(): Trip[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Trip[]) : []
  } catch {
    return []
  }
}

function commit(next: Trip[]) {
  trips = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage blocked or full: trips still work for this visit.
  }
  listeners.forEach((l) => l())
}

// Keep tabs in sync.
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      trips = load()
      listeners.forEach((l) => l())
    }
  })

export function useTrips(): Trip[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => trips,
  )
}

const newId = () => Math.random().toString(36).slice(2, 10)

function update(id: string, fn: (t: Trip) => Trip) {
  commit(trips.map((t) => (t.id === id ? { ...fn(t), updatedAt: Date.now() } : t)))
}

export const tripActions = {
  create(name: string, firstItem?: StopRef): Trip {
    const trip: Trip = {
      id: newId(),
      name: name.trim() || 'My trip',
      startDate: null,
      days: 1,
      items: firstItem ? [{ ref: firstItem, day: 1 }] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    commit([trip, ...trips])
    return trip
  },
  remove(id: string) {
    commit(trips.filter((t) => t.id !== id))
  },
  rename(id: string, name: string) {
    update(id, (t) => ({ ...t, name: name.trim() || t.name }))
  },
  setStartDate(id: string, startDate: string | null) {
    update(id, (t) => ({ ...t, startDate }))
  },
  setDays(id: string, days: number) {
    const d = Math.max(1, Math.min(14, days))
    // Stops on removed days move to the new last day.
    update(id, (t) => ({ ...t, days: d, items: t.items.map((i) => ({ ...i, day: Math.min(i.day, d) })) }))
  },
  toggle(id: string, ref: StopRef) {
    update(id, (t) =>
      t.items.some((i) => i.ref === ref)
        ? { ...t, items: t.items.filter((i) => i.ref !== ref) }
        : { ...t, items: [...t.items, { ref, day: t.days }] },
    )
  },
  removeItem(id: string, ref: StopRef) {
    update(id, (t) => ({ ...t, items: t.items.filter((i) => i.ref !== ref) }))
  },
  moveToDay(id: string, ref: StopRef, day: number) {
    update(id, (t) => {
      const item = t.items.find((i) => i.ref === ref)
      if (!item) return t
      // Append to the end of the target day.
      return { ...t, items: [...t.items.filter((i) => i.ref !== ref), { ...item, day }] }
    })
  },
  /** Move a stop up or down within its day. */
  shift(id: string, ref: StopRef, delta: -1 | 1) {
    update(id, (t) => {
      const item = t.items.find((i) => i.ref === ref)
      if (!item) return t
      const sameDay = t.items.filter((i) => i.day === item.day)
      const pos = sameDay.indexOf(item)
      const swapWith = sameDay[pos + delta]
      if (!swapWith) return t
      const items = [...t.items]
      const a = items.indexOf(item)
      const b = items.indexOf(swapWith)
      ;[items[a], items[b]] = [items[b], items[a]]
      return { ...t, items }
    })
  },
  /** Save a shared trip as a new trip of your own. */
  importShared(shared: SharedTrip): Trip {
    const trip: Trip = {
      id: newId(),
      name: shared.name,
      startDate: shared.startDate,
      days: shared.days,
      items: shared.items,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    commit([trip, ...trips])
    return trip
  },
}

export const tripsContaining = (all: Trip[], ref: StopRef) => all.filter((t) => t.items.some((i) => i.ref === ref))

// ── Sharing: the whole trip lives in the link, no server needed ──

export type SharedTrip = Pick<Trip, 'name' | 'startDate' | 'days' | 'items'>

export function encodeTrip(t: Trip | SharedTrip): string {
  const compact = { n: t.name, s: t.startDate, d: t.days, i: t.items.map((i) => [i.ref, i.day]) }
  const bytes = new TextEncoder().encode(JSON.stringify(compact))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Absolute link that opens a read-only copy of the trip anywhere. */
export const sharedTripUrl = (t: Trip | SharedTrip) =>
  `${window.location.origin}${import.meta.env.BASE_URL}trip/shared?t=${encodeTrip(t)}`

export function decodeTrip(code: string): SharedTrip | null {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const c = JSON.parse(new TextDecoder().decode(bytes)) as { n: string; s: string | null; d: number; i: [StopRef, number][] }
    if (typeof c.n !== 'string' || !Array.isArray(c.i)) return null
    return {
      name: c.n.slice(0, 80),
      startDate: typeof c.s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.s) ? c.s : null,
      days: Math.max(1, Math.min(14, Number(c.d) || 1)),
      items: c.i
        .filter(([ref]) => typeof ref === 'string' && /^(region|park|trail|place):[\w-]+$/.test(ref))
        .map(([ref, day]) => ({ ref, day: Math.max(1, Math.min(14, Number(day) || 1)) })),
    }
  } catch {
    return null
  }
}

// ── Hand-offs ──

export type ResolvedStop = {
  ref: StopRef
  kind: 'region' | 'park' | 'trail' | 'place'
  name: string
  lng: number
  lat: number
}

/** Google Maps directions through a day's stops, from the user's location (max 9 waypoints). */
export function multiStopDirectionsUrl(stops: ResolvedStop[]): string | null {
  if (!stops.length) return null
  const pts = stops.slice(0, 10).map((s) => `${s.lat},${s.lng}`)
  const destination = pts[pts.length - 1]
  const waypoints = pts.slice(0, -1).join('|')
  const params = new URLSearchParams({ api: '1', destination, travelmode: 'driving' })
  if (waypoints) params.set('waypoints', waypoints)
  return `https://www.google.com/maps/dir/?${params}`
}

const icsEscape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
const icsDate = (iso: string, addDays: number) => {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + addDays)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

/** One all-day calendar event per day, listing that day's stops. */
export function tripIcs(trip: Trip, stopsByDay: ResolvedStop[][], tripUrl: string): string {
  const start = trip.startDate!
  const events = stopsByDay.map((stops, i) => {
    const desc = [stops.map((s, n) => `${n + 1}. ${s.name}`).join('\n'), tripUrl].filter(Boolean).join('\n\n')
    return [
      'BEGIN:VEVENT',
      `UID:${trip.id}-day${i + 1}@canopy`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
      `DTSTART;VALUE=DATE:${icsDate(start, i)}`,
      `DTEND;VALUE=DATE:${icsDate(start, i + 1)}`,
      `SUMMARY:${icsEscape(`${trip.name} · Day ${i + 1}`)}`,
      `DESCRIPTION:${icsEscape(desc)}`,
      stops[0] ? `LOCATION:${icsEscape(stops[0].name)}` : '',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n')
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Canopy//Trips//EN', ...events, 'END:VCALENDAR'].join('\r\n') + '\r\n'
}
