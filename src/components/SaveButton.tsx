import { useEffect, useId, useRef, useState } from 'react'
import { useIsDesktop, usePresence } from '../hooks'
import { Add, Bookmark, Check } from 'relume-icons'
import { FullScreenMenu } from './ui'
import { tripActions, tripsContaining, useTrips, type StopRef } from '../lib/trips'

/**
 * Save a region, park, trail, place or nearby stop to one or more trips (Airbnb-wishlist style).
 * With no trips yet, the first save creates "My trip". `compact` is the bookmark alone, for the
 * end of a list row; its menu opens toward the left.
 */
export function SaveButton({ stopRef, name, compact = false }: { stopRef: StopRef; name: string; compact?: boolean }) {
  const trips = useTrips()
  const saved = tripsContaining(trips, stopRef)
  const [open, setOpen] = useState(false)
  const presence = usePresence(open)
  const isDesktop = useIsDesktop()
  const [newName, setNewName] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const menuId = useId()

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

  function flash(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  function onClick() {
    if (trips.length === 0) {
      tripActions.create('My trip', stopRef)
      flash('Saved to My trip')
      return
    }
    setOpen(!open)
  }

  function createTrip(e: React.FormEvent) {
    e.preventDefault()
    const trip = tripActions.create(newName || 'New trip', stopRef)
    setNewName('')
    setOpen(false)
    flash(`Saved to ${trip.name}`)
  }

  // The menu's options: in a popover on desktop, filling the screen on phones.
  const choices = (
    <>
      <ul className="max-h-56 overflow-y-auto">
        {trips.map((t) => {
          const inTrip = saved.some((s) => s.id === t.id)
          return (
            <li key={t.id}>
              <button
                role="menuitemcheckbox"
                aria-checked={inTrip}
                onClick={() => {
                  tripActions.toggle(t.id, stopRef)
                  flash(inTrip ? `Removed from ${t.name}` : `Saved to ${t.name}`)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--surface-2)]"
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                    inTrip ? 'border-brand bg-brand text-white' : 'border-[var(--line)]'
                  }`}
                >
                  {inTrip && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                <span className="text-xs text-[var(--ink-soft)]">{t.items.length}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <form onSubmit={createTrip} className="mt-1 flex items-center gap-1 border-t border-[var(--line)] pt-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New trip name"
          aria-label="New trip name"
          maxLength={80}
          className="min-w-0 flex-1 rounded-lg bg-[var(--surface-2)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button type="submit" aria-label="Create trip and save" className="rounded-lg bg-brand p-1.5 text-white hover:opacity-90">
          <Add className="size-4" />
        </button>
      </form>
    </>
  )
  const isSaved = saved.length > 0
  return (
    <div ref={root} className="relative">
      <button
        onClick={onClick}
        aria-haspopup={trips.length ? 'menu' : undefined}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={compact ? (isSaved ? `${name}: saved to a trip` : `Save ${name} to a trip`) : undefined}
        title={compact ? (isSaved ? 'Saved to a trip' : 'Save to a trip') : undefined}
        className={`inline-flex items-center rounded-full border text-sm transition active:scale-[0.97] ${compact ? 'size-9 justify-center' : 'gap-1.5 px-4 py-2'} ${
          isSaved ? 'border-brand bg-brand/10 font-medium text-brand hover:bg-brand/15' : 'border-[var(--line)] hover:bg-[var(--surface-2)]'
        }`}
      >
        <Bookmark className="size-4" />
        {!compact && (isSaved ? 'Saved' : 'Save')}
      </button>

      {presence.mounted && !isDesktop && (
        <FullScreenMenu title="Save to a trip" closing={presence.closing} onClose={() => setOpen(false)}>
          {choices}
        </FullScreenMenu>
      )}
      {presence.mounted && isDesktop && (
        <div
          id={menuId}
          role="menu"
          aria-label={`Save ${name} to a trip`}
          className={`absolute top-full z-30 mt-2 w-64 ${compact ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} ${presence.closing ? 'pointer-events-none animate-pop-out' : 'animate-pop-in'} rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-xl`}
        >
          <p className="px-2 pt-1 pb-2 text-xs font-semibold">Save to a trip</p>
          {choices}
        </div>
      )}

      {toast && (
        <span role="status" className={`absolute bottom-full z-30 mb-1.5 animate-pop-in whitespace-nowrap ${compact ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'} rounded-full bg-[var(--ink)] px-3 py-1 text-xs text-[var(--surface)] shadow-lg`}>
          {toast}
        </span>
      )}
    </div>
  )
}
