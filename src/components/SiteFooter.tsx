import { ExternalIcon } from './ui'

const CREDITS: [string, string][] = [
  ['Ontario Parks', 'https://www.ontarioparks.ca'],
  ['iNaturalist', 'https://www.inaturalist.org'],
  ['Ontario Ministry of Natural Resources', 'https://data.ontario.ca'],
  ['Parks Canada', 'https://open.canada.ca/data/en/organization/pc'],
  ['NASA GIBS', 'https://earthdata.nasa.gov/gibs'],
  ['Open-Meteo', 'https://open-meteo.com'],
  ['OpenStreetMap contributors', 'https://www.openstreetmap.org/copyright'],
  ['Mapbox', 'https://www.mapbox.com/about/maps/'],
]

/** Computed once when the app loads, so the footer never shows a stale year. */
const YEAR = new Date().getFullYear()

const LINK = 'underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current'

/** Bottom of every panel: copyright, site link and data credits. */
export function SiteFooter() {
  return (
    <footer className="mx-5 mt-2 mb-6 space-y-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--ink-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>© Canopy {YEAR}</span>
        <a
          href="https://www.maaribs.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-[var(--ink)] transition-colors hover:text-maple"
        >
          maaribs.com
          <ExternalIcon className="size-3.5" />
        </a>
      </div>
      <p className="leading-relaxed">
        Maps and data from{' '}
        {CREDITS.map(([name, href], i) => (
          <span key={name}>
            <a href={href} target="_blank" rel="noreferrer" className={LINK}>
              {name}
            </a>
            {i < CREDITS.length - 2 ? ', ' : i === CREDITS.length - 2 ? ' and ' : '. '}
          </span>
        ))}
        Ontario government data is used under the Open Government Licence – Ontario, Parks Canada data under the Open Government
        Licence – Canada. Icons by{' '}
        <a href="https://icons8.com" target="_blank" rel="noreferrer" className={LINK}>
          Icons8
        </a>
        .
      </p>
    </footer>
  )
}
