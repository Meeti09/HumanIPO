'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAgreementSnapshots } from '@/hooks/useAgreements'
import { AgreementCard } from '@/components/AgreementCard'
import {
  Badge,
  ButtonLink,
  Callout,
  EmptyState,
  Progress,
  Select,
  cx,
  statusTone,
} from '@/components/ui'
import { CONTRACTS_CONFIGURED } from '@/lib/contracts'
import { formatBps, formatToken, percent, shortAddress } from '@/lib/format'
import { AgreementStatus, STATUS_LABEL } from '@/lib/types'

type Filter = 'open' | 'active' | 'all'
type View = 'cards' | 'table'

export default function ExplorePage() {
  const { agreements, isLoading, isError } = useAgreementSnapshots()
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<View>('cards')

  const filtered = useMemo(() => {
    if (filter === 'open') return agreements.filter((a) => a.status === AgreementStatus.Funding)
    if (filter === 'active') return agreements.filter((a) => a.status === AgreementStatus.Active)
    return agreements
  }, [agreements, filter])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Explore agreements</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Every agreement created through the HumanYield factory on Monad Testnet. All figures are
            read directly from the contracts. These are demo agreements, not real investment
            opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter" className="sr-only">
            Filter agreements
          </label>
          <Select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="w-40"
          >
            <option value="all">All agreements</option>
            <option value="open">Open for funding</option>
            <option value="active">Active</option>
          </Select>
          <div className="flex rounded-md border border-line-strong" role="group" aria-label="View">
            {(['cards', 'table'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cx(
                  'px-3 py-2 text-sm capitalize first:rounded-l-md last:rounded-r-md',
                  view === v ? 'bg-paper font-medium text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {!CONTRACTS_CONFIGURED ? (
          <Callout tone="caution" title="Contracts not configured">
            Set the factory and token addresses in <code className="font-mono">web/.env.local</code>{' '}
            and reload. The README lists the deployed Monad Testnet addresses.
          </Callout>
        ) : isError ? (
          <Callout tone="critical" title="Could not reach Monad Testnet">
            The RPC endpoint did not respond. Check your connection and reload.
          </Callout>
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 rounded-lg border border-line bg-surface" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nothing matches this filter"
            description="No agreements in this state yet. Create one to see the full lifecycle."
            action={<ButtonLink href="/create">Create an agreement</ButtonLink>}
          />
        ) : view === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <AgreementCard key={a.agreement} agreement={a} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Person
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Purpose
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Raised
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Share
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Term
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Cap
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Contract
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.agreement} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 font-medium text-ink">
                      <Link href={`/agreement/${a.agreement}`} className="hover:underline">
                        {a.profile.displayName}
                      </Link>
                    </th>
                    <td className="px-4 py-3 text-ink-soft">{a.profile.headline}</td>
                    <td className="px-4 py-3">
                      <span className="tnum text-ink">
                        {formatToken(a.totalRaised)} / {formatToken(a.terms.fundingGoal)}
                      </span>
                      <span className="mt-1.5 block w-28">
                        <Progress value={percent(a.totalRaised, a.terms.fundingGoal)} />
                      </span>
                    </td>
                    <td className="tnum px-4 py-3 text-ink">{formatBps(a.terms.incomeShareBps)}</td>
                    <td className="tnum px-4 py-3 text-ink">{a.terms.termMonths} mo</td>
                    <td className="tnum px-4 py-3 text-ink">{formatToken(a.terms.repaymentCap)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(a.status)}>{STATUS_LABEL[a.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/agreement/${a.agreement}`}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        {shortAddress(a.agreement)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
