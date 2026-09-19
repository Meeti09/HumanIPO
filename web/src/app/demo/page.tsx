'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAccount, useConfig, useReadContract } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { useQueryClient } from '@tanstack/react-query'
import { maxUint256, type Address } from 'viem'
import { isaAgreementAbi, isaFactoryAbi, testUSDAbi } from '@/lib/abis'
import { CONTRACTS_CONFIGURED, FACTORY_ADDRESS, TEST_USD_ADDRESS } from '@/lib/contracts'
import {
  useAgreement,
  useInvestorPosition,
  useRecipientAgreements,
  useTokenAllowance,
  useTokenBalance,
} from '@/hooks/useAgreements'
import { useTx } from '@/components/TransactionProvider'
import { WalletButton } from '@/components/WalletButton'
import { explorerAddress } from '@/lib/chain'
import { formatToken } from '@/lib/format'
import { AgreementStatus } from '@/lib/types'
import { Badge, Button, Callout, Card, CardHeader, TermRow, cx } from '@/components/ui'

// Small figures so the whole lifecycle fits inside one faucet allocation.
const DEMO = {
  fundingGoal: 1_000_000_000n, // 1,000 tUSD
  repaymentCap: 2_400_000_000n, // 2,400 tUSD
  minIncome: 1_500_000_000n, // 1,500 tUSD
  shareBps: 700, // 7%
  termMonths: 24,
  income: 4_000_000_000n, // 4,000 tUSD -> 280 owed
}

type StepId = 'wallet' | 'tusd' | 'create' | 'fund' | 'withdraw' | 'income' | 'settle' | 'claim'

export default function GuidedDemoPage() {
  const { address, isConnected } = useAccount()
  const { run, busy } = useTx()
  const config = useConfig()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Address | undefined>()

  const { balance } = useTokenBalance(address)
  const { addresses } = useRecipientAgreements(address)

  // Work on the newest agreement this wallet created, unless one was picked explicitly.
  const current = selected ?? addresses[addresses.length - 1]
  const { agreement } = useAgreement(current)
  const { allowance } = useTokenAllowance(address, current)
  const { claimable, contribution } = useInvestorPosition(current, address)

  const { data: previewed } = useReadContract({
    address: current,
    abi: isaAgreementAbi,
    functionName: 'calculateContribution',
    args: [DEMO.income],
    query: { enabled: Boolean(current) },
  })
  const obligation = (previewed as bigint | undefined) ?? 0n

  const refresh = () => queryClient.invalidateQueries()

  const done: Record<StepId, boolean> = useMemo(
    () => ({
      wallet: isConnected,
      tusd: balance > 0n,
      create: Boolean(agreement),
      fund: Boolean(agreement && agreement.status !== AgreementStatus.Funding),
      withdraw: Boolean(agreement?.capitalWithdrawn),
      income: Boolean(agreement && agreement.incomePeriodCount > 0n),
      settle: Boolean(agreement && agreement.totalRepaid > 0n),
      claim: Boolean(agreement && agreement.totalClaimed > 0n),
    }),
    [isConnected, balance, agreement],
  )

  const remaining = agreement ? agreement.terms.fundingGoal - agreement.totalRaised : 0n

  if (!CONTRACTS_CONFIGURED) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Callout tone="caution" title="Contracts not configured">
          Set the factory and token addresses in <code className="font-mono">web/.env.local</code>.
        </Callout>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Run the full lifecycle yourself
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The agreements on <Link href="/explore" className="text-accent hover:underline">Explore</Link>{' '}
        belong to other wallets, so you can only fund them. This page publishes an agreement where{' '}
        <strong className="font-medium text-ink">you are the recipient</strong>, then walks the whole
        way through: fund it, draw the capital, report income, settle, and claim the distribution.
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        Eight steps, each a real Monad Testnet transaction, about two minutes. Deliberately small
        figures so it all fits inside one faucet allocation.
      </p>

      <div className="mt-8 space-y-4">
        <Step n={1} title="Connect a wallet" done={done.wallet}>
          <p className="mb-3 text-sm text-ink-soft">
            Monad Testnet, with a little MON for gas.
          </p>
          <WalletButton />
        </Step>

        <Step n={2} title="Get demo tUSD" done={done.tusd} disabled={!done.wallet}>
          <p className="mb-3 text-sm text-ink-soft">
            You hold {formatToken(balance)} tUSD. The faucet gives 10,000 per hour — more than
            enough for this run.
          </p>
          <Button
            disabled={busy || !done.wallet}
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
              if (ok) refresh()
            }}
          >
            {done.tusd ? 'Get more tUSD' : 'Get 10,000 tUSD'}
          </Button>
        </Step>

        <Step n={3} title="Publish your agreement" done={done.create} disabled={!done.tusd}>
          <p className="mb-3 text-sm text-ink-soft">
            Deploys a new contract with you as the recipient.
          </p>
          <dl className="mb-4 rounded-md border border-line bg-paper px-4 py-1">
            <TermRow label="Funding goal" value="1,000 tUSD" />
            <TermRow label="Income share" value="7%" />
            <TermRow label="Term" value="24 months" />
            <TermRow label="Repayment cap" value="2,400 tUSD" />
            <TermRow label="Minimum monthly income" value="1,500 tUSD" />
          </dl>
          <Button
            disabled={busy || !done.tusd}
            onClick={async () => {
              const before = (await readContract(config, {
                address: FACTORY_ADDRESS,
                abi: isaFactoryAbi,
                functionName: 'getAgreementCount',
              })) as bigint

              const ok = await run({
                title: 'Publishing your agreement',
                summary: 'Deploying a new agreement contract on Monad Testnet',
                steps: [
                  {
                    label: 'Call createAgreement()',
                    request: {
                      address: FACTORY_ADDRESS,
                      abi: isaFactoryAbi,
                      functionName: 'createAgreement',
                      args: [
                        DEMO.fundingGoal,
                        DEMO.repaymentCap,
                        DEMO.minIncome,
                        DEMO.shareBps,
                        DEMO.termMonths,
                        'Demo Recipient',
                        'Guided lifecycle walkthrough',
                        'A short agreement created from the guided demo so the recipient side of the product can be exercised end to end on Monad Testnet. Demo data.',
                        'Education',
                      ],
                    },
                  },
                ],
              })
              if (!ok) return
              refresh()
              const created = (await readContract(config, {
                address: FACTORY_ADDRESS,
                abi: isaFactoryAbi,
                functionName: 'getAgreement',
                args: [before],
              })) as Address
              setSelected(created)
            }}
          >
            {done.create ? 'Publish another' : 'Publish agreement'}
          </Button>
          {agreement ? (
            <p className="mt-3 text-sm text-ink-muted">
              Working on{' '}
              <a
                href={explorerAddress(agreement.agreement)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-accent hover:underline"
              >
                {agreement.agreement}
              </a>
            </p>
          ) : null}
        </Step>

        <Step n={4} title="Fund it to the goal" done={done.fund} disabled={!done.create}>
          <p className="mb-3 text-sm text-ink-soft">
            Normally other people do this. Here you fund your own raise, which fills it and{' '}
            <strong className="font-medium text-ink">activates the agreement in the same
            transaction</strong> — starting the term.
          </p>
          <Button
            disabled={busy || !agreement || agreement.status !== AgreementStatus.Funding}
            onClick={async () => {
              if (!agreement) return
              const steps = []
              if (allowance < remaining) {
                steps.push({
                  label: 'Approve tUSD spending',
                  request: {
                    address: TEST_USD_ADDRESS,
                    abi: testUSDAbi,
                    functionName: 'approve',
                    args: [agreement.agreement, maxUint256],
                  },
                })
              }
              steps.push({
                label: `Invest ${formatToken(remaining)} tUSD`,
                request: {
                  address: agreement.agreement,
                  abi: isaAgreementAbi,
                  functionName: 'fund',
                  args: [remaining],
                },
              })
              const ok = await run({
                title: 'Funding your agreement',
                summary: 'Fills the raise and starts the term',
                steps,
              })
              if (ok) refresh()
            }}
          >
            Fund {formatToken(remaining)} tUSD
          </Button>
        </Step>

        <Step n={5} title="Withdraw the capital" done={done.withdraw} disabled={!done.fund}>
          <p className="mb-3 text-sm text-ink-soft">
            The raised funds go to you — this is the money that pays for the course.
          </p>
          <Button
            disabled={busy || !agreement || agreement.capitalWithdrawn || !done.fund}
            onClick={async () => {
              if (!agreement) return
              const ok = await run({
                title: 'Withdrawing capital',
                summary: `${formatToken(agreement.totalRaised)} tUSD to your wallet`,
                steps: [
                  {
                    label: 'Call withdrawCapital()',
                    request: {
                      address: agreement.agreement,
                      abi: isaAgreementAbi,
                      functionName: 'withdrawCapital',
                    },
                  },
                ],
              })
              if (ok) refresh()
            }}
          >
            Withdraw {agreement ? formatToken(agreement.totalRaised) : '—'} tUSD
          </Button>
        </Step>

        <Step n={6} title="Report income" done={done.income} disabled={!done.fund}>
          <p className="mb-3 text-sm text-ink-soft">
            Report 4,000 tUSD of monthly income. The amount owed below is not computed in this page
            — it comes from calling{' '}
            <code className="font-mono text-xs">calculateContribution</code> on your contract.
          </p>
          <dl className="mb-4 rounded-md border border-line bg-paper px-4 py-1">
            <TermRow label="Reported income" value="4,000 tUSD" />
            <TermRow label="Income share" value="7%" />
            <TermRow label="Contract says you owe" value={`${formatToken(obligation)} tUSD`} />
          </dl>
          <Callout tone="caution" title="Demo income attestation">
            Self-reported and recorded on Monad Testnet. Not verified against real earnings.
          </Callout>
          <Button
            className="mt-4"
            disabled={
              busy || !agreement || agreement.status !== AgreementStatus.Active ||
              agreement.pendingObligation > 0n
            }
            onClick={async () => {
              if (!agreement) return
              const ok = await run({
                title: 'Reporting income',
                summary: `4,000 tUSD → ${formatToken(obligation)} tUSD due`,
                steps: [
                  {
                    label: 'Call submitIncome()',
                    request: {
                      address: agreement.agreement,
                      abi: isaAgreementAbi,
                      functionName: 'submitIncome',
                      args: [DEMO.income, '0x'],
                    },
                  },
                ],
              })
              if (ok) refresh()
            }}
          >
            Submit 4,000 tUSD of income
          </Button>
        </Step>

        <Step n={7} title="Settle" done={done.settle} disabled={!done.income}>
          <p className="mb-3 text-sm text-ink-soft">
            Pay what the contract says you owe. It becomes claimable by funders immediately, split
            pro rata.
          </p>
          <Button
            disabled={busy || !agreement || agreement.pendingObligation === 0n}
            onClick={async () => {
              if (!agreement) return
              const steps = []
              if (allowance < agreement.pendingObligation) {
                steps.push({
                  label: 'Approve tUSD spending',
                  request: {
                    address: TEST_USD_ADDRESS,
                    abi: testUSDAbi,
                    functionName: 'approve',
                    args: [agreement.agreement, maxUint256],
                  },
                })
              }
              steps.push({
                label: `Settle ${formatToken(agreement.pendingObligation)} tUSD`,
                request: {
                  address: agreement.agreement,
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
            Settle {agreement ? formatToken(agreement.pendingObligation) : '—'} tUSD
          </Button>
        </Step>

        <Step n={8} title="Claim your distribution" done={done.claim} disabled={!done.settle}>
          <p className="mb-3 text-sm text-ink-soft">
            You funded the whole raise, so you own 100% of settlements and can claim all{' '}
            {formatToken(claimable)} tUSD of it. With several funders this splits by contribution.
          </p>
          <Button
            disabled={busy || claimable === 0n}
            onClick={async () => {
              if (!agreement) return
              const ok = await run({
                title: 'Claiming distribution',
                summary: `${formatToken(claimable)} tUSD to your wallet`,
                steps: [
                  {
                    label: 'Call claim()',
                    request: {
                      address: agreement.agreement,
                      abi: isaAgreementAbi,
                      functionName: 'claim',
                    },
                  },
                ],
              })
              if (ok) refresh()
            }}
          >
            Claim {formatToken(claimable)} tUSD
          </Button>
        </Step>
      </div>

      {done.claim && agreement ? (
        <Callout tone="positive" title="That is the whole lifecycle">
          <p className="mt-1">
            You published an agreement, funded it, drew the capital, reported income, settled what
            the contract calculated, and claimed the distribution — every step a real transaction.
            Open{' '}
            <Link href={`/agreement/${agreement.agreement}`} className="text-accent underline">
              the agreement page
            </Link>{' '}
            for the full history, or{' '}
            <Link href="/activity" className="text-accent underline">
              Activity
            </Link>{' '}
            for the transaction hashes.
          </p>
        </Callout>
      ) : null}

      {contribution > 0n && agreement ? (
        <Card className="mt-8">
          <CardHeader title="Current agreement state" description="Read from your contract." />
          <dl className="px-5 py-2">
            <TermRow label="Status" value={['Raising', 'Active', 'Completed', 'Cancelled'][agreement.status]} />
            <TermRow label="Raised" value={`${formatToken(agreement.totalRaised)} tUSD`} />
            <TermRow label="Settled to date" value={`${formatToken(agreement.totalRepaid)} tUSD`} />
            <TermRow label="Periods reported" value={Number(agreement.incomePeriodCount)} />
            <TermRow label="Available to claim" value={`${formatToken(claimable)} tUSD`} />
          </dl>
        </Card>
      ) : null}
    </div>
  )
}

function Step({
  n,
  title,
  done,
  disabled,
  children,
}: {
  n: number
  title: string
  done: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Card className={cx('p-5', disabled && !done ? 'opacity-55' : '')}>
      <div className="flex items-center gap-3">
        <span
          className={cx(
            'tnum inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
            done ? 'border-positive bg-positive text-white' : 'border-line-strong text-ink-muted',
          )}
        >
          {done ? '✓' : n}
        </span>
        <h2 className="flex-1 text-base font-semibold text-ink">{title}</h2>
        {done ? <Badge tone="positive">Done</Badge> : null}
      </div>
      <div className="mt-4 pl-9">{children}</div>
    </Card>
  )
}
