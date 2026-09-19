import { formatUnits, parseUnits } from 'viem'

export const TOKEN_DECIMALS = 6

/** 1,234.56 — no currency symbol, because tUSD is a demo asset. */
export function formatToken(value: bigint | undefined, opts: { decimals?: number } = {}) {
  if (value === undefined) return '—'
  const n = Number(formatUnits(value, TOKEN_DECIMALS))
  const decimals = opts.decimals ?? (Number.isInteger(n) ? 0 : 2)
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatTokenWithSymbol(value: bigint | undefined) {
  return `${formatToken(value)} tUSD`
}

export function parseToken(value: string): bigint {
  const cleaned = value.replace(/,/g, '').trim()
  if (cleaned === '') return 0n
  return parseUnits(cleaned, TOKEN_DECIMALS)
}

export function formatBps(bps: number | bigint | undefined) {
  if (bps === undefined) return '—'
  const n = Number(bps) / 100
  return `${Number.isInteger(n) ? n : n.toFixed(2)}%`
}

export function shortAddress(address?: string, size = 4) {
  if (!address) return '—'
  return `${address.slice(0, 2 + size)}…${address.slice(-size)}`
}

export function formatDate(seconds: bigint | number | undefined) {
  if (!seconds || Number(seconds) === 0) return '—'
  return new Date(Number(seconds) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(seconds: bigint | number | undefined) {
  if (!seconds || Number(seconds) === 0) return '—'
  return new Date(Number(seconds) * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function percent(numerator: bigint, denominator: bigint) {
  if (denominator === 0n) return 0
  return Math.min(100, Number((numerator * 10000n) / denominator) / 100)
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
