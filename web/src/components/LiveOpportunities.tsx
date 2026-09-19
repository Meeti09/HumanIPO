'use client'

import { useAgreementSnapshots } from '@/hooks/useAgreements'
import { CONTRACTS_CONFIGURED } from '@/lib/contracts'
import { AgreementCard } from './AgreementCard'
import { ButtonLink, Callout, EmptyState } from './ui'
import { AgreementStatus } from '@/lib/types'

export function LiveOpportunities({ limit = 3 }: { limit?: number }) {
  const { agreements, isLoading, isError } = useAgreementSnapshots()

  if (!CONTRACTS_CONFIGURED) {
    return (
      <Callout tone="caution" title="Contracts not configured">
        Set <code className="font-mono">NEXT_PUBLIC_FACTORY_ADDRESS</code> and{' '}
        <code className="font-mono">NEXT_PUBLIC_TEST_USD_ADDRESS</code> in{' '}
        <code className="font-mono">web/.env.local</code>, then reload. See the README for the
        deployed Monad Testnet addresses.
      </Callout>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-56 rounded-lg border border-line bg-surface" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Callout tone="critical" title="Could not reach Monad Testnet">
        The RPC endpoint did not respond. Check your connection and reload.
      </Callout>
    )
  }

  const open = agreements
    .filter((a) => a.status === AgreementStatus.Funding)
    .slice(0, limit)
  const shown = open.length > 0 ? open : agreements.slice(0, limit)

  if (shown.length === 0) {
    return (
      <EmptyState
        title="No agreements on-chain yet"
        description="Nothing has been created through this factory. Publish the first agreement to see it here."
        action={<ButtonLink href="/create">Create an agreement</ButtonLink>}
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((a) => (
        <AgreementCard key={a.agreement} agreement={a} />
      ))}
    </div>
  )
}
