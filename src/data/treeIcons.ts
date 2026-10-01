// Tree icon ids (one per tree group) and a helper to pick one from a tree name.
// The artwork lives in src/components/TreeIcon.tsx.

export const TREE_ICON_IDS = [
  'maples',
  'oaks',
  'birches',
  'aspens',
  'larches',
  'ashes',
  'beeches',
  'hickories',
  'elms',
  'cherries',
  'alders',
  'other-trees',
  'shrubs',
] as const

export type TreeIconId = (typeof TREE_ICON_IDS)[number]

/** Map a free-text tree name ("Sugar maple", "Tamarack") to its icon. */
export function treeIconFor(name: string): TreeIconId | null {
  const n = name.toLowerCase()
  if (n.includes('maple')) return 'maples'
  if (n.includes('oak')) return 'oaks'
  if (n.includes('birch')) return 'birches'
  if (n.includes('aspen') || n.includes('poplar') || n.includes('cottonwood')) return 'aspens'
  if (n.includes('larch') || n.includes('tamarack')) return 'larches'
  if (n.includes('beech')) return 'beeches'
  if (/\bash\b/.test(n) && !n.includes('mountain')) return 'ashes'
  if (n.includes('hickory') || n.includes('walnut')) return 'hickories'
  if (n.includes('elm') || n.includes('basswood') || n.includes('linden')) return 'elms'
  if (n.includes('cherry') || n.includes('serviceberry') || n.includes('mountain ash')) return 'cherries'
  if (n.includes('alder') || n.includes('hornbeam') || n.includes('ironwood')) return 'alders'
  if (n.includes('ginkgo') || n.includes('tupelo')) return 'other-trees'
  if (n.includes('sumac') || n.includes('blueberr') || n.includes('dogwood') || n.includes('viburnum') || n.includes('creeper'))
    return 'shrubs'
  return null
}
