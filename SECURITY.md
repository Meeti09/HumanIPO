# Security

## Status

**This is an unaudited prototype built during a one-day hackathon (Monad Blitz) and deployed to
Monad Testnet only.** It has not been reviewed by a third party. Do not deploy it to a mainnet, do
not put real value through it, and do not treat any part of it as production-ready.

The `tUSD` settlement token is a demo asset with an open faucet. It has no value and is not
redeemable for anything.

## What the contracts do enforce

These invariants are implemented in Solidity, not in the frontend:

| Rule | Where |
| --- | --- |
| Income share percentage applied to each attested income figure | `ISAAgreement.calculateContribution` |
| Minimum income floor — below it, a period settles at zero | `ISAAgreement.calculateContribution` |
| Repayment cap — the final settlement is clipped so total repayment can never exceed it | `ISAAgreement.calculateContribution`, `remainingObligation` |
| Term deadline — no new income can be reported after `endTime` | `ISAAgreement.submitIncome` |
| Overfunding rejected rather than partially accepted | `ISAAgreement.fund` |
| Only the recipient may report income, settle, withdraw capital, activate or cancel | `onlyRecipient` modifier |
| Only one settlement obligation open at a time | `ISAAgreement.submitIncome` |
| Claims can never exceed an investor's pro-rata share of what has actually been repaid | `ISAAgreement.claimable` / `claim` |
| Constructor bounds: non-zero goal, 0 < share ≤ 50%, 1 ≤ term ≤ 120 months, cap ≥ goal | `ISAAgreement` constructor |

## Practices applied

- OpenZeppelin `ERC20`, `Ownable`, `ReentrancyGuard` and `SafeERC20` rather than hand-rolled
  equivalents.
- `nonReentrant` on every function that moves tokens (`fund`, `refund`, `withdrawCapital`,
  `makeRepayment`, `claim`).
- Checks-effects-interactions: accounting is updated before any external token call.
- Pull-based distribution. Settlements are claimed by each investor, so there is no loop over an
  unbounded investor set during a payment.
- No `tx.origin`, no `delegatecall`, no upgradeable proxies, no admin key over user funds.
- The single owner-gated function (`ISAFactory.setDefaultVerifier`) affects only which verifier
  *future* agreements are created with. Existing agreements hold their verifier as an `immutable`
  and cannot be changed by anyone.
- 33 Foundry tests covering the lifecycle, access control, bounds, cap clipping, expiry,
  proportional distribution and two fuzz properties.

## Known limitations

1. **Income is self-reported.** `DemoIncomeVerifier` records the recipient's own figure on-chain
   and bounds it to a sane maximum. It does not verify real earnings, and it cannot. This is
   labelled as a demo attestation everywhere it appears in the product. `IIncomeVerifier` exists so
   a payroll, open-banking or oracle-backed implementation can replace it without touching
   agreement logic.
2. **Nothing compels reporting.** A recipient can simply never call `submitIncome`. The on-chain
   system records and enforces terms; it does not create the off-chain obligation to report. A real
   deployment needs legal recourse alongside the contract.
3. **Rounding dust.** Pro-rata claims use integer division, so a small remainder can stay in the
   agreement contract when a settlement does not divide evenly. It is bounded by (number of
   investors − 1) base units per settlement and is not recoverable in this version.
4. **Term months are 30-day periods.** `SECONDS_PER_MONTH = 30 days`, so a 36-month term is 1080
   days rather than three calendar years.
5. **No settlement cadence enforcement.** The contract does not require a minimum interval between
   income submissions. It records what is reported, when it is reported.
6. **Gas on Monad is charged on `gas_limit`, not gas used.** Wallet-estimated limits are used
   throughout; no manual limits are set.

## Reporting an issue

This is a hackathon prototype with no production deployment. If you find a problem, open an issue
on the GitHub repository. There is no bug bounty.
