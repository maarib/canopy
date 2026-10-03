import { useMemo, useState } from 'react'
import { ChevronRight, FilterList, Search } from 'relume-icons'
import { PARK_FILTERS } from '../data/amenityIcons'
import { DIFFICULTY, PLACE_KINDS, type Difficulty, type Place, type PlaceKind, type Trail } from '../lib/explore'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { normalize } from '../lib/search'
import { STAGE_ORDER, STAGES } from '../lib/stage'
import { ICON_TILE, LIST, ROW } from '../lib/styles'
import { ActivityOptions } from './ActivityFilter'
import { PlaceIcon } from './PlaceIcon'
import { TrailCard } from './TrailPanel'
import { ExternalIcon, InfoRow } from './ui'

// Dedicated pages for the Parks and Trails sections (and About). Each is a list with its own
// search, filters and sort; the map beside it shows the same things.

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <h2 className="text-3xl leading-tight">{title}</h2>
      <p className="text-sm text-[var(--ink-soft)]">{subtitle}</p>
    </header>
  )
}

function FilterInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 focus-within:ring-2 focus-within:ring-maple/40">
      <Search className="size-5 shrink-0 text-[var(--ink-soft)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-soft)]"
      />
    </label>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        on ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]' : 'border-[var(--line)] hover:bg-[var(--surface-2)]'
      }`}
    >
      {children}
    </button>
  )
}

// ── Parks ──────────────────────────────────────────────────

type ParkSort = 'colour' | 'name'

export function ParksPanel({
  parks,
  activities,
  onActivities,
  countWith,
  facilitiesReady,
  onSelectPark,
}: {
  /** Report locations already narrowed by the activity filter. */
  parks: ParkReport[] | undefined
  activities: string[]
  onActivities: (ids: string[]) => void
  countWith: (ids: string[]) => number
  facilitiesReady: boolean
  onSelectPark: (p: ParkReport) => void
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<ParkSort>('colour')
  const [showFilters, setShowFilters] = useState(activities.length > 0)

  const list = useMemo(() => {
    const q = normalize(query)
    return (parks ?? [])
      .filter((p) => p.main && (!q || normalize(parkTitle(p)).includes(q)))
      .sort((a, b) =>
        sort === 'name'
          ? parkTitle(a).localeCompare(parkTitle(b))
          : STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || (b.colourChange ?? 0) - (a.colourChange ?? 0),
      )
  }, [parks, query, sort])

  return (
    <div className="space-y-4 p-5">
      <PageHeader title="Parks" subtitle="Ontario Parks with fall colour reports, facilities and activities" />
      <FilterInput value={query} onChange={setQuery} placeholder="Find a park" />

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Chip on={showFilters || activities.length > 0} onClick={() => setShowFilters(!showFilters)}>
          <FilterList className="size-4" />
          Activities{activities.length > 0 && ` · ${activities.length}`}
        </Chip>
        <Chip on={sort === 'colour'} onClick={() => setSort('colour')}>
          Best colour first
        </Chip>
        <Chip on={sort === 'name'} onClick={() => setSort('name')}>
          A–Z
        </Chip>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-[var(--line)] p-2">
          <ActivityOptions value={activities} onChange={onActivities} countWith={countWith} ready={facilitiesReady} />
        </div>
      )}
      {!showFilters && activities.length > 0 && (
        <p className="text-sm">
          With <strong className="font-semibold">{activities.map((id) => PARK_FILTERS.get(id)?.label).join(', ')}</strong>{' '}
          <button onClick={() => onActivities([])} className="ml-1 text-xs font-medium text-maple hover:underline">
            Clear
          </button>
        </p>
      )}

      <p className="text-xs text-[var(--ink-soft)]">{parks ? `${list.length} parks` : 'Loading parks…'}</p>
      <ul className={LIST}>
        {list.map((p) => (
          <li key={p.id}>
            <button onClick={() => onSelectPark(p)} className={ROW}>
              <span className={`${ICON_TILE} bg-[var(--surface-2)]`}>
                <span className="size-3.5 rounded-full" style={{ background: STAGES[p.stage].color }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{parkTitle(p)}</span>
                <span className="text-xs text-[var(--ink-soft)]">
                  {p.region} · {p.colourChange ?? 0}% colour
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium" style={{ color: STAGES[p.stage].color }}>
                {STAGES[p.stage].label}
              </span>
              <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
            </button>
          </li>
        ))}
      </ul>
      {parks && !list.length && <p className="py-6 text-center text-sm text-[var(--ink-soft)]">No parks match. Try fewer activities or another name.</p>}
      <p className="text-[11px] text-[var(--ink-soft)]">
        All 340 Ontario Parks have facility data; the ones with fall colour reports are shown here and on the map. The rest are coming.
      </p>
    </div>
  )
}

// ── Trails & places ────────────────────────────────────────

const DIFFICULTIES: Difficulty[] = ['easy', 'moderate', 'hard', 'backpacking']
const PLACE_TABS: PlaceKind[] = ['waterfall', 'viewpoint', 'lake', 'peak', 'river', 'creek']

/** `show` is "trails" or a place kind (from ?show=). */
export function TrailsPanel({
  trails,
  places,
  show,
  onShow,
  onSelectTrail,
  onSelectPlace,
}: {
  trails: Trail[]
  places: Place[]
  show: 'trails' | PlaceKind
  onShow: (s: 'trails' | PlaceKind) => void
  onSelectTrail: (t: Trail) => void
  onSelectPlace: (p: Place) => void
}) {
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p] as const)), [places])
  const q = normalize(query)

  const trailList = trails
    .filter((t) => (!difficulty || t.difficulty === difficulty) && (!q || normalize(t.name).includes(q)))
    .sort((a, b) => a.lengthKm - b.lengthKm)
  const placeList = places
    .filter((p) => p.kind === show && !/^(Lookout on|Unnamed)/.test(p.name) && (!q || normalize(p.name).includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name))
  const kindsWithPlaces = PLACE_TABS.filter((k) => places.some((p) => p.kind === k && !/^(Lookout on|Unnamed)/.test(p.name)))

  return (
    <div className="space-y-4 p-5">
      <PageHeader title="Trails" subtitle="Hikes, waterfalls, lookouts and lakes, with what's along each trail" />
      <FilterInput value={query} onChange={setQuery} placeholder={show === 'trails' ? 'Find a trail' : `Find a ${PLACE_KINDS[show].label.toLowerCase()}`} />

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Chip on={show === 'trails'} onClick={() => onShow('trails')}>
          <PlaceIcon kind="trail" className="size-4" />
          Trails
        </Chip>
        {kindsWithPlaces.map((k) => (
          <Chip key={k} on={show === k} onClick={() => onShow(k)}>
            <PlaceIcon kind={k} className="size-4" />
            {PLACE_KINDS[k].plural}
          </Chip>
        ))}
      </div>

      {show === 'trails' ? (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Difficulty">
            <Chip on={!difficulty} onClick={() => setDifficulty(null)}>
              Any difficulty
            </Chip>
            {DIFFICULTIES.map((d) => (
              <Chip key={d} on={difficulty === d} onClick={() => setDifficulty(difficulty === d ? null : d)}>
                <span className="size-2 rounded-full" style={{ background: DIFFICULTY[d].color }} />
                {DIFFICULTY[d].label}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-[var(--ink-soft)]">{trailList.length} trails · shortest first</p>
          <ul className={LIST}>
            {trailList.map((t) => (
              <li key={t.id}>
                <TrailCard trail={t} places={placeById} onClick={() => onSelectTrail(t)} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-xs text-[var(--ink-soft)]">{placeList.length} {PLACE_KINDS[show].plural.toLowerCase()}</p>
          <ul className={LIST}>
            {placeList.map((p) => (
              <li key={p.id}>
                <button onClick={() => onSelectPlace(p)} className={ROW}>
                  <span className={`${ICON_TILE} text-white`} style={{ background: PLACE_KINDS[p.kind].color }}>
                    <PlaceIcon kind={p.kind} className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {PLACE_KINDS[p.kind].label}
                      {p.ele ? ` · ${p.ele} m` : ''}
                      {p.trails.length ? ` · on ${p.trails.length} trail${p.trails.length > 1 ? 's' : ''}` : ''}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="text-[11px] text-[var(--ink-soft)]">Algonquin's Highway 60 corridor for now; more areas are on the way.</p>
    </div>
  )
}

// ── About & data sources ───────────────────────────────────

const SOURCES: { name: string; url: string; what: string; licence: string; refresh: string }[] = [
  { name: 'Ontario Parks', url: 'https://www.ontarioparks.ca/fallcolour', what: 'Fall colour reports, park activities and facilities', licence: 'Ontario Parks website', refresh: 'Daily · weekly' },
  { name: 'iNaturalist', url: 'https://www.inaturalist.org', what: 'Tree sightings and nearby photos', licence: "Observers' CC licences", refresh: 'Live' },
  { name: 'Ontario Ministry of Natural Resources', url: 'https://data.ontario.ca/dataset/fishing-access-points', what: 'Fishing access points (Fish ON-Line), Ontario Trail Network', licence: 'Open Government Licence – Ontario', refresh: 'Monthly · weekly' },
  { name: 'Parks Canada', url: 'https://open.canada.ca/data/en/organization/pc', what: 'National park trails', licence: 'Open Government Licence – Canada', refresh: 'Live' },
  { name: 'OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright', what: 'Waterfalls, lookouts, lakes, creeks; basemap data', licence: 'ODbL', refresh: 'Weekly' },
  { name: 'Mapbox', url: 'https://www.mapbox.com/about/maps/', what: 'Basemap, terrain and globe', licence: 'Mapbox terms', refresh: 'Live' },
  { name: 'NASA GIBS', url: 'https://earthdata.nasa.gov/gibs', what: 'VIIRS satellite imagery', licence: 'Public domain', refresh: 'Daily' },
  { name: 'Open-Meteo', url: 'https://open-meteo.com', what: '7-day outlook', licence: 'CC BY 4.0', refresh: 'Live' },
]

export function AboutPanel() {
  return (
    <div className="space-y-6 p-5">
      <PageHeader title="About Canopy" subtitle="A one-stop shop for nature lovers and explorers" />
      <p className="text-sm leading-relaxed">
        Canopy brings together fall colour, parks, trails, lakes and fishing spots so you can plan a day outside in one place. It starts
        with Ontario, with fall colour across Canada, and will grow from there.
      </p>
      <section>
        <h3 className="text-lg">Data sources</h3>
        <ul className={LIST}>
          {SOURCES.map((s) => (
            <InfoRow
              key={s.name}
              label={
                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-maple">
                  {s.name}
                  <ExternalIcon className="size-3.5 text-[var(--ink-soft)]" />
                </a>
              }
              detail={`${s.what} · ${s.licence}`}
              value={s.refresh}
            />
          ))}
        </ul>
      </section>
      <section className="space-y-1 text-sm">
        <h3 className="text-lg">Design</h3>
        <p className="text-[var(--ink-soft)]">
          Leaf icons are Canopy's own. Place and activity icons by{' '}
          <a href="https://icons8.com" target="_blank" rel="noreferrer" className="underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--ink)]">
            Icons8
          </a>
          ; interface icons by Relume. Type: Londrina Solid and Livvic.
        </p>
      </section>
    </div>
  )
}
