import type { ReactNode } from 'react'
import { ChevronRight } from 'relume-icons'
import { signatureTree, type Region } from '../data/regions'
import type { TreeInfo } from '../data/trees'
import { parkCover, placeCover, regionCover } from '../lib/coverSpec'
import { PLACE_KINDS, type Place } from '../lib/explore'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { formatWindow, peakPhase, PHASE_STYLE } from '../lib/peak'
import { STAGES } from '../lib/stage'
import { ICON_TILE, ROW } from '../lib/styles'
import { CoverThumb } from './ForestCover'
import { PlaceIcon } from './PlaceIcon'
import { TreeIcon } from './TreeIcon'
import { Badge } from './ui'

// One row per kind of thing, used wherever that thing is listed: its cover on the left, its name
// and a line of detail, a badge where it has a status, and a chevron. A park looks the same in
// Parks, Foliage, Explore and on a tree's page; only the line of detail may differ. (Trails have
// TrailCard in TrailPanel, built the same way.)

function Row({ cover, name, detail, badge, onClick }: { cover: ReactNode; name: string; detail: ReactNode; badge?: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={ROW}>
      {cover}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">{detail}</span>
      </span>
      {badge}
      <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
    </button>
  )
}

/** A park: its island, its region and color (or `detail`), and its stage. */
export function ParkRow({ park, detail, onClick }: { park: ParkReport; detail?: ReactNode; onClick: () => void }) {
  const stage = STAGES[park.stage]
  return (
    <Row
      cover={
        <CoverThumb
          spec={parkCover(park)}
          fallback={
            <span className={`${ICON_TILE} bg-[var(--surface-2)]`}>
              <span className="size-3.5 rounded-full" style={{ background: stage.color }} />
            </span>
          }
        />
      }
      name={parkTitle(park)}
      detail={detail ?? `${park.region} · ${park.colorChange ?? 0}% color`}
      badge={<Badge size="sm" color={stage.color}>{stage.label}</Badge>}
      onClick={onClick}
    />
  )
}

/** A region: its island, its province and usual peak, and where it is in that window. */
export function RegionRow({ region, onClick }: { region: Region; onClick: () => void }) {
  const phase = PHASE_STYLE[peakPhase(region)]
  return (
    <Row
      cover={
        <CoverThumb
          spec={regionCover(region)}
          fallback={
            <span className={`${ICON_TILE} bg-[var(--surface-2)]`}>
              <TreeIcon id={signatureTree(region)} className="size-6" />
            </span>
          }
        />
      }
      name={region.name}
      detail={`${region.province} · peak ${formatWindow(region)}`}
      badge={<Badge size="sm" color={phase.color}>{phase.label}</Badge>}
      onClick={onClick}
    />
  )
}

/** A waterfall, lookout, lake, peak, river or creek: its island, its kind and how to reach it. */
export function PlaceRow({ place, onClick }: { place: Place; onClick: () => void }) {
  const kind = PLACE_KINDS[place.kind]
  return (
    <Row
      cover={
        <CoverThumb
          spec={placeCover(place)}
          fallback={
            <span className={`${ICON_TILE} text-white`} style={{ background: kind.color }}>
              <PlaceIcon kind={place.kind} className="size-5" />
            </span>
          }
        />
      }
      name={place.name}
      detail={`${kind.label}${place.ele ? ` · ${place.ele} m` : ''}${place.trails.length ? ` · on ${place.trails.length} trail${place.trails.length > 1 ? 's' : ''}` : ''}`}
      onClick={onClick}
    />
  )
}

/** A tree: its leaf, its fall colors, and how many were seen turning (`undefined` while loading). */
export function TreeRow({ tree, turning, onClick }: { tree: TreeInfo; turning: number | undefined; onClick: () => void }) {
  return (
    <Row
      cover={
        <span className={`${ICON_TILE} bg-[var(--surface-2)]`}>
          <TreeIcon id={tree.id} className="size-7" />
        </span>
      }
      name={tree.name}
      detail={
        <>
          <span className="flex -space-x-1" aria-hidden>
            {tree.colors.map((c) => (
              <span key={c} className="size-2.5 rounded-full border border-[var(--surface)]" style={{ background: c }} />
            ))}
          </span>
          {turning === undefined ? '…' : turning ? `${turning} turning` : 'None seen turning'}
        </>
      }
      onClick={onClick}
    />
  )
}
