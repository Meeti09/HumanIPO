'use client'

import Link from 'next/link'
import { Badge, cx } from './ui'
import { formatDateTime } from '@/lib/format'
import type { ActivityEvent } from '@/hooks/useActivity'

const KIND_LABEL: Record<ActivityEvent['kind'], string> = {
  created: 'Created',
  activated: 'Activated',
  income: 'Income',
  settled: 'Settled',
  completed: 'Completed',
}

const KIND_TONE: Record<ActivityEvent['kind'], 'neutral' | 'accent' | 'positive' | 'caution'> = {
  created: 'neutral',
  activated: 'accent',
  income: 'caution',
  settled: 'positive',
  completed: 'neutral',
}

export function ActivityFeed({
  events,
  limit,
  showAgreement = true,
}: {
  events: ActivityEvent[]
  limit?: number
  showAgreement?: boolean
}) {
  const shown = limit ? events.slice(0, limit) : events

  if (shown.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-ink-muted">
        No on-chain activity yet. Publishing, funding or settling an agreement will show up here.
      </p>
    )
  }

  return (
    <ol className="divide-y divide-line">
      {shown.map((e) => (
        <li key={e.id} className="flex gap-4 px-5 py-3.5">
          <span
            aria-hidden
            className={cx(
              'mt-1.5 inline-block size-2 shrink-0 rounded-full',
              e.kind === 'settled'
                ? 'bg-positive'
                : e.kind === 'income'
                  ? 'bg-caution'
                  : e.kind === 'activated'
                    ? 'bg-accent'
                    : 'bg-line-strong',
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium text-ink">{e.headline}</span>
              <Badge tone={KIND_TONE[e.kind]}>{KIND_LABEL[e.kind]}</Badge>
              {showAgreement ? (
                <Link
                  href={`/agreement/${e.agreement}`}
                  className="text-sm text-accent hover:underline"
                >
                  {e.who}
                </Link>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{e.detail}</p>
          </div>
          <time className="tnum shrink-0 text-xs text-ink-muted" dateTime={String(e.at)}>
            {formatDateTime(e.at)}
          </time>
        </li>
      ))}
    </ol>
  )
}
