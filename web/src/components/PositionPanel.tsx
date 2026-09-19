'use client'

import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { isaAgreementAbi } from '@/lib/abis'
import { useInvestorPosition } from '@/hooks/useAgreements'
import { formatToken } from '@/lib/format'
import { AgreementStatus, type AgreementSnapshot } from '@/lib/types'
import { useTx } from './TransactionProvider'
import { Button, Card, CardHeader, Stat } from './ui'

export function PositionPanel({ agreement: a }: { agreement: AgreementSnapshot }) {
  const { address } = useAccount()
  const { run, busy } = useTx()
  const queryClient = useQueryClient()
  const { contribution, shareBps, claimed, claimable } = useInvestorPosition(a.agreement, address)

  if (!address || contribution === 0n) return null

  const cancelled = a.status === AgreementStatus.Cancelled

  return (
    <Card>
      <CardHeader title="Your position" description="Read from the agreement contract." />
      <div className="p-5">
        <dl className="grid grid-cols-2 gap-5">
          <Stat label="Contributed" value={`${formatToken(contribution)} tUSD`} />
          <Stat label="Ownership" value={`${(Number(shareBps) / 100).toFixed(2)}%`} />
          <Stat label="Claimed so far" value={`${formatToken(claimed)} tUSD`} />
          <Stat
            label="Available now"
            value={`${formatToken(claimable)} tUSD`}
            tone={claimable > 0n ? 'positive' : 'default'}
          />
        </dl>

        <div className="mt-5">
          {cancelled ? (
            <Button
              className="w-full"
              disabled={busy}
              onClick={async () => {
                const ok = await run({
                  title: 'Reclaiming contribution',
                  summary: `${formatToken(contribution)} tUSD back to your wallet`,
                  steps: [
                    {
                      label: 'Call refund()',
                      request: {
                        address: a.agreement,
                        abi: isaAgreementAbi,
                        functionName: 'refund',
                      },
                    },
                  ],
                })
                if (ok) queryClient.invalidateQueries()
              }}
            >
              Reclaim {formatToken(contribution)} tUSD
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={busy || claimable === 0n}
              onClick={async () => {
                const ok = await run({
                  title: 'Claiming distribution',
                  summary: `${formatToken(claimable)} tUSD to your wallet`,
                  steps: [
                    {
                      label: 'Call claim()',
                      request: {
                        address: a.agreement,
                        abi: isaAgreementAbi,
                        functionName: 'claim',
                      },
                    },
                  ],
                })
                if (ok) queryClient.invalidateQueries()
              }}
            >
              {claimable > 0n
                ? `Claim ${formatToken(claimable)} tUSD`
                : 'Nothing to claim yet'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
