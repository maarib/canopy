import type { ReactNode } from 'react'
import type { PlaceKind } from '../lib/explore'

// Minimal icons for each kind of place, drawn to match the tree icons (24×24, currentColor).

export type PlaceIconId = PlaceKind | 'trail' | 'trailhead'

const signpost = (
  <>
    <rect x="11" y="2.5" width="2" height="19" rx="1" />
    <path d="M13 4.6h6l2.6 2.5L19 9.6h-6z" />
    <path d="M11 10.9H5l-2.6 2.5L5 15.9h6z" />
  </>
)

const ICONS: Record<PlaceIconId, ReactNode> = {
  waterfall: (
    <>
      <rect x="3" y="3" width="18" height="3.4" rx="1.7" />
      <rect x="6.2" y="5.5" width="2.3" height="10.5" rx="1.15" />
      <rect x="10.85" y="5.5" width="2.3" height="13" rx="1.15" />
      <rect x="15.5" y="5.5" width="2.3" height="8.6" rx="1.15" />
      <ellipse cx="7.35" cy="18.9" rx="2.4" ry="1.25" />
      <ellipse cx="12" cy="21.2" rx="2.7" ry="1.3" />
      <ellipse cx="16.65" cy="17.1" rx="2.4" ry="1.25" />
    </>
  ),
  viewpoint: (
    <>
      <path
        fillRule="evenodd"
        d="M6 7h2.2l1.4-2.2h4.8L15.8 7H18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Zm6 2.6a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Z"
      />
      <circle cx="12" cy="13.8" r="2.3" />
    </>
  ),
  peak: (
    <path
      fillRule="evenodd"
      d="M2.5 20.5 9.4 6.6l3.5 6 2.6-3.7 6 11.6Zm6.9-11.3L8.1 11.8l1.3-.7 1.3 1.2.6-.7Z"
    />
  ),
  lake: (
    <g fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <path d="M3 8.5c1.5-1.7 3-1.7 4.5 0s3 1.7 4.5 0 3-1.7 4.5 0 3 1.7 4.5 0" />
      <path d="M3 13.5c1.5-1.7 3-1.7 4.5 0s3 1.7 4.5 0 3-1.7 4.5 0 3 1.7 4.5 0" />
      <path d="M3 18.5c1.5-1.7 3-1.7 4.5 0s3 1.7 4.5 0 3-1.7 4.5 0 3 1.7 4.5 0" />
    </g>
  ),
  river: (
    <path d="M6.5 2.5c0 6 11 4.5 11 10.5S6.5 15 6.5 21.5" fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
  ),
  creek: (
    <>
      <path d="M8 2.5c0 6 8.5 4.5 8.5 10.5S8 15 8 21.5" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="17.6" cy="19.2" r="1.6" />
      <circle cx="5.6" cy="9.4" r="1.3" />
    </>
  ),
  trail: signpost,
  trailhead: signpost,
}

export function PlaceIcon({ kind, className = 'size-4' }: { kind: PlaceIconId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      {ICONS[kind]}
    </svg>
  )
}
