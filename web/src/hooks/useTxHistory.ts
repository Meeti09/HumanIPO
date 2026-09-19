'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * A local record of transactions this browser has sent.
 *
 * Monad's public RPC caps `eth_getLogs` at a 100-block range — about 40 seconds of history at
 * 400ms blocks — so transaction hashes cannot be recovered by scanning logs after the fact.
 * The on-chain *state* history (see `useActivity`) is complete and authoritative; this store
 * exists only to keep the explorer links for actions the user performed in this browser.
 */
export type TxRecord = {
  hash: string
  label: string
  title: string
  at: number
  status: 'success' | 'failed'
}

const STORAGE_KEY = 'humanyield.tx-history'
const MAX_RECORDS = 50

let listeners: Array<() => void> = []
let cache: TxRecord[] | null = null
let cacheRaw: string | null = null

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

const EMPTY: TxRecord[] = []

function getSnapshot(): TxRecord[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return EMPTY
  // useSyncExternalStore requires a referentially stable snapshot between renders.
  if (raw === cacheRaw && cache) return cache
  try {
    cache = JSON.parse(raw) as TxRecord[]
    cacheRaw = raw
    return cache
  } catch {
    return EMPTY
  }
}

const getServerSnapshot = (): TxRecord[] => EMPTY

export function recordTransaction(record: TxRecord) {
  if (typeof window === 'undefined') return
  const existing = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as TxRecord[]
    } catch {
      return []
    }
  })()
  const next = [record, ...existing.filter((r) => r.hash !== record.hash)].slice(0, MAX_RECORDS)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  emit()
}

export function useTxHistory() {
  const records = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const clear = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    emit()
  }, [])

  return { records, clear }
}
