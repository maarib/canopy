import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePresence } from '../hooks'
import { Bookmark, Help, KeyboardArrowDown, Mail, Person } from 'relume-icons'
import { ExternalIcon } from './ui'

// Header avatar with an account menu, modelled on Airbnb's and AllTrails' profile menus:
// your things first (trips), then help and about, then sign-in. Canopy has no accounts yet,
// so trips live on this device and sign-in is marked as coming soon.

const FEEDBACK = 'https://github.com/maarib/canopy/issues/new'

type Props = { tripCount: number; onNavigate: (path: string) => void }

export function AccountMenu({ tripCount, onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const presence = usePresence(open)
  const root = useRef<HTMLDivElement>(null)

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

  const go = (path: string) => {
    setOpen(false)
    onNavigate(path)
  }

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex items-center gap-1 rounded-full border border-[var(--line)] py-1 pr-2 pl-1 shadow-sm transition-colors hover:bg-[var(--surface-2)] ${
          open ? 'bg-[var(--surface-2)]' : ''
        }`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--surface)]">
          <Person className="size-5" />
        </span>
        <KeyboardArrowDown className={`size-4 text-[var(--ink-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {presence.mounted && (
        <div role="menu" className={`absolute top-full right-0 z-40 mt-2 w-72 origin-top-right ${presence.closing ? 'pointer-events-none animate-pop-out' : 'animate-pop-in'} rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-xl`}>
          <div className="flex items-center gap-3 px-2 pt-1 pb-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Person className="size-6 text-[var(--ink-soft)]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Guest</span>
              <span className="block text-xs text-[var(--ink-soft)]">Your trips are saved on this device</span>
            </span>
          </div>
          <div className="border-t border-[var(--line)] py-1">
            <Item icon={<Bookmark className="size-5" />} onClick={() => go('/trips')} meta={tripCount ? String(tripCount) : undefined}>
              Trips
            </Item>
          </div>
          <div className="border-t border-[var(--line)] py-1">
            <Item icon={<Help className="size-5" />} onClick={() => go('/about')}>
              About & data sources
            </Item>
            <Item icon={<Mail className="size-5" />} href={FEEDBACK}>
              Send feedback
            </Item>
          </div>
          <div className="border-t border-[var(--line)] pt-1">
            <Item icon={<Person className="size-5" />} disabled meta="Coming soon">
              Sign in or create account
            </Item>
          </div>
        </div>
      )}
    </div>
  )
}

function Item({
  icon,
  children,
  onClick,
  href,
  meta,
  disabled,
}: {
  icon: ReactNode
  children: ReactNode
  onClick?: () => void
  href?: string
  meta?: string
  disabled?: boolean
}) {
  const cls = `flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm transition-colors ${
    disabled ? 'cursor-default text-[var(--ink-soft)]' : 'hover:bg-[var(--surface-2)]'
  }`
  const body = (
    <>
      <span className="text-[var(--ink-soft)]">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
      {meta && <span className="text-xs text-[var(--ink-soft)]">{meta}</span>}
      {href && <ExternalIcon className="size-3.5 text-[var(--ink-soft)]" />}
    </>
  )
  return href ? (
    <a role="menuitem" href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <button role="menuitem" onClick={onClick} disabled={disabled} aria-disabled={disabled} className={cls}>
      {body}
    </button>
  )
}
