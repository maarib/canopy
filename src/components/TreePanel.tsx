import { useMemo } from 'react'
import { REGIONS, type Region } from '../data/regions'
import { treeIconFor } from '../data/treeIcons'
import type { TreeInfo } from '../data/trees'
import type { LeafObservation } from '../lib/inaturalist'
import { type ParkReport } from '../lib/ontarioParks'
import { LIST } from '../lib/styles'
import { TreeIcon } from './TreeIcon'
import { ParkRow, RegionRow } from './rows'
import { BackButton, Skeleton } from './ui'

// A tree's own page: what color it turns and when, how to recognise it, and where it's turning
// right now. While it's open the map shows only this tree's sightings.

/** A sighting this close to a park counts toward it. */
const NEAR_KM = 40

function km(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180
  return Math.hypot((bLng - aLng) * r * Math.cos(((aLat + bLat) / 2) * r), (bLat - aLat) * r) * 6371
}

type Props = {
  tree: TreeInfo
  /** Every sighting from the last 14 days; undefined while they load. */
  sightings: LeafObservation[] | undefined
  parks: ParkReport[]
  onBack: () => void
  onSelectPark: (p: ParkReport) => void
  onSelectRegion: (r: Region) => void
}

export function TreePanel({ tree, sightings, parks, onBack, onSelectPark, onSelectRegion }: Props) {
  const turning = useMemo(() => sightings?.filter((o) => o.group === tree.id && o.state === 'colored'), [sightings, tree.id])
  // Parks with the most of this tree seen turning nearby.
  const nearParks = useMemo(
    () =>
      parks
        .filter((p) => p.main)
        .map((park) => ({ park, n: (turning ?? []).filter((o) => km(park.lat, park.lng, o.lat, o.lng) <= NEAR_KM).length }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 5),
    [parks, turning],
  )
  const regions = REGIONS.filter((r) => r.species.some((s) => treeIconFor(s) === tree.id))
  const photos = (turning ?? []).filter((o) => o.photoUrl).slice(0, 9)

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      <header className="flex items-center gap-4">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-[var(--surface-2)]">
          <TreeIcon id={tree.id} className="size-14" />
        </span>
        <div className="min-w-0">
          <h2 className="text-3xl leading-tight">{tree.name}</h2>
          <p className="text-sm text-[var(--ink-soft)]">{tree.line}</p>
        </div>
      </header>

      <dl className="space-y-4 text-sm leading-relaxed">
        <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3">
          <dt className="mb-1 font-display text-lg leading-none">Turns</dt>
          <dd className="flex items-start gap-2.5">
            <span className="mt-1 flex shrink-0 -space-x-1" aria-hidden>
              {tree.colors.map((c) => (
                <span key={c} className="size-4 rounded-full border-2 border-[var(--surface-2)]" style={{ background: c }} />
              ))}
            </span>
            {tree.turns}
          </dd>
        </div>
        <div>
          <dt className="mb-1 font-display text-lg leading-none">When</dt>
          <dd>{tree.when}</dd>
        </div>
        <div>
          <dt className="mb-1 font-display text-lg leading-none">How to spot it</dt>
          <dd>{tree.spot}</dd>
        </div>
        <div>
          <dt className="mb-1 font-display text-lg leading-none">Where it grows</dt>
          <dd>{tree.where}</dd>
        </div>
      </dl>
      <p className="-mt-2 text-xs text-[var(--ink-soft)]">In Ontario: {tree.kinds}.</p>

      <section>
        <h3 className="text-lg">Turning now</h3>
        {turning === undefined ? (
          <Skeleton className="mt-2 h-24" />
        ) : !turning.length ? (
          <p className="mt-1 text-sm text-[var(--ink-soft)]">No one has reported {tree.name.toLowerCase()} turning in the last two weeks.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {turning.length.toLocaleString('en-CA')} seen turning across Canada in the last two weeks. They are the ones on the map.
            </p>
            {nearParks.length > 0 && (
              <ul className={`stagger ${LIST}`}>
                {nearParks.map(({ park, n }) => (
                  <li key={park.id}>
                    <ParkRow park={park} detail={`${n} seen within ${NEAR_KM} km`} onClick={() => onSelectPark(park)} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {regions.length > 0 && (
        <section>
          <h3 className="text-lg">Regions known for it</h3>
          <ul className={LIST}>
            {regions.map((r) => (
              <li key={r.id}>
                <RegionRow region={r} onClick={() => onSelectRegion(r)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {photos.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg">Recent photos</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((o) => (
              <a key={o.id} href={o.url} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-lg bg-[var(--surface-2)]">
                <img src={o.photoUrl!} alt="" loading="lazy" decoding="async" width={240} height={240} className="size-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 px-1.5 pt-4 pb-1 text-[11px] text-white">{o.species}</span>
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Photos from iNaturalist observers (CC licences, tap for credit).</p>
        </section>
      )}
    </div>
  )
}
