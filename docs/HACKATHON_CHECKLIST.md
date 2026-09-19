# Monad Blitz submission checklist — HumanYield

Submission closes at **5:45 PM**. Everything must be live before then.

Tick a box only when you have personally verified it. Unverified items are worth nothing.

---

## Basic — 100 points

| # | Item | Points | Status |
| --- | --- | --- | --- |
| 1 | Public GitHub repository | 25 | ☐ Repo pushed and set to public |
| 2 | README with live page, contract address, project explanation, working instructions | 25 | ☑ README complete — verify links resolve after deploy |
| 3 | Smart contracts deployed on Monad Testnet | 25 | ☑ Deployed — see addresses below |
| 4 | Project publicly hosted | 25 | ☐ Vercel URL live |

**Verify before ticking #4:** open the live URL in a private window, on a phone, with no wallet
installed. The landing page and explore page must render and load on-chain data.

---

## Advance — Project working — 100 points

| # | Item | Points | Status |
| --- | --- | --- | --- |
| 1 | All announced functions working | 25 | ☐ Run the full checklist below |
| 2 | Live transaction on-chain during the demo | 25 | ☐ Rehearse once end to end |
| 3 | Contract verified on the explorer / source published | 25 | ☑ All 4 contracts verified, perfect match on MonadVision + Monadscan |
| 4 | Someone else can run it from the README without help | 25 | ☐ Fresh-clone test below |

### Announced-function checklist

Every feature named in the pitch must actually work. Test each on the deployed app:

- [ ] Landing page renders, live opportunities load from the factory
- [ ] Explore — card view, table view, status filter
- [ ] Agreement detail — terms, progress, funders, income history, on-chain links
- [ ] Demo identity sign-in (both personas) shows read-only portfolio / recipient views
- [ ] Wallet connect + wrong-network switch prompt
- [ ] tUSD faucet
- [ ] Invest — approve + fund, ownership preview correct
- [ ] Funding to goal auto-activates the agreement
- [ ] Create agreement — validation, review screen, deploys a new contract
- [ ] Recipient: activate early, withdraw capital
- [ ] Recipient: submit income, obligation matches `calculateContribution`
- [ ] Recipient: settle repayment
- [ ] Investor: claim distribution, portfolio totals update
- [ ] Every transaction shows a working Monad Explorer link
- [ ] Mobile layout does not break

### Fresh-clone test (do this literally)

```bash
git clone <REPO_URL> /tmp/hy-test && cd /tmp/hy-test
cd contracts && forge install --no-git OpenZeppelin/openzeppelin-contracts && forge test
cd ../web && cp .env.example .env.local
# paste the deployed addresses into .env.local
npm install && npm run dev
```

- [ ] Tests pass from a clean clone
- [ ] `npm run dev` serves a working app against the deployed contracts
- [ ] No step required knowledge that is not in the README

---

## Build in public — 100 points

| # | Item | Points | Status |
| --- | --- | --- | --- |
| 1 | Launch post tagging @monad @monad_dev @geeky_kartikey | 25 | ☐ Drafted in `SOCIAL_POSTS.md` — not posted |
| 2 | Demo video, 30+ seconds, product actually running | 25 | ☐ Script in `VIDEO_SCRIPT.md` |
| 3 | Creative advertisement video | 25 | ☐ Concept in `SOCIAL_POSTS.md` §4 |
| 4 | 5K+ collective views across Blitz posts | 25 | ☐ Record real counts — do not estimate |

**Note:** drafts exist for all of the above. Posting is a human action and has not been done.

---

## Bonus — 100 points

| # | Item | Points | Status |
| --- | --- | --- | --- |
| 1 | Monad Mainnet deployment | 25 | ☐ Only if testnet demo is fully stable first |
| 2 | Public page on a custom domain | 15 | ☐ Add in Vercel → Domains |
| 3 | Pre-market fit | up to 20 | ☑ `PITCH.md` §5 — real ISA precedents cited |
| 4 | Revenue potential and strategy | up to 20 | ☑ `PITCH.md` §5 and README — documented, not charged in MVP |
| 5 | Innovation and originality | up to 20 | ☑ `PITCH.md` §5 — differentiated from Superfluid/Sablier |

**On mainnet:** the contracts are unaudited. Deploying to mainnet means a real factory that anyone
could publish an agreement through. If you do it, deploy the contracts for the points, but keep the
live app pointed at testnet and say so plainly.

---

## Deployed addresses

Deployed 19 Sep 2026. Source of truth: `contracts/deployments/monad-testnet.json`.

| Contract | Address | Explorer |
| --- | --- | --- |
| ISAFactory | `0xdaA1Dca29D758cEc7B3bA659c2921ccCcd494c01` | [view](https://testnet.monadexplorer.com/address/0xdaA1Dca29D758cEc7B3bA659c2921ccCcd494c01) |
| TestUSD (tUSD) | `0x9aE4053b0aa7a042eA3355fe743E0C21F2Cb6e95` | [view](https://testnet.monadexplorer.com/address/0x9aE4053b0aa7a042eA3355fe743E0C21F2Cb6e95) |
| DemoIncomeVerifier | `0x1811389195AC43285f8c9489aDD72a83F2a0A34c` | [view](https://testnet.monadexplorer.com/address/0x1811389195AC43285f8c9489aDD72a83F2a0A34c) |
| Sample agreement (Sarah Mehta) | `0x53Aa40A42d68E489fC9b694e943Fe00a0CcbFe59` | [view](https://testnet.monadexplorer.com/address/0x53Aa40A42d68E489fC9b694e943Fe00a0CcbFe59) |

Other seeded agreements: Arjun Rao `0xCa5aCbF08d048faa8e6b927f5BCc0C4ee026C754`,
Maya Kapoor `0x071aC242cf2D41C540768c235CB70e20f414495D`.

- Network: Monad Testnet
- Chain ID: 10143
- Live URL: `TBD`
- Repository: https://github.com/Meeti09/HumanIPO

---

## Final sweep — 15 minutes before submission

- [ ] Live URL loads in a private window
- [ ] README's contract addresses match what is actually deployed
- [ ] README's live URL is correct and resolves
- [ ] Explorer links in the footer all resolve
- [ ] Repository is public
- [ ] `.env` files with the deployer key are **not** in the repo (`git log --all -- contracts/.env`
      returns nothing)
- [ ] One real transaction executed on the deployed app today
- [ ] Disclaimer visible on every page
