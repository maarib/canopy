import { lazy, Suspense } from 'react'
import App from './App'

// Dev-only icon preview at /?icons; stripped from production builds.
const IconSheet = import.meta.env.DEV ? lazy(() => import('./dev/IconSheet')) : null
const showIconSheet = IconSheet && new URLSearchParams(location.search).has('icons')

export default function Root() {
  return IconSheet && showIconSheet ? (
    <Suspense>
      <IconSheet />
    </Suspense>
  ) : (
    <App />
  )
}
