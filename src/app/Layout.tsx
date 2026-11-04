import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { ProgressActivity } from 'relume-icons'
import { AccountMenu } from '../components/AccountMenu'
import { SideNav, TabBar, type Section } from '../components/AppNav'
import { BottomSheet, type SnapPoint } from '../components/BottomSheet'
import { SiteFooter } from '../components/SiteFooter'
import { Logo, ProgressBar, ShowOnMap } from '../components/ui'
import { ViewSwitch } from '../components/ViewSwitch'
import { TAB_BAR_HEIGHT } from '../lib/styles'

/** The floating panel's width plus its gap from the map's left edge (px). */
export const PANEL_INSET = 432

/**
 * The app's frame: the header, and below it the map with the panel. On desktop the panel sits
 * beside the map, floating over it or as the whole page, with the side nav on the left; on phones
 * it is a bottom sheet over the map, above the tab bar.
 */
export function Layout({
  isDesktop,
  sheet,
  onSheet,
  pageKey,
  section,
  tripCount,
  sightingsProgress,
  panel,
  showOnMap,
  landing,
  floatingPanel,
  onHome,
  onNavigate,
  children,
}: {
  isDesktop: boolean
  sheet: SnapPoint
  onSheet: (v: SnapPoint) => void
  /** Changes with the page, so each new page eases in and starts at the top. */
  pageKey: string
  section: Section | null
  tripCount: number
  /** How much of the season's sightings has loaded, while it loads; otherwise null. */
  sightingsProgress: number | null
  panel: ReactNode
  /** On phones, a place's page in the full panel offers a way back to the map. */
  showOnMap: (() => void) | null
  /** Explore with the panel closed: no sheet on phones. */
  landing: boolean
  /** Desktop, map with panel: the panel floats over the map's left side. */
  floatingPanel: boolean
  onHome: () => void
  onNavigate: (path: string) => void
  /** The map and what sits over it. */
  children: ReactNode
}) {
  // A new page starts at the top of the desktop panel (the phone sheet does the same itself).
  const asideRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    asideRef.current?.scrollTo({ top: 0 })
  }, [pageKey])

  const footer = <SiteFooter onNavigate={onNavigate} />
  const loading = sightingsProgress !== null

  return (
    <div className="flex h-full flex-col">
      <header className="relative z-30 flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-2.5">
        <button onClick={onHome} className="flex items-center gap-2" aria-label="Canopy home">
          <Logo className="size-7 -rotate-12" />
          <h1 className="text-2xl leading-none font-black tracking-wide">Canopy</h1>
        </button>
        <span className="hidden text-sm text-[var(--ink-soft)] sm:inline">Explore Ontario's outdoors</span>
        {/* The view switch: in the middle of the header on desktop, beside the account menu on phones. */}
        {isDesktop && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <ViewSwitch view={sheet} onChange={onSheet} />
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
              <ProgressActivity className="size-4 animate-spin" />
              <span className="hidden sm:inline">Loading live sightings…</span>
            </span>
          )}
          {!isDesktop && <ViewSwitch view={sheet} onChange={onSheet} />}
          <AccountMenu tripCount={tripCount} onNavigate={onNavigate} />
        </div>
        {loading && (
          <div className="absolute inset-x-0 -bottom-px">
            <ProgressBar value={sightingsProgress} label="Loading live sightings" />
          </div>
        )}
      </header>

      <main className="relative flex min-h-0 flex-1">
        {isDesktop && (
          <>
            <SideNav active={section} onNavigate={onNavigate} tripCount={tripCount} />
            {/* Beside the map, the panel floats over it as a card: level with the map's buttons, the
                same gap at its left and bottom. As the full panel it is the page. */}
            <aside
              ref={asideRef}
              className={`overflow-y-auto bg-[var(--surface)] ${
                sheet === 'full'
                  ? 'min-w-0 flex-1'
                  : sheet === 'peek'
                    ? 'hidden'
                    : 'absolute top-3 bottom-3 left-[96px] z-20 w-[420px] rounded-3xl border border-[var(--line)] shadow-xl'
              }`}
            >
              {/* Keyed by page so each new page or place eases in. At least as tall as the panel, so the footer sits at the bottom on short pages. */}
              <div key={pageKey} className={`page-move animate-panel-in flex min-h-full flex-col ${sheet === 'full' ? 'mx-auto max-w-3xl' : ''}`}>
                {panel}
                {footer}
              </div>
            </aside>
          </>
        )}

        {/* The map stays mounted behind the full panel, so coming back to it is instant. */}
        <div className={`relative min-w-0 flex-1 ${isDesktop && sheet === 'full' ? 'hidden' : ''} ${floatingPanel ? 'panel-floating' : ''}`} style={isDesktop ? undefined : { marginBottom: TAB_BAR_HEIGHT }}>
          {children}
        </div>

        {!isDesktop && (
          <>
            {/* The landing page has no sheet: the search sits on the map instead. */}
            {!landing && <BottomSheet snap={sheet} onSnap={onSheet} contentKey={pageKey} bottomOffset={TAB_BAR_HEIGHT}>
              {/* At least as tall as the panel, so the footer sits at the bottom on short pages. */}
              <div key={pageKey} className="page-move animate-panel-in flex min-h-full flex-col">
                <ShowOnMap value={showOnMap}>{panel}</ShowOnMap>
                {footer}
              </div>
            </BottomSheet>}
            <TabBar active={section} onNavigate={onNavigate} tripCount={tripCount} />
          </>
        )}
      </main>
    </div>
  )
}
