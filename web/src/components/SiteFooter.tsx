import Link from 'next/link'
import { explorerAddress, EXPLORER_URL, CHAIN_ID } from '@/lib/chain'
import { FACTORY_ADDRESS, TEST_USD_ADDRESS, VERIFIER_ADDRESS } from '@/lib/contracts'

const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL || ''

const CONTRACTS = [
  { label: 'ISAFactory', address: FACTORY_ADDRESS },
  { label: 'TestUSD (tUSD)', address: TEST_USD_ADDRESS },
  { label: 'DemoIncomeVerifier', address: VERIFIER_ADDRESS },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-ink">HumanYield</p>
            <p className="mt-2 max-w-xs text-sm text-ink-muted">
              Income Share Agreements as a consumer product, settled on Monad.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/explore" className="text-ink-soft hover:text-ink">
                  Explore agreements
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-ink-soft hover:text-ink">
                  Raise funding
                </Link>
              </li>
              <li>
                <Link href="/transparency" className="text-ink-soft hover:text-ink">
                  Contracts &amp; transparency
                </Link>
              </li>
              {REPO_URL ? (
                <li>
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink-soft hover:text-ink"
                  >
                    Source code
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Monad Testnet · chain {CHAIN_ID}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {CONTRACTS.map((c) => (
                <li key={c.label} className="flex flex-col">
                  <span className="text-ink-soft">{c.label}</span>
                  <a
                    href={explorerAddress(c.address)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-accent underline underline-offset-2"
                  >
                    {c.address}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={EXPLORER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-soft hover:text-ink"
                >
                  Monad Explorer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-ink-muted">
          Prototype built for Monad Blitz and deployed to Monad Testnet. Agreements, profiles and
          the tUSD settlement asset are demo data with no real-world financial value. Income figures
          are self-reported testnet attestations, not verified earnings. Nothing here is financial
          advice or an offer of securities.
        </p>
      </div>
    </footer>
  )
}
