'use client'

import { useEffect, useRef, useState } from 'react'
import { DEMO_IDENTITIES, useDemo } from './DemoProvider'
import { Button, cx } from './ui'

export function DemoSignIn() {
  const { identity, signIn, signOut } = useDemo()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!mounted) return null

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:inline-flex"
      >
        {identity ? identity.name : 'Demo sign-in'}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="Demo sign-in"
          className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-line bg-surface p-4 shadow-lg"
        >
          <p className="text-sm font-semibold text-ink">Demo identities</p>
          <p className="mt-1 text-xs text-ink-muted">
            View-only personas for evaluating the product. They hold no keys and cannot sign. Any
            on-chain action still needs a connected wallet.
          </p>

          <div className="mt-3 space-y-2">
            {DEMO_IDENTITIES.map((i) => (
              <button
                key={i.role}
                type="button"
                onClick={() => {
                  signIn(i.role)
                  setOpen(false)
                }}
                className={cx(
                  'w-full rounded-md border px-3 py-2.5 text-left transition-colors',
                  identity?.role === i.role
                    ? 'border-accent bg-accent-soft'
                    : 'border-line hover:bg-paper',
                )}
              >
                <span className="block text-sm font-medium text-ink">{i.name}</span>
                <span className="block font-mono text-xs text-ink-muted">{i.email}</span>
                <span className="mt-1 block text-xs text-ink-soft">{i.blurb}</span>
              </button>
            ))}
          </div>

          {identity ? (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                signOut()
                setOpen(false)
              }}
            >
              Sign out of demo identity
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
