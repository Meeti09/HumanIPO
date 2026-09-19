'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * False during server rendering and the first client render, true afterwards.
 *
 * Wallet state only exists in the browser, so components that read it must render a neutral
 * placeholder until hydration is done. `useSyncExternalStore` gives us that without a
 * setState-in-effect cascade.
 */
export function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}
