'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'

/**
 * Demo identities let a judge look around the product instantly without a wallet.
 *
 * They are view-only UI personas mapped to a public testnet address — they hold no keys and
 * cannot sign anything. Any on-chain action still requires a connected wallet.
 */
export type DemoRole = 'investor' | 'recipient'

export type DemoIdentity = {
  role: DemoRole
  name: string
  email: string
  address: Address
  blurb: string
}

const SEED_ADDRESS = (process.env.NEXT_PUBLIC_DEMO_SEED_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as Address

export const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    role: 'investor',
    name: 'Demo Investor',
    email: 'investor@humanyield.demo',
    address: (process.env.NEXT_PUBLIC_DEMO_INVESTOR_ADDRESS as Address) || SEED_ADDRESS,
    blurb: 'Browse open agreements and follow a funded portfolio.',
  },
  {
    role: 'recipient',
    name: 'Demo Recipient',
    email: 'creator@humanyield.demo',
    address: (process.env.NEXT_PUBLIC_DEMO_RECIPIENT_ADDRESS as Address) || SEED_ADDRESS,
    blurb: 'See the income reporting and settlement side of an agreement.',
  },
]

type DemoContextValue = {
  identity: DemoIdentity | null
  signIn: (role: DemoRole) => void
  signOut: () => void
  /** Address the read-only views should use: the connected wallet, else the demo identity. */
  viewAddress: Address | undefined
  /** True when the views are showing demo-identity data rather than the connected wallet. */
  viewingAsDemo: boolean
}

const DemoContext = createContext<DemoContextValue | null>(null)

const STORAGE_KEY = 'humanyield.demo-role'

// The selected persona lives in localStorage so it survives a reload. Reading it through
// useSyncExternalStore keeps server and first-client renders consistent without a setState
// cascade in an effect.
let listeners: Array<() => void> = []

function subscribe(listener: () => void) {
  listeners.push(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
    window.removeEventListener('storage', listener)
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function getSnapshot(): DemoRole | null {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'investor' || stored === 'recipient' ? stored : null
}

const getServerSnapshot = (): DemoRole | null => null

export function DemoProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount()
  const role = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const signIn = useCallback((next: DemoRole) => {
    window.localStorage.setItem(STORAGE_KEY, next)
    emit()
  }, [])

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    emit()
  }, [])

  const identity = useMemo(
    () => DEMO_IDENTITIES.find((i) => i.role === role) ?? null,
    [role],
  )

  const value = useMemo<DemoContextValue>(() => {
    const demoAddress =
      identity && identity.address !== '0x0000000000000000000000000000000000000000'
        ? identity.address
        : undefined
    return {
      identity,
      signIn,
      signOut,
      viewAddress: address ?? demoAddress,
      viewingAsDemo: !address && Boolean(demoAddress),
    }
  }, [identity, signIn, signOut, address])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}
