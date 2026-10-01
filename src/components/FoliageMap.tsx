import { AdvancedMarker, APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useEffect } from 'react'
import type { Region } from '../data/regions'
import type { LeafObservation } from '../lib/inaturalist'
import { PHASE_STYLE, peakPhase } from '../lib/peak'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || 'DEMO_MAP_ID'
const CANADA = { lat: 52, lng: -92 }

type Props = {
  regions: Region[]
  observations: LeafObservation[]
  selected: Region | null
  onSelect: (region: Region) => void
}

export function FoliageMap(props: Props) {
  if (!API_KEY) return <MissingKey />
  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        mapId={MAP_ID}
        defaultCenter={CANADA}
        defaultZoom={4}
        minZoom={3}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        className="h-full w-full"
      >
        {props.observations.map((o) => (
          <AdvancedMarker key={o.id} position={o} title={`${o.species} · ${o.observedOn}`} zIndex={1}>
            <span className="block size-2.5 rounded-full border border-white/80 bg-pumpkin shadow" />
          </AdvancedMarker>
        ))}
        {props.regions.map((r) => (
          <AdvancedMarker key={r.id} position={r} title={r.name} zIndex={10} onClick={() => props.onSelect(r)}>
            <LeafPin color={PHASE_STYLE[peakPhase(r)].color} active={props.selected?.id === r.id} />
          </AdvancedMarker>
        ))}
        <FlyTo target={props.selected} />
      </Map>
    </APIProvider>
  )
}

function FlyTo({ target }: { target: Region | null }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    if (target) {
      map.panTo(target)
      map.setZoom(8)
    } else {
      map.panTo(CANADA)
      map.setZoom(4)
    }
  }, [map, target])
  return null
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

function MissingKey() {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--surface-2)] p-6">
      <div className="max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-sm shadow-sm">
        <p className="mb-2 font-semibold">Add a Google Maps key to see the map</p>
        <p className="text-[var(--ink-soft)]">
          Copy <code>.env.example</code> to <code>.env.local</code> and set <code>VITE_GOOGLE_MAPS_API_KEY</code>.
          The regions, forecasts and leaf photos in the panel work without it.
        </p>
      </div>
    </div>
  )
}
