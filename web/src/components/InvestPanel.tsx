'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { maxUint256 } from 'viem'
import { isaAgreementAbi, testUSDAbi } from '@/lib/abis'
import { TEST_USD_ADDRESS } from '@/lib/contracts'
import { useTokenAllowance, useTokenBalance } from '@/hooks/useAgreements'
import { formatToken, parseToken } from '@/lib/format'
import type { AgreementSnapshot } from '@/lib/types'
import { AgreementStatus } from '@/lib/types'
import { useTx } from './TransactionProvider'
import { Button, Callout, Card, CardHeader, Field, Input, TermRow } from './ui'
import { FaucetButton } from './FaucetButton'
import { WalletButton } from './WalletButton'

const QUICK_AMOUNTS = ['100', '250', '500']

export function InvestPanel({ agreement: a }: { agreement: AgreementSnapshot }) {
  const { address, isConnected } = useAccount()
  const { run, busy } = useTx()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('500')

  const { balance } = useTokenBalance(address)
  const { allowance } = useTokenAllowance(address, a.agreement)

  const remaining = a.terms.fundingGoal - a.totalRaised
  const parsed = (() => {
    try {
      return parseToken(amount)
    } catch {
      return 0n
    }
  })()

  const projectedRaised = a.totalRaised + parsed
  const ownershipBps =
    projectedRaised > 0n ? Number((parsed * 10000n) / projectedRaised) / 100 : 0
  const maxDistribution =
    projectedRaised > 0n ? (a.terms.repaymentCap * parsed) / projectedRaised : 0n

  let error: string | undefined
  if (parsed <= 0n) error = 'Enter an amount greater than zero.'
  else if (parsed > remaining) error = `Only ${formatToken(remaining)} tUSD left in this raise.`
  else if (parsed > balance) error = `Your balance is ${formatToken(balance)} tUSD.`

  if (a.status !== AgreementStatus.Funding) {
    return (
      <Card>
        <CardHeader title="Funding closed" />
        <div className="p-5">
          <p className="text-sm text-ink-soft">
            This agreement is no longer accepting contributions. Positions are fixed at{' '}
            {formatToken(a.totalRaised)} tUSD raised across {Number(a.investorCount)} funder
            {Number(a.investorCount) === 1 ? '' : 's'}.
          </p>
        </div>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader title="Fund this agreement" description="Connect a wallet on Monad Testnet." />
        <div className="space-y-4 p-5">
          <p className="text-sm text-ink-soft">
            You will need testnet MON for gas and demo tUSD to invest. Both are free.
          </p>
          <WalletButton />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Fund this agreement"
        description={`${formatToken(remaining)} tUSD still open`}
        action={<FaucetButton />}
      />
      <div className="space-y-5 p-5">
        <Field
          label="Amount"
          htmlFor="invest-amount"
          suffix="tUSD"
          error={amount !== '' ? error : undefined}
          hint={`Balance ${formatToken(balance)} tUSD`}
        >
          <Input
            id="invest-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pr-14"
          />
        </Field>

        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <Button key={q} variant="secondary" size="sm" onClick={() => setAmount(q)}>
              {q}
            </Button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAmount(formatToken(remaining < balance ? remaining : balance, { decimals: 2 }))}
          >
            Max
          </Button>
        </div>

        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Your position if this fills
          </p>
          <dl className="mt-2">
            <TermRow label="Contribution" value={`${formatToken(parsed)} tUSD`} />
            <TermRow
              label="Ownership of settlements"
              value={`${ownershipBps.toFixed(2)}%`}
            />
            <TermRow
              label="Share of the repayment cap"
              value={`up to ${formatToken(maxDistribution)} tUSD`}
            />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            Ownership is calculated against the total raised at activation, so it changes if others
            fund after you. The cap is a ceiling, not a projection — the recipient may report no
            qualifying income and settle nothing.
          </p>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={busy || Boolean(error)}
          onClick={async () => {
            const steps = []
            if (allowance < parsed) {
              steps.push({
                label: 'Approve tUSD spending',
                request: {
                  address: TEST_USD_ADDRESS,
                  abi: testUSDAbi,
                  functionName: 'approve',
                  args: [a.agreement, maxUint256],
                },
              })
            }
            steps.push({
              label: `Invest ${formatToken(parsed)} tUSD`,
              request: {
                address: a.agreement,
                abi: isaAgreementAbi,
                functionName: 'fund',
                args: [parsed],
              },
            })

            const ok = await run({
              title: `Funding ${a.profile.displayName}`,
              summary: `${formatToken(parsed)} tUSD on Monad Testnet`,
              steps,
            })
            if (ok) queryClient.invalidateQueries()
          }}
        >
          {busy ? 'Working…' : `Invest ${formatToken(parsed)} tUSD`}
        </Button>

        {parsed === remaining && parsed > 0n ? (
          <Callout tone="accent">
            This contribution completes the raise, so the agreement activates in the same
            transaction and the term starts immediately.
          </Callout>
        ) : null}
      </div>
    </Card>
  )
}
