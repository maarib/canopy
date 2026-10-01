import { useSyncExternalStore } from 'react'

// The elevation chart's hover point changes ~60 times a second while dragging. Keeping it in a
// tiny external store means only the map's hover marker re-renders, not the whole app.

type Point = [number, number] | null
let point: Point = null
const listeners = new Set<() => void>()

export function setHoverPoint(next: Point) {
  if (next === point || (next && point && next[0] === point[0] && next[1] === point[1])) return
  point = next
  listeners.forEach((l) => l())
}

export function useHoverPoint(): Point {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => point,
  )
}
