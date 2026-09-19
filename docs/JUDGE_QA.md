# Anticipated judge questions — HumanYield

Every answer here is true of what is actually built. Where something is not solved, the answer says
so — a judge who catches an oversell discounts everything else you said.

**The one rule: never bluff.** "That isn't solved, here's where the seam is" beats a confident wrong
answer every time.

---

## A. The killer question — income verification

### "How do you know they're telling the truth about their income?"

> You don't. Income is self-reported. The `DemoIncomeVerifier` records the recipient's own figure
> on-chain and bounds it to a sane maximum — it does not check it against real earnings, and it
> can't. It's labelled as a demo attestation on the agreement page, the recipient panel, the README
> and the landing page.
>
> What is built is the seam. `ISAAgreement` never talks to a verifier directly, it calls through
> `IIncomeVerifier`. A payroll provider, an open-banking connection, or an oracle attestation
> implements that same interface and drops in without changing a line of agreement logic. The UI
> surfaces whatever `sourceLabel()` returns, so funders always see the provenance of the number.
>
> What's solved here is the instrument and the settlement. Verification is the next problem.

### "So what stops someone raising 5,000 and never reporting a thing?"

> Nothing on-chain. They can withdraw the capital and go silent, and funders lose everything.
>
> That's the honest boundary: the contract makes **settlement** trustless, not **reporting**. It
> guarantees that *if* a figure is reported, the percentage, the floor and the cap are applied
> exactly and the split is correct. It guarantees nothing about whether a figure arrives.
>
> A real deployment needs three things this prototype doesn't have: verified identity, portable
> repayment reputation, and legal recourse. All three are on the roadmap, and none of them are
> blockchain problems.

### "Then why put it on-chain at all, if trust is still required?"

> Because the two problems are separable, and one of them is genuinely solved here.
>
> The reason ISAs haven't become a consumer product isn't that we can't verify income — payroll
> APIs exist. It's that servicing them is brutal: a variable percentage of a changing income, split
> across many funders, every month, for years, with a cap that has to be enforced to the cent. That
> administrative cost is why ISAs only exist where an institution can amortise it over thousands of
> students.
>
> That's the part this removes. Any funder can verify the maths themselves, the cap can never be
> exceeded, the split can never be wrong, and there's no servicer taking a cut.

### "What if they under-report — say 2,000 when they earned 8,000?"

> Then they settle 140 instead of 560, and the contract has no way to know. Same answer as above:
> verification is the unsolved half. Worth adding that the cap works in the recipient's favour here
> too, so over-reporting is also possible if someone wanted to close out an agreement early —
> the contract simply applies the terms to whatever it's given.

---

## B. "Why blockchain?"

### "Couldn't this be a Postgres database and a Stripe integration?"

> For a single operator, yes — and that's exactly what existing ISA servicers are. The difference is
> what a funder has to trust.
>
> In the database version, the funder trusts the operator's arithmetic, the operator's solvency, and
> the operator's continued existence for the next three years. There's no way to check that the cap
> was enforced or that your 20% share was actually 20%.
>
> Here, the agreement is its own contract with its own balance. Anyone can read the terms, recompute
> every settlement, and verify their own claim. The operator can't quietly change the percentage,
> can't pay one funder before another, and can't disappear with the balance. For a multi-party
> financial agreement lasting years, that's the whole point.

### "Isn't a legal contract enough?"

> A legal contract tells you what's *supposed* to happen. It doesn't do the arithmetic, doesn't hold
> the money, and enforcing it costs more than most of these agreements are worth. You'd need both —
> the contract for recourse when someone stops reporting, and this for the settlement mechanics.

---

## C. "Why Monad?"

### "Why not Ethereum, Base, or any other EVM chain?"

> Because the economics of the product are set by the cost of a settlement, not the cost of a
> deployment.
>
> One 36-month agreement is at minimum 36 income attestations, 36 settlements, and one claim per
> funder per settlement. A thousand agreements with ten funders each is on the order of 400,000
> transactions a year, all small.
>
> Where a settlement costs a dollar, monthly is the *floor* and small incomes aren't worth servicing
> at all — the fees eat the distribution. Where it costs a fraction of a cent, you can settle
> weekly, or per paycheque, and the natural end state is continuous settlement. That's a different
> product, and it's only buildable where transactions are routine rather than events.

### "That's throughput. What did 400ms blocks actually buy you in the product?"

> The interface never has to lie. Every action is a real transaction and the app shows the measured
> confirmation time next to it — you saw them land in around a second. Most dApps hide a slow chain
> behind an optimistic UI that shows success before it's true; this one doesn't need to, so a funder
> is never looking at a number that hasn't settled.

### "Did you use anything Monad-specific, or is it just a chain ID?"

> Two things shaped the build.
>
> Monad's public RPC caps `eth_getLogs` at a **100-block range** — about 40 seconds of history at
> 400ms blocks. That makes a log-scanning activity feed impossible without running an indexer. So
> the agreements persist their own history as state — `createdAt`, `startTime`, and a full
> `IncomePeriod[]` with reported and settled timestamps — and `/activity` reconstructs the complete
> timeline from state reads. No indexer, no backend, no range limit.
>
> Second, Multicall3 is deployed on Monad Testnet, so the explore page and the whole portfolio each
> load in a single batched `eth_call` rather than one per agreement.
>
> Beyond that, EVM compatibility was the point: Foundry, OpenZeppelin, viem and wagmi all worked
> unchanged, so the build time went into the financial primitive rather than into tooling.

---

## D. Differentiation

### "Isn't this just Sablier or Superfluid?"

> No, and the difference is the whole idea.
>
> Sablier and Superfluid are streaming *infrastructure*: you set up a schedule at creation and money
> moves along it. The amount is known in advance.
>
> Here the amount is **not knowable in advance**, because it's a function of income that hasn't
> happened yet. At settlement time the contract takes an attested figure, applies a percentage,
> checks a floor, and clips against a remaining cap. That's an income share agreement — a financial
> instrument — not a payment rail. You could theoretically use a stream as the *delivery* mechanism
> underneath, but it would be an implementation detail beneath this.

### "How is this different from Goldfinch, Maple, or undercollateralised lending?"

> Those are loans. Fixed principal, fixed interest, fixed schedule, regardless of what the borrower
> earns. The whole point here is that the obligation moves with income and can be zero.

### "Hasn't personal income tokenisation been tried? Alex Masmej raised against his income in 2020."

> Yes, and it's cited as precedent rather than avoided. He raised $20K against 15% of three years of
> income. It demonstrated the demand and then hit exactly the wall this addresses: settlement was
> manual, enforcement was social, and there was no programmable cap. The idea isn't new. Making it
> operable is the contribution.

---

## E. Legal and regulatory

### "Isn't this a security?"

> Very likely, in most jurisdictions — an investment of money in a common enterprise with an
> expectation of profit from someone else's efforts is close to textbook. That's precisely why this
> is a testnet prototype with a valueless demo asset and a disclaimer on every page, rather than
> something taking real money.
>
> A real deployment needs jurisdiction-aware offering rules, disclosures, investor limits and
> probably a licensed entity. That's on the roadmap and it is not a weekend problem.

### "ISAs have a bad reputation — predatory terms, students trapped. How is this different?"

> Fair, and the criticism is mostly about terms, not the instrument. The abuses were uncapped or
> near-uncapped agreements, opaque percentages, and minimum payments that applied regardless of
> employment.
>
> Three things here are structural, not promises: a **hard repayment cap** the contract clips the
> final settlement against so it can never be exceeded; a **minimum income floor** below which a
> period settles at exactly zero; and a **term deadline** after which no new income can be reported.
> All three are immutable once published — the recipient can't be renegotiated into worse terms, and
> the funder can see all of them before committing a cent.
>
> What it doesn't fix is someone choosing bad terms for themselves. Disclosure and comparison tooling
> would be the answer, and that's a product problem.

### "What about the recipient's privacy? Their income is on a public chain."

> Correct, and it's a real limitation. Every attested figure is public, permanently, tied to an
> address. Right now that's mitigated only by pseudonymity, which is weak.
>
> The fix is to attest a commitment rather than a plaintext figure — the verifier posts a proof that
> the obligation was correctly derived without publishing the income itself. The `IIncomeVerifier`
> seam is the right place for it, but it isn't built.

---

## F. Business model and market

### "How do you make money?"

> Three streams, none of them charged in this MVP — there's no fee anywhere in the contracts, so the
> accounting stays trivially auditable.
>
> A **1% origination fee** on successfully funded agreements, charged only when someone actually gets
> funded. A **0.5% settlement fee** on distributions, which earns nothing in a month when the
> recipient earns nothing — the platform's revenue has the same shape as the instrument.
>
> The real business is the third: **verified income as a tier**. An agreement backed by payroll-
> verified income is materially more fundable than a self-reported one. That spread is worth more
> than either transaction fee.

### "Who's the actual customer? Who pays first?"

> The honest answer is that the funder side is harder than the recipient side. Plenty of people want
> capital; the question is who underwrites a stranger.
>
> The realistic wedge is existing trust networks — funding someone you already know, where the
> reporting problem is socially enforced and the product is solving the settlement mechanics rather
> than the underwriting. Bootcamps and training providers are the other obvious channel, since
> they already originate ISAs and currently carry the servicing cost themselves.

### "What's the market size?"

> I'd rather not give you a fabricated TAM. The verifiable anchor is that ISAs already operate at
> scale in education finance — Purdue's Back a Boiler, and the bootcamp sector generally — and every
> one of those programmes runs its own servicing operation. That servicing cost is the addressable
> wedge. I haven't done bottom-up sizing and I'm not going to invent one.

---

## G. Smart contract and technical depth

### "Walk me through the contracts."

> Four. `ISAFactory` deploys and indexes agreements and exposes batched snapshot readers.
> `ISAAgreement` is one contract per person holding terms, funder positions, income history and
> settlement accounting. `IIncomeVerifier` is the attestation interface, with `DemoIncomeVerifier`
> behind it for testnet. `TestUSD` is a 6-decimal demo settlement asset with an open faucet.
>
> Publishing deploys a real contract, not a row in a mapping — each agreement has its own address on
> the explorer and its own balance.

### "How does the distribution work? Does it loop over investors?"

> No — that's the thing that would break at scale. Distribution is pull-based. Each funder's claim is
> `totalRepaid × contribution / totalRaised − alreadyClaimed`. Settlement is O(1) regardless of
> funder count; each funder claims independently whenever they want.

### "What are the attack surfaces?"

> `nonReentrant` on every function that moves tokens, checks-effects-interactions throughout,
> `SafeERC20` for transfers, no `tx.origin`, no `delegatecall`, no upgradeable proxies, and no admin
> key over user funds.
>
> The one owner-gated function is `ISAFactory.setDefaultVerifier`, and it only affects which verifier
> *future* agreements are created with. Existing agreements hold their verifier as an `immutable` —
> nobody, including me, can swap it out from under funders who already committed.

### "What bugs do you know about?"

> Three I'd flag without being asked.
>
> **Rounding dust.** Pro-rata claims use integer division, so when a settlement doesn't divide evenly
> a small remainder stays in the contract. It's bounded by roughly (funders − 1) base units per
> settlement — micro-cents — and it isn't recoverable in this version.
>
> **Months are 30-day periods.** `SECONDS_PER_MONTH = 30 days`, so a 36-month term is 1080 days, not
> three calendar years.
>
> **No enforced settlement cadence.** The contract records what's reported when it's reported; it
> doesn't require a minimum interval between submissions.

### "Is it tested?"

> 33 Foundry tests including two fuzz properties. Coverage includes parameter bounds, overfunding
> rejection, early activation, cancel-and-refund, the income calculation against the percentage,
> floor and remaining cap, cap clipping on the final settlement, term expiry, authorisation on every
> restricted function, proportional distribution across three investors, claims never exceeding
> repayments, and a full fund-to-completion lifecycle. `forge test` from a clean clone.

### "Audited?"

> No. Unaudited, testnet only, and the README says so in the first screen. That's why there's no
> mainnet deployment — deploying an unaudited factory that anyone could raise real money through
> would be irresponsible for 25 bonus points.

### "Why is there no indexer or backend?"

> There's no database anywhere in the project — every figure on screen is read from the contracts.
> For history, Monad's RPC caps `eth_getLogs` at 100 blocks, so I made the agreements store their own
> history as state and read it back. It removes an entire piece of infrastructure and there's nothing
> to go stale or out of sync.

---

## H. Product and UX

### "What happens if the recipient wants to cancel?"

> Before activation they can cancel, and every funder can reclaim their full contribution — that's
> tested. After activation they can't; the terms are fixed for the duration. That asymmetry is
> deliberate: funders need certainty once the money has moved.

### "Can a funder exit early? Sell their position?"

> Not in this version, and it's the most obvious missing feature. Positions are proportional claims
> stored in the agreement, not transferable tokens. Making them ERC-721s opens a secondary market for
> ISA exposure, which is where this gets genuinely interesting — but it's a stretch feature and I'd
> rather show four things working than six things half-working.

### "What if nobody funds the agreement?"

> It sits open. The recipient can either close funding early and start the term with whatever was
> raised, or cancel and let everyone refund. Both paths are live in the product.

---

## I. Hostile and trap questions

### "Show me a transaction from today that isn't yours."

> Fair challenge, and the honest answer is that every transaction on this deployment is mine or the
> demo funders' — it went live today. What I can show is that they're all real and independently
> verifiable: here's the agreement on the explorer, here are the four verified contracts with
> published source, and here's the app recomputing the same numbers from chain state.

### "Are those three people real?"

> No, and they're labelled as demo agreements everywhere they appear — on the card, on the detail
> page, and in a banner on every screen. Inventing testimonials or user counts would be the fastest
> way to lose your trust.

### "Is that tUSD worth anything?"

> Nothing. It's a demo asset with an open faucet, six decimals, clearly marked "Monad Testnet demo
> asset". Anyone can mint 10,000 an hour.

### "You built this today. What did you actually write versus copy?"

> The contracts are original — the factory, the agreement, the verifier interface. The primitives
> underneath are OpenZeppelin: `ERC20`, `Ownable`, `ReentrancyGuard`, `SafeERC20`, because
> rewriting audited code is a mistake. The frontend is Next.js, wagmi and viem. What isn't
> off-the-shelf is the income-share settlement logic and the product around it.

### "If I fund an agreement right now, what's my realistic expected return?"

> I'm not going to give you a number, and you should be suspicious of anyone who does. The cap is a
> ceiling, not a projection — the recipient might report no qualifying income and settle nothing, and
> you'd lose the entire contribution. The app says exactly that next to the ownership calculation,
> and it doesn't display a projected yield anywhere, deliberately.

---

## J. Questions you should answer with "I don't know"

Do not improvise on these. Saying so is the correct answer.

- Precise market sizing or TAM
- Legal status in a specific named jurisdiction
- Gas benchmarks you haven't actually measured
- Whether a specific payroll provider's API would work — you haven't integrated one
- Anything about audit findings, because there's been no audit

---

## The four facts to have ready

| | |
| --- | --- |
| **Live** | https://humanipo.vercel.app |
| **Repo** | https://github.com/Meeti09/HumanIPO |
| **Factory** | `0xdaA1Dca29D758cEc7B3bA659c2921ccCcd494c01` |
| **Network** | Monad Testnet, chain 10143 — four contracts verified, perfect match |
