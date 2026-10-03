import { useQuery } from '@tanstack/react-query'
import type { FeatureCollection, Point } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  AttributionControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapMouseEvent,
  type MapRef,
} from 'react-map-gl/mapbox'
import { ExternalIcon } from './ui'
import { signatureTree, type Region } from '../data/regions'
import type { TreeIconId } from '../data/treeIcons'
import { TreeIcon } from './TreeIcon'
import { MapSkeleton } from './MapSkeleton'
import { useHoverPoint } from '../lib/hoverStore'
import { PlaceIcon, type PlaceIconId } from './PlaceIcon'
import { isPhotoSpot, PLACE_KINDS, type Place, type Trail } from '../lib/explore'
import { useIsDesktop, usePrefersDark } from '../hooks'
import { hexbin, hexSizeForZoom } from '../lib/hexbin'
import type { LeafObservation } from '../lib/inaturalist'
import {
  MAPBOX_DEM,
  MAPBOX_STYLE,
  MAPBOX_TOKEN,
  resolveLight,
  satelliteTiles,
  standardConfig,
  type LightSetting,
} from '../lib/mapStyle'
import type { ParkReport } from '../lib/ontarioParks'
import { amenityIconUrl } from '../data/amenityIcons'
import { ACCESS_ICONS, type AccessType, type FishingAccess } from '../lib/fishingAccess'
import { PHASE_STYLE, peakPhase } from '../lib/peak'
import { STAGE_COLOR_EXPRESSION, STAGES } from '../lib/stage'
import { fetchParksCanadaTrails, snapBounds, type Bounds } from '../lib/trails'

/**
 * Camera padding so targets land in the visible part of the map. The map keeps padding
 * between moves, so every move sets it: half-open sheet for places, peek height otherwise.
 */
/** Must match the half snap point in BottomSheet.tsx. */
const SHEET_HALF = 0.52
/** Phones: the bottom tab bar (see AppNav). The map stops above it; the sheet sits on it. */
const TAB_BAR = 64
/** Height of the half-open sheet, which covers the bottom of the map on phones. */
const sheetHalf = () => Math.round((window.innerHeight - TAB_BAR) * SHEET_HALF)

function sheetPadding(isDesktop: boolean, placeOpen: boolean) {
  const bottom = isDesktop ? 0 : placeOpen ? sheetHalf() : 132
  return { top: 0, left: 0, right: 0, bottom }
}

export type MapLayers = {
  reports: boolean
  hexes: boolean
  sightings: boolean
  trails: boolean
  satellite: boolean
  terrain3d: boolean
  fishing: boolean
}

export type FlyTarget = {
  id: string
  lng: number
  lat: number
  zoom: number
  /** Fit these bounds instead of flying to a point (e.g. a whole trail). */
  bounds?: [number, number, number, number]
} | null
export type MapView = { lat: number; lng: number; zoom: number }

type Props = {
  regions: Region[]
  parks: ParkReport[]
  sightings: LeafObservation[]
  layers: MapLayers
  satelliteDate: string
  light: LightSetting
  target: FlyTarget
  selectedId: string | null
  onSelectRegion: (r: Region) => void
  onSelectPark: (p: ParkReport) => void
  /** Starting view (e.g. from a shared link); ignored when `target` is set. */
  initialView: MapView | null
  /** Called after the user pans/zooms. */
  onViewChange: (view: MapView) => void
  /** One-off fly-to (e.g. a town picked in search); a new `id` triggers it. */
  focus: FlyTarget
  explore: { trails: Trail[]; places: Place[] }
  selectedTrail: Trail | null
  selectedPlace: Place | null
  onSelectTrail: (t: Trail) => void
  onSelectPlace: (p: Place) => void
  /** A trip being viewed: numbered stops and its trails' tracks. */
  trip: { stops: TripPin[]; trails: Trail[] } | null
  onSelectTripStop: (ref: string) => void
  /** Ontario fishing access points (boat launches, shore access, docks). */
  fishing: FishingAccess[]
  selectedFishing: FishingAccess | null
  onSelectFishing: (a: FishingAccess) => void
}

export type TripPin = { ref: string; n: number; lng: number; lat: number; color: string; name: string }

/** Room for the search bar on top and the sheet/panel elsewhere when fitting a trail. */
function fitPadding(isDesktop: boolean) {
  return isDesktop
    ? { top: 80, bottom: 60, left: 60, right: 60 }
    : { top: 70, bottom: sheetHalf() + 16, left: 24, right: 24 }
}

/**
 * The default view: southern and central Ontario, where most park pins, regions, trails and
 * fishing spots are. Fitted inside the part of the map you can see (beside the panel on
 * desktop, above the half-open sheet on phones) so the pins are the first thing in view.
 */
const HOME_BOUNDS: [[number, number], [number, number]] = [
  [-85, 42.2],
  [-74.4, 47.8],
]
const TRAILS_MIN_ZOOM = 9
const INTERACTIVE = ['explore-trails-hit', 'parks-circles', 'sightings-dots', 'hexes-fill', 'fishing-pins']
const FISHING_MIN_ZOOM = 8
const FISHING_TEAL = '#1f6f74'

/** A pin image for each access type: white disc, teal ring, Icons8 icon. Drawn at 2× for sharpness. */
async function addFishingImages(map: { addImage: (id: string, img: ImageData, o: { pixelRatio: number }) => void; hasImage: (id: string) => boolean }) {
  const px = 26 * 2
  await Promise.all(
    (Object.keys(ACCESS_ICONS) as AccessType[]).map(async (type) => {
      const id = `fishing-${type}`
      if (map.hasImage(id)) return
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = amenityIconUrl(ACCESS_ICONS[type], 16)
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = px
      const ctx = canvas.getContext('2d')!
      ctx.beginPath()
      ctx.arc(px / 2, px / 2, px / 2 - 3, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = FISHING_TEAL
      ctx.stroke()
      const icon = 32
      ctx.drawImage(img, (px - icon) / 2, (px - icon) / 2, icon, icon)
      map.addImage(id, ctx.getImageData(0, 0, px, px), { pixelRatio: 2 })
    }),
  )
}
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }

type PopupInfo = { lng: number; lat: number; title: string; lines: string[]; href?: string }

/** Memoized: the app re-renders often (sheet, search, panels); the map only when its props change. */
export const FoliageMap = memo(function FoliageMap(props: Props) {
  const { layers } = props
  const mapRef = useRef<MapRef>(null)
  const dark = usePrefersDark()
  const isDesktop = useIsDesktop()
  const [zoom, setZoom] = useState(3.3)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [hovering, setHovering] = useState(false)
  const [popup, setPopup] = useState<PopupInfo | null>(null)

  // Fly to whatever the panel selected. On first load, a deep link jumps straight there
  // and a shared map view (or the default) is already the initial view.
  const { target, focus } = props
  const firstRun = useRef(true)
  // The map engine loads asynchronously, so a target can arrive before the map exists;
  // `mapReady` re-runs the fly once it does.
  const [mapReady, setMapReady] = useState(false)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (firstRun.current) {
      firstRun.current = false
      if (!target) return
    }
    const padding = sheetPadding(isDesktop, !!target)
    if (target?.bounds)
      map.fitBounds(
        [
          [target.bounds[0], target.bounds[1]],
          [target.bounds[2], target.bounds[3]],
        ],
        { padding: fitPadding(isDesktop), maxZoom: 15, duration: 1500 },
      )
    else if (target) map.flyTo({ center: [target.lng, target.lat], zoom: target.zoom, padding, duration: 1600, essential: true })
    else map.fitBounds(HOME_BOUNDS, { padding: fitPadding(isDesktop), duration: 1200 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fly only when the target changes identity
  }, [target?.id, mapReady])

  // Mapbox Standard is configured at runtime: theme, autumn colors, light preset.
  const lightPreset = resolveLight(props.light, dark)
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return
    map.setConfig('basemap', standardConfig(lightPreset))
  }, [mapReady, lightPreset])

  // Record the view after moves the user made, or a fly-to they asked for (search), but not
  // the map settling on load.
  const reportNextMove = useRef(false)
  useEffect(() => {
    if (focus) reportNextMove.current = true
    if (focus?.bounds)
      mapRef.current?.fitBounds(
        [
          [focus.bounds[0], focus.bounds[1]],
          [focus.bounds[2], focus.bounds[3]],
        ],
        { padding: fitPadding(isDesktop), duration: 1600 },
      )
    else if (focus)
      mapRef.current?.flyTo({
        center: [focus.lng, focus.lat],
        zoom: focus.zoom,
        padding: sheetPadding(isDesktop, false),
        duration: 1600,
        essential: true,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fly once per focus request
  }, [focus?.id])

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

  const fishingPoints = useMemo<FeatureCollection<Point>>(
    () => ({
      type: 'FeatureCollection',
      features: props.fishing.map((f) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
        properties: { id: f.id, type: f.type, named: !!f.name },
      })),
    }),
    [props.fishing],
  )
  const selectedFishingPoint = useMemo<FeatureCollection>(() => {
    const f = props.selectedFishing
    return f
      ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [f.lng, f.lat] }, properties: { type: f.type } }] }
      : EMPTY
  }, [props.selectedFishing])
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

  const exploreTrails = useMemo<FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: props.explore.trails.map((t) => ({
        type: 'Feature',
        geometry: t.geometry,
        properties: { id: t.id, name: t.name, selected: t.id === props.selectedTrail?.id },
      })),
    }),
    [props.explore.trails, props.selectedTrail?.id],
  )
  // The highlighted tracks: the selected trail, or every trail in the trip being viewed.
  const highlighted = props.selectedTrail ? [props.selectedTrail] : (props.trip?.trails ?? [])
  const selectedTrailData = useMemo<FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: highlighted.map((t) => ({ type: 'Feature', geometry: t.geometry, properties: {} })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by ids, not array identity
    [highlighted.map((t) => t.id).join()],
  )

  // Which places get a pin: a selected trail's stops; otherwise photo spots and trailheads when zoomed in.
  const placePins = useMemo(() => {
    const byId = new globalThis.Map(props.explore.places.map((p) => [p.id, p]))
    if (props.selectedTrail) return props.selectedTrail.along.flatMap((a) => byId.get(a.poi) ?? [])
    if (props.trip) return []
    const pins = zoom >= 9 ? props.explore.places.filter((p) => isPhotoSpot(p.kind)) : []
    if (props.selectedPlace && !pins.includes(props.selectedPlace)) pins.push(props.selectedPlace)
    return pins
  }, [props.explore.places, props.selectedTrail, props.selectedPlace, props.trip, zoom])
  const trailheadPins = props.selectedTrail ? [props.selectedTrail] : props.trip ? [] : zoom >= 9.5 ? props.explore.trails : []

  const trailBounds = layers.trails && zoom >= TRAILS_MIN_ZOOM && bounds ? snapBounds(bounds) : null
  const trails = useQuery({
    queryKey: ['trails', trailBounds],
    queryFn: () => fetchParksCanadaTrails(trailBounds!),
    enabled: !!trailBounds,
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  })

  function updateView(report = true) {
    const map = mapRef.current
    if (!map) return
    setZoom(map.getZoom())
    const c = map.getCenter()
    if (report) props.onViewChange({ lat: c.lat, lng: c.lng, zoom: map.getZoom() })
    // On the globe at low zoom the viewport's corners can be off the planet, and Mapbox's
    // getBounds() throws (Invalid LngLat NaN). Bounds only matter zoomed in, so skip them then.
    let b: ReturnType<typeof map.getBounds> = null
    try {
      b = map.getBounds()
    } catch {
      return
    }
    if (b) setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
  }

  function handleClick(e: MapMouseEvent) {
    const feature = e.features?.[0]
    if (!feature) return setPopup(null)
    const p = feature.properties as Record<string, string | number>
    if (feature.layer?.id === 'explore-trails-hit') {
      const trail = props.explore.trails.find((t) => t.id === p.id)
      if (trail) props.onSelectTrail(trail)
      setPopup(null)
    } else if (feature.layer?.id === 'fishing-pins') {
      const access = props.fishing.find((a) => a.id === String(p.id))
      if (access) props.onSelectFishing(access)
      setPopup(null)
    } else if (feature.layer?.id === 'parks-circles') {
      const park = props.parks.find((x) => x.id === String(p.id))
      if (park) props.onSelectPark(park)
      setPopup(null)
    } else if (feature.layer?.id === 'sightings-dots') {
      setPopup({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        title: String(p.species),
        lines: [`${p.state === 'bare' ? 'Leaves down' : 'Color change'} · ${p.observedOn}`],
        href: String(p.url),
      })
    } else {
      setPopup({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        title: `${p.colored} turning · ${p.bare} leafless`,
        lines: [`iNaturalist sightings, last 14 days`, String(p.top)],
      })
    }
  }

  if (!MAPBOX_TOKEN) return <MissingToken />
  const vis = (on: boolean) => (on ? 'visible' : 'none') as 'visible' | 'none'

  return (
    <>
    <Map
      ref={mapRef}
      initialViewState={
        props.target?.bounds
          ? { bounds: props.target.bounds, fitBoundsOptions: { padding: fitPadding(isDesktop) } }
          : props.target
          ? { longitude: props.target.lng, latitude: props.target.lat, zoom: props.target.zoom - 2 }
          : props.initialView
            ? { longitude: props.initialView.lng, latitude: props.initialView.lat, zoom: props.initialView.zoom }
            : { bounds: HOME_BOUNDS, fitBoundsOptions: { padding: fitPadding(isDesktop) } }
      }
      mapboxAccessToken={MAPBOX_TOKEN}
      minZoom={2}
      maxPitch={75}
      mapStyle={MAPBOX_STYLE}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      interactiveLayerIds={INTERACTIVE}
      cursor={hovering ? 'pointer' : 'grab'}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handleClick}
      onLoad={(e) => {
        if (import.meta.env.DEV) Object.assign(window, { __canopyMap: e.target }) // for debugging in devtools
        updateView(false)
        setMapReady(true)
        addFishingImages(e.target).catch(() => {}) // pins simply don't show if the icon CDN is unreachable
      }}
      onMoveEnd={(e) => {
        // Mapbox sets originalEvent only for user-driven moves (react-map-gl's type omits it).
        const byUser = !!(e as { originalEvent?: Event }).originalEvent
        updateView(byUser || reportNextMove.current)
        reportNextMove.current = false
      }}
      terrain={layers.terrain3d ? { source: 'mapbox-dem', exaggeration: 1.4 } : undefined}
    >
      <NavigationControl position="top-right" visualizePitch />
      <AttributionControl compact position="bottom-right" />

      {/*
        Mapbox Standard slots: "bottom" sits on land/water under roads, "middle" above roads
        under labels and 3D, "top" above everything. Within a slot, later layers draw on top.
      */}
      <Source id="mapbox-dem" type="raster-dem" url={MAPBOX_DEM} tileSize={512} maxzoom={14}>
        <Layer
          id="hillshade"
          type="hillshade"
          slot="bottom"
          paint={{
            'hillshade-exaggeration': 0.3,
            'hillshade-shadow-color': dark ? '#000000' : '#6b5a4a',
            'hillshade-highlight-color': dark ? '#2a221c' : '#fffaf2',
            'hillshade-accent-color': dark ? '#000000' : '#6b5a4a',
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
          slot="bottom"
          layout={{ visibility: vis(layers.satellite) }}
          paint={{ 'raster-opacity': 0.95 }}
        />
      </Source>

      <Source id="trails" type="geojson" data={trailBounds && trails.data ? trails.data : EMPTY}>
        <Layer
          id="trails-line"
          type="line"
          slot="middle"
          layout={{ visibility: vis(layers.trails), 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': dark ? '#a9cf8f' : '#2f5d3a',
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 14, 3.5],
            'line-dasharray': [2, 1.2],
            'line-emissive-strength': 1,
          }}
        />
        <Layer
          id="trails-label"
          type="symbol"
          slot="top"
          minzoom={12}
          layout={{
            visibility: vis(layers.trails),
            'symbol-placement': 'line',
            'text-field': ['coalesce', ['get', 'name'], ''],
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-size': 11,
          }}
          paint={{
            'text-color': dark ? '#cfe3c0' : '#2f5d3a',
            'text-halo-color': dark ? '#000' : '#fff',
            'text-halo-width': 1.2,
          }}
        />
      </Source>

      {/* Ontario Trail Network trails from the Explore data. */}
      <Source id="explore-trails" type="geojson" data={exploreTrails}>
        <Layer
          id="explore-trails-line"
          type="line"
          slot="middle"
          minzoom={7.5}
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': dark ? '#a9cf8f' : '#2f5d3a',
            'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 4],
            'line-opacity': props.selectedTrail ? 0.35 : 0.95,
            'line-emissive-strength': 1,
          }}
        />
        {/* Wide invisible line so trails are easy to tap. */}
        <Layer
          id="explore-trails-hit"
          type="line"
          slot="middle"
          minzoom={7.5}
          paint={{ 'line-color': '#000', 'line-opacity': 0, 'line-width': 16 }}
        />
        <Layer
          id="explore-trails-label"
          type="symbol"
          slot="top"
          minzoom={11}
          layout={{
            'symbol-placement': 'line',
            'text-field': ['get', 'name'],
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-size': 12,
          }}
          paint={{
            'text-color': dark ? '#d6ebc6' : '#24482d',
            'text-halo-color': dark ? '#000' : '#fff',
            'text-halo-width': 1.4,
          }}
        />
      </Source>
      {/* The selected trail's track, drawn over everything else. */}
      <Source id="selected-trail" type="geojson" data={selectedTrailData}>
        <Layer
          id="selected-trail-casing"
          type="line"
          slot="top"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': '#fff', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 6, 15, 11], 'line-emissive-strength': 1 }}
        />
        <Layer
          id="selected-trail-line"
          type="line"
          slot="top"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': '#e8730c', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3.5, 15, 7], 'line-emissive-strength': 1 }}
        />
      </Source>

      <Source id="hexes" type="geojson" data={hexes}>
        <Layer
          id="hexes-fill"
          type="fill"
          slot="middle"
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
            // Keep data colors true under every light preset.
            'fill-emissive-strength': 1,
          }}
        />
        <Layer
          id="hexes-outline"
          type="line"
          slot="middle"
          maxzoom={11}
          layout={{ visibility: vis(layers.hexes) }}
          paint={{ 'line-color': dark ? '#000' : '#fff', 'line-opacity': 0.5, 'line-width': 0.75, 'line-emissive-strength': 1 }}
        />
      </Source>

      <Source id="sightings" type="geojson" data={sightingPoints}>
        <Layer
          id="sightings-dots"
          type="circle"
          slot="middle"
          minzoom={6}
          layout={{ visibility: vis(layers.sightings) }}
          paint={{
            'circle-color': ['match', ['get', 'state'], 'bare', STAGES.past.color, '#e8730c'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 2.5, 12, 6],
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0, 7, 0.9],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1,
            'circle-emissive-strength': 1,
          }}
        />
      </Source>

      <Source id="fishing" type="geojson" data={fishingPoints}>
        <Layer
          id="fishing-pins"
          type="symbol"
          slot="top"
          minzoom={FISHING_MIN_ZOOM}
          layout={{
            visibility: vis(layers.fishing),
            'icon-image': ['concat', 'fishing-', ['get', 'type']],
            'icon-size': ['interpolate', ['linear'], ['zoom'], FISHING_MIN_ZOOM, 0.75, 12, 1],
            // Named points win when pins collide; Mapbox hides the rest until you zoom in.
            'symbol-sort-key': ['case', ['get', 'named'], 0, 1],
            'icon-padding': 1,
          }}
          paint={{ 'icon-emissive-strength': 1 }}
        />
      </Source>
      <Source id="selected-fishing" type="geojson" data={selectedFishingPoint}>
        <Layer
          id="selected-fishing-pin"
          type="symbol"
          slot="top"
          layout={{
            'icon-image': ['concat', 'fishing-', ['get', 'type']],
            'icon-size': 1.35,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          }}
          paint={{ 'icon-emissive-strength': 1 }}
        />
      </Source>

      <Source id="parks" type="geojson" data={parkPoints}>
        <Layer
          id="parks-circles"
          type="circle"
          slot="middle"
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
            'circle-emissive-strength': 1,
          }}
        />
      </Source>

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
            <TreePin
              tree={signatureTree(r)}
              color={PHASE_STYLE[peakPhase(r)].color}
              active={props.selectedId === r.id}
              small={zoom < 4.5}
            />
          </button>
        </Marker>
      ))}

      {trailheadPins.map((t) => (
        <Marker key={`th-${t.id}`} longitude={t.trailhead[0]} latitude={t.trailhead[1]} anchor="center" onClick={(e) => {
          e.originalEvent.stopPropagation()
          props.onSelectTrail(t)
        }}>
          <button title={`${t.name} trailhead`} aria-label={`${t.name} trailhead`} className="cursor-pointer">
            <PlacePin kind="trailhead" active={props.selectedTrail?.id === t.id} />
          </button>
        </Marker>
      ))}
      {placePins.map((p) => (
        <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="center" onClick={(e) => {
          e.originalEvent.stopPropagation()
          props.onSelectPlace(p)
        }}>
          <button title={p.name} aria-label={`${PLACE_KINDS[p.kind].label}: ${p.name}`} className="cursor-pointer">
            <PlacePin kind={p.kind} active={props.selectedPlace?.id === p.id} />
          </button>
        </Marker>
      ))}
      <HoverMarker />
      {props.trip?.stops.map((s) => (
        <Marker key={`trip-${s.ref}`} longitude={s.lng} latitude={s.lat} anchor="center" onClick={(e) => {
          e.originalEvent.stopPropagation()
          props.onSelectTripStop(s.ref)
        }}>
          <button
            title={`${s.n}. ${s.name}`}
            aria-label={`Stop ${s.n}: ${s.name}`}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white text-sm font-semibold text-white shadow-md transition-transform hover:scale-110"
            style={{ background: s.color }}
          >
            {s.n}
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
              <a href={popup.href} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-maple underline underline-offset-2 hover:brightness-90">
                View on iNaturalist
                <ExternalIcon className="size-3.5" />
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
    {!mapReady && <MapSkeleton />}
    </>
  )
})

/** Follows the elevation chart; subscribes to the hover store so only this re-renders. */
function HoverMarker() {
  const point = useHoverPoint()
  if (!point) return null
  return (
    <Marker longitude={point[0]} latitude={point[1]} anchor="center">
      <span className="block size-4 rounded-full border-[3px] border-white bg-[#e8730c] shadow-lg" />
    </Marker>
  )
}

function TreePin({ tree, color, active, small }: { tree: TreeIconId; color: string; active: boolean; small: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-white shadow-md transition-transform ${
        active ? 'size-10 scale-110 border-[3px]' : small ? 'size-6 border-2 hover:scale-125' : 'size-8 border-[2.5px] hover:scale-110'
      }`}
      // Leaf keeps its tree's fall color; the ring shows where the region is in its peak window.
      style={{ borderColor: color, ['--leaf-ink' as string]: '#2d3550' }}
    >
      <TreeIcon id={tree} className={active ? 'size-7' : small ? 'size-[18px]' : 'size-6'} />
    </span>
  )
}

function MissingToken() {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--surface-2)] p-6">
      <div className="max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-sm shadow-sm">
        <p className="mb-2 font-semibold">Add a Mapbox token to see the map</p>
        <p className="text-[var(--ink-soft)]">
          Put your public token (starts with <code>pk.</code>) in <code>.env.local</code> as{' '}
          <code>VITE_MAPBOX_TOKEN</code>, then restart the dev server.
        </p>
      </div>
    </div>
  )
}

function PlacePin({ kind, active }: { kind: PlaceIconId; active: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full border-2 border-white text-white shadow-md transition-transform ${
        active ? 'size-10 scale-110' : 'size-7 hover:scale-110'
      }`}
      style={{ background: PLACE_KINDS[kind].color }}
    >
      <PlaceIcon kind={kind} className={active ? 'size-6' : 'size-4'} />
    </span>
  )
}
