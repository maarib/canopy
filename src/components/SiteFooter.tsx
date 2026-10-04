import { ExternalIcon } from './ui'

/** Computed once when the app loads, so the footer never shows a stale year. */
const YEAR = new Date().getFullYear()

/**
 * One quiet line at the end of every panel, pushed to the bottom when the page is short: the
 * copyright on the left; About, Data sources and the maker's site on the right.
 */
export function SiteFooter({ onNavigate }: { onNavigate: (path: string) => void }) {
  const link = 'underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current'
  return (
    <footer className="mx-5 mt-auto mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[var(--line)] pt-4 text-xs text-[var(--ink-soft)]">
      <span>© Canopy {YEAR}</span>
      <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button onClick={() => onNavigate('/about')} className={link}>
          About
        </button>
        <button onClick={() => onNavigate('/sources')} className={link}>
          Data sources
        </button>
        <a href="https://www.maaribs.com" target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 ${link}`}>
          maaribs.com
          <ExternalIcon className="size-3.5" />
        </a>
      </span>
    </footer>
  )
}
