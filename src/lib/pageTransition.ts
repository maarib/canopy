// Page transitions, the way native apps move between screens. On phones, going deeper slides the
// new page in from the right while the old one drifts left under it; going back does the
// reverse; switching tabs crossfades. On desktop the same moves are a short slide and fade inside
// the panel. Built on the browser's View Transitions, which animate a picture of the old page into
// the new one. Only the panel's page moves (it carries `view-transition-name: page`); the map,
// header, rail and tab bar stay put. Browsers without View Transitions simply change page.
//
// The router updates the page in a React transition, a little after `navigate` returns, so the
// new picture is taken when the page has actually changed: `pageShown`, called from the app once
// the new page is in place, ends the wait (or a short timeout does, if nothing changes).

export type PageMove = 'forward' | 'back' | 'tab'

let shown: (() => void) | null = null

const STILL = '(prefers-reduced-motion: reduce)'

export function movePage(kind: PageMove, update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } }
  if (!doc.startViewTransition || matchMedia(STILL).matches) return update()
  shown?.()
  const root = document.documentElement
  root.dataset.pageMove = kind
  const t = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const done = () => {
          clearTimeout(timer)
          shown = null
          resolve()
        }
        const timer = setTimeout(done, 300)
        shown = done
        update()
      }),
  )
  t.finished.finally(() => {
    if (root.dataset.pageMove === kind) delete root.dataset.pageMove
  })
}

/** The new page is on screen: let the transition take its picture and play. */
export function pageShown() {
  shown?.()
}
