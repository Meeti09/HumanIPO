'use client'

import { useEffect, useRef, useState } from 'react'
import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { formatUnits } from 'viem'
import { monadTestnet } from '@/lib/chain'
import { shortAddress } from '@/lib/format'
import { useIsMounted } from '@/hooks/useIsMounted'
import { Button } from './ui'

function connectorLabel(name: string) {
  if (/walletconnect/i.test(name)) return 'WalletConnect (mobile / QR)'
  if (/injected/i.test(name)) return 'Browser wallet'
  return name
}

export function WalletButton() {
  // `chainId` here is the connector's real network. useChainId() reports the wagmi config's
  // chain, which with a single-chain config is always Monad — it would show "connected" even
  // while the wallet sits on Ethereum, so it must not be used as the network guard.
  const { address, isConnected, chainId } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { data: balance } = useBalance({
    address,
    chainId: monadTestnet.id,
    query: { enabled: Boolean(address) },
  })
  const mounted = useIsMounted()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  // Avoid a hydration mismatch: wallet state is only known on the client.
  if (!mounted) {
    return (
      <Button variant="secondary" size="sm" disabled>
        Connect wallet
      </Button>
    )
  }

  if (!isConnected) {
    if (connectors.length === 0) {
      return (
        <Button variant="secondary" size="sm" disabled>
          No wallet found
        </Button>
      )
    }

    if (connectors.length === 1) {
      return (
        <Button size="sm" disabled={isPending} onClick={() => connect({ connector: connectors[0] })}>
          {isPending ? 'Connecting…' : 'Connect wallet'}
        </Button>
      )
    }

    return (
      <div className="relative" ref={ref}>
        <Button
          size="sm"
          disabled={isPending}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
        >
          {isPending ? 'Connecting…' : 'Connect wallet'}
        </Button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-10 z-50 w-60 rounded-lg border border-line bg-surface p-1.5 shadow-lg"
          >
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                type="button"
                role="menuitem"
                onClick={() => {
                  connect({ connector })
                  setOpen(false)
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm text-ink hover:bg-paper"
              >
                {connectorLabel(connector.name)}
              </button>
            ))}
            <p className="px-3 py-2 text-xs text-ink-muted">
              Monad Testnet — you will be prompted to switch or add the network.
            </p>
          </div>
        ) : null}
      </div>
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
      <span className="tnum hidden text-xs text-ink-muted sm:inline">
        {balance ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(2)} MON` : ''}
      </span>
      <Button variant="secondary" size="sm" onClick={() => disconnect()} title="Disconnect">
        <span className="font-mono">{shortAddress(address)}</span>
      </Button>
    </div>
  )
}
