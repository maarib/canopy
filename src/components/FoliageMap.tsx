import { useQuery } from '@tanstack/react-query'
import type { FeatureCollection, Point } from 'geojson'
import type { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre'
import type { Region } from '../data/regions'
import { useIsDesktop, usePrefersDark } from '../hooks'
import { hexbin, hexSizeForZoom } from '../lib/hexbin'
import type { LeafObservation } from '../lib/inaturalist'
import { firstLabelLayerId, loadAutumnStyle, satelliteTiles, TERRAIN_TILES } from '../lib/mapStyle'
import type { ParkReport } from '../lib/ontarioParks'
import { PHASE_STYLE, peakPhase } from '../lib/peak'
import { STAGE_COLOR_EXPRESSION, STAGES } from '../lib/stage'
import { fetchParksCanadaTrails, snapBounds, type Bounds } from '../lib/trails'

export type MapLayers = {
  reports: boolean
  hexes: boolean
  sightings: boolean
  trails: boolean
  satellite: boolean
  terrain3d: boolean
}

export type FlyTarget = { id: string; lng: number; lat: number; zoom: number } | null

type Props = {
  regions: Region[]
  parks: ParkReport[]
  sightings: LeafObservation[]
  layers: MapLayers
  satelliteDate: string
  target: FlyTarget
  selectedId: string | null
  onSelectRegion: (r: Region) => void
  onSelectPark: (p: ParkReport) => void
}

/** Where nearly all of Canada's fall colour is: the southern band, BC to Newfoundland. */
const COLOUR_BELT: [[number, number], [number, number]] = [
  [-128, 42],
  [-53, 57],
]
/** Phones are too narrow for the whole belt; start on the east, where most of the colour is. */
const EAST_BELT = { longitude: -73, latitude: 46.5, zoom: 3.4 }
const TRAILS_MIN_ZOOM = 9
const INTERACTIVE = ['parks-circles', 'sightings-dots', 'hexes-fill']
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }

type PopupInfo = { lng: number; lat: number; title: string; lines: string[]; href?: string }

export function FoliageMap(props: Props) {
  const { layers } = props
  const mapRef = useRef<MapRef>(null)
  const dark = usePrefersDark()
  const isDesktop = useIsDesktop()
  const [style, setStyle] = useState<StyleSpecification | null>(null)
  const [zoom, setZoom] = useState(3.3)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [hovering, setHovering] = useState(false)
  const [popup, setPopup] = useState<PopupInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    loadAutumnStyle(dark ? 'dark' : 'light').then((s) => !cancelled && setStyle(s))
    return () => {
      cancelled = true
    }
  }, [dark])

  // Fly to whatever the panel selected.
  const { target } = props
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // On phones the bottom sheet covers the lower half; keep the target in the visible part.
    const padding = { top: 0, left: 0, right: 0, bottom: isDesktop ? 0 : Math.round(window.innerHeight * 0.45) }
    if (target) map.flyTo({ center: [target.lng, target.lat], zoom: target.zoom, padding, duration: 1600, essential: true })
    else if (isDesktop) map.fitBounds(COLOUR_BELT, { padding: 24, duration: 1200 })
    else map.flyTo({ center: [EAST_BELT.longitude, EAST_BELT.latitude], zoom: EAST_BELT.zoom, padding, duration: 1200 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fly only when the target changes identity
  }, [target?.id])

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: layers.terrain3d ? 60 : 0, duration: 1000 })
  }, [layers.terrain3d])

  const hexSize = hexSizeForZoom(zoom)
  const hexes = useMemo(
    () =>
      hexbin(props.sightings, hexSize, (pts) => {
        const bare = pts.filter((p) => p.state === 'bare').length
        const colored = pts.length - bare
        const names = new globalThis.Map<string, number>()
        for (const p of pts) names.set(p.species, (names.get(p.species) ?? 0) + 1)
        const top = [...names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n)
        return { colored, bare, total: pts.length, bareShare: bare / pts.length, top: top.join(', ') }
      }),
    [props.sightings, hexSize],
  )

  const sightingPoints = useMemo<FeatureCollection<Point>>(
    () => ({
      type: 'FeatureCollection',
      features: props.sightings.map((o) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
        properties: { id: o.id, species: o.species, state: o.state, observedOn: o.observedOn, url: o.url },
      })),
    }),
    [props.sightings],
  )

  const parkPoints = useMemo<FeatureCollection<Point>>(
    () => ({
      type: 'FeatureCollection',
      features: props.parks.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p.id, stage: p.stage, main: p.main, selected: p.id === props.selectedId },
      })),
    }),
    [props.parks, props.selectedId],
  )

  const trailBounds = layers.trails && zoom >= TRAILS_MIN_ZOOM && bounds ? snapBounds(bounds) : null
  const trails = useQuery({
    queryKey: ['trails', trailBounds],
    queryFn: () => fetchParksCanadaTrails(trailBounds!),
    enabled: !!trailBounds,
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  })

  function updateView() {
    const map = mapRef.current
    if (!map) return
    setZoom(map.getZoom())
    const b = map.getBounds()
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
  }

  function handleClick(e: MapLayerMouseEvent) {
    const feature = e.features?.[0]
    if (!feature) return setPopup(null)
    const p = feature.properties as Record<string, string | number>
    if (feature.layer.id === 'parks-circles') {
      const park = props.parks.find((x) => x.id === String(p.id))
      if (park) props.onSelectPark(park)
      setPopup(null)
    } else if (feature.layer.id === 'sightings-dots') {
      setPopup({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        title: String(p.species),
        lines: [`${p.state === 'bare' ? 'Leaves down' : 'Colour change'} · ${p.observedOn}`],
        href: String(p.url),
      })
    } else {
      setPopup({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        title: `${p.colored} colour · ${p.bare} bare`,
        lines: [`iNaturalist sightings, last 14 days`, String(p.top)],
      })
    }
  }

  if (!style) return <div className="h-full w-full bg-[var(--surface-2)]" />
  const labelId = firstLabelLayerId(style)
  const vis = (on: boolean) => (on ? 'visible' : 'none') as 'visible' | 'none'

  return (
    <Map
      ref={mapRef}
      initialViewState={isDesktop ? { bounds: COLOUR_BELT, fitBoundsOptions: { padding: 24 } } : EAST_BELT}
      minZoom={2}
      maxPitch={75}
      mapStyle={style}
      style={{ width: '100%', height: '100%' }}
      attributionControl={{ compact: true }}
      interactiveLayerIds={INTERACTIVE}
      cursor={hovering ? 'pointer' : 'grab'}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handleClick}
      onLoad={(e) => {
        if (import.meta.env.DEV) Object.assign(window, { __canopyMap: e.target }) // for debugging in devtools
        updateView()
      }}
      onMoveEnd={updateView}
      terrain={layers.terrain3d ? { source: 'terrain-dem', exaggeration: 1.4 } : undefined}
    >
      <NavigationControl position="top-right" visualizePitch />

      {/* Rendered top-down: each layer slots in below the one before it. */}
      <Source id="parks" type="geojson" data={parkPoints}>
        <Layer
          id="parks-circles"
          type="circle"
          beforeId={labelId}
          layout={{ visibility: vis(layers.reports), 'circle-sort-key': ['case', ['get', 'main'], 1, 0] }}
          paint={{
            'circle-color': STAGE_COLOR_EXPRESSION as never,
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3,
              ['case', ['get', 'main'], 4.5, 3],
              9,
              ['case', ['get', 'main'], 10, 7],
            ],
            'circle-stroke-color': ['case', ['get', 'selected'], '#111', '#fff'],
            'circle-stroke-width': ['case', ['get', 'selected'], 3, 1.5],
          }}
        />
      </Source>

      <Source id="sightings" type="geojson" data={sightingPoints}>
        <Layer
          id="sightings-dots"
          type="circle"
          beforeId="parks-circles"
          minzoom={6}
          layout={{ visibility: vis(layers.sightings) }}
          paint={{
            'circle-color': ['match', ['get', 'state'], 'bare', STAGES.past.color, '#e8730c'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 2.5, 12, 6],
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0, 7, 0.9],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1,
          }}
        />
      </Source>

      <Source id="hexes" type="geojson" data={hexes}>
        <Layer
          id="hexes-fill"
          type="fill"
          beforeId="sightings-dots"
          maxzoom={11}
          layout={{ visibility: vis(layers.hexes) }}
          paint={{
            'fill-color': [
              'case',
              ['>=', ['get', 'bareShare'], 0.5],
              STAGES.past.color,
              ['interpolate', ['linear'], ['get', 'colored'], 1, '#e3b53c', 4, '#e8730c', 10, '#c8102e'],
            ],
            // Zoom must be the outermost input; busier hexes are more opaque, and all fade as dots take over.
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              ['interpolate', ['linear'], ['get', 'total'], 1, 0.35, 8, 0.7],
              10.5,
              ['interpolate', ['linear'], ['get', 'total'], 1, 0.08, 8, 0.18],
            ],
          }}
        />
        <Layer
          id="hexes-outline"
          type="line"
          beforeId="sightings-dots"
          maxzoom={11}
          layout={{ visibility: vis(layers.hexes) }}
          paint={{ 'line-color': dark ? '#000' : '#fff', 'line-opacity': 0.5, 'line-width': 0.75 }}
        />
      </Source>

      <Source id="trails" type="geojson" data={trailBounds && trails.data ? trails.data : EMPTY}>
        <Layer
          id="trails-line"
          type="line"
          beforeId="hexes-fill"
          layout={{ visibility: vis(layers.trails), 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': dark ? '#a9cf8f' : '#2f5d3a',
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 14, 3.5],
            'line-dasharray': [2, 1.2],
          }}
        />
        <Layer
          id="trails-label"
          type="symbol"
          minzoom={12}
          layout={{
            visibility: vis(layers.trails),
            'symbol-placement': 'line',
            'text-field': ['coalesce', ['get', 'name'], ''],
            'text-font': ['Noto Sans Regular'],
            'text-size': 11,
          }}
          paint={{
            'text-color': dark ? '#cfe3c0' : '#2f5d3a',
            'text-halo-color': dark ? '#000' : '#fff',
            'text-halo-width': 1.2,
          }}
        />
      </Source>

      <Source
        key={props.satelliteDate}
        id="satellite"
        type="raster"
        tiles={[satelliteTiles(props.satelliteDate)]}
        tileSize={256}
        maxzoom={9}
        attribution="Imagery: NASA EOSDIS GIBS (VIIRS)"
      >
        <Layer
          id="satellite-raster"
          type="raster"
          beforeId="trails-line"
          layout={{ visibility: vis(layers.satellite) }}
          paint={{ 'raster-opacity': 0.95 }}
        />
      </Source>

      <Source id="hillshade-dem" type="raster-dem" tiles={[TERRAIN_TILES]} encoding="terrarium" tileSize={256} maxzoom={13}>
        <Layer
          id="hillshade"
          type="hillshade"
          beforeId={style.layers.some((l) => l.id === 'waterway') ? 'waterway' : labelId}
          paint={{
            'hillshade-exaggeration': 0.35,
            'hillshade-shadow-color': dark ? '#000000' : '#6b5a4a',
            'hillshade-highlight-color': dark ? '#2a221c' : '#fffaf2',
            'hillshade-accent-color': dark ? '#000000' : '#6b5a4a',
          }}
        />
      </Source>
      <Source
        id="terrain-dem"
        type="raster-dem"
        tiles={[TERRAIN_TILES]}
        encoding="terrarium"
        tileSize={256}
        maxzoom={13}
        attribution="Terrain: Mapzen / AWS Open Data"
      />

      {props.regions.map((r) => (
        <Marker
          key={r.id}
          longitude={r.lng}
          latitude={r.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            props.onSelectRegion(r)
          }}
        >
          <button title={r.name} aria-label={r.name} className="cursor-pointer">
            <LeafPin color={PHASE_STYLE[peakPhase(r)].color} active={props.selectedId === r.id} small={zoom < 4.5} />
          </button>
        </Marker>
      ))}

      {popup && (
        <Popup longitude={popup.lng} latitude={popup.lat} onClose={() => setPopup(null)} closeButton={false} maxWidth="240px">
          <div className="text-[13px] text-[#2a211c]">
            <div className="font-semibold">{popup.title}</div>
            {popup.lines.map((l) => (
              <div key={l} className="text-[#6f625a]">
                {l}
              </div>
            ))}
            {popup.href && (
              <a href={popup.href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-maple underline">
                View on iNaturalist
              </a>
            )}
          </div>
        </Popup>
      )}

      {layers.trails && zoom < TRAILS_MIN_ZOOM && zoom >= 6 && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
          Zoom in to see Parks Canada trails
        </div>
      )}
    </Map>
  )
}

function LeafPin({ color, active, small }: { color: string; active: boolean; small: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`drop-shadow-md transition-transform ${active ? 'size-10 scale-110' : small ? 'size-5 hover:scale-125' : 'size-7 hover:scale-110'}`}
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
