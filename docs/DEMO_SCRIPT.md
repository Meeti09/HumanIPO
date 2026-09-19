# Demo script — HumanYield

**Target length: 4 minutes.** Every step below executes a real transaction on Monad Testnet.

## Live references

| | |
| --- | --- |
| Open raise to invest in | **Sarah Mehta** — `0x53Aa40A42d68E489fC9b694e943Fe00a0CcbFe59` (3,000 of 5,000 raised) |
| Already-running agreement with real history | **Priya Nair** — `0x8810f33C793A387509e127Bc54AAe5fCFCBccFe6` (2 funders, 3 reported periods, 660 tUSD settled) |
| Factory | `0xdaA1Dca29D758cEc7B3bA659c2921ccCcd494c01` |

Priya's agreement is the fallback if anything goes wrong live: it already shows the whole
lifecycle — a filled raise, an income history including a zero-income month, settlements, and a
partly-claimed distribution — with every transaction on the explorer.

## Before you start

- [ ] Wallet connected to Monad Testnet (chain 10143) with at least 0.5 MON for gas
- [ ] Live URL open in one tab, `https://testnet.monadexplorer.com` open in a second
- [ ] Browser zoom at 100%, transaction panel visible in the bottom-right
- [ ] Faucet already used once so you are holding tUSD (saves 20 seconds on stage)

If anything fails mid-demo, the fallback is the agreement detail page — all state is read live from
the contract, so a refresh recovers. If a transaction itself fails, open Priya Nair's agreement and
narrate the completed history instead; it is all real and already on-chain.

---

## 0:00 — The problem (25 seconds)

> "Someone wants to retrain as an ML engineer. They need five thousand dollars for the course and
> three months of runway. A bank offers them a fixed loan — same payment every month whether they
> land the job or not. Crowdfunding gives them a t-shirt to sell. Neither matches the actual shape
> of the risk.
>
> An income share agreement does: you get funded now, and you return a percentage of what you
> actually earn, capped, for a fixed term. Earn nothing, owe nothing. It's a real financial
> instrument — it's just never been a consumer product, because the settlement admin is brutal."

## 0:25 — The product (20 seconds)

Open the landing page. Point at the worked-example card on the right.

> "HumanYield makes that instrument something a person can publish in a minute and anyone can fund.
> Five thousand raised, seven percent of income, thirty-six months, hard cap at twelve thousand.
> Earn four thousand in a month, you settle two-eighty. Earn nothing, you settle nothing. Hit the
> cap, you're done. All four of those rules are enforced by the contract, not by this interface."

## 0:45 — Fund someone (60 seconds)

Go to **Explore** → open **Sarah Mehta — AI Career Transition**.

> "This is read live from the factory contract. Here are her terms, here's what's been raised, and
> here's the contract address on the explorer."

In the right-hand panel, enter **500**, and point at the ownership preview before signing.

> "Before I sign, the app tells me exactly what I'm buying: five hundred tUSD, which is X percent of
> every future settlement, up to this share of her repayment cap."

Click **Invest 500 tUSD**. Approve, then fund.

> "Two transactions — approve and fund. Watch the timer."

**Point at the confirmation times in the panel.** They should read under two seconds each.

> "That's Monad. And this matters more than it looks — an ISA isn't one transaction, it's a
> settlement every month for three years, split across every funder. That's the workload."

## 1:45 — Become the recipient (45 seconds)

Go to **Guided demo** (`/demo`). Steps 1–2 are already green if you prepped.

Click **Publish agreement** (step 3).

> "Publishing deploys a brand new contract — this person's own agreement, with their own address on
> the explorer. One transaction, about a second."

Then **Fund 1,000 tUSD** (step 4).

> "Normally other people fund this. I'll fund my own raise to close it — and filling the goal
> activates the agreement in the same transaction, starting the term."

Then **Withdraw** (step 5).

> "The capital goes to the recipient. That's the money that pays for the course."

## 2:30 — Report income and settle (60 seconds)

Step 6 shows the income figure already filled in at 4,000.

> "Now the interesting part. I report four thousand of monthly income. The number underneath isn't
> computed in JavaScript — the app is calling `calculateContribution` on the contract, which applies
> the seven percent, checks the minimum income floor, and clips against the remaining cap. Two
> hundred and eighty."

Click **Submit income** → then **Settle 280 tUSD**.

> "Submitting records the attestation on-chain. Settling moves the two-eighty into the agreement,
> where it's immediately claimable by every funder in proportion to what they put in."

**Say the honest part out loud — do not skip this:**

> "And I want to be straight about the hard part: a blockchain cannot see a payslip. That income
> figure is self-reported and labelled as a demo attestation everywhere it appears. It goes through
> an `IIncomeVerifier` interface, so a payroll or open-banking provider drops in without changing a
> line of agreement logic. What's solved here is the instrument and the settlement. Verification is
> the next problem, and I'm not going to pretend otherwise."

## 3:30 — Claim and verify (30 seconds)

Step 8: click **Claim**.

> "Distribution is pull-based, so it scales to any number of funders without a loop in the payment
> path."

Now go to **Activity**.

> "Every publication, income report and settlement across the whole product, with timestamps. And
> underneath, every transaction I just signed, with its hash."

One line worth saying, because judges will wonder why there's no indexer:

> "Monad's public RPC caps `eth_getLogs` at a hundred blocks — about forty seconds of history. So
> instead of scanning logs, the agreements store their own history as state and the app reads it
> back. No indexer, no backend, no range limit."

Switch to the explorer tab. Paste the agreement address.

> "Every one of those — the funding, the deploy, the attestation, the settlement, the claim — is a
> real transaction on Monad Testnet. Contract's verified, source is published, and the repo has the
> addresses."

## 4:00 — Close (15 seconds)

> "HumanYield. Fund a person's future, not just a project. Repo, contract address and live URL are
> all in the README."

---

## Do not demo

- Cancel/refund — it works and is tested, but it dead-ends the agreement you are showing.
- Multiple settlements in a row to hit the cap — correct but slow on stage.
- Editing an agreement after creation — terms are immutable by design.
