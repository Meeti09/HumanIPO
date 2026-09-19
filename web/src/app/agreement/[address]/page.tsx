'use client'

import { use } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { isAddress, type Address } from 'viem'
import {
  useAgreement,
  useIncomePeriods,
  useInvestors,
} from '@/hooks/useAgreements'
import { InvestPanel } from '@/components/InvestPanel'
import { PositionPanel } from '@/components/PositionPanel'
import { RecipientPanel } from '@/components/RecipientPanel'
import {
  Avatar,
  Badge,
  Callout,
  Card,
  CardHeader,
  Progress,
  Stat,
  TermRow,
  statusTone,
} from '@/components/ui'
import { explorerAddress } from '@/lib/chain'
import {
  formatBps,
  formatDate,
  formatDateTime,
  formatToken,
  percent,
  shortAddress,
} from '@/lib/format'
import { STATUS_LABEL } from '@/lib/types'

export default function AgreementPage({
  params,
}: {
  params: Promise<{ address: string }>
}) {
  const { address: raw } = use(params)
  const { address: wallet } = useAccount()

  const valid = isAddress(raw)
  const agreementAddress = valid ? (raw as Address) : undefined
  const { agreement: a, isLoading, isError } = useAgreement(agreementAddress)
  const { periods } = useIncomePeriods(agreementAddress)
  const { investors } = useInvestors(agreementAddress)

  if (!valid) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Callout tone="critical" title="Not a valid address">
          <code className="font-mono">{raw}</code> is not a contract address on Monad Testnet.{' '}
          <Link href="/explore" className="text-accent underline">
            Back to explore
          </Link>
        </Callout>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-8 w-64 rounded bg-line" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-96 rounded-lg border border-line bg-surface" />
          <div className="h-80 rounded-lg border border-line bg-surface" />
        </div>
      </div>
    )
  }

  if (isError || !a) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Callout tone="critical" title="Agreement not found">
          No HumanYield agreement responded at <code className="font-mono">{raw}</code>. It may be
          on a different network.{' '}
          <Link href="/explore" className="text-accent underline">
            Back to explore
          </Link>
        </Callout>
      </div>
    )
  }

  const isRecipient = Boolean(wallet && wallet.toLowerCase() === a.recipient.toLowerCase())
  const progress = percent(a.totalRaised, a.terms.fundingGoal)
  const repaidProgress = percent(a.totalRepaid, a.terms.repaymentCap)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/explore" className="text-sm text-ink-muted hover:text-ink">
        ← All agreements
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start gap-4">
        <Avatar name={a.profile.displayName} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {a.profile.displayName}
            </h1>
            <Badge tone={statusTone(a.status)}>{STATUS_LABEL[a.status]}</Badge>
            <Badge>{a.profile.category}</Badge>
          </div>
          <p className="mt-1 text-base text-ink-soft">{a.profile.headline}</p>
          <a
            href={explorerAddress(a.agreement)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-mono text-xs text-accent underline underline-offset-2"
          >
            {a.agreement}
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          <Card className="p-5">
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Stat
                label="Raised"
                value={`${formatToken(a.totalRaised)}`}
                hint={`of ${formatToken(a.terms.fundingGoal)} tUSD`}
              />
              <Stat
                label="Settled to date"
                value={`${formatToken(a.totalRepaid)}`}
                hint={`of ${formatToken(a.terms.repaymentCap)} tUSD cap`}
              />
              <Stat label="Funders" value={Number(a.investorCount)} />
              <Stat label="Periods reported" value={Number(a.incomePeriodCount)} />
            </dl>
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
                  <span>Funding progress</span>
                  <span className="tnum">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} label="Funding progress" />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
                  <span>Repaid against cap</span>
                  <span className="tnum">{repaidProgress.toFixed(1)}%</span>
                </div>
                <Progress value={repaidProgress} label="Repayment progress" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Purpose" />
            <p className="p-5 text-sm leading-relaxed text-ink-soft">{a.profile.description}</p>
          </Card>

          <Card>
            <CardHeader title="Agreement terms" description="Enforced by the contract." />
            <dl className="px-5 py-2">
              <TermRow label="Funding goal" value={`${formatToken(a.terms.fundingGoal)} tUSD`} />
              <TermRow label="Income share" value={formatBps(a.terms.incomeShareBps)} />
              <TermRow label="Term" value={`${a.terms.termMonths} months`} />
              <TermRow label="Repayment cap" value={`${formatToken(a.terms.repaymentCap)} tUSD`} />
              <TermRow
                label="Minimum monthly income"
                value={`${formatToken(a.terms.minIncomeThreshold)} tUSD`}
              />
              <TermRow label="Created" value={formatDate(a.createdAt)} />
              <TermRow
                label="Term window"
                value={
                  a.startTime === 0n
                    ? 'Starts at activation'
                    : `${formatDate(a.startTime)} → ${formatDate(a.endTime)}`
                }
              />
            </dl>
          </Card>

          {/* Income history */}
          <Card>
            <CardHeader
              title="Income and settlement history"
              description="Every reported period, read from the contract."
            />
            {periods.length === 0 ? (
              <p className="p-5 text-sm text-ink-muted">
                No income has been reported yet. History appears here after the first submission.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                      <th scope="col" className="px-5 py-3 font-medium">
                        Period
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Reported income
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Owed
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Reported at
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...periods].reverse().map((p, i) => {
                      const index = periods.length - i
                      return (
                        <tr key={index} className="border-b border-line last:border-b-0">
                          <th scope="row" className="tnum px-5 py-3 font-medium text-ink">
                            #{index}
                          </th>
                          <td className="tnum px-5 py-3 text-ink-soft">
                            {formatToken(p.attestedIncome)}
                          </td>
                          <td className="tnum px-5 py-3 text-ink">{formatToken(p.obligation)}</td>
                          <td className="px-5 py-3 text-ink-muted">
                            {formatDateTime(p.reportedAt)}
                          </td>
                          <td className="px-5 py-3">
                            {p.obligation === 0n ? (
                              <Badge>Nothing owed</Badge>
                            ) : p.settled ? (
                              <Badge tone="positive">Settled</Badge>
                            ) : (
                              <Badge tone="caution">Due</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Funders */}
          <Card>
            <CardHeader title="Funders" description={`${investors.length} on-chain positions`} />
            {investors.length === 0 ? (
              <p className="p-5 text-sm text-ink-muted">No contributions yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {investors.map((investor) => (
                  <li key={investor} className="flex items-center justify-between px-5 py-3">
                    <a
                      href={explorerAddress(investor)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-sm text-accent hover:underline"
                    >
                      {shortAddress(investor, 6)}
                    </a>
                    {wallet && wallet.toLowerCase() === investor.toLowerCase() ? (
                      <Badge tone="accent">You</Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Transparency */}
          <Card>
            <CardHeader title="On-chain details" />
            <dl className="px-5 py-2">
              <TermRow
                label="Agreement contract"
                value={
                  <a
                    href={explorerAddress(a.agreement)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-accent hover:underline"
                  >
                    {shortAddress(a.agreement, 8)}
                  </a>
                }
              />
              <TermRow
                label="Recipient"
                value={
                  <a
                    href={explorerAddress(a.recipient)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-accent hover:underline"
                  >
                    {shortAddress(a.recipient, 8)}
                  </a>
                }
              />
              <TermRow
                label="Settlement token"
                value={
                  <a
                    href={explorerAddress(a.token)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-accent hover:underline"
                  >
                    tUSD · {shortAddress(a.token, 6)}
                  </a>
                }
              />
              <TermRow
                label="Income verifier"
                value={
                  <a
                    href={explorerAddress(a.verifier)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-accent hover:underline"
                  >
                    {shortAddress(a.verifier, 6)}
                  </a>
                }
              />
              <TermRow label="Capital withdrawn" value={a.capitalWithdrawn ? 'Yes' : 'No'} />
            </dl>
          </Card>
        </div>

        {/* Right column — actions */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {isRecipient ? <RecipientPanel agreement={a} /> : <InvestPanel agreement={a} />}
          <PositionPanel agreement={a} />

          <Callout tone="caution" title="Demo agreement">
            Terms, profile and settlement asset are testnet demo data. Income figures are
            self-reported attestations recorded on Monad Testnet, not verified earnings. This is not
            an offer of securities.
          </Callout>
        </div>
      </div>
    </div>
  )
}
