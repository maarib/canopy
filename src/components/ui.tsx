import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowBack, ArrowForward, Check, KeyboardArrowDown, Link } from 'relume-icons'
import { usePresence } from '../hooks'
import { ICON_TILE, INFO_ROW, inkOn } from '../lib/styles'

/** The nearest ancestor that scrolls (the desktop panel or the phone sheet). */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p
  return null
}

/**
 * Set while a place's page covers the map (the full panel on phones): calling it brings the map
 * back with the place on it. The detail page's top bar shows a "Show on Map" button for it.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const ShowOnMap = createContext<(() => void) | null>(null)

/**
 * The top bar of a detail page, pinned to the top of the panel: a round back button, and the
 * page's title, which fades in once the page's own heading has scrolled under the bar. Clear while
 * the page is at the top, so the cover shows through; solid once it scrolls.
 */
export function BackButton({ onClick }: { onClick: () => void }) {
  const showOnMap = useContext(ShowOnMap)
  const bar = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [title, setTitle] = useState<string | null>(null)

  useEffect(() => {
    const el = bar.current
    const scroller = scrollParent(el)
    const heading = el?.parentElement?.querySelector('h2')
    if (!el || !scroller) return
    const onScroll = () => setScrolled(scroller.scrollTop > 4)
    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    let io: IntersectionObserver | undefined
    if (heading) {
      io = new IntersectionObserver(
        ([e]) => setTitle(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0) + el.offsetHeight ? (heading.textContent ?? null) : null),
        { root: scroller, rootMargin: `-${el.offsetHeight}px 0px 0px 0px` },
      )
      io.observe(heading)
    }
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      io?.disconnect()
    }
  }, [])

  return (
    <div
      ref={bar}
      className={`sticky top-0 z-20 -mx-5 -mt-5 -mb-2 flex h-14 items-center gap-3 border-b px-4 transition-colors duration-200 ${
        scrolled ? 'border-[var(--line)] bg-[var(--surface)]' : 'border-transparent'
      }`}
    >
      <button
        onClick={onClick}
        aria-label="Back"
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] shadow-sm transition-[background-color,transform] hover:bg-[var(--surface-2)] active:scale-95"
      >
        <ArrowBack className="size-5" />
      </button>
      <span aria-hidden className={`min-w-0 flex-1 truncate font-display text-xl leading-none transition-opacity duration-200 ${title ? 'opacity-100' : 'opacity-0'}`}>
        {title}
      </span>
      {showOnMap && (
        <button
          onClick={showOnMap}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm font-medium shadow-sm transition-[background-color,transform] hover:bg-[var(--surface-2)] active:scale-95"
        >
          <ViewIcon view="map" className="size-4" />
          Show on Map
        </button>
      )}
    </div>
  )
}

/** A label inside a fill of its color: a park's color stage, a trail's difficulty. `sm` for list rows. */
export function Badge({ color, size = 'md', children }: { color: string; size?: 'sm' | 'md'; children: ReactNode }) {
  return (
    <span className={`shrink-0 rounded-full font-medium ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm'}`} style={{ background: color, color: inkOn(color) }}>
      {children}
    </span>
  )
}

/** Diagonal arrow for links that leave Canopy. */
export function ExternalIcon({ className = 'size-4' }: { className?: string }) {
  return <ArrowForward className={`${className} -rotate-45`} />
}

export function LinkButton({
  href,
  primary,
  icon,
  external,
  children,
}: {
  href: string
  primary?: boolean
  /** Leading icon. */
  icon?: ReactNode
  /** Trailing ↗ arrow for links to other sites. */
  external?: boolean
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ${
        primary
          ? 'bg-brand font-medium text-white hover:brightness-110 active:scale-[0.97]'
          : 'border border-[var(--line)] hover:bg-[var(--surface-2)] active:scale-[0.97]'
      }`}
    >
      {icon}
      {children}
      {external && <ExternalIcon className="size-3.5 opacity-70" />}
    </a>
  )
}

export type MoreLink = { label: string; href?: string; onClick?: () => void }

/**
 * The secondary links of a detail page, in one compact row under its main buttons (directions,
 * save, share) and a divider: quiet underlined text, with an arrow on the ones that leave Canopy.
 */
export function MoreLinks({ links }: { links: MoreLink[] }) {
  const cls = 'inline-flex items-center gap-1 underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current'
  if (!links.length) return null
  return (
    <nav aria-label="More links" className="-mt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[var(--line)] pt-3 text-sm text-[var(--ink-soft)]">
      {links.map((l) =>
        l.href ? (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={cls}>
            {l.label}
            <ExternalIcon className="size-3.5" />
          </a>
        ) : (
          <button key={l.label} onClick={l.onClick} className={cls}>
            {l.label}
          </button>
        ),
      )}
    </nav>
  )
}

export function Meter({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{value === null ? '—' : `${value}%`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${value ?? 0}%`, background: color }} />
      </div>
    </div>
  )
}

/** Native share sheet where available (phones), otherwise copy the link. Shares the current page unless `url` is given. */
export function ShareButton({ title, url: shareUrl, label = 'Share' }: { title: string; url?: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = shareUrl ?? window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link', url)
    }
  }
  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2 text-sm transition hover:bg-[var(--surface-2)] active:scale-[0.97] disabled:active:scale-100"
      aria-live="polite"
    >
      {copied ? <Check className="size-4 text-spruce dark:text-[#a9cf8f]" /> : <Link className="size-4" />}
      {copied ? 'Link Copied' : label}
    </button>
  )
}

/** Placeholder block while content loads. Size it with classes. */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={`skeleton block ${className}`} style={style} />
}

/** A loading panel shaped like a place page. */
export function PanelSkeleton({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="space-y-5 p-5" role="status" aria-label={label}>
      <Skeleton className="h-4 w-16" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-40 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-36 rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  )
}

/** Thin determinate progress bar (e.g. sightings streaming in). */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-0.5 w-full overflow-hidden bg-transparent"
    >
      <div className="h-full bg-pumpkin transition-[width] duration-500 ease-out" style={{ width: `${Math.max(4, value * 100)}%` }} />
    </div>
  )
}

/** A fact, facility or activity: icon tile, label (and optional detail), value on the right. Same size as tappable rows. */
export function InfoRow({ icon, label, detail, value }: { icon?: ReactNode; label: ReactNode; detail?: ReactNode; value?: ReactNode }) {
  return (
    <li className={INFO_ROW}>
      {icon && <span className={`${ICON_TILE} bg-[var(--surface-2)]`}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {detail && <span className="block text-xs text-[var(--ink-soft)]">{detail}</span>}
      </span>
      {value != null && <span className="shrink-0 text-sm tabular-nums text-[var(--ink-soft)]">{value}</span>}
    </li>
  )
}

/**
 * Segmented tabs or options (equal widths) with a pill that slides to the selected one.
 * `role` is "tablist" for tabs and "radiogroup" for a single choice.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  role = 'tablist',
  label,
  size = 'sm',
  className = '',
}: {
  options: { id: T; label: ReactNode }[]
  value: T
  onChange: (id: T) => void
  role?: 'tablist' | 'radiogroup'
  label?: string
  size?: 'sm' | 'xs'
  className?: string
}) {
  const n = options.length
  const index = Math.max(0, options.findIndex((o) => o.id === value))
  const item = role === 'tablist' ? 'tab' : 'radio'
  return (
    <div
      role={role}
      aria-label={label}
      className={`relative grid gap-1 rounded-full bg-[var(--surface-2)] p-1 ${size === 'xs' ? 'text-xs' : 'text-sm'} ${className}`}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-[var(--surface)] shadow-sm transition-transform duration-300 ease-[var(--ease-out-soft)]"
        style={{ width: `calc((100% - 0.5rem - ${n - 1} * 0.25rem) / ${n})`, transform: `translateX(calc(${index} * (100% + 0.25rem)))` }}
      />
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            role={item}
            aria-selected={role === 'tablist' ? on : undefined}
            aria-checked={role === 'radiogroup' ? on : undefined}
            onClick={() => onChange(o.id)}
            className={`relative flex items-center justify-center gap-1 rounded-full px-2 font-medium transition-colors ${size === 'xs' ? 'py-1' : 'py-1.5'} ${
              on ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Icons the icon pack doesn't have, drawn to match its outline style ──

const OUTLINE = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export function InfoIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg {...OUTLINE} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.6" r="0.6" fill="currentColor" />
    </svg>
  )
}

/** Something that can be turned round by hand: Material's "360" mark, an arrow looping about an upright axis. */
export function TurnIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 7C6.48 7 2 9.24 2 12c0 2.24 2.94 4.13 7 4.77V20l4-4-4-4v2.73c-3.15-.56-5-1.9-5-2.73 0-1.06 3.04-3 8-3s8 1.94 8 3c0 .73-1.46 1.89-4 2.53v2.05c3.53-.77 6-2.53 6-4.58 0-2.76-4.48-5-10-5z" />
    </svg>
  )
}

/** The three views: the map alone, the map with the panel, the panel alone. */
export function ViewIcon({ view, className = 'size-5' }: { view: 'map' | 'split' | 'panel'; className?: string }) {
  return (
    <svg {...OUTLINE} className={className}>
      {view === 'map' && <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2ZM9 4.5v13M15 6.5v13" />}
      {view === 'split' && <path d="M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2ZM10 4.5v15M5.8 8.5h1.9M5.8 11.5h1.9" />}
      {view === 'panel' && <path d="M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2ZM7.5 9h9M7.5 12h9M7.5 15h5.5" />}
    </svg>
  )
}

/** Canopy's mark: a plain maple leaf in the brand color. */
export function Logo({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`text-brand ${className}`} aria-hidden>
      <path d={LOGO_LEAF} fill="currentColor" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
    </svg>
  )
}
/** Three lobes with a tooth on each shoulder and a short stem. Also public/favicon.svg. */
export const LOGO_LEAF =
  'M50 6 58 21 66 17 63 39 76 28 79 36 92 34 88 47 95 51 76 66 79 74 53 71 53 94 47 94 47 71 21 74 24 66 5 51 12 47 8 34 21 36 24 28 37 39 34 17 42 21Z'

// ── The standard filter and sort control: a pill that opens a menu ──

/**
 * A pill button that opens a menu under it: filters ("Region", "Activities · 2") and sorts
 * ("Sort: Best color"). `value` shows the current choice after the label; `count` shows how many
 * options are set. The pill fills in when something other than the default is chosen (`active`).
 */
export function MenuButton({
  label,
  value,
  count = 0,
  active = count > 0,
  icon,
  width = 260,
  children,
}: {
  label: string
  value?: string
  count?: number
  active?: boolean
  icon?: ReactNode
  width?: number
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState<CSSProperties>()
  const presence = usePresence(open)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  // Anchored to the viewport, so a scrolling row of pills or the panel's edge never clips it.
  const openMenu = () => {
    const r = button.current!.getBoundingClientRect()
    const w = Math.min(width, window.innerWidth - 24)
    setPlace({ top: r.bottom + 6, left: Math.max(12, Math.min(r.left, window.innerWidth - w - 12)), width: w, maxHeight: Math.max(160, window.innerHeight - r.bottom - 24) })
    setOpen(true)
  }
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node) && close()
    // Escape closes the menu and hands focus back to its pill.
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (close(), button.current?.focus())
    const onScroll = (e: Event) => !menu.current?.contains(e.target as Node) && close()
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <div ref={root} className="shrink-0">
      <button
        ref={button}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border py-1.5 pr-2 pl-3 text-sm transition active:scale-[0.97] ${
          active ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]' : `border-[var(--line)] hover:bg-[var(--surface-2)] ${open ? 'bg-[var(--surface-2)]' : ''}`
        }`}
      >
        {icon}
        <span>
          {label}
          {value && <span className="font-medium">: {value}</span>}
          {count > 0 && ` · ${count}`}
        </span>
        <KeyboardArrowDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* Drawn at the top of the page, not inside the panel: the panel's entrance animation makes
          it the reference box for anything fixed inside it, which put the menu in the wrong place. */}
      {presence.mounted &&
        createPortal(
        <div
          ref={menu}
          role="group"
          aria-label={label}
          style={place}
          className={`fixed z-40 origin-top-left ${presence.closing ? 'pointer-events-none animate-pop-out' : 'animate-pop-in'} overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xl`}
        >
          {children(() => setOpen(false))}
        </div>,
          document.body,
        )}
    </div>
  )
}

/** One choice in a MenuButton's menu. */
export function MenuOption({ selected, onClick, icon, label, hint }: { selected: boolean; onClick: () => void; icon?: ReactNode; label: string; hint?: string }) {
  return (
    <button
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm transition-colors ${selected ? 'bg-brand/10' : 'hover:bg-[var(--surface-2)]'}`}
    >
      {icon && <span className="flex size-5 shrink-0 items-center justify-center">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block ${selected ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {hint && <span className="block text-xs text-[var(--ink-soft)]">{hint}</span>}
      </span>
      {selected && <Check className="size-4 shrink-0 text-brand" />}
    </button>
  )
}
