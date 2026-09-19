# HumanYield

**Fund a person's future, not just a project.** HumanYield turns a personal goal — a course, a
certification, a career move, a creative project — into an Income Share Agreement that anyone can
fund, where repayment is a percentage of the recipient's reported income and every settlement is
split across funders automatically on Monad.

Built for **Monad Blitz**. Deployed and operational on **Monad Testnet**.

---

## Submission summary

| | |
| --- | --- |
| **Live application** | https://humanipo.vercel.app |
| **Repository** | `https://github.com/Meeti09/HumanIPO` |
| **Network** | Monad Testnet — chain ID **10143** |
| **ISAFactory** | `0xdaA1Dca29D758cEc7B3bA659c2921ccCcd494c01` |
| **TestUSD (tUSD)** | `0x9aE4053b0aa7a042eA3355fe743E0C21F2Cb6e95` |
| **DemoIncomeVerifier** | `0x1811389195AC43285f8c9489aDD72a83F2a0A34c` |
| **Sample agreement (open raise)** | `0x53Aa40A42d68E489fC9b694e943Fe00a0CcbFe59` |
| **Sample agreement (full lifecycle, real history)** | `0x8810f33C793A387509e127Bc54AAe5fCFCBccFe6` |
| **Explorer** | https://testnet.monadexplorer.com |
| **Verification** | `Verified — perfect match on MonadVision and Monadscan` |
| **Tests** | 33 Foundry tests, all passing (`cd contracts && forge test`) |

> **Prototype for Monad Testnet.** Demo agreements, profiles and the tUSD settlement asset have no
> real-world financial value. Income figures are self-reported testnet attestations, not verified
> earnings. This is not financial advice or an offer of securities.

---

## Problem

People need capital for the thing that changes their earning power. The two things on offer both
misprice the risk:

- A **fixed loan** demands the same payment every month whether they landed the job or not. It is
  most punishing exactly when they can least afford it.
- **Crowdfunding** gives backers no economic stake in the outcome they funded. The upside they
  helped create accrues entirely elsewhere.

The instrument that actually fits is an **income share agreement**: capital now, in exchange for a
fixed percentage of future income, for a fixed term, under a hard repayment cap. It already works
at scale in education finance. It has never become a consumer product, because the settlement admin
is brutal — a variable percentage of a changing income, divided across many funders, every month,
for years.

## Solution

HumanYield makes that instrument something a person can publish in under a minute and anyone can
fund.

1. A recipient states their terms: **funding goal, income share %, term, repayment cap, minimum
   income floor.** Publishing deploys *their own agreement contract* on Monad.
2. Funders contribute. Each contribution is recorded on-chain as a proportional claim on every
   future settlement — fund 20% of the raise, receive 20% of everything repaid.
3. The recipient reports monthly income. The contract applies the percentage, checks the income
   floor, clips against the remaining cap, and opens a settlement obligation.
4. The recipient settles. Funds become claimable by every funder, pro rata.
5. When the cap is reached or the term elapses, the agreement closes and nothing further is owed.

**Worked example** — a 5,000 tUSD raise at a 7% income share, 36 months, capped at 12,000 tUSD,
with a 2,000 tUSD minimum income floor:

| Reported monthly income | Settlement owed |
| --- | --- |
| 4,000 | 280 |
| 6,000 | 420 |
| 1,500 (below the floor) | 0 |
| 0 | 0 |
| Any, once 12,000 total has been repaid | 0 — agreement complete |

Every one of those rules is enforced in Solidity, not in the interface.

## Why Monad?

This is not a chain swap. The product's economics depend on cheap, frequent settlement.

**An agreement is not one transaction — it is a relationship.** A single 36-month ISA is at least 36
income attestations, 36 settlements, and one claim per funder per settlement. Ten thousand
agreements with ten funders each is millions of small transactions a year. That is the workload
Monad's throughput is built for, and it is precisely what makes this uneconomic on a chain where
each settlement costs real money.

**Cost per settlement sets the product's minimum cadence.** Where settling costs dollars, monthly is
the floor and small incomes are not worth servicing at all. Where it costs a fraction of a cent,
income can be reported and split weekly, or per paycheque. Continuous settlement — the natural end
state for an income share — only becomes buildable on a chain where a transaction is routine rather
than an event.

**Sub-second confirmation changes the interface.** Every action in HumanYield is a real transaction,
and the app shows the measured confirmation time and a Monad Explorer link for each one. Nothing is
hidden behind an optimistic UI that might be lying to the user, because it does not need to be —
the chain keeps up with the interaction.

Monad's 400ms blocks and EVM compatibility meant the entire stack — Foundry, OpenZeppelin, viem,
wagmi — worked unchanged, so the build time went into the financial primitive rather than into
tooling.

## Architecture

```
                         ┌──────────────────────────────────────┐
                         │      Next.js 16 · React 19 · TS      │
                         │      wagmi v3 · viem · Tailwind      │
                         │                                      │
                         │  /          landing + live listings  │
                         │  /explore   all agreements           │
                         │  /agreement/[address]  detail+action │
                         │  /dashboard portfolio + claims       │
                         │  /recipient income reporting         │
                         │  /create    publish an agreement     │
                         │  /demo      guided 8-step lifecycle  │
                         │  /activity  on-chain history + hashes│
                         │  /transparency  contracts & limits   │
                         └───────────────────┬──────────────────┘
                                             │ wagmi · viem
                                             │ (multicall3 batched reads)
                         ┌───────────────────▼──────────────────┐
                         │          Monad Testnet · 10143       │
                         └───────────────────┬──────────────────┘
                                             │
        ┌────────────────────────────────────┼────────────────────────────────┐
        │                                    │                                │
┌───────▼─────────┐              ┌───────────▼──────────┐          ┌──────────▼─────────┐
│   ISAFactory    │  deploys ──► │    ISAAgreement      │ ──asks──►│ DemoIncomeVerifier │
│                 │              │   (one per person)   │          │                    │
│ createAgreement │              │                      │          │ attestIncome()     │
│ getAgreement*   │              │ fund / activate      │          │ sourceLabel()      │
│ getSnapshots    │◄─ indexes ── │ submitIncome         │          │                    │
│ getInvestor     │              │ makeRepayment        │          │ implements         │
│   Positions     │              │ claim / refund       │          │ IIncomeVerifier    │
└─────────────────┘              │ withdrawCapital      │          └────────────────────┘
                                 └───────────┬──────────┘               ▲
                                             │                          │ swappable for
                                    moves    │                          │ payroll / oracle /
                                             ▼                          │ open-banking
                                 ┌──────────────────────┐               │ without touching
                                 │  TestUSD (tUSD, 6dp) │               │ agreement logic
                                 │  open faucet, demo   │───────────────┘
                                 └──────────────────────┘
```

**No database, no backend, no indexer.** Every piece of financial and profile state — terms,
balances, funder positions, income history, settlement accounting — lives on-chain and is read
directly by the frontend. The factory exposes batched snapshot readers (`getAgreementSnapshots`,
`getInvestorPositions`) so the explore page and the portfolio each load in a single `eth_call`.

### Repository layout

```
.
├── contracts/                   Foundry project
│   ├── src/
│   │   ├── ISAFactory.sol        deploys + indexes agreements
│   │   ├── ISAAgreement.sol      one agreement: terms, funding, income, settlement, claims
│   │   ├── IIncomeVerifier.sol   income attestation interface
│   │   ├── DemoIncomeVerifier.sol  testnet self-attestation implementation
│   │   └── TestUSD.sol           6-decimal demo settlement token with a faucet
│   ├── script/Deploy.s.sol       deploys the stack, writes deployments/monad-testnet.json
│   ├── script/Seed.s.sol         creates + partially funds the three demo agreements
│   └── test/ISA.t.sol            33 tests incl. 2 fuzz properties
├── web/                         Next.js frontend
│   └── src/{app,components,hooks,lib}
├── scripts/
│   ├── generate-abis.mjs        Foundry artifacts → web/src/lib/abis.ts
│   └── verify.sh                publishes source to the Monad explorers
├── docs/                        pitch, demo script, checklist, social + video scripts
├── SECURITY.md
└── README.md
```

## Demo

### Already on-chain, if you just want to inspect the result

[`0x8810f33C793A387509e127Bc54AAe5fCFCBccFe6`](https://testnet.monadexplorer.com/address/0x8810f33C793A387509e127Bc54AAe5fCFCBccFe6)
is a real agreement that has been through the entire lifecycle on Monad Testnet. Open it in the app
and you will see:

- 4,000 tUSD raised from **two** funders (2,500 and 1,500 — 62.5% / 37.5%)
- the raise filling and the agreement activating in the same transaction
- capital withdrawn by the recipient
- **three reported income periods**, including a zero-income month that correctly settled nothing:
  | Period | Reported income | Owed at 6% |
  | --- | --- | --- |
  | #1 | 5,000 | 300 |
  | #2 | 0 | 0 — nothing owed |
  | #3 | 6,000 | 360 |
- 660 tUSD settled in total, of which funder A has claimed exactly 412.50 (62.5%) and funder B's
  247.50 (37.5%) is still sitting unclaimed in the contract

Every one of those is a transaction you can click through on the explorer.

### Running it yourself — the guided path

Open **`/demo`**. The agreements on Explore belong to other wallets, so you can only fund those;
this page publishes an agreement where **you are the recipient** and walks the entire lifecycle in
eight gated steps, each a real transaction:

1. Connect a wallet → 2. Faucet 10,000 tUSD → 3. Publish your agreement (deploys a contract)
→ 4. Fund it to the goal (activates in the same transaction) → 5. Withdraw the capital
→ 6. Report 4,000 tUSD of income (the amount owed comes from calling `calculateContribution` on
your contract, not from the page) → 7. Settle → 8. Claim the distribution

Each step unlocks only when the previous one is confirmed on-chain, and the figures are small
enough that one faucet allocation covers the whole run. About two minutes.

### Transaction history

**`/activity`** has two feeds:

- **On-chain activity** — every publication, activation, income report and settlement across all
  agreements, with timestamps. Reconstructed from contract state, because Monad's public RPC caps
  `eth_getLogs` at a **100-block range** (about 40 seconds at 400ms blocks), which makes a log scan
  useless for history. Each agreement stores `createdAt`, `startTime` and a full `IncomePeriod[]`
  with `reportedAt` / `settledAt`, so the timeline is complete with no indexer and no range limit.
- **Your transactions** — hashes of everything signed from this browser, with explorer links, kept
  in `localStorage` and never sent anywhere.

A condensed version of the first feed also appears on the portfolio dashboard.

### Narrated demo

Step-by-step narration for presenting is in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

1. **Explore** → open a seeded agreement (e.g. *Sarah Mehta — AI Career Transition*).
2. **Invest** 500 tUSD. The panel shows your exact ownership before you sign. → *2 transactions*
3. **Create** your own agreement from the pre-filled form. → *1 transaction, deploys a new contract*
4. **Fund it to the goal** — the agreement activates in the same transaction.
5. **Withdraw capital**, then **report 4,000 tUSD of income**. The obligation (280 tUSD) is computed
   by calling `calculateContribution` on the contract. → *2 transactions*
6. **Settle** the 280 tUSD. It becomes claimable by funders immediately. → *1–2 transactions*
7. **Portfolio** → **Claim** your distribution. → *1 transaction*
8. Open any of those hashes on Monad Explorer.

### Demo identities

Two read-only personas let a judge look around instantly without a wallet. Use the **Demo sign-in**
control in the header.

| Identity | Email | What it shows |
| --- | --- | --- |
| Demo Investor | `investor@humanyield.demo` | A funded portfolio with positions and distributions |
| Demo Recipient | `creator@humanyield.demo` | The income reporting and settlement side |

These are **UI personas mapped to a public testnet address**. They hold no keys, provide no custody
and cannot sign anything. Every on-chain action still requires a connected wallet.

## How to run

### Prerequisites

- [Node.js](https://nodejs.org) 20 or newer
- [Foundry](https://getfoundry.sh) (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- A browser wallet (MetaMask, Rabby, …)

### 1. Clone and install

```bash
git clone https://github.com/Meeti09/HumanIPO humanyield
cd humanyield
npm --prefix web install
cd contracts && forge install --no-git OpenZeppelin/openzeppelin-contracts && cd ..
```

### 2. Run the contract tests

```bash
cd contracts && forge test -vv && cd ..
```

Expect **33 passing tests**.

### 3. Point the frontend at the deployed contracts

```bash
cp web/.env.example web/.env.local
```

Then set these in `web/.env.local` — the live values are in the table at the top of this README:

```
NEXT_PUBLIC_FACTORY_ADDRESS=0xdaA1Dca29D758cEc7B3bA659c2921ccCcd494c01
NEXT_PUBLIC_TEST_USD_ADDRESS=0x9aE4053b0aa7a042eA3355fe743E0C21F2Cb6e95
NEXT_PUBLIC_VERIFIER_ADDRESS=0x1811389195AC43285f8c9489aDD72a83F2a0A34c
```

### 4. Start the app

```bash
npm --prefix web run dev
```

Open http://localhost:3000. You are now running against the same contracts as the live deployment.

## Environment variables

### `web/.env.local` — all public, shipped to the browser

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_MONAD_RPC_URL` | no | Monad Testnet RPC. Defaults to `https://testnet-rpc.monad.xyz`. |
| `NEXT_PUBLIC_CHAIN_ID` | no | Chain id. Defaults to `10143`. |
| `NEXT_PUBLIC_EXPLORER_URL` | no | Explorer base used for every link. Defaults to `https://testnet.monadexplorer.com`. |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | **yes** | Deployed `ISAFactory`. Without it the app shows a configuration notice. |
| `NEXT_PUBLIC_TEST_USD_ADDRESS` | **yes** | Deployed `TestUSD`. |
| `NEXT_PUBLIC_VERIFIER_ADDRESS` | no | Deployed `DemoIncomeVerifier`, shown on the transparency page. |
| `NEXT_PUBLIC_DEMO_SEED_ADDRESS` | no | Fallback address the demo identities map to. |
| `NEXT_PUBLIC_DEMO_INVESTOR_ADDRESS` | no | Address whose positions the Demo Investor persona displays. |
| `NEXT_PUBLIC_DEMO_RECIPIENT_ADDRESS` | no | Address whose agreements the Demo Recipient persona displays. |
| `NEXT_PUBLIC_REPO_URL` | no | Source link in the footer and transparency page. |

### `contracts/.env` — deployment only, **never committed**

| Variable | Description |
| --- | --- |
| `MONAD_TESTNET_RPC_URL` | RPC used by `forge script`. |
| `PRIVATE_KEY` | 0x-prefixed key used to sign deployments. Use a throwaway account funded with a few testnet MON. |
| `FACTORY_ADDRESS` | Set after deploying; read by the seed script. |

`contracts/.env` is gitignored. Nothing in this repository needs a private key at runtime — the
frontend signs through the user's wallet only.

## Wallet setup

Add Monad Testnet to your wallet:

| Field | Value |
| --- | --- |
| Network name | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Chain ID | `10143` |
| Currency symbol | `MON` |
| Block explorer | `https://testnet.monadexplorer.com` |

The app detects the wrong network and offers a one-click switch, which also adds the network if you
do not have it.

### Testnet MON (gas)

Every action is a real transaction, so you need testnet MON. Get it from the
[official Monad faucet](https://faucet.monad.xyz). A fraction of a MON covers the whole demo.

### Demo tUSD (settlement asset)

Click **Get 10,000 tUSD** anywhere in the app once your wallet is connected. This calls `faucet()`
on the `TestUSD` contract — 10,000 tUSD per address, once per hour. tUSD is a demo asset with no
real-world value.

## Contract deployment

Only needed if you want your own deployment; the live addresses above are already deployed.

```bash
cd contracts
cp .env.example .env          # then fill in PRIVATE_KEY
source .env

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$MONAD_TESTNET_RPC_URL" \
  --broadcast
```

This prints the three addresses and writes `contracts/deployments/monad-testnet.json`.

Seed the three demo agreements (optional):

```bash
export FACTORY_ADDRESS=<printed ISAFactory address>
forge script script/Seed.s.sol:Seed --rpc-url "$MONAD_TESTNET_RPC_URL" --broadcast
```

Regenerate the frontend ABIs after any contract change:

```bash
cd contracts && forge build && cd ..
node scripts/generate-abis.mjs
```

## Contract verification

The Monad verification API publishes source to MonadVision, Socialscan and Monadscan in one call:

```bash
npm run contracts:verify      # or: bash scripts/verify.sh
```

The script reads `contracts/deployments/monad-testnet.json`, produces the standard JSON input and
Foundry metadata for each contract, ABI-encodes the factory's constructor arguments, and POSTs to
`https://agents.devnads.com/v1/verify`.

Manual fallback, per contract:

```bash
cd contracts
forge verify-contract <ADDRESS> src/ISAFactory.sol:ISAFactory \
  --chain 10143 \
  --verifier sourcify \
  --verifier-url "https://sourcify-api-monad.blockvision.org/"
```

Individual agreement contracts are deployed by the factory with constructor arguments; verifying
`ISAAgreement` once publishes the source for all of them.

## Tests

```bash
cd contracts
forge test              # 33 tests
forge test -vvv         # with traces
forge test --gas-report
```

Coverage includes: agreement creation and parameter bounds; funding, overfunding rejection and
early activation; capital withdrawal; cancel and refund; income calculation against the share
percentage, the income floor and the remaining cap; cap clipping on the final settlement; term
expiry; authorisation on every restricted function; proportional distribution across three
investors; claims never exceeding repayments; a full fund → settle → complete lifecycle; the faucet
cooldown; and two fuzz properties on obligation bounds and share arithmetic.

## Product flow

```
  RECIPIENT                                              FUNDERS
  ─────────                                              ───────
  create agreement  ──── deploys ISAAgreement ────►      browse /explore
        │                                                      │
        │                                                 invest (fund)
        │                                                      │
        │◄──────── raise fills, or activate() ──────────────────┘
        │
  withdrawCapital()
        │
  submitIncome(4,000)
        │  contract: 4,000 × 7% = 280, floor ✓, cap ✓
        ▼
  makeRepayment()  ──── 280 tUSD into the agreement ────►  claim()
        │                                                  pro rata:
        │                                                  20% funder → 56
        ▼
  repeat monthly until the cap is reached or the term elapses
        │
        ▼
  AgreementCompleted — nothing further is owed
```

## Income verification — what this prototype does not do

**A blockchain cannot see a payslip.** This is the honest limitation at the centre of the product,
and it is labelled as such everywhere it appears in the interface.

In this MVP, income is **self-reported by the recipient** and recorded on-chain by
`DemoIncomeVerifier`, which bounds the figure to a sane maximum and emits an attestation event. It
does **not** check the figure against real-world earnings, and nothing compels a recipient to report
honestly, or at all.

What the architecture does provide is a clean seam. `ISAAgreement` calls its verifier through the
`IIncomeVerifier` interface:

```solidity
interface IIncomeVerifier {
    function sourceLabel() external view returns (string memory);
    function attestIncome(
        address agreement,
        address recipient,
        uint256 reportedIncome,
        bytes calldata proof
    ) external returns (uint256 attestedIncome);
}
```

A payroll-provider, open-banking, or oracle-attestation implementation drops into that interface
without a single change to agreement logic, and the UI surfaces whatever `sourceLabel()` returns so
the provenance of every income figure is visible to funders. The verifier is `immutable` on each
agreement, so it cannot be swapped out from under existing funders.

## Security

See [`SECURITY.md`](SECURITY.md) for the full write-up.

Summary: unaudited hackathon prototype, testnet only. Uses OpenZeppelin `ERC20`, `Ownable`,
`ReentrancyGuard` and `SafeERC20`; `nonReentrant` on every token-moving function;
checks-effects-interactions throughout; pull-based distribution so there is no loop over investors
in the payment path; no `tx.origin`, no `delegatecall`, no upgradeable proxies, and no admin key
over user funds. Economic rules — share percentage, income floor, repayment cap, term deadline,
pro-rata split, overfunding rejection — are enforced in Solidity, not in the frontend.

## Limitations

1. **Income is self-reported.** See above. This is the hard problem and it is not solved here.
2. **Nothing compels reporting.** The contract makes settlement trustless; it does not make
   reporting trustless. Real deployments need identity, reputation and legal recourse.
3. **Rounding dust.** Pro-rata claims use integer division, so a small remainder can stay in the
   agreement contract. Bounded by (investors − 1) base units per settlement.
4. **Months are 30-day periods** (`SECONDS_PER_MONTH = 30 days`), so a 36-month term is 1080 days.
5. **No enforced settlement cadence.** The contract records what is reported, when it is reported.
6. **No secondary market.** Positions are not transferable in this version.
7. **Unaudited, testnet only.** Do not put real value through this.

## Revenue model

Deliberately **not charged in the MVP** — no fee is taken anywhere in the contracts. The path to
revenue, if this were a product:

| Stream | Rate | Rationale |
| --- | --- | --- |
| Origination fee | 1% of successfully funded agreements | Charged only on outcomes, aligned with recipients actually getting funded |
| Settlement fee | 0.5% of distributions | Scales with repayments actually made, so it earns nothing when the recipient earns nothing |
| Verified-income tier | subscription / per-attestation | Once payroll and open-banking integrations exist, an agreement backed by verified income is materially more fundable — that spread is the real business |

Adding a fee is a small change: an immutable `feeBps` and treasury on the factory, applied on
`makeRepayment`. It was left out so the MVP's accounting stays trivially auditable.

## Roadmap

- **Real income verification** — payroll provider and open-banking implementations of
  `IIncomeVerifier`; oracle-attested crypto income for on-chain earners
- **Continuous settlement** — per-paycheque or streaming settlement, which is only economic on a
  chain with Monad's cost profile
- **Transferable positions** — funder positions as ERC-721s, opening a secondary market for ISA
  exposure
- **Reputation** — on-chain repayment history as a portable credential for recipients raising again
- **Portfolio products** — diversified pools across many agreements rather than single-person risk
- **Compliance** — jurisdiction-aware offering rules, disclosures and investor limits; an ISA is very
  likely a security in most jurisdictions
- **Mainnet** — after an audit, not before

## Hackathon

| | |
| --- | --- |
| Event | Monad Blitz |
| Network | Monad Testnet (chain ID 10143) |
| Repository | `https://github.com/Meeti09/HumanIPO` (public) |
| Live URL | https://humanipo.vercel.app |
| Contracts | See the submission summary at the top |
| Built with | [MonSkills](https://skills.devnads.com/) — scaffold, verification API and Monad gas/concepts guidance |

Judge-facing documents:

- [`docs/PITCH.md`](docs/PITCH.md) — the pitch, timed
- [`docs/JUDGE_QA.md`](docs/JUDGE_QA.md) — anticipated judge questions, with honest answers
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — step-by-step live demo
- [`docs/HACKATHON_CHECKLIST.md`](docs/HACKATHON_CHECKLIST.md) — rubric checklist
- [`docs/VIDEO_SCRIPT.md`](docs/VIDEO_SCRIPT.md) and [`docs/SOCIAL_POSTS.md`](docs/SOCIAL_POSTS.md)

## Licence

MIT
