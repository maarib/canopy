import { TREE_GROUPS } from '../data/treeGroups'
import type { TreeIconId } from '../data/treeIcons'

export type TreeFilterValue = 'trees' | 'all' | string

export type TreeOption = { id: TreeFilterValue; label: string; icon?: TreeIconId; n?: number }

/** "All trees", each tree group seen in the last 14 days (by count), then "All plants". */
export function treeOptions(counts: Map<string, number>): TreeOption[] {
  // Real trees first by count; shrubs and vines go last.
  const groups = TREE_GROUPS.filter((g) => counts.get(g.id)).sort(
    (a, b) => Number(b.tree) - Number(a.tree) || counts.get(b.id)! - counts.get(a.id)!,
  )
  return [
    { id: 'trees', label: 'All trees' },
    ...groups.map((g) => ({ id: g.id, label: g.label, icon: g.id as TreeIconId, n: counts.get(g.id) })),
    { id: 'all', label: 'All plants (incl. shrubs)' },
  ]
}

