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

const ITEMS = 'button:not([disabled]), a[href], input:not([disabled]), [role="menuitem"], [role="option"]'

/**
 * Keyboard use for a popover menu or list, the way native menus work: when it opens, focus moves
 * to the chosen item (or the first); ↑ and ↓ move between items, Home and End to the ends; when
 * it closes, focus goes back to whatever opened it. Pass the menu's element (or null while
 * closed). Keys typed in a text field inside the menu are left alone.
 */
export function useMenuKeys(menu: HTMLElement | null) {
  useEffect(() => {
    if (!menu) return
    const opener = document.activeElement as HTMLElement | null
    const items = () => [...menu.querySelectorAll<HTMLElement>(ITEMS)].filter((el) => el.offsetParent !== null || el === document.activeElement)
    // The current choice of a pick-one list (not a switch or tab elsewhere in the menu).
    const chosen = menu.querySelector<HTMLElement>('[role="option"][aria-selected="true"], button[aria-pressed="true"]')
    ;(chosen && items().includes(chosen) ? chosen : items()[0])?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') return
      const list = items()
      const at = list.indexOf(document.activeElement as HTMLElement)
      const to = e.key === 'ArrowDown' ? (at + 1) % list.length : e.key === 'ArrowUp' ? (at - 1 + list.length) % list.length : e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : -1
      if (to < 0 || !list.length) return
      e.preventDefault()
      list[to].focus()
    }
    menu.addEventListener('keydown', onKey)
    return () => {
      menu.removeEventListener('keydown', onKey)
      // Hand focus back only if it was in the menu (not if the person clicked elsewhere).
      if (opener?.isConnected && (document.activeElement === document.body || menu.contains(document.activeElement))) opener.focus({ preventScroll: true })
    }
  }, [menu])
}
