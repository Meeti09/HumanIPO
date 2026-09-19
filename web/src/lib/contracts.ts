import type { Address } from 'viem'

const ZERO = '0x0000000000000000000000000000000000000000' as Address

/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` into the client bundle only for *static* member
 * access. A dynamic lookup like `process.env[name]` is left untouched and resolves to undefined
 * in the browser, so every reference below must be written out literally.
 */
function asAddress(value: string | undefined): Address {
  if (!value || !/^0x[0-9a-fA-F]{40}$/.test(value.trim())) return ZERO
  return value.trim() as Address
}

export const FACTORY_ADDRESS = asAddress(process.env.NEXT_PUBLIC_FACTORY_ADDRESS)
export const TEST_USD_ADDRESS = asAddress(process.env.NEXT_PUBLIC_TEST_USD_ADDRESS)
export const VERIFIER_ADDRESS = asAddress(process.env.NEXT_PUBLIC_VERIFIER_ADDRESS)

/** True when the app has been pointed at a deployed factory. */
export const CONTRACTS_CONFIGURED = FACTORY_ADDRESS !== ZERO && TEST_USD_ADDRESS !== ZERO

export const SETTLEMENT_TOKEN = {
  address: TEST_USD_ADDRESS,
  symbol: 'tUSD',
  decimals: 6,
  label: 'Monad Testnet demo asset',
} as const
