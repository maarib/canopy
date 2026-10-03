import { useEffect, useRef, useState } from 'react'
import { usePresence } from '../hooks'
import { KeyboardArrowDown } from 'relume-icons'
import { TreeOptions } from './MapControls'
import { treeOptions, type TreeFilterValue } from '../lib/treeOptions'
import { TreeIcon } from './TreeIcon'

/** Compact "Trees: All trees ▾" dropdown: the tree list only appears when asked for. */
export function TreePicker({ value, counts, onChange }: { value: TreeFilterValue; counts: Map<string, number>; onChange: (v: TreeFilterValue) => void }) {
  const [open, setOpen] = useState(false)
  const presence = usePresence(open)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  const current = treeOptions(counts).find((o) => o.id === value) ?? { id: value, label: 'All trees' }
  return (
    <div ref={root} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Trees: ${current.label}`}
        className={`flex items-center gap-1.5 rounded-full border border-[var(--line)] py-1.5 pr-2 pl-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)] ${open ? 'bg-[var(--surface-2)]' : ''}`}
      >
        {'icon' in current && current.icon ? (
          <TreeIcon id={current.icon} className="size-[18px]" />
        ) : (
          <TreeIcon id="maples" tone="mono" className="size-4 text-[var(--ink-soft)]" />
        )}
        <span className="max-w-32 truncate">{current.label}</span>
        <KeyboardArrowDown className={`size-4 text-[var(--ink-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {presence.mounted && (
        <div className={`absolute top-full right-0 z-30 mt-1 max-h-80 w-72 origin-top-right ${presence.closing ? 'pointer-events-none animate-pop-out' : 'animate-pop-in'} overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xl`}>
          <TreeOptions
            counts={counts}
            value={value}
            onChange={(v) => {
              onChange(v)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
