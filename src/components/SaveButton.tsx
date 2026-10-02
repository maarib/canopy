import { useEffect, useId, useRef, useState } from 'react'
import { Add, Bookmark, Check } from 'relume-icons'
import { tripActions, tripsContaining, useTrips, type StopRef } from '../lib/trips'

/**
 * Save a region, park, trail or place to one or more trips (Airbnb-wishlist style).
 * With no trips yet, the first save creates "My trip".
 */
export function SaveButton({ stopRef, name }: { stopRef: StopRef; name: string }) {
  const trips = useTrips()
  const saved = tripsContaining(trips, stopRef)
  const [open, setOpen] = useState(false)
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

  const isSaved = saved.length > 0
  return (
    <div ref={root} className="relative">
      <button
        onClick={onClick}
        aria-haspopup={trips.length ? 'menu' : undefined}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${
          isSaved ? 'border-maple bg-maple/10 font-medium text-maple' : 'border-[var(--line)] hover:bg-[var(--surface-2)]'
        }`}
      >
        <Bookmark className="size-4" />
        {isSaved ? 'Saved' : 'Save'}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`Save ${name} to a trip`}
          className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-xl"
        >
          <p className="px-2 pt-1 pb-2 text-xs font-semibold">Save to a trip</p>
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
                        inTrip ? 'border-maple bg-maple text-white' : 'border-[var(--line)]'
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
              className="min-w-0 flex-1 rounded-lg bg-[var(--surface-2)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-maple/40"
            />
            <button type="submit" aria-label="Create trip and save" className="rounded-lg bg-maple p-1.5 text-white hover:opacity-90">
              <Add className="size-4" />
            </button>
          </form>
        </div>
      )}

      {toast && (
        <span role="status" className="absolute top-full left-0 z-30 mt-1.5 whitespace-nowrap rounded-full bg-[var(--ink)] px-3 py-1 text-xs text-[var(--surface)] shadow-lg">
          {toast}
        </span>
      )}
    </div>
  )
}
