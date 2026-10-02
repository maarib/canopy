// Groups iNaturalist observations into the trees (and a few shrubs and vines)
// people actually go leaf-peeping for. IDs are iNaturalist genus taxon IDs;
// an observation matches a group if any of its ancestors is one of them.

export type TreeGroup = {
  id: string
  label: string
  genusIds: number[]
  tree: boolean
}

export const TREE_GROUPS: TreeGroup[] = [
  { id: 'maples', label: 'Maples', genusIds: [47727], tree: true },
  { id: 'oaks', label: 'Oaks', genusIds: [47851], tree: true },
  { id: 'birches', label: 'Birches', genusIds: [49156], tree: true },
  { id: 'aspens', label: 'Aspens & poplars', genusIds: [47566], tree: true },
  { id: 'larches', label: 'Larches', genusIds: [55571], tree: true },
  { id: 'ashes', label: 'Ashes', genusIds: [54806], tree: true },
  { id: 'beeches', label: 'Beeches', genusIds: [49203], tree: true },
  { id: 'hickories', label: 'Hickories & walnuts', genusIds: [54788, 54495], tree: true },
  { id: 'elms', label: 'Elms & basswoods', genusIds: [53549, 54856], tree: true },
  { id: 'cherries', label: 'Cherries & serviceberries', genusIds: [47351, 49230, 48582], tree: true },
  { id: 'alders', label: 'Alders & hornbeams', genusIds: [53352, 54772], tree: true },
  { id: 'other-trees', label: 'Ginkgo, tupelo & more', genusIds: [64355, 53580, 54804, 54796], tree: true },
  { id: 'shrubs', label: 'Sumacs, shrubs & vines', genusIds: [54765, 47193, 48353, 54774, 50280], tree: false },
]

const GROUP_BY_GENUS = new Map(TREE_GROUPS.flatMap((g) => g.genusIds.map((id) => [id, g.id] as const)))

export function groupFor(ancestorIds: number[]): string | null {
  for (const id of ancestorIds) {
    const group = GROUP_BY_GENUS.get(id)
    if (group) return group
  }
  return null
}

export const TREE_GROUP_IDS = new Set(TREE_GROUPS.filter((g) => g.tree).map((g) => g.id))
