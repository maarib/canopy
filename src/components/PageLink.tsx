import { useQueryClient } from '@tanstack/react-query'
import { useRef, type ComponentProps, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { pageSearch } from '../lib/urlState'
import { warmPath } from '../lib/warm'

/** How long the pointer rests on a link before its page is warmed, so sweeping across a list doesn't load every row. */
const HOVER_MS = 80

/** A plain click: the app opens the page itself. Anything else (cmd, ctrl, shift, middle) is the browser's. */
const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

/**
 * A link to one of the app's pages: a real `<a href>`, so it opens in a new tab, copies and is
 * crawled like any link, while a plain click goes through `onOpen` and keeps the app's page
 * moves. The page's code and data start loading when the link is hovered, touched or focused.
 */
export function PageLink({
  to,
  onOpen,
  boundary,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & {
  /** The page's path, e.g. from `parkPath`. Filters and layers in the URL come along. */
  to: string
  onOpen: () => void
  /** A park's shortname: its outline is fetched with the page. */
  boundary?: string
}) {
  const { search } = useLocation()
  const client = useQueryClient()
  const warmed = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const warm = () => {
    clearTimeout(timer.current)
    if (warmed.current) return
    warmed.current = true
    warmPath(client, to, boundary)
  }
  const query = pageSearch(search)
  return (
    <Link
      {...props}
      to={{ pathname: to, search: query ? `?${query}` : '' }}
      onClick={(e) => {
        props.onClick?.(e)
        if (e.defaultPrevented || !isPlainClick(e)) return
        e.preventDefault()
        onOpen()
      }}
      onPointerEnter={(e) => {
        props.onPointerEnter?.(e)
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') timer.current = setTimeout(warm, HOVER_MS)
      }}
      onPointerLeave={(e) => {
        props.onPointerLeave?.(e)
        clearTimeout(timer.current)
      }}
      onTouchStart={(e) => {
        props.onTouchStart?.(e)
        warm()
      }}
      onFocus={(e) => {
        props.onFocus?.(e)
        warm()
      }}
    />
  )
}
