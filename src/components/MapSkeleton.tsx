import { TreeIcon } from './TreeIcon'

/** Shown while the map engine downloads and until the first frame of the map is drawn. */
export function MapSkeleton() {
  return (
    <div role="status" aria-label="Loading map" className="absolute inset-0 flex items-center justify-center bg-[var(--surface-2)]">
      <div className="skeleton absolute inset-0 rounded-none opacity-60" />
      <div className="relative flex flex-col items-center gap-2 text-sm text-[var(--ink-soft)]">
        <TreeIcon id="maples" className="size-8 animate-pulse text-maple motion-reduce:animate-none" />
        Loading map…
      </div>
    </div>
  )
}
