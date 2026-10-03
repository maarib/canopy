import { useState, type ReactNode } from 'react'
import { ArrowBack, ArrowForward, Check, Link } from 'relume-icons'
import { ICON_TILE, INFO_ROW } from '../lib/styles'

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="-ml-1 flex items-center gap-1 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
      <ArrowBack className="size-4" />
      Back
    </button>
  )
}

export function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-sm font-medium text-white" style={{ background: color }}>
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
          ? 'bg-maple font-medium text-white hover:brightness-110 active:scale-[0.97]'
          : 'border border-[var(--line)] hover:bg-[var(--surface-2)] active:scale-[0.97]'
      }`}
    >
      {icon}
      {children}
      {external && <ExternalIcon className="size-3.5 opacity-70" />}
    </a>
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
      {copied ? 'Link copied' : label}
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
