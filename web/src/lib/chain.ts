import { defineChain } from 'viem'
import { monadTestnet as viemMonadTestnet } from 'viem/chains'

export const RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL || viemMonadTestnet.rpcUrls.default.http[0]

export const EXPLORER_URL = (
  process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://testnet.monadexplorer.com'
).replace(/\/$/, '')

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || viemMonadTestnet.id)

/** Monad Testnet, with the RPC and explorer overridable through the environment. */
export const monadTestnet = defineChain({
  ...viemMonadTestnet,
  id: CHAIN_ID,
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: EXPLORER_URL },
  },
})

export const explorerTx = (hash: string) => `${EXPLORER_URL}/tx/${hash}`
export const explorerAddress = (address: string) => `${EXPLORER_URL}/address/${address}`
