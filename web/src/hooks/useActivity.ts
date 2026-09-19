'use client'

import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'
import type { Address } from 'viem'
import { isaAgreementAbi } from '@/lib/abis'
import { formatToken } from '@/lib/format'
import type { AgreementSnapshot, IncomePeriod } from '@/lib/types'

export type ActivityEvent = {
  id: string
  at: number
  kind: 'created' | 'activated' | 'income' | 'settled' | 'completed'
  agreement: Address
  who: string
  headline: string
  detail: string
  amount?: bigint
}

/**
 * A timeline of what has happened across a set of agreements.
 *
 * Built from contract *state* rather than event logs: Monad's public RPC caps `eth_getLogs` at a
 * 100-block range, so a log scan cannot reach back more than about 40 seconds. Every agreement
 * stores `createdAt`, `startTime` and a full `IncomePeriod[]` with `reportedAt` / `settledAt`
 * timestamps, so the same history is reconstructable — completely, and with no range limit.
 *
 * Funding and claims are deliberately absent: the contracts record their amounts but not their
 * timestamps, so they cannot be honestly placed on a timeline. They are shown as positions on the
 * agreement and portfolio pages instead.
 */
export function useActivity(agreements: AgreementSnapshot[]) {
  const periodQueries = useReadContracts({
    contracts: agreements.map((a) => ({
      address: a.agreement,
      abi: isaAgreementAbi,
      functionName: 'getIncomePeriods' as const,
    })),
    query: { enabled: agreements.length > 0, refetchInterval: 8_000 },
  })

  const events = useMemo(() => {
    const out: ActivityEvent[] = []

    agreements.forEach((a, i) => {
      const name = a.profile.displayName

      out.push({
        id: `${a.agreement}-created`,
        at: Number(a.createdAt),
        kind: 'created',
        agreement: a.agreement,
        who: name,
        headline: 'Agreement published',
        detail: `${a.profile.headline} — raising ${formatToken(a.terms.fundingGoal)} tUSD at ${
          a.terms.incomeShareBps / 100
        }% for ${a.terms.termMonths} months`,
      })

      if (a.startTime > 0n) {
        out.push({
          id: `${a.agreement}-activated`,
          at: Number(a.startTime),
          kind: 'activated',
          agreement: a.agreement,
          who: name,
          headline: 'Raise closed, term started',
          detail: `${formatToken(a.totalRaised)} tUSD raised from ${Number(
            a.investorCount,
          )} funder${Number(a.investorCount) === 1 ? '' : 's'}`,
          amount: a.totalRaised,
        })
      }

      const result = periodQueries.data?.[i]
      const periods =
        result?.status === 'success' ? (result.result as unknown as IncomePeriod[]) : []

      periods.forEach((p, index) => {
        out.push({
          id: `${a.agreement}-income-${index}`,
          at: Number(p.reportedAt),
          kind: 'income',
          agreement: a.agreement,
          who: name,
          headline: 'Income reported',
          detail:
            p.obligation === 0n
              ? `${formatToken(p.attestedIncome)} tUSD attested — below the income floor, nothing owed`
              : `${formatToken(p.attestedIncome)} tUSD attested — ${formatToken(
                  p.obligation,
                )} tUSD owed at ${a.terms.incomeShareBps / 100}%`,
          amount: p.obligation,
        })

        if (p.settled && p.obligation > 0n) {
          out.push({
            id: `${a.agreement}-settled-${index}`,
            at: Number(p.settledAt),
            kind: 'settled',
            agreement: a.agreement,
            who: name,
            headline: 'Settlement distributed',
            detail: `${formatToken(p.obligation)} tUSD split across ${Number(
              a.investorCount,
            )} funder${Number(a.investorCount) === 1 ? '' : 's'} pro rata`,
            amount: p.obligation,
          })
        }
      })

      if (a.status === 2) {
        const last = periods[periods.length - 1]
        out.push({
          id: `${a.agreement}-completed`,
          at: Number(last?.settledAt ?? a.endTime),
          kind: 'completed',
          agreement: a.agreement,
          who: name,
          headline: 'Agreement completed',
          detail: `${formatToken(a.totalRepaid)} tUSD settled in total — nothing further is owed`,
          amount: a.totalRepaid,
        })
      }
    })

    return out.sort((x, y) => y.at - x.at || x.id.localeCompare(y.id))
  }, [agreements, periodQueries.data])

  return { events, isLoading: periodQueries.isLoading }
}
