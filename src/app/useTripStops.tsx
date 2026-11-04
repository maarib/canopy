import { useCallback } from 'react'
import { amenityIconUrl } from '../data/amenityIcons'
import { REGIONS, signatureTree } from '../data/regions'
import { PlaceIcon } from '../components/PlaceIcon'
import { TreeIcon } from '../components/TreeIcon'
import type { StopInfo } from '../components/TripPanels'
import { formatDuration, PLACE_KINDS, placePath, trailPath } from '../lib/explore'
import { STOP_KINDS, stopMapsUrl } from '../lib/nearbyStops'
import { parkColor, parkDetail, parkTitle, type ParkReport } from '../lib/ontarioParks'
import { PHASE_STYLE, peakPhase } from '../lib/peak'
import { parseStopRef, type StopRef } from '../lib/trips'
import { parkPath, regionPath } from '../lib/urlState'
import type { ExploreIndex } from './useAppData'

/** A nearby stop's pin and number on a trip: a quiet slate, apart from the stage and place colors. */
const STOP_COLOR = '#5c6b73'

/** A trip's saved stops, turned back into things to draw, list and open. */
export function useTripStops(everyPark: ParkReport[] | undefined, exploreIndex: ExploreIndex, go: (pathname: string) => void) {
  /** Turn a saved trip stop back into something to draw, list and open. */
  const resolveStop = useCallback(
    (ref: StopRef): StopInfo | null => {
      const [kind, id] = ref.split(/:(.+)/) as [StopInfo['kind'], string]
      if (kind === 'region') {
        const r = REGIONS.find((x) => x.id === id)
        if (!r) return null
        const color = PHASE_STYLE[peakPhase(r)].color
        return { ref, kind, name: r.name, lng: r.lng, lat: r.lat, color, icon: <TreeIcon id={signatureTree(r)} tone="mono" className="size-4" />, detail: `${r.province} · Region`, href: { page: regionPath(r.id) } }
      }
      if (kind === 'park') {
        const p = everyPark?.find((x) => x.id === id)
        if (!p) return null
        return { ref, kind, name: parkTitle(p), lng: p.lng, lat: p.lat, color: parkColor(p), icon: <TreeIcon id="maples" tone="mono" className="size-4" />, detail: `Provincial park · ${parkDetail(p)}`, href: { page: parkPath(p) } }
      }
      if (kind === 'stop') {
        const s = parseStopRef(ref)
        const k = s && STOP_KINDS.find((x) => x.id === s.kind)
        if (!s || !k) return null
        return { ref, kind, name: s.name, lng: s.lng, lat: s.lat, color: STOP_COLOR, icon: <img src={amenityIconUrl(k.icon, 16)} width={16} height={16} alt="" />, detail: k.one, href: { external: stopMapsUrl(s) } }
      }
      if (kind === 'trail') {
        const t = exploreIndex.trailById.get(id)
        if (!t) return null
        return { ref, kind, name: t.name, lng: t.trailhead[0], lat: t.trailhead[1], color: PLACE_KINDS.trail.color, icon: <PlaceIcon kind="trail" className="size-4" />, detail: `Trail · ${t.lengthKm} km · ${formatDuration(t.durationH)}`, trail: t, href: { page: trailPath(t) } }
      }
      const pl = exploreIndex.placeById.get(id)
      if (!pl) return null
      return { ref, kind: 'place', name: pl.name, lng: pl.lng, lat: pl.lat, color: PLACE_KINDS[pl.kind].color, icon: <PlaceIcon kind={pl.kind} className="size-4" />, detail: PLACE_KINDS[pl.kind].label, href: { page: placePath(pl) } }
    },
    [everyPark, exploreIndex],
  )

  /** Open a stop's page (a trip's list or its pin on the map). */
  const openStop = useCallback(
    (ref: string) => {
      const [kind, id] = ref.split(/:(.+)/)
      if (kind === 'region') return go(regionPath(id))
      if (kind === 'park') {
        const p = everyPark?.find((x) => x.id === id)
        return p && go(parkPath(p))
      }
      if (kind === 'stop') {
        // A stop has no page of its own: it opens in Google Maps, like its row in a Nearby list.
        const s = parseStopRef(ref)
        return s && window.open(stopMapsUrl(s), '_blank', 'noopener')
      }
      if (kind === 'trail') {
        const t = exploreIndex.trailById.get(id)
        return t && go(trailPath(t))
      }
      const pl = exploreIndex.placeById.get(id)
      return pl && go(placePath(pl))
    },
    [go, everyPark, exploreIndex],
  )

  return { resolveStop, openStop }
}
