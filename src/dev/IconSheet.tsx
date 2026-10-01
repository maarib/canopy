import { TREE_GROUPS } from '../data/treeGroups'
import { TreeIcon } from '../components/TreeIcon'
import { TREE_ICON_IDS } from '../data/treeIcons'

// Dev-only icon preview: open /?icons while running `npm run dev`.
export default function IconSheet() {
  const label = (id: string) => TREE_GROUPS.find((g) => g.id === id)?.label ?? id
  const colour = (id: string) => TREE_GROUPS.find((g) => g.id === id)?.colour ?? '#c8102e'
  return (
    <div className="min-h-full space-y-8 p-6">
      <h1 className="text-3xl">Tree icons</h1>
      {[96, 24, 16].map((px) => (
        <section key={px}>
          <h2 className="mb-3 text-lg">{px}px</h2>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-7">
            {TREE_ICON_IDS.map((id) => (
              <figure key={id} className="flex flex-col items-center gap-1.5 text-center text-[11px] text-[var(--ink-soft)]">
                <span className="block" style={{ color: colour(id), width: px, height: px }}>
                  <TreeIcon id={id} className="size-full" />
                </span>
                {label(id)}
              </figure>
            ))}
          </div>
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
