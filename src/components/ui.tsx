import { useState, type ReactNode } from 'react'
import { ArrowBack, ArrowForward, Check, Link } from 'relume-icons'

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
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm ${
        primary
          ? 'bg-maple font-medium text-white hover:opacity-90'
          : 'border border-[var(--line)] hover:bg-[var(--surface-2)]'
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

/** Native share sheet where available (phones), otherwise copy the link. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = window.location.href
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
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2 text-sm hover:bg-[var(--surface-2)]"
      aria-live="polite"
    >
      {copied ? <Check className="size-4 text-spruce dark:text-[#a9cf8f]" /> : <Link className="size-4" />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  )
}
