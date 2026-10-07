import { useMemo, useState } from 'react'
import { FilterList, Search } from 'relume-icons'
import { PARK_FILTERS } from '../data/amenityIcons'
import { DIFFICULTY, PLACE_KINDS, type Difficulty, type Place, type PlaceKind, type Trail } from '../lib/explore'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { normalize } from '../lib/search'
import { STAGE_ORDER } from '../lib/stage'
import { LIST } from '../lib/styles'
import { ActivityOptions } from './ActivityFilter'
import { PlaceIcon } from './PlaceIcon'
import { ParkRow, PlaceRow } from './rows'
import { TrailCard } from './TrailPanel'
import { ExternalIcon, InfoRow, MenuButton, MenuOption } from './ui'

// Dedicated pages for the Parks and Places sections (and About). Each is a list with its own
// search, and filters and sorts as menu pills (MenuButton); the map beside it shows the same things.

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
    <label className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 focus-within:ring-2 focus-within:ring-brand/40">
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
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition active:scale-[0.97] ${
        on ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]' : 'border-[var(--line)] hover:bg-[var(--surface-2)]'
      }`}
    >
      {children}
    </button>
  )
}

// ── Parks ──────────────────────────────────────────────────

/** Ontario Parks writes two of its regions both ways ("Northeast" and "Northeastern"); the filter treats each pair as one. */
const regionOf = (p: ParkReport) => p.region.replace(/^(North(?:east|west))$/, '$1ern')

type ParkSort = 'color' | 'name'
const PARK_SORTS: Record<ParkSort, string> = { color: 'Best color', name: 'A–Z' }

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
  const [sort, setSort] = useState<ParkSort>('color')
  const [region, setRegion] = useState<string | null>(null)
  const regions = useMemo(() => [...new Set((parks ?? []).filter((p) => p.main).map(regionOf))].sort(), [parks])

  const list = useMemo(() => {
    const q = normalize(query)
    return (parks ?? [])
      .filter((p) => p.main && (!region || regionOf(p) === region) && (!q || normalize(parkTitle(p)).includes(q)))
      .sort((a, b) =>
        sort === 'name'
          ? parkTitle(a).localeCompare(parkTitle(b))
          : STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || (b.colorChange ?? 0) - (a.colorChange ?? 0),
      )
  }, [parks, query, sort, region])

  return (
    <div className="space-y-4 p-5">
      <PageHeader title="Parks" subtitle="Ontario Parks with fall color reports, facilities and activities" />
      <FilterInput value={query} onChange={setQuery} placeholder="Find a park" />

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        <MenuButton label="Region" value={region ?? undefined} active={!!region}>
          {(close) => (
            <>
              <MenuOption selected={!region} label="All regions" onClick={() => (setRegion(null), close())} />
              {regions.map((r) => (
                <MenuOption key={r} selected={region === r} label={r} onClick={() => (setRegion(r), close())} />
              ))}
            </>
          )}
        </MenuButton>
        <MenuButton label="Activities" count={activities.length} icon={<FilterList className="size-4" />} width={340}>
          {() => <ActivityOptions value={activities} onChange={onActivities} countWith={countWith} ready={facilitiesReady} />}
        </MenuButton>
        <MenuButton label="Sort" value={PARK_SORTS[sort]} active={false}>
          {(close) =>
            (Object.keys(PARK_SORTS) as ParkSort[]).map((id) => <MenuOption key={id} selected={sort === id} label={PARK_SORTS[id]} onClick={() => (setSort(id), close())} />)
          }
        </MenuButton>
      </div>

      {activities.length > 0 && (
        <p className="text-sm">
          With <strong className="font-semibold">{activities.map((id) => PARK_FILTERS.get(id)?.label).join(', ')}</strong>{' '}
          <button onClick={() => onActivities([])} className="ml-1 text-xs font-medium text-brand hover:underline">
            Clear
          </button>
        </p>
      )}

      <p className="text-xs text-[var(--ink-soft)]">{parks ? `${list.length} parks` : 'Loading parks…'}</p>
      <ul className={`stagger ${LIST}`}>
        {list.map((p) => (
          <li key={p.id}>
            <ParkRow park={p} onClick={() => onSelectPark(p)} />
          </li>
        ))}
      </ul>
      {parks && !list.length && <p className="py-6 text-center text-sm text-[var(--ink-soft)]">No parks match. Try another region, fewer activities or another name.</p>}
      <p className="text-[11px] text-[var(--ink-soft)]">
        All 340 Ontario Parks have facility data; the ones with fall color reports are shown here and on the map. The rest are coming.
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
  initialDifficulty,
  onShow,
  onSelectTrail,
  onSelectPlace,
}: {
  trails: Trail[]
  places: Place[]
  show: 'trails' | PlaceKind
  /** A difficulty to start on (from ?level=, e.g. the landing page's "Easy trails"). */
  initialDifficulty?: string | null
  onShow: (s: 'trails' | PlaceKind) => void
  onSelectTrail: (t: Trail) => void
  onSelectPlace: (p: Place) => void
}) {
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | null>(DIFFICULTIES.includes(initialDifficulty as Difficulty) ? (initialDifficulty as Difficulty) : null)
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
      <PageHeader title="Places" subtitle="Trails, waterfalls, lookouts, lakes and peaks, with what's along each trail" />
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            <MenuButton label="Difficulty" value={difficulty ? DIFFICULTY[difficulty].label : undefined} active={!!difficulty} icon={<FilterList className="size-4" />}>
              {(close) => (
                <>
                  <MenuOption selected={!difficulty} label="Any difficulty" onClick={() => (setDifficulty(null), close())} />
                  {DIFFICULTIES.map((d) => (
                    <MenuOption
                      key={d}
                      selected={difficulty === d}
                      icon={<span className="size-2.5 rounded-full" style={{ background: DIFFICULTY[d].color }} />}
                      label={DIFFICULTY[d].label}
                      onClick={() => (setDifficulty(d), close())}
                    />
                  ))}
                </>
              )}
            </MenuButton>
          </div>
          <p className="text-xs text-[var(--ink-soft)]">{trailList.length} trails · shortest first</p>
          <ul className={`stagger ${LIST}`}>
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
          <ul className={`stagger ${LIST}`}>
            {placeList.map((p) => (
              <li key={p.id}>
                <PlaceRow place={p} onClick={() => onSelectPlace(p)} />
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="text-[11px] text-[var(--ink-soft)]">Algonquin's Highway 60 corridor for now; more areas are on the way.</p>
    </div>
  )
}

// ── About, and data sources ───────────────────────────────────

const SOURCES: { name: string; url: string; what: string; licence: string; refresh: string }[] = [
  { name: 'Ontario Parks', url: 'https://www.ontarioparks.ca/fallcolour', what: 'Fall color reports, park activities and facilities', licence: 'Ontario Parks website', refresh: 'Daily · weekly' },
  { name: 'iNaturalist', url: 'https://www.inaturalist.org', what: 'Tree sightings and nearby photos', licence: "Observers' CC licences", refresh: 'Live' },
  { name: 'Ontario Ministry of Natural Resources', url: 'https://data.ontario.ca/dataset/fishing-access-points', what: 'Provincial park boundaries, fishing access points (Fish ON-Line), Ontario Trail Network', licence: 'Open Government Licence – Ontario', refresh: 'Monthly · weekly' },
  { name: 'Parks Canada', url: 'https://open.canada.ca/data/en/organization/pc', what: 'National park trails', licence: 'Open Government Licence – Canada', refresh: 'Live' },
  { name: 'OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright', what: 'Waterfalls, lookouts, lakes, creeks; basemap data', licence: 'ODbL', refresh: 'Weekly' },
  { name: 'Mapbox', url: 'https://www.mapbox.com/about/maps/', what: 'Basemap, satellite imagery and terrain', licence: 'Mapbox terms', refresh: 'Live' },
  { name: 'Natural Earth', url: 'https://www.naturalearthdata.com', what: "Ontario's outline, for the color outlook", licence: 'Public domain', refresh: 'Fixed' },
  { name: 'NASA GIBS', url: 'https://earthdata.nasa.gov/gibs', what: 'VIIRS satellite imagery', licence: 'Public domain', refresh: 'Daily' },
  { name: 'Open-Meteo', url: 'https://open-meteo.com', what: '7-day weather forecast', licence: 'CC BY 4.0', refresh: 'Live' },
]

/** The story of Canopy, in its maker's words. */
const DESIGN: { name: string; url?: string; what: string; by: string }[] = [
  { name: 'Logo and leaf icons', what: 'The maple mark and the thirteen tree icons', by: 'Canopy' },
  { name: 'Island covers', what: "Each place's real shape as a low-poly island in today's colors", by: 'Canopy' },
  { name: 'Place icons', what: 'Trails, waterfalls, lookouts, peaks, lakes, rivers and creeks', by: 'Canopy' },
  { name: 'Activity and facility icons', url: 'https://icons8.com', what: 'Windows 11 Color set', by: 'Icons8' },
  { name: 'Interface icons', url: 'https://www.npmjs.com/package/relume-icons', what: 'Buttons, menus and navigation', by: 'Relume' },
  { name: 'Londrina Solid', url: 'https://fonts.google.com/specimen/Londrina+Solid', what: 'Titles and headings', by: 'Google Fonts' },
  { name: 'Livvic', url: 'https://fonts.google.com/specimen/Livvic', what: 'Everything else', by: 'Google Fonts' },
]

/** What Canopy does for accessibility today, stated as checked facts, and what is still open. */
const ACCESS: [string, string][] = [
  ['Readable text', 'Body text, labels and badges meet WCAG AA contrast (4.5:1) in light and dark. Badges switch between white and dark text to suit their color.'],
  ['Color is never the only signal', 'Every fall color stage and trail difficulty is written out beside its color.'],
  ['Keyboard', 'Every button, link, menu and map pin can be reached with Tab and shows a clear focus ring. Escape closes menus.'],
  ['Screen readers', 'Controls, map pins and loading states have names. The parks, trails and places on the map are also in lists you can read.'],
  ['Motion', 'Animations switch off when your device asks for reduced motion.'],
  ['Your settings', 'Light and dark follow your device, and the layout adapts from a phone to a wide screen.'],
]

export function AboutPanel({ onData }: { onData: () => void }) {
  return (
    <div className="space-y-6 p-5">
      <PageHeader title="About Canopy" subtitle="A one-stop shop for nature lovers and explorers" />
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          Canopy started as something I made for myself. Every fall I wanted to know where the color was, and every trip meant the
          same routine: a park report in one tab, a trail map in another, the weather in a third, and a guess at whether the drive
          would be worth it.
        </p>
        <p>
          So I built one place to plan my own trips. First a map of fall color. Then the parks, and what each one offers. Then
          trails, waterfalls, lookouts and lakes, and a way to string them together into a day out.
        </p>
        <p>
          Somewhere along the way it stopped being only mine. It grew into what you're looking at today: a single place to see
          what's out there, pick where to go, and plan the trip. It starts with Ontario, with fall color across Canada, and it
          will keep growing from there.
        </p>
        <p>If it helps you get outside a little more often, it has done its job.</p>
      </div>
      <section>
        <h3 className="text-lg">Accessibility</h3>
        <p className="mt-1 text-sm leading-relaxed">
          Canopy is built so anyone can plan a day outside with it. It is checked against the WCAG 2.1 AA guidelines with an automated
          audit across its main pages, in light and dark and on phone and desktop sizes.
        </p>
        <ul className={LIST}>
          {ACCESS.map(([label, detail]) => (
            <InfoRow key={label} label={label} detail={detail} />
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)]">
          Still to do: orange buttons and orange links on light backgrounds are below the AA contrast target, menus don't yet respond to arrow keys, and Canopy
          hasn't had a full test with a screen reader. If something gets in your way,{' '}
          <a href="https://github.com/maarib/canopy/issues/new" target="_blank" rel="noreferrer" className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current">
            tell us
          </a>
          .
        </p>
      </section>
      <p className="text-sm text-[var(--ink-soft)]">
        Everything here is built on open and public data.{' '}
        <button onClick={onData} className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current">
          See the data sources
        </button>
        .
      </p>
      <p className="text-[11px] text-[var(--ink-soft)]">
        Canopy v{VERSION} ·{' '}
        <a href={`https://github.com/maarib/canopy/releases/tag/v${__APP_VERSION__}`} target="_blank" rel="noreferrer" className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current">
          What's new
        </a>
      </p>
    </div>
  )
}

/** Every source: what it provides, its licence and how often it refreshes. */
export function DataSourcesPanel() {
  return (
    <div className="space-y-6 p-5">
      <PageHeader title="Data sources" subtitle="Where everything in Canopy comes from" />
      <ul className={`stagger ${LIST}`}>
        {SOURCES.map((s) => (
          <InfoRow
            key={s.name}
            label={
              // Inline, with the arrow tied to the last word, so it follows the name when it wraps.
              <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-brand">
                {s.name}
                {'\u00a0'}
                <ExternalIcon className="inline size-3.5 align-[-2px] text-[var(--ink-soft)]" />
              </a>
            }
            detail={`${s.what} · ${s.licence}`}
            value={s.refresh}
          />
        ))}
      </ul>
      <section>
        <h3 className="text-lg">Design</h3>
        <ul className={`stagger ${LIST}`}>
          {DESIGN.map((d) => (
            <InfoRow
              key={d.name}
              label={
                d.url ? (
                  <a href={d.url} target="_blank" rel="noreferrer" className="hover:text-brand">
                    {d.name}
                    {'\u00a0'}
                    <ExternalIcon className="inline size-3.5 align-[-2px] text-[var(--ink-soft)]" />
                  </a>
                ) : (
                  d.name
                )
              }
              detail={d.what}
              value={d.by}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

/** "1.1.0" → "1.1"; a patch release keeps its last number ("1.1.2"). */
const VERSION = __APP_VERSION__.replace(/\.0$/, '')
