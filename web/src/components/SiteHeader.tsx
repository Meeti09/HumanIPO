'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { WalletButton } from './WalletButton'
import { DemoSignIn } from './DemoSignIn'
import { cx } from './ui'

const NAV = [
  { href: '/explore', label: 'Explore' },
  { href: '/dashboard', label: 'Portfolio' },
  { href: '/recipient', label: 'My agreements' },
  { href: '/activity', label: 'Activity' },
  { href: '/create', label: 'Raise funding' },
  { href: '/demo', label: 'Guided demo' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span
            aria-hidden
            className="inline-block size-4 rounded-sm border-[3px] border-accent border-b-transparent"
          />
          HumanYield
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'rounded px-2.5 py-1.5 text-sm transition-colors',
                  active ? 'font-medium text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <DemoSignIn />
          <WalletButton />
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded border border-line-strong px-2 py-1.5 text-xs text-ink-soft md:hidden"
          >
            Menu
          </button>
        </div>
      </div>

      {open ? (
        <nav aria-label="Primary mobile" className="border-t border-line px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded px-2 py-2 text-sm text-ink-soft hover:bg-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  )
}
