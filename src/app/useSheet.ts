import { useState } from 'react'
import { useLocation } from 'react-router'
import type { SnapPoint } from '../components/BottomSheet'
import type { Selection } from './useSelection'

/**
 * The view: the map alone ('peek'), the map with the panel ('half') or the panel alone ('full').
 * On phones these are the sheet's three heights. Explore is the landing page and opens on the map
 * alone, with the search over it; any other page opens with its panel.
 */
export function useSheet(selection: Selection, selectionKey: string, isDesktop: boolean) {
  const { pathname } = useLocation()
  const [sheet, setSheet] = useState<SnapPoint>(() =>
    pathname === '/' ? 'peek' : !isDesktop && ['/about', '/sources'].includes(pathname) ? 'full' : 'half',
  )

  // When the page changes, show the map with the panel, so the new content shows. The full panel
  // is the exception: moving between pages stays in it. (Adjusting state during render when the key changes, per React's guidance.)
  const [sheetFor, setSheetFor] = useState(selectionKey)
  if (sheetFor !== selectionKey) {
    setSheetFor(selectionKey)
    const isPlace = ['region', 'park', 'trail', 'place', 'fishing', 'loading'].includes(selection?.kind ?? '')
    // Explore always comes back as the landing page: the map, with the search over it.
    if (selectionKey === 'home') setSheet('peek')
    // About and Data sources are reading pages with nothing on the map: on phones they take the screen.
    else if (!isDesktop && (selection?.kind === 'about' || selection?.kind === 'sources')) setSheet('full')
    // On desktop, opening a place always shows the map with the panel. On phones the view is the
    // reader's choice and stays put; only the map alone opens the panel, or a tapped pin would do nothing.
    else if (isPlace ? isDesktop || sheet === 'peek' : sheet !== 'full') setSheet('half')
  }

  return [sheet, setSheet] as const
}
