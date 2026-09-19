'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useConfig } from 'wagmi'
import { getAccount, switchChain, writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import type { Hash } from 'viem'
import { explorerTx, monadTestnet } from '@/lib/chain'
import { Button, cx } from './ui'

/** One contract call inside a user-facing action. */
export type TxStep = {
  label: string
  /** Everything wagmi's writeContract needs. Typed loosely so pages stay readable. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any
}

type StepState = {
  label: string
  status: 'queued' | 'signing' | 'pending' | 'success' | 'error'
  hash?: Hash
  elapsedMs?: number
  error?: string
}

type RunState = {
  title: string
  summary?: string
  steps: StepState[]
  done: boolean
  failed: boolean
}

type TxContextValue = {
  run: (options: { title: string; summary?: string; steps: TxStep[] }) => Promise<boolean>
  state: RunState | null
  busy: boolean
  dismiss: () => void
}

const TxContext = createContext<TxContextValue | null>(null)

export function useTx() {
  const ctx = useContext(TxContext)
  if (!ctx) throw new Error('useTx must be used inside <TransactionProvider>')
  return ctx
}

function readableError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/user rejected|denied transaction|User denied/i.test(message)) {
    return 'You rejected the request in your wallet.'
  }
  if (/insufficient funds/i.test(message)) {
    return 'Not enough MON to cover gas. Top up from the Monad Testnet faucet.'
  }
  // viem puts the useful bit on the first line.
  const first = message.split('\n').find((line) => line.trim().length > 0) ?? message
  return first.length > 180 ? `${first.slice(0, 177)}…` : first
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const config = useConfig()
  const [state, setState] = useState<RunState | null>(null)
  const [busy, setBusy] = useState(false)

  const run = useCallback<TxContextValue['run']>(
    async ({ title, summary, steps }) => {
      setBusy(true)

      // The wallet's own selected network is the one that signs. wagmi's useChainId()
      // reports the config's chain, which with a single-chain config is always Monad — so it
      // cannot be trusted as a guard. Read the connector's real chain and switch before any
      // request is built, otherwise the wallet would happily sign this on whatever network
      // the user happens to be on.
      const needsSwitch = getAccount(config).chainId !== monadTestnet.id

      const initial: RunState = {
        title,
        summary,
        steps: [
          ...(needsSwitch
            ? [{ label: 'Switch to Monad Testnet', status: 'queued' as const }]
            : []),
          ...steps.map((s) => ({ label: s.label, status: 'queued' as const })),
        ],
        done: false,
        failed: false,
      }
      setState(initial)

      const progress = [...initial.steps]
      const push = (patch: Partial<RunState> = {}) =>
        setState({ ...initial, ...patch, steps: [...progress] })

      const offset = needsSwitch ? 1 : 0

      if (needsSwitch) {
        progress[0] = { ...progress[0], status: 'signing' }
        push()
        try {
          await switchChain(config, { chainId: monadTestnet.id })
          progress[0] = { ...progress[0], status: 'success' }
          push()
        } catch (error) {
          progress[0] = { ...progress[0], status: 'error', error: readableError(error) }
          push({ failed: true, done: true })
          setBusy(false)
          return false
        }
      }

      for (let i = offset; i < progress.length; i++) {
        progress[i] = { ...progress[i], status: 'signing' }
        push()
        try {
          const started = performance.now()
          // Pinning chainId makes wagmi reject (or re-prompt) rather than sign on another network.
          const hash = await writeContract(config, {
            ...steps[i - offset].request,
            chainId: monadTestnet.id,
          })
          progress[i] = { ...progress[i], status: 'pending', hash }
          push()

          const receipt = await waitForTransactionReceipt(config, { hash })
          const elapsedMs = Math.round(performance.now() - started)
          if (receipt.status === 'reverted') {
            progress[i] = { ...progress[i], status: 'error', error: 'Reverted on-chain.', elapsedMs }
            push({ failed: true, done: true })
            setBusy(false)
            return false
          }
          progress[i] = { ...progress[i], status: 'success', elapsedMs }
          push()
        } catch (error) {
          progress[i] = { ...progress[i], status: 'error', error: readableError(error) }
          push({ failed: true, done: true })
          setBusy(false)
          return false
        }
      }

      push({ done: true })
      setBusy(false)
      return true
    },
    [config],
  )

  const dismiss = useCallback(() => setState(null), [])

  const value = useMemo(() => ({ run, state, busy, dismiss }), [run, state, busy, dismiss])

  return (
    <TxContext.Provider value={value}>
      {children}
      <TransactionPanel state={state} onDismiss={dismiss} />
    </TxContext.Provider>
  )
}

function StatusDot({ status }: { status: StepState['status'] }) {
  const map: Record<StepState['status'], string> = {
    queued: 'border-line-strong bg-surface',
    signing: 'border-accent bg-accent-soft',
    pending: 'border-accent bg-accent-soft',
    success: 'border-positive bg-positive',
    error: 'border-critical bg-critical',
  }
  return (
    <span
      aria-hidden
      className={cx(
        'mt-1 inline-block size-2.5 shrink-0 rounded-full border',
        map[status],
        status === 'pending' || status === 'signing' ? 'animate-pulse' : '',
      )}
    />
  )
}

function stepCaption(step: StepState) {
  switch (step.status) {
    case 'queued':
      return 'Waiting'
    case 'signing':
      return 'Confirm in your wallet'
    case 'pending':
      return 'Confirming on Monad Testnet…'
    case 'success':
      return step.elapsedMs !== undefined
        ? `Confirmed in ${(step.elapsedMs / 1000).toFixed(1)}s`
        : 'Confirmed'
    case 'error':
      return step.error ?? 'Failed'
  }
}

function TransactionPanel({
  state,
  onDismiss,
}: {
  state: RunState | null
  onDismiss: () => void
}) {
  if (!state) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm rounded-lg border border-line bg-surface shadow-lg sm:left-auto sm:right-6 sm:mx-0 sm:w-96"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{state.title}</p>
          {state.summary ? <p className="mt-0.5 text-xs text-ink-muted">{state.summary}</p> : null}
        </div>
        {state.done ? (
          <Button variant="ghost" size="sm" onClick={onDismiss} aria-label="Dismiss">
            Close
          </Button>
        ) : null}
      </div>

      <ol className="px-4 py-3">
        {state.steps.map((step, i) => (
          <li key={i} className="flex gap-3 py-1.5">
            <StatusDot status={step.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{step.label}</p>
              <p
                className={cx(
                  'text-xs',
                  step.status === 'error' ? 'text-critical' : 'text-ink-muted',
                )}
              >
                {stepCaption(step)}
              </p>
              {step.hash ? (
                <a
                  href={explorerTx(step.hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-block font-mono text-xs text-accent underline underline-offset-2"
                >
                  View on Monad Explorer
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
