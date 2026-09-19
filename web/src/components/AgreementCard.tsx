import Link from 'next/link'
import { Avatar, Badge, Card, Progress, statusTone } from './ui'
import { formatBps, formatToken, percent } from '@/lib/format'
import { STATUS_LABEL, type AgreementSnapshot } from '@/lib/types'

export function AgreementCard({ agreement: a }: { agreement: AgreementSnapshot }) {
  const progress = percent(a.totalRaised, a.terms.fundingGoal)

  return (
    <Card className="flex flex-col transition-colors hover:border-line-strong">
      <Link href={`/agreement/${a.agreement}`} className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <Avatar name={a.profile.displayName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{a.profile.displayName}</p>
            <p className="truncate text-sm text-ink-muted">{a.profile.headline}</p>
          </div>
          <Badge tone={statusTone(a.status)}>{STATUS_LABEL[a.status]}</Badge>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="tnum font-medium text-ink">
              {formatToken(a.totalRaised)}{' '}
              <span className="font-normal text-ink-muted">
                of {formatToken(a.terms.fundingGoal)} tUSD
              </span>
            </span>
            <span className="tnum text-xs text-ink-muted">{progress.toFixed(0)}%</span>
          </div>
          <div className="mt-2">
            <Progress value={progress} label={`${a.profile.displayName} funding progress`} />
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-xs text-ink-muted">Income share</dt>
            <dd className="tnum mt-0.5 font-medium text-ink">
              {formatBps(a.terms.incomeShareBps)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Term</dt>
            <dd className="tnum mt-0.5 font-medium text-ink">{a.terms.termMonths} mo</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Cap</dt>
            <dd className="tnum mt-0.5 font-medium text-ink">
              {formatToken(a.terms.repaymentCap)}
            </dd>
          </div>
        </dl>
      </Link>
    </Card>
  )
}
