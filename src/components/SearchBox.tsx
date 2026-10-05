import { useQuery } from '@tanstack/react-query'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Close, LocationOn, ProgressActivity, Search } from 'relume-icons'
import { signatureTree, REGIONS } from '../data/regions'
import type { TreeIconId } from '../data/treeIcons'
import { PLACE_KINDS, type Place, type Trail } from '../lib/explore'
import type { ParkReport } from '../lib/ontarioParks'
import { searchLocal, searchPlaces, type SearchResult } from '../lib/search'
import { STAGES } from '../lib/stage'
import { PlaceIcon } from './PlaceIcon'
import { TreeIcon } from './TreeIcon'

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function SearchBox({
  parks,
  trails,
  places: explorePlaces,
  onSelect,
  up,
}: {
  parks: ParkReport[]
  trails: Trail[]
  places: Place[]
  onSelect: (r: SearchResult) => void
  /** Open the results above the box (when it sits at the bottom of the screen). */
  up?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const trimmed = query.trim()
  const local = useMemo(() => searchLocal(trimmed, parks, trails, explorePlaces), [trimmed, parks, trails, explorePlaces])
  const debounced = useDebounced(trimmed, 300)
  const places = useQuery({
    queryKey: ['photon', debounced],
    queryFn: ({ signal }) => searchPlaces(debounced, signal),
    enabled: debounced.length >= 3,
    staleTime: Infinity,
  })

  // Our own places first; geocoder results fill in towns and landmarks, minus near-duplicates.
  const results = useMemo(() => {
    const labels = new Set(local.map((r) => r.label.toLowerCase()))
    const extra = debounced === trimmed ? (places.data ?? []).filter((r) => !labels.has(r.label.toLowerCase())) : []
    return [...local, ...extra].slice(0, 10)
  }, [local, places.data, debounced, trimmed])

  function choose(r: SearchResult) {
    onSelect(r)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      if (query) setQuery('')
      else inputRef.current?.blur()
      setOpen(false)
    }
  }

  const loading = places.isFetching && debounced.length >= 3
  const showList = open && trimmed.length > 0
  const activeId = results[active] ? `${listId}-${active}` : undefined

  return (
    <div className="relative">
      <div className="flex h-[42px] items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 shadow-md focus-within:ring-2 focus-within:ring-brand/40">
        <Search className="size-5 shrink-0 text-[var(--ink-soft)]" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Search parks, trails, towns…"
          aria-label="Search parks, trails, places, towns and trees"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList ? activeId : undefined}
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-[var(--ink-soft)] [&::-webkit-search-cancel-button]:hidden"
        />
        {loading && <ProgressActivity className="size-4 shrink-0 animate-spin text-[var(--ink-soft)]" />}
        {query && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="-mr-1 rounded-full p-1 text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
          >
            <Close className="size-4" />
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute inset-x-0 z-20 max-h-[50vh] ${up ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'} animate-pop-in overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-1.5 shadow-xl`}
        >
          {results.map((r, i) => (
            <li
              key={`${r.kind}:${r.kind === 'park' ? r.park.id : r.kind === 'trail' ? r.trail.id : r.kind === 'explore-place' ? r.place.id : r.id}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-3.5 py-2 ${i === active ? 'bg-[var(--surface-2)]' : ''}`}
            >
              <ResultIcon result={r} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{r.label}</span>
                <span className="block truncate text-xs text-[var(--ink-soft)]">{r.detail}</span>
              </span>
            </li>
          ))}
          {!results.length && !loading && (
            <li className="px-3.5 py-3 text-sm text-[var(--ink-soft)]">
              {trimmed.length < 3
                ? 'Keep typing to search towns and landmarks'
                : `No matches for “${trimmed}”. Try a park, trail, town or tree.`}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ResultIcon({ result }: { result: SearchResult }) {
  const box = 'flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]'
  if (result.kind === 'region') {
    const region = REGIONS.find((r) => r.id === result.id)!
    return (
      <span className={`${box} text-brand`}>
        <TreeIcon id={signatureTree(region)} className="size-4" />
      </span>
    )
  }
  if (result.kind === 'park')
    return (
      <span className={box}>
        <span className="size-3 rounded-full" style={{ background: STAGES[result.park.stage].color }} />
      </span>
    )
  if (result.kind === 'trail' || result.kind === 'explore-place') {
    const kind = result.kind === 'trail' ? 'trail' : result.place.kind
    return (
      <span className={`${box} text-white`} style={{ background: PLACE_KINDS[kind].color }}>
        <PlaceIcon kind={kind} className="size-4" />
      </span>
    )
  }
  if (result.kind === 'tree')
    return (
      <span className={`${box} text-pumpkin`}>
        <TreeIcon id={result.id as TreeIconId} className="size-4" />
      </span>
    )
  return (
    <span className={`${box} text-[var(--ink-soft)]`}>
      <LocationOn className="size-4" />
    </span>
  )
}
