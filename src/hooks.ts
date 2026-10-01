import { useSyncExternalStore } from 'react'

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

export const usePrefersDark = () => useMediaQuery('(prefers-color-scheme: dark)')
/** Matches Tailwind's `md` breakpoint. */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')
