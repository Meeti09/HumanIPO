'use client'

import { useAccount, useBalance, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { formatUnits } from 'viem'
import { monadTestnet } from '@/lib/chain'
import { shortAddress } from '@/lib/format'
import { useIsMounted } from '@/hooks/useIsMounted'
import { Button } from './ui'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { data: balance } = useBalance({ address, query: { enabled: Boolean(address) } })
  const mounted = useIsMounted()

  // Avoid a hydration mismatch: wallet state is only known on the client.
  if (!mounted) {
    return (
      <Button variant="secondary" size="sm" disabled>
        Connect wallet
      </Button>
    )
  }

  if (!isConnected) {
    const connector = connectors[0]
    return (
      <Button
        size="sm"
        disabled={isPending || !connector}
        onClick={() => connector && connect({ connector })}
      >
        {isPending ? 'Connecting…' : connector ? 'Connect wallet' : 'No wallet found'}
      </Button>
    )
  }

  if (chainId !== monadTestnet.id) {
    return (
      <Button
        size="sm"
        variant="danger"
        disabled={switching}
        onClick={() => switchChain({ chainId: monadTestnet.id })}
      >
        {switching ? 'Switching…' : 'Switch to Monad Testnet'}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-ink-muted sm:inline tnum">
        {balance ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(2)} MON` : ''}
      </span>
      <Button variant="secondary" size="sm" onClick={() => disconnect()} title="Disconnect">
        <span className="font-mono">{shortAddress(address)}</span>
      </Button>
    </div>
  )
}
