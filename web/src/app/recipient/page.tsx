'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useAgreementsByAddress, useRecipientAgreements } from '@/hooks/useAgreements'
import { useDemo } from '@/components/DemoProvider'
import { RecipientPanel } from '@/components/RecipientPanel'
import { WalletButton } from '@/components/WalletButton'
import {
  Badge,
  ButtonLink,
  Callout,
  Card,
  EmptyState,
  Progress,
  Stat,
  statusTone,
} from '@/components/ui'
import { explorerAddress } from '@/lib/chain'
import { formatBps, formatToken, percent, shortAddress } from '@/lib/format'
import { STATUS_LABEL } from '@/lib/types'
import { CONTRACTS_CONFIGURED } from '@/lib/contracts'

export default function RecipientPage() {
  const { address } = useAccount()
  const { viewAddress, viewingAsDemo, identity } = useDemo()
  const { addresses } = useRecipientAgreements(viewAddress)
  const { agreements, isLoading } = useAgreementsByAddress(addresses)

  if (!CONTRACTS_CONFIGURED) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Callout tone="caution" title="Contracts not configured">
          Set the factory address in <code className="font-mono">web/.env.local</code>.
        </Callout>
      </div>
    )
  }

  if (!viewAddress) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">My agreements</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Connect the wallet that created an agreement to report income and settle, or pick a demo
          identity from the header to see what the recipient side looks like.
        </p>
        <div className="mt-6">
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">My agreements</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Agreements where{' '}
            <span className="font-mono text-ink">{shortAddress(viewAddress, 6)}</span> is the
            recipient.
          </p>
        </div>
        <ButtonLink href="/create" variant="secondary">
          Create another
        </ButtonLink>
      </div>

      {viewingAsDemo ? (
        <div className="mt-5">
          <Callout tone="accent" title={`Viewing as ${identity?.name}`}>
            Read-only. To report income and settle, connect the wallet that created the agreement —
            or create your own in under a minute.
          </Callout>
        </div>
      ) : null}

      <div className="mt-8 space-y-10">
        {isLoading ? (
          <div className="h-64 rounded-lg border border-line bg-surface" />
        ) : agreements.length === 0 ? (
          <EmptyState
            title="No agreements yet"
            description="Agreements on Explore belong to other wallets, so you can only fund those. Publish your own and this page gains income reporting and settlement controls."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink href="/demo">Run the guided lifecycle</ButtonLink>
                <ButtonLink href="/create" variant="secondary">
                  Create an agreement
                </ButtonLink>
              </div>
            }
          />
        ) : (
          agreements.map((a) => (
            <section key={a.agreement}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/agreement/${a.agreement}`}
                        className="text-base font-semibold text-ink hover:underline"
                      >
                        {a.profile.headline}
                      </Link>
                      <Badge tone={statusTone(a.status)}>{STATUS_LABEL[a.status]}</Badge>
                    </div>
                    <a
                      href={explorerAddress(a.agreement)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block font-mono text-xs text-accent hover:underline"
                    >
                      {shortAddress(a.agreement, 8)}
                    </a>
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <Stat
                    label="Raised"
                    value={formatToken(a.totalRaised)}
                    hint={`of ${formatToken(a.terms.fundingGoal)} tUSD`}
                  />
                  <Stat label="Income share" value={formatBps(a.terms.incomeShareBps)} />
                  <Stat
                    label="Settled"
                    value={formatToken(a.totalRepaid)}
                    hint={`of ${formatToken(a.terms.repaymentCap)} cap`}
                  />
                  <Stat
                    label="Remaining obligation"
                    value={formatToken(a.terms.repaymentCap - a.totalRepaid)}
                  />
                </dl>

                <div className="mt-5">
                  <Progress
                    value={percent(a.totalRepaid, a.terms.repaymentCap)}
                    label="Repayment progress"
                  />
                </div>
              </Card>

              {address && address.toLowerCase() === a.recipient.toLowerCase() ? (
                <div className="mt-4">
                  <RecipientPanel agreement={a} />
                </div>
              ) : (
                <div className="mt-4">
                  <Callout tone="neutral">
                    Connect{' '}
                    <span className="font-mono">{shortAddress(a.recipient, 6)}</span> to report
                    income and settle this agreement.
                  </Callout>
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  )
}
