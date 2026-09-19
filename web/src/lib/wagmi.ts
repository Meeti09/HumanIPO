import { createConfig, http, cookieStorage, createStorage } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { monadTestnet, RPC_URL } from './chain'

/**
 * Wallet connection uses the injected connector (MetaMask, Rabby, Brave, OKX …).
 * No project id or third-party service is required to run this app locally.
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected({ shimDisconnect: true })],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  batch: { multicall: true },
  transports: {
    [monadTestnet.id]: http(RPC_URL, { batch: true }),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
