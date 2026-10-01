import type { ReactNode } from 'react'

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
      ← Back
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

export function LinkButton({ href, primary, children }: { href: string; primary?: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        primary
          ? 'rounded-full bg-maple px-4 py-2 text-sm font-medium text-white hover:opacity-90'
          : 'rounded-full border border-[var(--line)] px-4 py-2 text-sm hover:bg-[var(--surface-2)]'
      }
    >
      {children}
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
