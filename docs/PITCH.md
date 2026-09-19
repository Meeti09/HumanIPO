# HumanYield — pitch

**One line:** Fund a person's future, not just a project — repayment moves with their income,
settled on Monad.

---

## 1. Problem (20 seconds)

People need capital for the thing that changes their earning power: a course, a certification, a
career switch, a creative project. The two options both misprice the risk.

- A **fixed loan** demands the same payment whether they landed the job or not. It is at its most
  punishing exactly when they can least afford it.
- **Crowdfunding** gives backers no economic stake in the outcome they funded.

The instrument that fits — an **income share agreement** — already exists. It is used by
universities and bootcamps. It has never been a consumer product, because the settlement admin is
brutal: a percentage of a changing income, split across many funders, every month, for years.

## 2. Solution (20 seconds)

HumanYield turns an ISA into something a person publishes in under a minute and anyone can fund.

- The recipient states: amount, income share, term, repayment cap, minimum income floor.
- Publishing deploys **their own agreement contract** on Monad.
- Funders contribute; each contribution is a proportional on-chain claim on every future settlement.
- The recipient reports income; the contract applies the percentage, the floor and the remaining
  cap, and splits the settlement pro rata.

The primitive is: **person → funding agreement → future income share → programmable settlement →
investor distribution.**

## 3. Product demo (2 minutes)

See [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md). Every step is a live Monad Testnet transaction:

1. Open a live agreement read from the factory contract
2. Invest — see the ownership calculation before signing
3. Publish a new agreement — deploys a fresh contract
4. Report income — the obligation is computed by the contract, not the UI
5. Settle — funds become claimable pro rata
6. Claim — and open the whole trail on Monad Explorer

## 4. Why Monad (30 seconds)

This is not a chain swap. The economics of the product depend on cheap, frequent settlement.

- **One agreement is not one transaction.** A 36-month ISA is 36 attestations, 36 settlements, and
  a claim per funder per settlement. Ten thousand agreements with ten funders each is millions of
  small transactions a year.
- **Cost per settlement sets the minimum cadence.** Where a settlement costs real money, monthly is
  the floor and small incomes are uneconomic to service at all. On Monad it can be weekly, or per
  paycheque, and the roadmap to continuous settlement is open.
- **Sub-second confirmation makes it feel like an app.** The demo shows the elapsed time on every
  transaction. Fund, report, settle, claim — each confirms in about a second, so the product never
  has to hide the chain behind an optimistic UI that might be lying.

## 5. Innovation and business model (30 seconds)

**What is new.** Superfluid and Sablier are streaming *infrastructure* — money moves on a schedule
you set up front. HumanYield is a *financial instrument*: the amount owed is not known in advance,
because it is a function of income that has not happened yet. The contract computes the obligation
at settlement time from an attested figure, a percentage, a floor and a cap. That is an ISA, not a
stream, and it is the thing that makes it a consumer product rather than a payments rail.

**Business model** (documented, deliberately not charged in the MVP):

- 1% origination fee on successfully funded agreements
- 0.5% settlement fee on distributions
- Premium verification tiers once payroll and open-banking integrations exist — an agreement backed
  by verified income is worth more to funders, and that spread is the real business

**Pre-market signal.** ISAs already work at scale in education finance (Lambda School,
Purdue's Back a Boiler) and personal-income tokenisation has been tried before —
Alex Masmej raised $20K against 15% of three years of income in 2020. Both hit the same wall:
manual settlement and no programmable enforcement. That wall is what this removes.

## 6. Submission proof (20 seconds)

Everything a judge needs is at the top of the README: repository, live URL, contract addresses,
explorer links and verification status.

---

## Say these four things out loud

**Repo:**
`____________________________________________`

**Contract (ISAFactory, Monad Testnet):**
`____________________________________________`

**Live:**
`____________________________________________`

**Deployment:**
`Monad Testnet — chain ID 10143 — contracts verified, source published`

---

## Anticipated questions

**"How do you know they're telling the truth about their income?"**
You don't, and I'm not claiming otherwise. Income is self-reported and labelled as a demo
attestation everywhere it appears. It routes through an `IIncomeVerifier` interface so a payroll or
open-banking provider replaces it without touching agreement logic. What is solved here is the
instrument and the settlement; verification is the next problem.

**"What stops someone taking the money and never reporting?"**
Nothing on-chain, in this version. The contract records and enforces terms; it does not create the
off-chain obligation. Real deployments need identity, reputation and legal recourse alongside it.
The honest framing is that this makes the *settlement* trustless, not the *reporting*.

**"Isn't this just Sablier with extra steps?"**
Sablier pays out a schedule known at creation. Here the amount is unknown until income is attested,
and is then bounded by a floor and a cap. Different primitive, different contract, different product.

**"Is this a security?"**
Very likely, in most jurisdictions, which is why this is a testnet prototype with demo assets and a
disclaimer on every page. Compliance is on the roadmap, not in the MVP.
