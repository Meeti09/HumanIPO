'use client'

import { useReadContract, useReadContracts } from 'wagmi'
import type { Address } from 'viem'
import { isaFactoryAbi, isaAgreementAbi, testUSDAbi } from '@/lib/abis'
import { FACTORY_ADDRESS, TEST_USD_ADDRESS, CONTRACTS_CONFIGURED } from '@/lib/contracts'
import type { AgreementSnapshot, IncomePeriod } from '@/lib/types'

const PAGE_SIZE = 50n

/** Every agreement, read in one batched eth_call against the factory. */
export function useAgreementSnapshots() {
  const query = useReadContract({
    address: FACTORY_ADDRESS,
    abi: isaFactoryAbi,
    functionName: 'getAgreementSnapshots',
    args: [0n, PAGE_SIZE],
    query: { enabled: CONTRACTS_CONFIGURED, refetchInterval: 8_000 },
  })

  return {
    ...query,
    agreements: (query.data as AgreementSnapshot[] | undefined) ?? [],
  }
}

/** A single agreement's full state. */
export function useAgreement(address?: Address) {
  const query = useReadContract({
    address,
    abi: isaAgreementAbi,
    functionName: 'getAgreementDetails',
    query: { enabled: Boolean(address), refetchInterval: 5_000 },
  })

  return { ...query, agreement: query.data as AgreementSnapshot | undefined }
}

export function useIncomePeriods(address?: Address) {
  const query = useReadContract({
    address,
    abi: isaAgreementAbi,
    functionName: 'getIncomePeriods',
    query: { enabled: Boolean(address), refetchInterval: 5_000 },
  })
  return { ...query, periods: (query.data as IncomePeriod[] | undefined) ?? [] }
}

export function useInvestors(address?: Address) {
  const query = useReadContract({
    address,
    abi: isaAgreementAbi,
    functionName: 'getInvestors',
    query: { enabled: Boolean(address), refetchInterval: 8_000 },
  })
  return { ...query, investors: (query.data as Address[] | undefined) ?? [] }
}

/** One investor's position inside one agreement. */
export function useInvestorPosition(agreement?: Address, investor?: Address) {
  const query = useReadContract({
    address: agreement,
    abi: isaAgreementAbi,
    functionName: 'getInvestorDetails',
    args: investor ? [investor] : undefined,
    query: { enabled: Boolean(agreement && investor), refetchInterval: 5_000 },
  })

  const data = query.data as readonly [bigint, bigint, bigint, bigint] | undefined
  return {
    ...query,
    contribution: data?.[0] ?? 0n,
    shareBps: data?.[1] ?? 0n,
    claimed: data?.[2] ?? 0n,
    claimable: data?.[3] ?? 0n,
  }
}

/** Portfolio view: every position an address holds, in one batched call. */
export function useInvestorPositions(investor?: Address) {
  const query = useReadContract({
    address: FACTORY_ADDRESS,
    abi: isaFactoryAbi,
    functionName: 'getInvestorPositions',
    args: investor ? [investor, 0n, PAGE_SIZE] : undefined,
    query: { enabled: CONTRACTS_CONFIGURED && Boolean(investor), refetchInterval: 6_000 },
  })

  const data = query.data as readonly [Address[], bigint[], bigint[]] | undefined
  const positions = (data?.[0] ?? []).map((agreement, i) => ({
    agreement,
    contribution: data?.[1][i] ?? 0n,
    claimable: data?.[2][i] ?? 0n,
  }))

  return { ...query, positions: positions.filter((p) => p.contribution > 0n) }
}

export function useRecipientAgreements(recipient?: Address) {
  const query = useReadContract({
    address: FACTORY_ADDRESS,
    abi: isaFactoryAbi,
    functionName: 'getAgreementsByRecipient',
    args: recipient ? [recipient] : undefined,
    query: { enabled: CONTRACTS_CONFIGURED && Boolean(recipient), refetchInterval: 6_000 },
  })
  return { ...query, addresses: (query.data as Address[] | undefined) ?? [] }
}

/** Snapshots for an arbitrary list of agreement addresses. */
export function useAgreementsByAddress(addresses: Address[]) {
  const query = useReadContracts({
    contracts: addresses.map((address) => ({
      address,
      abi: isaAgreementAbi,
      functionName: 'getAgreementDetails' as const,
    })),
    query: { enabled: addresses.length > 0, refetchInterval: 6_000 },
  })

  const agreements = (query.data ?? [])
    .map((r) => (r.status === 'success' ? (r.result as unknown as AgreementSnapshot) : null))
    .filter((a): a is AgreementSnapshot => a !== null)

  return { ...query, agreements }
}

// ---------------------------------------------------------------------------
// Settlement token
// ---------------------------------------------------------------------------

export function useTokenBalance(account?: Address) {
  const query = useReadContract({
    address: TEST_USD_ADDRESS,
    abi: testUSDAbi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: CONTRACTS_CONFIGURED && Boolean(account), refetchInterval: 5_000 },
  })
  return { ...query, balance: (query.data as bigint | undefined) ?? 0n }
}

export function useTokenAllowance(owner?: Address, spender?: Address) {
  const query = useReadContract({
    address: TEST_USD_ADDRESS,
    abi: testUSDAbi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: CONTRACTS_CONFIGURED && Boolean(owner && spender) },
  })
  return { ...query, allowance: (query.data as bigint | undefined) ?? 0n }
}

export function useFaucetCooldown(account?: Address) {
  const query = useReadContract({
    address: TEST_USD_ADDRESS,
    abi: testUSDAbi,
    functionName: 'faucetCooldownRemaining',
    args: account ? [account] : undefined,
    query: { enabled: CONTRACTS_CONFIGURED && Boolean(account), refetchInterval: 15_000 },
  })
  return { ...query, secondsRemaining: Number((query.data as bigint | undefined) ?? 0n) }
}
