import { useSyncExternalStore } from 'react'

// Light or dark. The app follows the device unless one is chosen in the account menu; the choice
// is kept on this device. The page carries the theme in force as `data-theme` on its root, which
// the styles key off (index.css). index.html sets it before the first paint, so a chosen theme
// never flashes the other one.

export type ThemeSetting = 'light' | 'dark' | 'system'

const KEY = 'canopy:theme'
const device = window.matchMedia('(prefers-color-scheme: dark)')

function stored(): ThemeSetting {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

let setting = stored()
const listeners = new Set<() => void>()
const isDark = () => (setting === 'system' ? device.matches : setting === 'dark')

function apply() {
  document.documentElement.dataset.theme = isDark() ? 'dark' : 'light'
  for (const tell of listeners) tell()
}
device.addEventListener('change', apply)
apply()

export function setTheme(next: ThemeSetting) {
  setting = next
  try {
    if (next === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch {
    // Private windows may refuse; the choice then lasts for this visit.
  }
  apply()
}

const subscribe = (tell: () => void) => {
  listeners.add(tell)
  return () => listeners.delete(tell)
}

/** What was chosen: light, dark, or follow the device. */
export const useThemeSetting = () => useSyncExternalStore(subscribe, () => setting)
/** Whether the app is dark right now. */
export const useDark = () => useSyncExternalStore(subscribe, isDark)
