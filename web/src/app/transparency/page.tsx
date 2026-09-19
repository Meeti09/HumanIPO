import { Card, CardHeader, TermRow } from '@/components/ui'
import { CHAIN_ID, EXPLORER_URL, RPC_URL, explorerAddress } from '@/lib/chain'
import { FACTORY_ADDRESS, TEST_USD_ADDRESS, VERIFIER_ADDRESS } from '@/lib/contracts'

const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL || ''

const CONTRACTS = [
  {
    name: 'ISAFactory',
    address: FACTORY_ADDRESS,
    role: 'Deploys and indexes every agreement. Batched snapshot reads for the explore page.',
  },
  {
    name: 'ISAAgreement',
    address: null,
    role: 'One contract per agreement, deployed by the factory. Holds the terms, funder positions, income history and settlement accounting.',
  },
  {
    name: 'TestUSD (tUSD)',
    address: TEST_USD_ADDRESS,
    role: 'Demo settlement asset, 6 decimals, open faucet. No real-world value.',
  },
  {
    name: 'DemoIncomeVerifier',
    address: VERIFIER_ADDRESS,
    role: 'Records the recipient’s self-reported income on-chain. Implements IIncomeVerifier so a payroll or oracle provider can replace it without changing agreement logic.',
  },
]

export const metadata = { title: 'Contracts & transparency — HumanYield' }

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Contracts &amp; transparency
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Everything this product does happens on Monad Testnet. Here is exactly what is deployed and
        where to verify it.
      </p>

      <Card className="mt-8">
        <CardHeader title="Network" />
        <dl className="px-5 py-2">
          <TermRow label="Chain" value="Monad Testnet" />
          <TermRow label="Chain ID" value={CHAIN_ID} />
          <TermRow label="RPC" value={<span className="font-mono text-xs">{RPC_URL}</span>} />
          <TermRow
            label="Explorer"
            value={
              <a
                href={EXPLORER_URL}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent hover:underline"
              >
                {EXPLORER_URL}
              </a>
            }
          />
          {REPO_URL ? (
            <TermRow
              label="Source"
              value={
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  GitHub repository
                </a>
              }
            />
          ) : null}
        </dl>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Deployed contracts" />
        <ul className="divide-y divide-line">
          {CONTRACTS.map((c) => (
            <li key={c.name} className="px-5 py-4">
              <p className="text-sm font-semibold text-ink">{c.name}</p>
              <p className="mt-1 text-sm text-ink-soft">{c.role}</p>
              {c.address ? (
                <a
                  href={explorerAddress(c.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block break-all font-mono text-xs text-accent hover:underline"
                >
                  {c.address}
                </a>
              ) : (
                <p className="mt-2 text-xs text-ink-muted">
                  Deployed per agreement — open any agreement page for its address.
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <CardHeader title="What the contracts enforce" />
        <ul className="space-y-2 p-5 text-sm text-ink-soft">
          <li>Income share percentage applied to every attested income figure.</li>
          <li>Minimum income floor below which a period settles at zero.</li>
          <li>Hard repayment cap; the final settlement is clipped so it can never be exceeded.</li>
          <li>Term deadline after which no new income can be reported.</li>
          <li>Pro-rata distribution across funders, claimed rather than pushed.</li>
          <li>Overfunding rejected outright; refunds available on a cancelled raise.</li>
          <li>Only the recipient can report income, settle, withdraw capital or cancel.</li>
        </ul>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Known limitations" />
        <ul className="space-y-2 p-5 text-sm text-ink-soft">
          <li>
            Income is self-reported. The demo verifier records the figure on-chain but does not
            check it against real earnings.
          </li>
          <li>
            Nothing compels a recipient to report. A production system needs payroll or
            open-banking attestation plus legal recourse.
          </li>
          <li>
            Integer division leaves dust in the agreement contract when a settlement does not divide
            evenly across funders.
          </li>
          <li>The contracts are unaudited and deployed to testnet only.</li>
        </ul>
      </Card>
    </div>
  )
}
