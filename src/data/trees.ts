import type { TreeIconId } from './treeIcons'

// What to know about each kind of tree on the Foliage page and its own page: the color it turns,
// when, how to recognise it and where it grows in Ontario. Ids match the tree groups
// (data/treeGroups.ts), which decide which sightings belong to each. Timing is typical for
// southern and central Ontario and shifts with latitude and the year's weather.

export type TreeInfo = {
  id: TreeIconId
  name: string
  /** One line under the name. */
  line: string
  /** Its fall colors, for swatches. */
  colors: string[]
  turns: string
  when: string
  spot: string
  where: string
  /** The species people will meet in Ontario. */
  kinds: string
}

export const TREES: TreeInfo[] = [
  {
    id: 'maples',
    name: 'Maples',
    line: 'The reds and oranges that fall is famous for.',
    colors: ['#c8102e', '#e8730c', '#e9b824'],
    turns: 'Scarlet, orange and gold, often all on one tree.',
    when: 'Red maples go first, from mid-September, often in wet ground. Sugar maples follow and carry the peak from late September to mid-October.',
    spot: 'Leaves grow in opposite pairs and are shaped like an open hand, with three to five pointed lobes. Sugar maple has smooth, rounded notches between the lobes; red maple has sharp, toothed ones.',
    where: 'The hardwood forests of central and southern Ontario. Algonquin and Muskoka are sugar maple country.',
    kinds: 'Sugar maple, red maple, silver maple, striped maple, mountain maple',
  },
  {
    id: 'oaks',
    name: 'Oaks',
    line: 'Late to turn, and slow to let go.',
    colors: ['#8f2f25', '#a85a2a', '#7a5c45'],
    turns: 'Deep red and russet, fading to brown.',
    when: 'Mid to late October, after the maples are done. Many oaks hold their brown leaves into winter.',
    spot: 'Lobed leaves and acorns. Red oak lobes end in bristle-tipped points; white and bur oak lobes are rounded.',
    where: 'Southern Ontario, and dry, sandy or rocky ground farther north.',
    kinds: 'Red oak, white oak, bur oak, black oak',
  },
  {
    id: 'birches',
    name: 'Birches',
    line: 'Clear yellow against white bark.',
    colors: ['#f0c93a', '#e9b824'],
    turns: 'Bright, clean yellow.',
    when: 'Late September to early October.',
    spot: 'Small oval leaves with a pointed tip and a double row of teeth. White birch has chalky bark that peels in sheets; yellow birch has bronze bark that curls in thin strips.',
    where: 'Across the province and far into the north. White birch often grows where fire or logging opened the forest.',
    kinds: 'White (paper) birch, yellow birch, grey birch',
  },
  {
    id: 'aspens',
    name: 'Aspens & poplars',
    line: 'Whole hillsides of trembling gold.',
    colors: ['#f2c230', '#e9a81f'],
    turns: 'Gold, sometimes with a touch of orange.',
    when: 'Mid-September in the north to early October farther south.',
    spot: 'Nearly round leaves on flattened stalks, so they flutter in the lightest breeze. The bark is smooth and pale, greenish white. Aspens spread by their roots, so a whole stand often turns on the same day.',
    where: 'Everywhere in the north, and scattered through the rest of the province.',
    kinds: 'Trembling aspen, largetooth aspen, balsam poplar, eastern cottonwood',
  },
  {
    id: 'larches',
    name: 'Larches',
    line: 'The conifer that turns gold and drops its needles.',
    colors: ['#d9a22b', '#b9852a'],
    turns: 'Smoky gold.',
    when: 'The last show of the season: mid-October into early November.',
    spot: 'Soft needles in little tufts along the twig. Unlike other conifers, it sheds them all each fall. Tamarack is the native larch.',
    where: 'Bogs, fens and wet ground, most of all in the north.',
    kinds: 'Tamarack',
  },
  {
    id: 'ashes',
    name: 'Ashes',
    line: 'Early, brief, and harder to find than it used to be.',
    colors: ['#7b3b5e', '#b06a3a', '#e3bf3d'],
    turns: 'White ash goes purple and bronze; green and black ash go yellow.',
    when: 'Among the first to turn, in late September, and quick to drop.',
    spot: 'Each leaf is made of five to nine leaflets in pairs along a stalk, and the leaves themselves grow in opposite pairs.',
    where: 'Southern and central Ontario, though the emerald ash borer has killed most mature ashes in the south.',
    kinds: 'White ash, green ash, black ash',
  },
  {
    id: 'beeches',
    name: 'Beeches',
    line: 'Copper leaves that stay through the winter.',
    colors: ['#d8a23a', '#b5762f'],
    turns: 'Golden bronze, fading to pale copper.',
    when: 'Mid to late October. Young beeches keep their papery leaves until spring.',
    spot: 'Oval leaves with straight, parallel veins, each ending in a small tooth. The bark is smooth and grey, even on old trees.',
    where: 'Alongside sugar maple in the hardwood forests of central and southern Ontario.',
    kinds: 'American beech',
  },
  {
    id: 'hickories',
    name: 'Hickories & walnuts',
    line: 'Rich gold in the southern woods.',
    colors: ['#e2b230', '#c99a2a'],
    turns: 'Hickories turn a deep golden yellow. Walnuts turn yellow and drop early.',
    when: 'Walnuts start shedding in September; hickories peak in early to mid-October.',
    spot: 'Long leaves made of many leaflets. Hickories have five to seven; black walnut has fifteen or more. Shagbark hickory has bark that peels away in long strips.',
    where: 'Southern Ontario, in the Carolinian forest near Lakes Erie and Ontario.',
    kinds: 'Shagbark hickory, bitternut hickory, black walnut, butternut',
  },
  {
    id: 'elms',
    name: 'Elms & basswoods',
    line: 'Soft yellow along rivers and old fence lines.',
    colors: ['#e6c64a', '#cfa93a'],
    turns: 'Yellow.',
    when: 'Late September into October.',
    spot: 'Elm leaves are oval, rough to the touch, double-toothed and lopsided at the base. Basswood leaves are large and heart-shaped, also lopsided.',
    where: 'River valleys, fields and woods in southern and central Ontario.',
    kinds: 'American elm, slippery elm, basswood',
  },
  {
    id: 'cherries',
    name: 'Cherries & serviceberries',
    line: 'Small trees that light up the forest edge.',
    colors: ['#d1432f', '#e8730c', '#e9b824'],
    turns: 'Orange and red, with some yellow.',
    when: 'Mid to late September, ahead of the taller trees.',
    spot: 'Cherries and serviceberries have oval, finely toothed leaves, and cherry bark is marked with short horizontal lines. Mountain-ash has feather-like leaves and clusters of orange-red berries.',
    where: 'Forest edges, clearings and roadsides across the province.',
    kinds: 'Pin cherry, black cherry, chokecherry, serviceberries, mountain-ash',
  },
  {
    id: 'alders',
    name: 'Alders & hornbeams',
    line: 'Quiet color down by the water.',
    colors: ['#d6b23c', '#7d8a4a'],
    turns: 'Ironwood turns a soft yellow. Alders mostly stay green and drop late.',
    when: 'Late September to mid-October.',
    spot: 'Oval, double-toothed leaves. Alders carry small woody cones through the winter; ironwood has shaggy bark in narrow strips and papery fruit like hops.',
    where: 'Stream banks, wet ground and the understory of hardwood forests.',
    kinds: 'Speckled alder, green alder, ironwood (hop-hornbeam)',
  },
  {
    id: 'other-trees',
    name: 'Ginkgo, tupelo & more',
    line: 'Scattered showpieces, mostly in the south.',
    colors: ['#f0c62e', '#c8102e'],
    turns: 'Ginkgo turns pure gold. Black tupelo turns a brilliant scarlet.',
    when: 'Tupelo turns early, in late September. Ginkgo waits until late October and often drops all its leaves within a day or two.',
    spot: 'Ginkgo leaves are small fans with veins that spread from the stalk. Tupelo leaves are glossy, smooth-edged ovals.',
    where: 'Ginkgo is planted along city streets and in parks. Black tupelo is rare, found in the far south near Lake Erie and Niagara.',
    kinds: 'Ginkgo, black tupelo, sassafras, tulip tree',
  },
  {
    id: 'shrubs',
    name: 'Sumacs, shrubs & vines',
    line: 'The first reds of the season, at eye level.',
    colors: ['#c2262b', '#e0572a', '#7a1f3a'],
    turns: 'Fiery red and orange; some vines and dogwoods go deep crimson and maroon.',
    when: 'From early September, weeks before the trees.',
    spot: 'Staghorn sumac has long, feather-like leaves, fuzzy branches and upright cones of red fruit. Virginia creeper is a climbing vine with five leaflets to a leaf.',
    where: 'Roadsides, fence lines, rocky clearings and forest edges.',
    kinds: 'Staghorn sumac, Virginia creeper, dogwoods, viburnums, blueberries',
  },
]

export const TREE_BY_ID = new Map(TREES.map((t) => [t.id as string, t]))
export const treePath = (id: string) => `/tree/${id}`
