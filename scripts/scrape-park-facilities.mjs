// Pulls the facilities and activities listed on every Ontario Parks park page into
// public/data/park-facilities.json. Park pages come from the site's sitemap; each page
// marks facilities and activities with <img class="park-icon"> tags whose file name is a
// stable key (`boat_launches.svg`, `_inactive` when not offered) and whose title holds the
// label and count ("Boat Launch(es) (9)"). Runs weekly via .github/workflows/park-facilities.yml.
// Source: https://www.ontarioparks.ca (please credit Ontario Parks). robots.txt asks for a
// 1 second crawl delay, which we respect.
//
//   node scripts/scrape-park-facilities.mjs            all parks
//   node scripts/scrape-park-facilities.mjs algonquin  just these (for testing)

import { readFile, writeFile } from 'node:fs/promises'

const SITE = 'https://www.ontarioparks.ca'
const OUT = new URL('../public/data/park-facilities.json', import.meta.url)
const UA = 'CanopyFallColors/0.1 (+https://github.com/maarib/canopy)'
const DELAY_MS = 1100

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) }).catch((e) => e)
  if (res instanceof Response && res.ok) return res.text()
  if (attempt < 3) {
    await sleep(3000 * attempt)
    return get(url, attempt + 1)
  }
  throw new Error(`${url}: ${res instanceof Response ? res.status : res.message}`)
}

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/** "<p>Boat Launch(es) (9)</p><p>Not available</p>" → { label: "Boat Launch(es)", count: 9 } */
function parseTitle(title) {
  const t = text(decode(title)).replace(/\s*Not available$/i, '')
  const m = t.match(/^(.*?)\s*\((\d[\d,]*)\)$/)
  return m ? { label: m[1], count: Number(m[2].replace(/,/g, '')) } : { label: t, count: null }
}

/** Icons between the "Facilities" heading and the "Activities" heading, and after it. */
function parseIcons(html) {
  const fac = html.search(/<h2[^>]*>\s*Facilities/i)
  const act = html.search(/<h2[^>]*>\s*Activities/i)
  if (fac === -1 || act === -1) return null
  const end = html.indexOf('</section>', act) === -1 ? act + 20_000 : html.indexOf('</section>', act)
  const icons = (chunk) =>
    // icon_size_2 only: the operating-dates legend below Activities reuses smaller (icon_size_1) icons.
    [...chunk.matchAll(/<img\b[^>]*class="[^"]*park-icon icon_size_2[^"]*"[^>]*>/g)].flatMap(([tag]) => {
      const src = tag.match(/src="[^"]*\/([a-z0-9_]+)\.svg"/i)?.[1]
      const title = tag.match(/title="([^"]*)"/)?.[1]
      if (!src || !title) return []
      const available = !src.endsWith('_inactive')
      return [{ key: src.replace(/_inactive$/, ''), available, ...parseTitle(title) }]
    })
  return { facilities: icons(html.slice(fac, act)), activities: icons(html.slice(act, end)) }
}

function parseInfo(html) {
  const field = (label) => {
    const m = html.match(new RegExp(`${label}:?\\s*</[^>]+>\\s*([^<]+)`, 'i')) ?? html.match(new RegExp(`${label}:\\s*([^<]+)`, 'i'))
    return m ? decode(m[1]).trim() : null
  }
  const size = field('Size')?.match(/[\d,.]+/)?.[0]
  return {
    name: text(html.match(/<h1[^>]*program-heading[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '') || null,
    classification: field('Park Classification'),
    established: Number(field('Year established')) || null,
    sizeHa: size ? Number(size.replace(/,/g, '')) : null,
  }
}

const only = process.argv.slice(2)
const urls = only.length
  ? only.map((s) => `${SITE}/park/${s}`)
  : [...new Set([...(await get(`${SITE}/sitemap.xml`)).matchAll(/<loc>([^<]+\/park\/[a-z0-9]+)<\/loc>/g)].map((m) => m[1]))]

const parks = {}
const labels = { facilities: {}, activities: {} }
const failed = []
for (const [i, url] of urls.entries()) {
  const slug = url.split('/').pop()
  try {
    const html = await get(url)
    const icons = parseIcons(html)
    if (!icons) {
      failed.push(`${slug}: no facilities section`)
      continue
    }
    for (const kind of ['facilities', 'activities']) for (const f of icons[kind]) labels[kind][f.key] ??= f.label
    parks[slug] = {
      ...parseInfo(html),
      url,
      facilities: icons.facilities.filter((f) => f.available).map(({ key, count }) => (count == null ? key : [key, count])),
      activities: icons.activities.filter((a) => a.available).map((a) => a.key),
    }
  } catch (e) {
    failed.push(e.message)
  }
  if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${urls.length}`)
  if (i < urls.length - 1) await sleep(DELAY_MS)
}

const count = Object.keys(parks).length
if (!only.length && count < 250) throw new Error(`Only ${count} parks parsed (${failed.length} failed); page format may have changed`)
for (const f of failed) console.warn(`  skipped ${f}`)

const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
const data = { labels: { facilities: sorted(labels.facilities), activities: sorted(labels.activities) }, parks: sorted(parks) }

// Leave the file untouched when nothing changed, so the weekly job only commits real updates.
const previous = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
if (!only.length && previous && JSON.stringify({ labels: previous.labels, parks: previous.parks }) === JSON.stringify(data)) {
  console.log(`No changes across ${count} parks`)
} else {
  await writeFile(OUT, JSON.stringify({ source: SITE, fetchedAt: new Date().toISOString(), ...data }) + '\n')
  console.log(`Wrote ${count} parks (${failed.length} skipped)`)
}
