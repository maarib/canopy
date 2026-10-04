// Shared interaction styles, so every list row and button behaves the same.
// Every list row in the app is at least 56px tall with a 40px icon tile on the left.

/** Tappable list row: full-width highlight on hover, slight press feedback. */
export const ROW =
  '-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--surface-2)] active:bg-[var(--line)]'

/** Non-interactive row with the same size and layout as ROW (facts, facilities, activities). */
export const INFO_ROW = 'flex min-h-14 items-center gap-3 py-2'

/** The square that holds a row's icon. */
export const ICON_TILE = 'flex size-10 shrink-0 items-center justify-center rounded-xl'

/** A divided list of rows. */
export const LIST = 'divide-y divide-[var(--line)]'

/** Phones: height of the bottom tab bar (AppNav), which the sheet and map sit above. */
export const TAB_BAR_HEIGHT = 64

/**
 * White or dark ink, whichever reads better on a `#rrggbb` fill (WCAG contrast): white on the
 * peak red and the greens, dark on the lighter yellows and oranges.
 */
export function inkOn(fill: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(fill.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return 1.05 / (luminance + 0.05) >= 4.5 ? '#ffffff' : '#2a211c'
}
