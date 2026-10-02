import { TreeIcon } from '../components/TreeIcon'
import { TREE_GROUPS } from '../data/treeGroups'
import { TREE_ICON_IDS } from '../data/treeIcons'

// Dev-only icon preview: open /?icons while running `npm run dev`.
export default function IconSheet() {
  const label = (id: string) => TREE_GROUPS.find((g) => g.id === id)?.label ?? id
  const colour = (id: string) => TREE_GROUPS.find((g) => g.id === id)?.colour ?? '#c8102e'
  const row = (px: number, variant: 'solid' | 'veined', mono = false) => (
    <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-7">
      {TREE_ICON_IDS.map((id) => (
        <figure key={id} className="flex flex-col items-center gap-1.5 text-center text-[11px] text-[var(--ink-soft)]">
          <span className="block" style={{ color: mono ? '#1d1a17' : colour(id), width: px, height: px }}>
            <TreeIcon id={id} className="size-full" variant={variant} />
          </span>
          {px >= 48 && <span className={mono ? 'text-[#6f625a]' : ''}>{label(id)}</span>}
        </figure>
      ))}
    </div>
  )
  return (
    <div className="min-h-full space-y-10 p-6">
      <h1 className="text-3xl">Tree icons</h1>
      <section>
        <h2 className="mb-3 text-lg">Veined · 96px · on paper</h2>
        <div className="rounded-2xl bg-[#f6f3ee] p-5">{row(96, 'veined', true)}</div>
      </section>
      <section>
        <h2 className="mb-3 text-lg">Solid · 96px · on paper</h2>
        <div className="rounded-2xl bg-[#f6f3ee] p-5">{row(96, 'solid', true)}</div>
      </section>
      <section>
        <h2 className="mb-3 text-lg">Veined · 48px</h2>
        {row(48, 'veined')}
      </section>
      {[24, 16].map((px) => (
        <section key={px}>
          <h2 className="mb-3 text-lg">Solid · {px}px</h2>
          {row(px, 'solid')}
        </section>
      ))}
      <section>
        <h2 className="mb-3 text-lg">Map pins</h2>
        <div className="flex flex-wrap gap-3">
          {TREE_ICON_IDS.map((id) => (
            <span key={id} className="flex size-8 items-center justify-center rounded-full bg-white shadow-md" style={{ color: '#c8102e' }}>
              <TreeIcon id={id} className="size-5" />
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
