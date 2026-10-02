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
