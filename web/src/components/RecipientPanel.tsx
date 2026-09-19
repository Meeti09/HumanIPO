'use client'

import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { maxUint256 } from 'viem'
import { isaAgreementAbi, testUSDAbi, demoIncomeVerifierAbi } from '@/lib/abis'
import { TEST_USD_ADDRESS } from '@/lib/contracts'
import { useTokenAllowance, useTokenBalance } from '@/hooks/useAgreements'
import { formatBps, formatToken, parseToken } from '@/lib/format'
import { AgreementStatus, type AgreementSnapshot } from '@/lib/types'
import { useTx } from './TransactionProvider'
import { Button, Callout, Card, CardHeader, Field, Input, TermRow } from './ui'
import { FaucetButton } from './FaucetButton'

export function RecipientPanel({ agreement: a }: { agreement: AgreementSnapshot }) {
  const { address } = useAccount()
  const { run, busy } = useTx()
  const queryClient = useQueryClient()
  const [income, setIncome] = useState('4000')

  const { balance } = useTokenBalance(address)
  const { allowance } = useTokenAllowance(address, a.agreement)

  const parsedIncome = (() => {
    try {
      return parseToken(income)
    } catch {
      return 0n
    }
  })()

  // The contract is the authority on what is owed; preview through it rather than in JS.
  const { data: previewed } = useReadContract({
    address: a.agreement,
    abi: isaAgreementAbi,
    functionName: 'calculateContribution',
    args: [parsedIncome],
    query: { enabled: parsedIncome >= 0n },
  })
  const obligation = (previewed as bigint | undefined) ?? 0n

  const { data: verifierLabel } = useReadContract({
    address: a.verifier,
    abi: demoIncomeVerifierAbi,
    functionName: 'sourceLabel',
  })

  const refresh = () => queryClient.invalidateQueries()

  // ---- Funding stage: activate early, or wait ----
  if (a.status === AgreementStatus.Funding) {
    return (
      <Card>
        <CardHeader
          title="Your agreement is raising"
          description={`${formatToken(a.totalRaised)} of ${formatToken(a.terms.fundingGoal)} tUSD committed`}
        />
        <div className="space-y-4 p-5">
          <p className="text-sm text-ink-soft">
            The agreement activates automatically when the goal is met. You can also close funding
            early and start the term with what has been raised so far.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || a.totalRaised === 0n}
              onClick={async () => {
                const ok = await run({
                  title: 'Activating agreement',
                  summary: `Starting a ${a.terms.termMonths}-month term`,
                  steps: [
                    {
                      label: 'Call activate()',
                      request: {
                        address: a.agreement,
                        abi: isaAgreementAbi,
                        functionName: 'activate',
                      },
                    },
                  ],
                })
                if (ok) refresh()
              }}
            >
              Close funding and activate
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                const ok = await run({
                  title: 'Cancelling agreement',
                  summary: 'Funders will be able to reclaim their contributions',
                  steps: [
                    {
                      label: 'Call cancel()',
                      request: {
                        address: a.agreement,
                        abi: isaAgreementAbi,
                        functionName: 'cancel',
                      },
                    },
                  ],
                })
                if (ok) refresh()
              }}
            >
              Cancel raise
            </Button>
          </div>
          {a.totalRaised === 0n ? (
            <Callout tone="neutral">Nothing has been contributed yet, so there is nothing to activate.</Callout>
          ) : null}
        </div>
      </Card>
    )
  }

  const completed = a.status === AgreementStatus.Completed
  const cancelled = a.status === AgreementStatus.Cancelled

  if (cancelled) {
    return (
      <Card>
        <CardHeader title="Agreement cancelled" />
        <div className="p-5 text-sm text-ink-soft">
          This raise was cancelled. Funders can reclaim their contributions from the agreement
          contract.
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {!a.capitalWithdrawn ? (
        <Card>
          <CardHeader
            title="Capital ready to withdraw"
            description={`${formatToken(a.totalRaised)} tUSD raised`}
          />
          <div className="p-5">
            <Button
              disabled={busy}
              onClick={async () => {
                const ok = await run({
                  title: 'Withdrawing capital',
                  summary: `${formatToken(a.totalRaised)} tUSD to your wallet`,
                  steps: [
                    {
                      label: 'Call withdrawCapital()',
                      request: {
                        address: a.agreement,
                        abi: isaAgreementAbi,
                        functionName: 'withdrawCapital',
                      },
                    },
                  ],
                })
                if (ok) refresh()
              }}
            >
              Withdraw {formatToken(a.totalRaised)} tUSD
            </Button>
          </div>
        </Card>
      ) : null}

      {a.pendingObligation > 0n ? (
        <Card>
          <CardHeader
            title="Settlement due"
            description={`${formatToken(a.pendingObligation)} tUSD owed for the income you reported`}
            action={<FaucetButton />}
          />
          <div className="space-y-4 p-5">
            <dl>
              <TermRow
                label="Reported income"
                value={`${formatToken(a.lastAttestedIncome)} tUSD`}
              />
              <TermRow label="Income share" value={formatBps(a.terms.incomeShareBps)} />
              <TermRow
                label="Amount due"
                value={`${formatToken(a.pendingObligation)} tUSD`}
              />
            </dl>
            {balance < a.pendingObligation ? (
              <Callout tone="caution">
                Your balance is {formatToken(balance)} tUSD. Use the faucet above before settling.
              </Callout>
            ) : null}
            <Button
              className="w-full"
              size="lg"
              disabled={busy || balance < a.pendingObligation}
              onClick={async () => {
                const steps = []
                if (allowance < a.pendingObligation) {
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
                  label: `Settle ${formatToken(a.pendingObligation)} tUSD`,
                  request: {
                    address: a.agreement,
                    abi: isaAgreementAbi,
                    functionName: 'makeRepayment',
                  },
                })
                const ok = await run({
                  title: 'Settling this period',
                  summary: 'Distributed to funders pro rata on confirmation',
                  steps,
                })
                if (ok) refresh()
              }}
            >
              Settle {formatToken(a.pendingObligation)} tUSD
            </Button>
          </div>
        </Card>
      ) : completed ? (
        <Card>
          <CardHeader title="Agreement complete" />
          <div className="p-5 text-sm text-ink-soft">
            {formatToken(a.totalRepaid)} tUSD has been settled against a{' '}
            {formatToken(a.terms.repaymentCap)} tUSD cap. Nothing further is owed and no new income
            can be reported.
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Report income"
            description="Submitting opens a settlement obligation for this period."
          />
          <div className="space-y-5 p-5">
            <Field
              label="Monthly income"
              htmlFor="income"
              suffix="tUSD"
              hint={`Nothing is owed below the ${formatToken(a.terms.minIncomeThreshold)} tUSD floor.`}
            >
              <Input
                id="income"
                inputMode="decimal"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="pr-14"
              />
            </Field>

            <div className="rounded-md border border-line bg-paper p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Calculated by the contract
              </p>
              <dl className="mt-2">
                <TermRow label="Reported income" value={`${formatToken(parsedIncome)} tUSD`} />
                <TermRow label="Income share" value={formatBps(a.terms.incomeShareBps)} />
                <TermRow label="Remaining before cap" value={`${formatToken(a.terms.repaymentCap - a.totalRepaid)} tUSD`} />
                <TermRow label="You will owe" value={`${formatToken(obligation)} tUSD`} />
              </dl>
            </div>

            <Callout tone="caution" title="Demo income attestation">
              {(verifierLabel as string | undefined) ??
                'Self-reported figure recorded on Monad Testnet. Not verified against real earnings.'}
            </Callout>

            <Button
              className="w-full"
              size="lg"
              disabled={busy}
              onClick={async () => {
                const ok = await run({
                  title: 'Reporting income',
                  summary: `${formatToken(parsedIncome)} tUSD → ${formatToken(obligation)} tUSD due`,
                  steps: [
                    {
                      label: 'Call submitIncome()',
                      request: {
                        address: a.agreement,
                        abi: isaAgreementAbi,
                        functionName: 'submitIncome',
                        args: [parsedIncome, '0x'],
                      },
                    },
                  ],
                })
                if (ok) refresh()
              }}
            >
              Submit income
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
