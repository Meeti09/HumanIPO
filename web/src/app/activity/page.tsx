'use client'

import { useAgreementSnapshots } from '@/hooks/useAgreements'
import { useActivity } from '@/hooks/useActivity'
import { useTxHistory } from '@/hooks/useTxHistory'
import { ActivityFeed } from '@/components/ActivityFeed'
import { Button, Callout, Card, CardHeader } from '@/components/ui'
import { explorerTx } from '@/lib/chain'
import { formatDateTime, shortAddress } from '@/lib/format'
import { CONTRACTS_CONFIGURED } from '@/lib/contracts'

export default function ActivityPage() {
  const { agreements, isLoading } = useAgreementSnapshots()
  const { events } = useActivity(agreements)
  const { records, clear } = useTxHistory()

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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Activity</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Everything that has happened across every HumanYield agreement on Monad Testnet,
        reconstructed from contract state.
      </p>

      <Card className="mt-8">
        <CardHeader
          title="On-chain activity"
          description={`${events.length} events across ${agreements.length} agreements`}
        />
        {isLoading ? (
          <p className="px-5 py-8 text-center text-sm text-ink-muted">Reading from Monad…</p>
        ) : (
          <ActivityFeed events={events} />
        )}
      </Card>

      <Card className="mt-8">
        <CardHeader
          title="Your transactions"
          description="Signed from this browser. Stored locally, never sent anywhere."
          action={
            records.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear
              </Button>
            ) : undefined
          }
        />
        {records.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-muted">
            Nothing yet. Fund an agreement, report income or claim a distribution and the
            transaction hash appears here with an explorer link.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {records.map((r) => (
              <li key={r.hash} className="flex flex-wrap items-baseline gap-x-3 px-5 py-3">
                <span className="text-sm font-medium text-ink">{r.label}</span>
                <span className="text-sm text-ink-muted">{r.title}</span>
                {r.status === 'failed' ? (
                  <span className="text-xs text-critical">failed</span>
                ) : null}
                <a
                  href={explorerTx(r.hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto font-mono text-xs text-accent hover:underline"
                >
                  {shortAddress(r.hash, 6)}
                </a>
                <time className="tnum w-full text-xs text-ink-muted sm:w-auto sm:pl-4">
                  {formatDateTime(Math.floor(r.at / 1000))}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Callout tone="neutral" title="Why this is built from state, not logs">
        <p className="mt-1">
          Monad&rsquo;s public RPC caps <code className="font-mono">eth_getLogs</code> at a
          100-block range — roughly 40 seconds of history at 400ms blocks — so scanning event logs
          cannot reach back far enough to be useful. Every agreement instead stores its own history
          as contract state: creation and activation timestamps, and a full list of income periods
          with reported and settled times. That is read back here in full, with no range limit and
          no indexer. Funding and claim amounts are recorded on-chain but without timestamps, so
          they are shown as positions on the agreement and portfolio pages rather than placed on
          this timeline.
        </p>
      </Callout>
    </div>
  )
}
