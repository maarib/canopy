// Accessibility check: axe-core (WCAG 2.1 A and AA rules) on every kind of page, in light and
// dark, at phone and desktop widths, plus a few open menus. Run against a running build:
//   npm run build && npx vite preview --port 4173 &
//   npm run check:a11y            (or: node scripts/check-a11y.mjs http://localhost:4173)
// Exits with 1 if any serious or critical issue is found, so CI can fail on it.

import AxeBuilder from '@axe-core/playwright'
import { chromium } from 'playwright'

const BASE = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '')
const PAGES = [
  ['home', '/'],
  ['parks', '/parks'],
  ['places', '/places'],
  ['foliage', '/foliage'],
  ['trips', '/trips'],
  ['about', '/about'],
  ['sources', '/sources'],
  ['park', '/park/195-bon-echo'],
  ['park without a report', '/park/petroglyphs'],
  ['trail', '/trail/otn-320643008-x'],
  ['place', '/place/waterfall-n1776047267-x'],
  ['region', '/region/algonquin'],
  ['tree', '/tree/maples'],
  ['fishing', '/fishing/-x'],
]
/** Menus and popovers, opened before checking (they aren't in the page until then). */
const OPEN = {
  parks: (p) => p.getByRole('button', { name: /^Sort/ }).click(),
  home: (p) => p.getByRole('button', { name: 'Account menu' }).click(),
}
const SIZES = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } }

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const found = new Map() // rule → { impact, help, where: Set }
for (const [size, viewport] of Object.entries(SIZES))
  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport, colorScheme: scheme })
    const page = await context.newPage()
    for (const [name, path] of PAGES) {
      await page.goto(BASE + path)
      await page.waitForTimeout(2500)
      for (const open of [null, OPEN[name]]) {
        if (open === undefined) continue
        if (open) await open(page).then(() => page.waitForTimeout(400)).catch(() => {})
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        for (const v of violations) {
          const f = found.get(v.id) ?? { impact: v.impact, help: v.help, where: new Map() }
          for (const n of v.nodes) {
            const key = n.target.join(' ')
            const w = f.where.get(key) ?? { pages: new Set(), summary: (n.failureSummary ?? '').split('\n').slice(1, 2).join(' ').trim(), html: n.html.slice(0, 120) }
            w.pages.add(`${name}${open ? ' (menu open)' : ''} · ${size} · ${scheme}`)
            f.where.set(key, w)
          }
          found.set(v.id, f)
        }
        if (open) await page.keyboard.press('Escape')
      }
    }
    await context.close()
  }
await browser.close()

const ORDER = ['critical', 'serious', 'moderate', 'minor']
const rules = [...found.entries()].sort((a, b) => ORDER.indexOf(a[1].impact) - ORDER.indexOf(b[1].impact))
for (const [id, f] of rules) {
  console.log(`\n[${f.impact}] ${id}: ${f.help} (${f.where.size} element${f.where.size === 1 ? '' : 's'})`)
  for (const [target, w] of [...f.where].slice(0, 8)) console.log(`  ${target}\n    ${w.html}\n    ${w.summary}\n    on: ${[...w.pages].slice(0, 4).join('; ')}${w.pages.size > 4 ? ` (+${w.pages.size - 4})` : ''}`)
}
const blocking = rules.filter(([, f]) => f.impact === 'critical' || f.impact === 'serious').length
console.log(`\n${rules.length} rule${rules.length === 1 ? '' : 's'} with issues; ${blocking} serious or critical.`)
process.exit(blocking ? 1 : 0)
