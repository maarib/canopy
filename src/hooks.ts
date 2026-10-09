import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
  )
}

/** Matches Tailwind's `md` breakpoint. */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')

/**
 * `value`, but while `throttling` is true it only updates every `ms` (the latest value wins).
 * Used to stop streamed data from rebuilding the map on every page.
 */
export function useThrottledWhile<T>(value: T, throttling: boolean, ms: number): T {
  const [shown, setShown] = useState(value)
  const latest = useRef(value)
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    latest.current = value
    // At most one timer at a time: new values arriving while it's pending ride along with it.
    if (throttling && !pending.current)
      pending.current = setTimeout(() => {
        pending.current = null
        setShown(latest.current)
      }, ms)
  }, [value, throttling, ms])
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current)
    },
    [],
  )
  return throttling ? shown : value
}

/**
 * Keep something mounted for `ms` after `open` turns false, so it can play an exit animation.
 * `closing` is true during that time. Pair with animate-pop-in / animate-pop-out.
 */
export function usePresence(open: boolean, ms = 120): { mounted: boolean; closing: boolean } {
  const [lingering, setLingering] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  // Adjust state during render when `open` flips (React's recommended pattern over an effect).
  if (wasOpen !== open) {
    setWasOpen(open)
    setLingering(!open)
  }
  useEffect(() => {
    if (!lingering) return
    const t = setTimeout(() => setLingering(false), ms)
    return () => clearTimeout(t)
  }, [lingering, ms])
  return { mounted: open || lingering, closing: !open && lingering }
}
