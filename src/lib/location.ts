import { useSyncExternalStore } from 'react'

// "Near me": where the person is, once they ask. One small store, so the map's button and dot
// and every list row read the same position. Nothing is asked for until the locate button (or
// "Nearest" in a sort menu) is used; the position stays in the page and is sent nowhere.

export type LocationState =
  | { status: 'off' }
  | { status: 'asking' }
  | { status: 'on'; lat: number; lng: number; accuracyM: number }
  /** `denied`: the browser or the person said no. `unavailable`: no position could be found. */
  | { status: 'denied' | 'unavailable' }

/** What to tell someone when their position cannot be had. */
export const LOCATION_HELP = {
  denied: 'Location is blocked for this site. Allow it in your browser settings to see what is near you.',
  unavailable: 'Your location could not be found just now. Try again in a moment.',
} as const

const KEY = 'canopy:near-me'
let state: LocationState = { status: 'off' }
let watch: number | null = null
const listeners = new Set<() => void>()

function set(next: LocationState) {
  state = next
  listeners.forEach((l) => l())
}

function remember(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: it is asked for again next visit.
  }
}

/** Ask for the position and keep following it. Safe to call again while on. */
export function locate() {
  if (!('geolocation' in navigator)) return set({ status: 'unavailable' })
  if (watch != null) return
  if (state.status !== 'on') set({ status: 'asking' })
  watch = navigator.geolocation.watchPosition(
    ({ coords }) => {
      // Small jitter is not worth re-rendering every list for.
      if (state.status === 'on' && Math.abs(state.lat - coords.latitude) < 0.0002 && Math.abs(state.lng - coords.longitude) < 0.0002) return
      remember(true)
      set({ status: 'on', lat: coords.latitude, lng: coords.longitude, accuracyM: coords.accuracy })
    },
    (err) => {
      stop()
      set({ status: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' })
    },
    { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
  )
}

function stop() {
  if (watch != null) navigator.geolocation.clearWatch(watch)
  watch = null
}

/** Stop following and forget the position. */
export function stopLocating() {
  stop()
  remember(false)
  set({ status: 'off' })
}

// Someone who turned it on before, and whose browser still allows it, is located again without
// a prompt. Where the browser cannot say, nothing happens until they ask.
if (typeof navigator !== 'undefined' && navigator.permissions) {
  try {
    if (localStorage.getItem(KEY)) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((p) => p.state === 'granted' && locate())
        .catch(() => {})
    }
  } catch {
    // Storage blocked.
  }
}

export function useLocation(): LocationState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

const RAD = Math.PI / 180
export const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const h = Math.sin(((bLat - aLat) * RAD) / 2) ** 2 + Math.cos(aLat * RAD) * Math.cos(bLat * RAD) * Math.sin(((bLng - aLng) * RAD) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

/** "850 m", "4.2 km", "38 km", "1,240 km". */
export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(50, Math.round(km * 20) * 50)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString('en-CA')} km`
}

/** How far a point is from the person, as the crow flies, or null until they are located. */
export function useAway(lat: number, lng: number): string | null {
  const here = useLocation()
  return here.status === 'on' ? `${formatDistance(distanceKm(here.lat, here.lng, lat, lng))} away` : null
}
