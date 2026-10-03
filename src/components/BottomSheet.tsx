import { useEffect, useRef, useState, type ReactNode } from 'react'

// Mobile bottom sheet with three snap points, Google Maps / Apple Maps style.
export type SnapPoint = 'peek' | 'half' | 'full'

/** `bottom` is the space taken by the tab bar under the sheet. */
const baseHeightFor = (snap: SnapPoint, bottom = 0) => {
  const vh = window.innerHeight - bottom
  return snap === 'peek' ? 132 : snap === 'half' ? Math.round(vh * 0.52) : Math.round(vh * 0.9)
}

type Props = {
  snap: SnapPoint
  onSnap: (s: SnapPoint) => void
  /** Changes when the sheet shows something new, so it scrolls back to the top. */
  contentKey: string
  /** Height of anything fixed below the sheet (the bottom tab bar). */
  bottomOffset?: number
  children: ReactNode
}

export function BottomSheet({ snap, onSnap, contentKey, bottomOffset = 0, children }: Props) {
  const heightFor = (s: SnapPoint) => baseHeightFor(s, bottomOffset)
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const start = useRef<{ y: number; h: number } | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // New content starts at the top.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [contentKey])

  function onPointerDown(e: React.PointerEvent) {
    start.current = { y: e.clientY, h: heightFor(snap) }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return
    setDragHeight(Math.max(96, Math.min((window.innerHeight - bottomOffset) * 0.95, start.current.h + start.current.y - e.clientY)))
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!start.current) return
    const moved = Math.abs(e.clientY - start.current.y)
    const h = dragHeight ?? start.current.h
    start.current = null
    setDragHeight(null)
    if (moved < 6) return onSnap(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half') // tap
    const snaps: SnapPoint[] = ['peek', 'half', 'full']
    onSnap(snaps.reduce((best, s) => (Math.abs(heightFor(s) - h) < Math.abs(heightFor(best) - h) ? s : best)))
  }

  return (
    <section
      className="fixed inset-x-0 z-20 flex flex-col rounded-t-3xl border-t border-[var(--line)] bg-[var(--surface)] shadow-[0_-8px_30px_rgba(0,0,0,0.18)]"
      style={{ bottom: bottomOffset, height: dragHeight ?? heightFor(snap), // A gentle spring: settles with a hint of overshoot.
        transition: dragHeight === null ? 'height 380ms cubic-bezier(0.3, 1.1, 0.45, 1)' : 'none' }}
    >
      <div
        className="group flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1.5 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Resize panel"
        aria-valuetext={snap}
        aria-valuenow={snap === 'peek' ? 0 : snap === 'half' ? 1 : 2}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') onSnap(snap === 'peek' ? 'half' : 'full')
          if (e.key === 'ArrowDown') onSnap(snap === 'full' ? 'half' : 'peek')
        }}
      >
        <span className="h-1.5 w-10 rounded-full bg-[var(--line)] transition-colors group-hover:bg-[var(--ink-soft)]" />
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </section>
  )
}
