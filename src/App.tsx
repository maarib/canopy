import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FoliageMap } from './components/FoliageMap'
import { RegionList } from './components/RegionList'
import { RegionPanel } from './components/RegionPanel'
import { REGIONS, type Region } from './data/regions'
import { fetchLeafObservations } from './lib/inaturalist'

export default function App() {
  const [selected, setSelected] = useState<Region | null>(null)
  const observations = useQuery({ queryKey: ['observations', 'canada'], queryFn: () => fetchLeafObservations() })

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-[var(--line)] px-5 py-3">
        <img src="/favicon.svg" alt="" className="size-6" />
        <h1 className="text-lg font-bold tracking-tight">Canopy</h1>
        <span className="hidden text-sm text-[var(--ink-soft)] sm:inline">Fall colours across Canada</span>
      </header>

      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="h-[48vh] shrink-0 md:order-2 md:h-auto md:flex-1">
          <FoliageMap regions={REGIONS} observations={observations.data?.items ?? []} selected={selected} onSelect={setSelected} />
        </div>
        <aside className="min-h-0 flex-1 overflow-y-auto border-[var(--line)] md:order-1 md:w-[420px] md:flex-none md:border-r">
          {selected ? (
            <RegionPanel key={selected.id} region={selected} onBack={() => setSelected(null)} />
          ) : (
            <RegionList regions={REGIONS} sightings={observations.data?.total} onSelect={setSelected} />
          )}
        </aside>
      </main>
    </div>
  )
}
