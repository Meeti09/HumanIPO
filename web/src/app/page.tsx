import Link from 'next/link'
import { ButtonLink, Card, Section, TermRow } from '@/components/ui'
import { LiveOpportunities } from '@/components/LiveOpportunities'

const STEPS = [
  {
    n: '01',
    title: 'Someone publishes an agreement',
    body: 'A person states what they need funding for, how much, what share of their income they will return, for how long, and the hard ceiling on total repayment. The terms are deployed as their own contract on Monad.',
  },
  {
    n: '02',
    title: 'Funders take a position',
    body: 'Anyone can contribute. Each contribution is recorded on-chain as a proportional claim on every future settlement. Fund 20% of the raise, receive 20% of everything repaid.',
  },
  {
    n: '03',
    title: 'Income is reported and settled',
    body: 'The recipient reports monthly income. The contract applies the agreed percentage, the minimum income floor, and the remaining cap, then splits the settlement across funders pro rata.',
  },
]

const COMPARISON = [
  {
    model: 'Crowdfunding',
    repayment: 'None — usually a reward or nothing',
    downside: 'Backers carry all the risk with no upside',
  },
  {
    model: 'Fixed loan',
    repayment: 'Same amount every month regardless of income',
    downside: 'Crushing when income drops to zero',
  },
  {
    model: 'HumanYield',
    repayment: 'A set percentage of reported income',
    downside: 'Nothing owed in a month with no qualifying income',
  },
]

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <div className="grid gap-12 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ink-muted">
            Income Share Agreements · Monad Testnet
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Fund a person&rsquo;s future, not just a project.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
            HumanYield turns a personal goal &mdash; a course, a certification, a career move, a
            creative project &mdash; into a funding agreement anyone can back. Instead of fixed
            repayments, the recipient returns an agreed share of their reported income, and the
            contract splits every settlement across funders automatically.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/explore" size="lg">
              Explore agreements
            </ButtonLink>
            <ButtonLink href="/create" size="lg" variant="secondary">
              Raise funding
            </ButtonLink>
          </div>
          <p className="mt-5 text-sm text-ink-muted">
            No account needed to look around &mdash; use a demo identity from the header. On-chain
            actions need a wallet on Monad Testnet.
          </p>
        </div>

        {/* Worked example — the product in one table */}
        <Card className="self-start p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Worked example
          </p>
          <h2 className="mt-2 text-lg font-semibold text-ink">
            A 5,000 tUSD raise at a 7% income share
          </h2>
          <dl className="mt-5">
            <TermRow label="Funding goal" value="5,000 tUSD" />
            <TermRow label="Income share" value="7%" />
            <TermRow label="Term" value="36 months" />
            <TermRow label="Repayment cap" value="12,000 tUSD" />
            <TermRow label="Minimum income" value="2,000 tUSD / month" />
          </dl>

          <div className="mt-5 rounded-md border border-line bg-paper p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              What gets settled
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="tnum flex justify-between">
                <span className="text-ink-soft">Earns 4,000 / month</span>
                <span className="font-medium text-ink">pays 280</span>
              </li>
              <li className="tnum flex justify-between">
                <span className="text-ink-soft">Earns 6,000 / month</span>
                <span className="font-medium text-ink">pays 420</span>
              </li>
              <li className="tnum flex justify-between">
                <span className="text-ink-soft">Earns 0 this month</span>
                <span className="font-medium text-ink">pays 0</span>
              </li>
              <li className="tnum flex justify-between border-t border-line pt-2">
                <span className="text-ink-soft">Once 12,000 is repaid</span>
                <span className="font-medium text-ink">nothing further is owed</span>
              </li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            The percentage, the floor, the term and the cap are enforced by the agreement contract,
            not by this interface.
          </p>
        </Card>
      </div>

      {/* How it works */}
      <Section
        id="how-it-works"
        title="How it works"
        description="Three steps, each one a transaction on Monad Testnet."
      >
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="tnum text-xs font-medium text-ink-muted">{s.n}</span>
              <h3 className="mt-2 text-base font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Comparison */}
      <Section
        title="Why an income share instead of a loan"
        description="The repayment obligation moves with what the person actually earns."
      >
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                <th scope="col" className="px-5 py-3 font-medium">
                  Model
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  What gets repaid
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Where it breaks
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.model} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-5 py-4 font-medium text-ink">
                    {row.model}
                  </th>
                  <td className="px-5 py-4 text-ink-soft">{row.repayment}</td>
                  <td className="px-5 py-4 text-ink-soft">{row.downside}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Why Monad */}
      <Section
        title="Why Monad"
        description="An ISA is not a one-off transaction. It is a relationship with a settlement event every month, for years, split across every funder."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-base font-semibold text-ink">Settlement is recurring, not rare</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              One agreement over 36 months is at least 36 income attestations, 36 settlements and a
              claim per funder per settlement. At scale that is a constant stream of small
              transactions &mdash; exactly the workload Monad&rsquo;s throughput and sub-second
              blocks are built for, and exactly what makes this uneconomic elsewhere.
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">Low friction changes the product</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              When a settlement costs fractions of a cent, monthly stops being the natural unit.
              Income can be reported and split weekly, or per paycheque, without the fees eating the
              distribution. The roadmap here is continuous settlement, and that only works on a
              chain where transactions are cheap enough to be routine.
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">
              The demo feels like an app, not a chain
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Every action in HumanYield &mdash; invest, report income, settle, claim &mdash; is a
              real transaction, and each one confirms in about a second. The interface shows the
              elapsed time and a Monad Explorer link for every one of them, so you can check the
              work.
            </p>
          </div>
        </div>
      </Section>

      {/* Live opportunities */}
      <Section
        title="Open agreements"
        description="Read live from the ISAFactory contract on Monad Testnet. These are labelled demo agreements, not real investment opportunities."
      >
        <LiveOpportunities limit={3} />
        <div className="mt-6">
          <Link href="/explore" className="text-sm font-medium text-accent hover:underline">
            View all agreements →
          </Link>
        </div>
      </Section>

      {/* Honest limitation */}
      <Section
        title="What this prototype does and does not do"
        description="Where the hard problem sits, stated plainly."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Enforced on-chain</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>Income share percentage applied to every attested figure</li>
              <li>Minimum income floor below which nothing is owed</li>
              <li>Hard repayment cap — the final settlement is clipped to it</li>
              <li>Term deadline after which no new income can be reported</li>
              <li>Pro-rata split of every settlement across funders</li>
              <li>Overfunding rejected; refunds available if a raise is cancelled</li>
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Not solved here</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                A blockchain cannot see a payslip. Income in this prototype is{' '}
                <strong className="font-medium text-ink">self-reported</strong> and attested by a
                demo verifier contract.
              </li>
              <li>
                Nothing forces a recipient to report honestly, or at all. Real deployments need
                payroll, open-banking or oracle attestation, plus legal recourse.
              </li>
              <li>
                The verifier sits behind an interface (
                <code className="font-mono text-xs">IIncomeVerifier</code>) so it can be replaced
                without touching agreement logic.
              </li>
            </ul>
          </Card>
        </div>
      </Section>
    </div>
  )
}
