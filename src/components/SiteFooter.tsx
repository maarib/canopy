import { ExternalIcon } from './ui'

/** Computed once when the app loads, so the footer never shows a stale year. */
const YEAR = new Date().getFullYear()

/**
 * One quiet line at the end of every panel. The full list of data sources and licences lives on
 * the About page (also in the account menu), so the footer stays short.
 */
export function SiteFooter({ onAbout }: { onAbout: () => void }) {
  return (
    <footer className="mx-5 mt-2 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--line)] pt-4 text-xs text-[var(--ink-soft)]">
      <span>© Canopy {YEAR}</span>
      <span aria-hidden>·</span>
      <button onClick={onAbout} className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current">
        About & data sources
      </button>
      <a
        href="https://www.maaribs.com"
        target="_blank"
        rel="noreferrer"
        className="ml-auto inline-flex items-center gap-1 font-medium text-[var(--ink)] transition-colors hover:text-maple"
      >
        maaribs.com
        <ExternalIcon className="size-3.5" />
      </a>
    </footer>
  )
}
