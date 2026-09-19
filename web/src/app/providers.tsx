'use client'

import { useState, type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { TransactionProvider } from '@/components/TransactionProvider'
import { DemoProvider } from '@/components/DemoProvider'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Monad blocks land in well under a second; a short stale window keeps the UI
            // fresh without hammering the RPC.
            staleTime: 2_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <DemoProvider>
          <TransactionProvider>{children}</TransactionProvider>
        </DemoProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
