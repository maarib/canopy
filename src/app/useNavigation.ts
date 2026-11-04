import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import type { Region } from '../data/regions'
import { treePath } from '../data/trees'
import { placePath, trailPath, type Place, type Trail } from '../lib/explore'
import { fishingPath, type FishingAccess } from '../lib/fishingAccess'
import type { ParkReport } from '../lib/ontarioParks'
import { movePage, type PageMove } from '../lib/pageTransition'
import type { Trip } from '../lib/trips'
import { pageSearch, parkPath, regionPath } from '../lib/urlState'

/**
 * Moving between pages, with the page move each kind of step plays (lib/pageTransition). Every
 * callback is stable, so the memoized map doesn't re-render when the app does.
 */
export function useNavigation() {
  const navigate = useNavigate()
  /** Navigate to a place (new history entry), keeping filters and layers. */
  const go = useCallback(
    (pathname: string, move: PageMove = 'forward') => {
      movePage(move, () => navigate({ pathname, search: pageSearch(window.location.search) }))
    },
    [navigate],
  )
  const goHome = useCallback(() => go('/', 'back'), [go])
  /** Back to wherever the user came from inside the app (e.g. region → trail → back), else home. */
  const goBack = useCallback(
    () => ((window.history.state as { idx?: number } | null)?.idx ? movePage('back', () => navigate(-1)) : goHome()),
    [navigate, goHome],
  )
  /** Sections keep filters and layers in the URL, like the rest of the app. */
  const openSection = useCallback(
    (path: string, change?: (p: URLSearchParams) => void) => {
      const [pathname, query] = path.split('?')
      const next = new URLSearchParams(window.location.search)
      next.delete('show')
      next.delete('level')
      next.delete('t')
      new URLSearchParams(query).forEach((v, k) => next.set(k, v))
      change?.(next)
      movePage('tab', () => navigate({ pathname, search: next.toString() ? `?${next}` : '' }))
    },
    [navigate],
  )
  return {
    go,
    goHome,
    goBack,
    openSection,
    selectTrail: useCallback((t: Trail) => go(trailPath(t)), [go]),
    selectPlace: useCallback((p: Place) => go(placePath(p)), [go]),
    selectFishing: useCallback((a: FishingAccess) => go(fishingPath(a)), [go]),
    selectRegion: useCallback((r: Region) => go(regionPath(r.id)), [go]),
    selectTree: useCallback((id: string) => go(treePath(id)), [go]),
    selectPark: useCallback((p: ParkReport) => go(parkPath(p)), [go]),
    openTrip: useCallback((t: Trip) => go(`/trip/${t.id}`), [go]),
  }
}

export type Navigation = ReturnType<typeof useNavigation>
