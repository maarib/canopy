import { LocationOn } from 'relume-icons'
import { ForestCover } from './ForestCover'
import { placeCover } from '../lib/coverSpec'
import { isPhotoSpot, PLACE_KINDS, type ExploreArea, type Place, type Trail } from '../lib/explore'
import { directionsUrl } from '../lib/peak'
import { ForecastStrip } from './ForecastStrip'
import { NearbyPhotos } from './NearbyPhotos'
import { PlaceIcon } from './PlaceIcon'
import { SaveButton } from './SaveButton'
import { TrailCard } from './TrailPanel'
import { BackButton, LinkButton, ShareButton } from './ui'

const BLURB: Record<Place['kind'], string> = {
  waterfall: 'Falls are at their most dramatic after rain; fall color on the banks peaks with the surrounding forest.',
  viewpoint: 'A lookout over the canopy: one of the best places on the trail for fall-color photos. Go early or late for soft light.',
  peak: 'A high point with views over the surrounding forest. Expect a climb.',
  lake: 'Calm mornings bring mirror reflections of the fall colors on the shoreline.',
  river: 'River corridors are lined with red maples that turn early.',
  creek: 'Creeks are lined with red maple and alder that color early in the season.',
}

type Props = {
  place: Place
  area: ExploreArea
  trails: Map<string, Trail>
  places: Map<string, Place>
  onBack: () => void
  onSelectTrail: (t: Trail) => void
}

export function PlacePanel({ place, area, trails, places, onBack, onSelectTrail }: Props) {
  const kind = PLACE_KINDS[place.kind]
  const onTrails = place.trails.flatMap((id) => {
    const t = trails.get(id)
    const at = t?.along.find((a) => a.poi === place.id)
    return t ? [{ trail: t, km: at?.km }] : []
  })

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      <ForestCover spec={placeCover(place)} name={place.name} />

      <header className="flex items-start gap-4">
        <span
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ background: kind.color }}
        >
          <PlaceIcon kind={place.kind} className="size-9" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide uppercase" style={{ color: kind.color }}>
            {kind.label}
            {isPhotoSpot(place.kind) && ' · Photo spot'} · {area.name.split(' · ')[0]}
          </p>
          <h2 className="text-3xl leading-tight">{place.name}</h2>
          {place.ele ? <p className="text-sm text-[var(--ink-soft)]">{place.ele} m elevation</p> : null}
        </div>
      </header>

      <section aria-label="Actions" className="-mt-2 flex flex-wrap gap-2">
        <LinkButton primary href={directionsUrl(place.lat, place.lng)} icon={<LocationOn className="size-4" />}>
          Get directions
        </LinkButton>
        <SaveButton stopRef={`place:${place.id}`} name={place.name} />
        <ShareButton title={`${place.name} · Canopy`} />
        <LinkButton href={place.osm} external>
          View on OpenStreetMap
        </LinkButton>
      </section>

      <p className="text-sm leading-relaxed">{BLURB[place.kind]}</p>

      <section>
        <h3 className="mb-1 text-lg">{onTrails.length ? 'Trails that reach it' : 'Trails'}</h3>
        {onTrails.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {onTrails.map(({ trail, km }) => (
              <li key={trail.id}>
                <TrailCard trail={trail} places={places} onClick={() => onSelectTrail(trail)} />
                {km !== undefined && <p className="-mt-1.5 pb-2 pl-[52px] text-xs text-[var(--ink-soft)]">At km {km} along this trail</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">No mapped trail passes here. It may be reachable by road, canoe or an unofficial path.</p>
        )}
      </section>

      <ForecastStrip lat={place.lat} lng={place.lng} />
      <NearbyPhotos lat={place.lat} lng={place.lng} radiusKm={3} />

      <p className="text-[11px] text-[var(--ink-soft)]">Place data © OpenStreetMap contributors.</p>
    </div>
  )
}
