import type { Address } from 'viem'

export const AgreementStatus = {
  Funding: 0,
  Active: 1,
  Completed: 2,
  Cancelled: 3,
} as const

export type AgreementStatusValue = (typeof AgreementStatus)[keyof typeof AgreementStatus]

export const STATUS_LABEL: Record<number, string> = {
  0: 'Raising',
  1: 'Active',
  2: 'Completed',
  3: 'Cancelled',
}

export type Profile = {
  displayName: string
  headline: string
  description: string
  category: string
}

export type Terms = {
  fundingGoal: bigint
  repaymentCap: bigint
  minIncomeThreshold: bigint
  incomeShareBps: number
  termMonths: number
}

/** Mirrors ISAAgreement.Snapshot. */
export type AgreementSnapshot = {
  agreement: Address
  recipient: Address
  token: Address
  verifier: Address
  profile: Profile
  terms: Terms
  status: number
  totalRaised: bigint
  totalRepaid: bigint
  totalClaimed: bigint
  pendingObligation: bigint
  startTime: bigint
  endTime: bigint
  investorCount: bigint
  incomePeriodCount: bigint
  capitalWithdrawn: boolean
  lastAttestedIncome: bigint
  createdAt: bigint
}

export type IncomePeriod = {
  attestedIncome: bigint
  obligation: bigint
  reportedAt: bigint
  settledAt: bigint
  settled: boolean
}
