import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

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

/**
 * A long list shown in steps: the first `step` items at once, and `step` more each time the
 * sentinel (put after the list) comes within a screen of view. Starts over when `items` changes.
 * Building a few hundred rows in one go froze slower phones for a third of a second.
 */
export function useGrowingList<T>(items: T[], step = 40): { shown: T[]; sentinel: (el: HTMLElement | null) => void } {
  const [count, setCount] = useState(step)
  const [source, setSource] = useState(items)
  if (source !== items) {
    setSource(items)
    setCount(step)
  }
  const observer = useRef<IntersectionObserver | null>(null)
  const sentinel = useCallback(
    (el: HTMLElement | null) => {
      observer.current?.disconnect()
      if (!el) return
      observer.current = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setCount((n) => n + step), { rootMargin: '100% 0px' })
      observer.current.observe(el)
    },
    [step],
  )
  return { shown: count >= items.length ? items : items.slice(0, count), sentinel }
}
