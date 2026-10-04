import { useState, type ReactNode } from 'react'
import {
  Add,
  CalendarToday,
  ChevronRight,
  Close,
  Description,
  KeyboardArrowDown,
  KeyboardArrowUp,
  LocationOn,
} from 'relume-icons'
import { downloadFile, formatDuration, type Trail } from '../lib/explore'
import {
  multiStopDirectionsUrl,
  sharedTripUrl,
  tripActions,
  tripIcs,
  type ResolvedStop,
  type SharedTrip,
  type StopRef,
  type Trip,
} from '../lib/trips'
import { ROW } from '../lib/styles'
import { BackButton, ShareButton } from './ui'

/** A trip stop resolved against the app's data, with how to draw and open it. */
export type StopInfo = ResolvedStop & {
  icon: ReactNode
  color: string
  detail: string
  trail?: Trail
}

export type ResolveStop = (ref: StopRef) => StopInfo | null

function dayLabel(trip: Pick<Trip, 'startDate'>, day: number) {
  if (!trip.startDate) return `Day ${day}`
  const d = new Date(`${trip.startDate}T12:00:00`)
  d.setDate(d.getDate() + day - 1)
  return `Day ${day} · ${d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}`
}

function totals(stops: StopInfo[]) {
  const trails = stops.flatMap((s) => (s.trail ? [s.trail] : []))
  const km = trails.reduce((sum, t) => sum + t.lengthKm, 0)
  const hours = trails.reduce((sum, t) => sum + (t.durationH ?? 0), 0)
  return { trails: trails.length, km: Math.round(km * 10) / 10, hours }
}

// ── Trips list ───────────────────────────────────────────────

export function TripsPanel({
  trips,
  resolve,
  onBack,
  onOpen,
}: {
  trips: Trip[]
  resolve: ResolveStop
  onBack: () => void
  onOpen: (t: Trip) => void
}) {
  const [name, setName] = useState('')
  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />
      <header className="pt-4">
        <h2 className="text-3xl leading-tight">Trips</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Save trails, parks and places with the Save button on their pages, then plan them day by day. Trips are kept on this
          device.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onOpen(tripActions.create(name || 'New trip'))
          setName('')
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name a new trip, e.g. Algonquin weekend"
          aria-label="New trip name"
          maxLength={80}
          className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button type="submit" className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          <Add className="size-4" /> Create trip
        </button>
      </form>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--ink-soft)]">
          No trips yet. Open a trail, park or place and tap <strong className="text-[var(--ink)]">Save</strong>.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {trips.map((t) => {
            const stops = t.items.flatMap((i) => resolve(i.ref) ?? [])
            const sum = totals(stops)
            return (
              <li key={t.id}>
                <button onClick={() => onOpen(t)} className={ROW}>
                  <span className="flex -space-x-2">
                    {stops.slice(0, 3).map((s) => (
                      <span
                        key={s.ref}
                        className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--surface)] text-white"
                        style={{ background: s.color }}
                      >
                        {s.icon}
                      </span>
                    ))}
                    {stops.length === 0 && <span className="size-8 rounded-full border-2 border-dashed border-[var(--line)]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.name}</span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {t.items.length} stop{t.items.length === 1 ? '' : 's'} · {t.days} day{t.days > 1 ? 's' : ''}
                      {sum.trails ? ` · ${sum.km} km of trail` : ''}
                      {t.startDate ? ` · from ${new Date(`${t.startDate}T12:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}` : ''}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── One trip ─────────────────────────────────────────────────

type TripPanelProps = {
  trip: Trip | SharedTrip
  /** Shared trips (from a link) are read-only until saved as a copy. */
  shared?: boolean
  resolve: ResolveStop
  onBack: () => void
  onOpenStop: (ref: StopRef) => void
  onSaveCopy?: () => void
  onDeleted?: () => void
}

export function TripPanel({ trip, shared, resolve, onBack, onOpenStop, onSaveCopy, onDeleted }: TripPanelProps) {
  const id = 'id' in trip ? trip.id : null
  const editable = !shared && id !== null
  const stops = trip.items.flatMap((i) => {
    const s = resolve(i.ref)
    return s ? [{ ...s, day: i.day }] : []
  })
  const missing = trip.items.length - stops.length
  const byDay = Array.from({ length: trip.days }, (_, d) => stops.filter((s) => s.day === d + 1))
  const sum = totals(stops)
  let n = 0

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      {shared && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand/10 p-3 text-sm">
          <span>This trip was shared with you. Save it to make changes.</span>
          <button onClick={onSaveCopy} className="shrink-0 rounded-full bg-brand px-3 py-1.5 font-medium text-white hover:opacity-90">
            Save to my trips
          </button>
        </div>
      )}

      <header className="pt-4">
        {editable ? (
          <input
            key={id}
            defaultValue={trip.name}
            onBlur={(e) => tripActions.rename(id!, e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-label="Trip name"
            maxLength={80}
            className="-mx-1 w-full rounded-lg bg-transparent px-1 font-display text-3xl leading-tight outline-none hover:bg-[var(--surface-2)] focus:bg-[var(--surface-2)]"
          />
        ) : (
          <h2 className="text-3xl leading-tight">{trip.name}</h2>
        )}
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          {stops.length} stop{stops.length === 1 ? '' : 's'}
          {sum.trails ? ` · ${sum.trails} trail${sum.trails > 1 ? 's' : ''}, ${sum.km} km · about ${formatDuration(sum.hours)} on foot` : ''}
        </p>
      </header>

      {editable && (
        <section className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-[var(--ink-soft)]">Start date</span>
            <input
              type="date"
              value={trip.startDate ?? ''}
              onChange={(e) => tripActions.setStartDate(id!, e.target.value || null)}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1.5 text-sm"
            />
          </label>
          <div className="text-sm">
            <span className="mb-1 block text-xs text-[var(--ink-soft)]">Days</span>
            <div className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-0.5">
              <button
                onClick={() => tripActions.setDays(id!, trip.days - 1)}
                disabled={trip.days <= 1}
                aria-label="Fewer days"
                className="rounded-md px-2.5 py-1 hover:bg-[var(--surface)] disabled:opacity-40"
              >
                −
              </button>
              <span className="w-6 text-center font-medium tabular-nums" aria-live="polite">
                {trip.days}
              </span>
              <button
                onClick={() => tripActions.setDays(id!, trip.days + 1)}
                disabled={trip.days >= 14}
                aria-label="More days"
                className="rounded-md px-2.5 py-1 hover:bg-[var(--surface)] disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        </section>
      )}

      {stops.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--ink-soft)]">
          Nothing here yet. Open a trail, park or place and tap <strong className="text-[var(--ink)]">Save</strong> to add it.
        </div>
      ) : (
        byDay.map((dayStops, d) => {
          const directions = multiStopDirectionsUrl(dayStops)
          return (
            <section key={d} aria-label={dayLabel(trip, d + 1)}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-lg">{dayLabel(trip, d + 1)}</h3>
                {directions && (
                  <a
                    href={directions}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Directions for ${dayLabel(trip, d + 1)}`}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-brand transition-colors hover:bg-brand/10"
                  >
                    <LocationOn className="size-4" /> Directions
                  </a>
                )}
              </div>
              {dayStops.length === 0 ? (
                <p className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--ink-soft)]">
                  Nothing planned yet. Move a stop here from its day menu.
                </p>
              ) : (
                <ol className="space-y-1">
                  {dayStops.map((s, i) => {
                    n += 1
                    return (
                      <li key={s.ref} className="flex items-center gap-2 rounded-xl py-1.5">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ background: s.color }}
                          aria-label={`Stop ${n}`}
                        >
                          {n}
                        </span>
                        <button onClick={() => onOpenStop(s.ref)} className="-my-1 min-w-0 flex-1 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-[var(--surface-2)]">
                          <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                            <span style={{ color: s.color }}>{s.icon}</span>
                            <span className="truncate">{s.name}</span>
                          </span>
                          <span className="block truncate text-xs text-[var(--ink-soft)]">{s.detail}</span>
                        </button>
                        {editable && (
                          <span className="flex shrink-0 items-center">
                            <IconButton label="Move up" disabled={i === 0} onClick={() => tripActions.shift(id!, s.ref, -1)}>
                              <KeyboardArrowUp className="size-4" />
                            </IconButton>
                            <IconButton
                              label="Move down"
                              disabled={i === dayStops.length - 1}
                              onClick={() => tripActions.shift(id!, s.ref, 1)}
                            >
                              <KeyboardArrowDown className="size-4" />
                            </IconButton>
                            {trip.days > 1 && (
                              <select
                                value={s.day}
                                onChange={(e) => tripActions.moveToDay(id!, s.ref, Number(e.target.value))}
                                aria-label={`Day for ${s.name}`}
                                className="mx-0.5 rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-1 py-1 text-xs"
                              >
                                {Array.from({ length: trip.days }, (_, k) => (
                                  <option key={k} value={k + 1}>
                                    Day {k + 1}
                                  </option>
                                ))}
                              </select>
                            )}
                            <IconButton label={`Remove ${s.name}`} onClick={() => tripActions.removeItem(id!, s.ref)}>
                              <Close className="size-4" />
                            </IconButton>
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          )
        })
      )}

      {missing > 0 && (
        <p className="text-xs text-[var(--ink-soft)]">
          {missing} saved stop{missing > 1 ? 's are' : ' is'} no longer available and {missing > 1 ? 'are' : 'is'} hidden.
        </p>
      )}

      {stops.length > 0 && (
        <section className="flex flex-wrap gap-2">
          <ShareButton title={`${trip.name} · Canopy trip`} url={sharedTripUrl(trip)} label="Share trip" />
          <button
            onClick={() => downloadFile(`${slug(trip.name)}.gpx`, tripGpx(trip.name, stops), 'application/gpx+xml')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2 text-sm transition hover:bg-[var(--surface-2)] active:scale-[0.97] disabled:active:scale-100"
          >
            <Description className="size-4" /> Download GPX
          </button>
          <button
            onClick={() =>
              trip.startDate &&
              downloadFile(
                `${slug(trip.name)}.ics`,
                tripIcs({ ...(trip as Trip), id: id ?? 'shared' }, byDay, sharedTripUrl(trip)),
                'text/calendar',
              )
            }
            disabled={!trip.startDate}
            title={trip.startDate ? undefined : 'Set a start date to add this trip to your calendar'}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2 text-sm hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            <CalendarToday className="size-4" /> Add to calendar
          </button>
        </section>
      )}
      {stops.length > 0 && !trip.startDate && (
        <p className="-mt-3 text-xs text-[var(--ink-soft)]">Set a start date to add this trip to your calendar.</p>
      )}

      {editable && (
        <button
          onClick={() => {
            if (window.confirm(`Delete “${trip.name}”? This can't be undone.`)) {
              tripActions.remove(id!)
              onDeleted?.()
            }
          }}
          className="text-sm text-[var(--ink-soft)] underline hover:text-brand"
        >
          Delete trip
        </button>
      )}
    </div>
  )
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] disabled:opacity-30"
    >
      {children}
    </button>
  )
}

const slug = (s: string) => s.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'trip'

const esc = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Every trail's track plus a waypoint for every stop. */
function tripGpx(name: string, stops: StopInfo[]): string {
  const wpts = stops.map((s) => `<wpt lat="${s.lat}" lon="${s.lng}"><name>${esc(s.name)}</name><type>${s.kind}</type></wpt>`).join('')
  const trks = stops
    .flatMap((s) => (s.trail ? [s.trail] : []))
    .map(
      (t) =>
        `<trk><name>${esc(t.name)}</name>${t.geometry.coordinates
          .map((line) => `<trkseg>${line.map(([lng, lat]) => `<trkpt lat="${lat}" lon="${lng}"/>`).join('')}</trkseg>`)
          .join('')}</trk>`,
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Canopy" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${esc(name)}</name></metadata>${wpts}${trks}</gpx>`
}
