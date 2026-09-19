'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { monadTestnet } from '@/lib/chain'
import { Button } from './ui'

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  8453: 'Base',
  137: 'Polygon',
  10: 'OP Mainnet',
  42161: 'Arbitrum One',
  56: 'BNB Smart Chain',
  143: 'Monad Mainnet',
}

/**
 * A wallet connected to the wrong network will still happily sign — on that network, spending
 * real gas on a contract that does not exist there. This makes the mismatch impossible to miss
 * before the user reaches an action button.
 */
export function NetworkBanner() {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected || chainId === undefined || chainId === monadTestnet.id) return null

  const current = CHAIN_NAMES[chainId] ?? `chain ${chainId}`

  return (
    <div className="border-b border-critical/25 bg-critical-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
        <p className="flex-1 text-sm text-critical">
          <strong className="font-semibold">Your wallet is on {current}.</strong> HumanYield runs on
          Monad Testnet — switch before signing anything, or you will spend real gas on the wrong
          network.
        </p>
        <Button
          size="sm"
          variant="danger"
          disabled={isPending}
          onClick={() => switchChain({ chainId: monadTestnet.id })}
        >
          {isPending ? 'Switching…' : 'Switch to Monad Testnet'}
        </Button>
      </div>
    </div>
  )
}
