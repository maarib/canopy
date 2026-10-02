import { TreeIcon } from '../components/TreeIcon'
import { TREE_GROUPS } from '../data/treeGroups'
import { TREE_ICON_IDS } from '../data/treeIcons'

// Dev-only icon preview: open /?icons while running `npm run dev`.
export default function IconSheet() {
  const label = (id: string) => TREE_GROUPS.find((g) => g.id === id)?.label ?? id
  const row = (px: number, tone: 'colour' | 'mono' = 'colour') => (
    <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-7">
      {TREE_ICON_IDS.map((id) => (
        <figure key={id} className="flex flex-col items-center gap-1.5 text-center text-[11px] text-[var(--ink-soft)]">
          <span className="block text-[var(--ink)]" style={{ width: px, height: px }}>
            <TreeIcon id={id} tone={tone} className="size-full" />
          </span>
          {px >= 48 && <span>{label(id)}</span>}
        </figure>
      ))}
    </div>
  )
  return (
    <div className="min-h-full space-y-10 p-6">
      <h1 className="text-3xl">Tree icons</h1>
      <section>
        <h2 className="mb-3 text-lg">96px · on paper</h2>
        <div className="rounded-2xl bg-[#f6f3ee] p-5 [--ink-soft:#6f625a] [--leaf-ink:#2d3550]">{row(96)}</div>
      </section>
      <section>
        <h2 className="mb-3 text-lg">48px · current theme</h2>
        {row(48)}
      </section>
      {[24, 16].map((px) => (
        <section key={px}>
          <h2 className="mb-3 text-lg">{px}px</h2>
          {row(px)}
        </section>
      ))}
      <section>
        <h2 className="mb-3 text-lg">Single colour (tone="mono") · 24px</h2>
        {row(24, 'mono')}
      </section>
    </div>
  )
}
