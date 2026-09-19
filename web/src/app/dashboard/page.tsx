'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { isaAgreementAbi } from '@/lib/abis'
import {
  useAgreementsByAddress,
  useInvestorPositions,
  useTokenBalance,
} from '@/hooks/useAgreements'
import { useDemo } from '@/components/DemoProvider'
import { useTx } from '@/components/TransactionProvider'
import { FaucetButton } from '@/components/FaucetButton'
import { WalletButton } from '@/components/WalletButton'
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  CardHeader,
  EmptyState,
  Stat,
  statusTone,
} from '@/components/ui'
import { formatToken, shortAddress } from '@/lib/format'
import { STATUS_LABEL } from '@/lib/types'
import { CONTRACTS_CONFIGURED } from '@/lib/contracts'

export default function DashboardPage() {
  const { address } = useAccount()
  const { viewAddress, viewingAsDemo, identity } = useDemo()
  const { run, busy } = useTx()
  const queryClient = useQueryClient()

  const { positions, isLoading } = useInvestorPositions(viewAddress)
  const { agreements } = useAgreementsByAddress(positions.map((p) => p.agreement))
  const { balance } = useTokenBalance(address)

  const totalFunded = positions.reduce((sum, p) => sum + p.contribution, 0n)
  const totalClaimable = positions.reduce((sum, p) => sum + p.claimable, 0n)
  const totalReturned = agreements.reduce((sum, a) => {
    const position = positions.find((p) => p.agreement === a.agreement)
    if (!position || a.totalRaised === 0n) return sum
    return sum + (a.totalRepaid * position.contribution) / a.totalRaised
  }, 0n)

  if (!CONTRACTS_CONFIGURED) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Callout tone="caution" title="Contracts not configured">
          Set the factory and token addresses in <code className="font-mono">web/.env.local</code>.
        </Callout>
      </div>
    )
  }

  if (!viewAddress) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Portfolio</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Connect a wallet to see your positions, or pick a demo identity from the header to look
          around a funded portfolio first.
        </p>
        <div className="mt-6">
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Portfolio</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Positions held by{' '}
            <span className="font-mono text-ink">{shortAddress(viewAddress, 6)}</span>, read from
            the agreement contracts.
          </p>
        </div>
        {address ? <FaucetButton /> : null}
      </div>

      {viewingAsDemo ? (
        <div className="mt-5">
          <Callout tone="accent" title={`Viewing as ${identity?.name}`}>
            This is a read-only demo identity mapped to a public testnet address. Connect a wallet
            to fund agreements or claim distributions yourself.
          </Callout>
        </div>
      ) : null}

      <Card className="mt-6 p-5">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat label="Positions" value={positions.length} />
          <Stat label="Total funded" value={`${formatToken(totalFunded)} tUSD`} />
          <Stat label="Returned to date" value={`${formatToken(totalReturned)} tUSD`} />
          <Stat
            label="Available to claim"
            value={`${formatToken(totalClaimable)} tUSD`}
            tone={totalClaimable > 0n ? 'positive' : 'default'}
          />
        </dl>
        {address ? (
          <p className="tnum mt-5 border-t border-line pt-4 text-sm text-ink-muted">
            Wallet balance: {formatToken(balance)} tUSD
          </p>
        ) : null}
      </Card>

      <div className="mt-8">
        {isLoading ? (
          <div className="h-48 rounded-lg border border-line bg-surface" />
        ) : positions.length === 0 ? (
          <EmptyState
            title="No positions yet"
            description="Fund an agreement and your position appears here, along with everything settled against it."
            action={<ButtonLink href="/explore">Explore agreements</ButtonLink>}
          />
        ) : (
          <Card>
            <CardHeader
              title="Your positions"
              description="Ownership is your contribution divided by the total raised at activation."
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                    <th scope="col" className="px-5 py-3 font-medium">
                      Person
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Contributed
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Ownership
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Settled to you
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Claimable
                    </th>
                    <th scope="col" className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const a = agreements.find((x) => x.agreement === p.agreement)
                    const ownership =
                      a && a.totalRaised > 0n
                        ? Number((p.contribution * 10000n) / a.totalRaised) / 100
                        : 0
                    const settled =
                      a && a.totalRaised > 0n
                        ? (a.totalRepaid * p.contribution) / a.totalRaised
                        : 0n
                    return (
                      <tr key={p.agreement} className="border-b border-line last:border-b-0">
                        <th scope="row" className="px-5 py-3 font-medium text-ink">
                          <Link href={`/agreement/${p.agreement}`} className="hover:underline">
                            {a?.profile.displayName ?? shortAddress(p.agreement)}
                          </Link>
                          <span className="block text-xs font-normal text-ink-muted">
                            {a?.profile.headline}
                          </span>
                        </th>
                        <td className="px-5 py-3">
                          {a ? (
                            <Badge tone={statusTone(a.status)}>{STATUS_LABEL[a.status]}</Badge>
                          ) : null}
                        </td>
                        <td className="tnum px-5 py-3 text-ink">{formatToken(p.contribution)}</td>
                        <td className="tnum px-5 py-3 text-ink">{ownership.toFixed(2)}%</td>
                        <td className="tnum px-5 py-3 text-ink-soft">{formatToken(settled)}</td>
                        <td className="tnum px-5 py-3 font-medium text-ink">
                          {formatToken(p.claimable)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy || p.claimable === 0n || !address}
                            onClick={async () => {
                              const ok = await run({
                                title: `Claiming from ${a?.profile.displayName ?? 'agreement'}`,
                                summary: `${formatToken(p.claimable)} tUSD to your wallet`,
                                steps: [
                                  {
                                    label: 'Call claim()',
                                    request: {
                                      address: p.agreement,
                                      abi: isaAgreementAbi,
                                      functionName: 'claim',
                                    },
                                  },
                                ],
                              })
                              if (ok) queryClient.invalidateQueries()
                            }}
                          >
                            Claim
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {agreements.length > 0 ? (
        <Card className="mt-8">
          <CardHeader
            title="Settlement activity"
            description="The latest reported period for each agreement you hold."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Agreement
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Periods reported
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Last reported income
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Total settled
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((a) => (
                  <tr key={a.agreement} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-5 py-3 font-medium text-ink">
                      <Link href={`/agreement/${a.agreement}`} className="hover:underline">
                        {a.profile.displayName}
                      </Link>
                    </th>
                    <td className="tnum px-5 py-3 text-ink-soft">
                      {Number(a.incomePeriodCount)}
                    </td>
                    <td className="tnum px-5 py-3 text-ink-soft">
                      {a.lastAttestedIncome > 0n ? formatToken(a.lastAttestedIncome) : '—'}
                    </td>
                    <td className="tnum px-5 py-3 text-ink">{formatToken(a.totalRepaid)}</td>
                    <td className="tnum px-5 py-3 text-ink-soft">
                      {a.pendingObligation > 0n ? (
                        <Badge tone="caution">{formatToken(a.pendingObligation)} due</Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
