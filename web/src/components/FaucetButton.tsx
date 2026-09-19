'use client'

import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { testUSDAbi } from '@/lib/abis'
import { TEST_USD_ADDRESS } from '@/lib/contracts'
import { useFaucetCooldown, useTokenBalance } from '@/hooks/useAgreements'
import { formatToken } from '@/lib/format'
import { useTx } from './TransactionProvider'
import { Button } from './ui'

export function FaucetButton({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { address } = useAccount()
  const { run, busy } = useTx()
  const { secondsRemaining } = useFaucetCooldown(address)
  const { balance } = useTokenBalance(address)
  const queryClient = useQueryClient()

  if (!address) return null

  const cooling = secondsRemaining > 0
  const minutes = Math.ceil(secondsRemaining / 60)

  return (
    <div className="flex items-center gap-3">
      <span className="tnum text-sm text-ink-soft">{formatToken(balance)} tUSD</span>
      <Button
        variant="secondary"
        size={size}
        disabled={busy || cooling}
        onClick={async () => {
          const ok = await run({
            title: 'Claiming demo tUSD',
            summary: '10,000 tUSD from the testnet faucet',
            steps: [
              {
                label: 'Call faucet()',
                request: { address: TEST_USD_ADDRESS, abi: testUSDAbi, functionName: 'faucet' },
              },
            ],
          })
          if (ok) queryClient.invalidateQueries()
        }}
      >
        {cooling ? `Faucet ready in ${minutes}m` : 'Get 10,000 tUSD'}
      </Button>
    </div>
  )
}
