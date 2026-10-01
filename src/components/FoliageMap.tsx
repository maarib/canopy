import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl/maplibre'
import type { FeatureCollection, Point } from 'geojson'
import type { Region } from '../data/regions'
import type { LeafObservation } from '../lib/inaturalist'
import { PHASE_STYLE, peakPhase } from '../lib/peak'

// OpenFreeMap: free OpenStreetMap vector basemaps, no key required.
// Swapping back to Google (for Places photos and 3D) is noted in docs/PLAN.md §3.
const STYLE = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}
const CANADA = { longitude: -92, latitude: 56, zoom: 3 }

type Props = {
  regions: Region[]
  observations: LeafObservation[]
  selected: Region | null
  onSelect: (region: Region) => void
}

export function FoliageMap({ regions, observations, selected, onSelect }: Props) {
  const mapRef = useRef<MapRef>(null)
  const dark = usePrefersDark()

  const sightings = useMemo<FeatureCollection<Point>>(
    () => ({
      type: 'FeatureCollection',
      features: observations.map((o) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
        properties: { species: o.species, observedOn: o.observedOn },
      })),
    }),
    [observations],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (selected) map.flyTo({ center: [selected.lng, selected.lat], zoom: 8, duration: 1600 })
    else map.flyTo({ center: [CANADA.longitude, CANADA.latitude], zoom: CANADA.zoom, duration: 1200 })
  }, [selected])

  return (
    <Map
      ref={mapRef}
      initialViewState={CANADA}
      minZoom={2}
      mapStyle={dark ? STYLE.dark : STYLE.light}
      style={{ width: '100%', height: '100%' }}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" showCompass={false} />

      <Source id="sightings" type="geojson" data={sightings}>
        <Layer
          id="sightings-dots"
          type="circle"
          paint={{
            'circle-color': '#e8730c',
            'circle-opacity': 0.85,
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 10, 7],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
          }}
        />
      </Source>

      {regions.map((r) => (
        <Marker
          key={r.id}
          longitude={r.lng}
          latitude={r.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            onSelect(r)
          }}
        >
          <button title={r.name} aria-label={r.name} className="cursor-pointer">
            <LeafPin color={PHASE_STYLE[peakPhase(r)].color} active={selected?.id === r.id} />
          </button>
        </Marker>
      ))}
    </Map>
  )
}

function usePrefersDark() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
}

function LeafPin({ color, active }: { color: string; active: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`drop-shadow-md transition-transform ${active ? 'size-11 scale-110' : 'size-8 hover:scale-110'}`}
      aria-hidden
    >
      <circle cx="16" cy="16" r="15" fill="white" />
      <path
        fill={color}
        d="M16 5l1.6 3.9 2.6-1.2-.6 4.6 3.5-2.6.4 2.4 3.1-.6-1.2 3.3 1.4.7-4.7 4 .6 1.9-4.4-.8.2 5.4h-2.2l.2-5.4-4.4.8.6-1.9-4.7-4 1.4-.7-1.2-3.3 3.1.6.4-2.4 3.5 2.6-.6-4.6 2.6 1.2z"
      />
    </svg>
  )
}
