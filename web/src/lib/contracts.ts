import type { Address } from 'viem'

const ZERO = '0x0000000000000000000000000000000000000000' as Address

function env(name: string): Address {
  const value = process.env[name]
  if (!value || !/^0x[0-9a-fA-F]{40}$/.test(value)) return ZERO
  return value as Address
}

export const FACTORY_ADDRESS = env('NEXT_PUBLIC_FACTORY_ADDRESS')
export const TEST_USD_ADDRESS = env('NEXT_PUBLIC_TEST_USD_ADDRESS')
export const VERIFIER_ADDRESS = env('NEXT_PUBLIC_VERIFIER_ADDRESS')

/** True when the app has been pointed at a deployed factory. */
export const CONTRACTS_CONFIGURED = FACTORY_ADDRESS !== ZERO && TEST_USD_ADDRESS !== ZERO

export const SETTLEMENT_TOKEN = {
  address: TEST_USD_ADDRESS,
  symbol: 'tUSD',
  decimals: 6,
  label: 'Monad Testnet demo asset',
} as const
