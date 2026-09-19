import { createConfig, http, cookieStorage, createStorage } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { walletConnect } from 'wagmi/connectors'
import { monadTestnet, RPC_URL } from './chain'

const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

/**
 * Wallet connection: the injected connector (MetaMask, Rabby, Brave, OKX …) is always
 * available and needs no third-party service. WalletConnect is added only when a project id
 * is configured, so the app still runs with an empty .env.local.
 */
const connectors = [
  injected({ shimDisconnect: true }),
  ...(WALLETCONNECT_PROJECT_ID
    ? [
        walletConnect({
          projectId: WALLETCONNECT_PROJECT_ID,
          showQrModal: true,
          metadata: {
            name: 'HumanYield',
            description:
              'Income Share Agreements as a consumer product, settled on Monad Testnet.',
            url: 'https://humanyield.vercel.app',
            icons: [],
          },
        }),
      ]
    : []),
]

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors,
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
