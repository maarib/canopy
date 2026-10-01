import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import Root from './Root'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10 * 60_000, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* BASE_URL is /canopy/ on GitHub Pages, / elsewhere. */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Root />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
