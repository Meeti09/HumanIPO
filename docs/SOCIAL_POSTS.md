# Social content — HumanYield

Drafts only. **Nothing here has been posted.** Fill the placeholders before publishing, and do not
claim metrics that have not happened.

Required tags on the launch post: **@monad @monad_dev @geeky_kartikey**

Placeholders to replace everywhere: `LIVE_URL`, `REPO_URL`, `FACTORY_ADDRESS`, `EXPLORER_LINK`.

---

## 1. Launch post (X)

> Built HumanYield at Monad Blitz.
>
> Fund a person's course or career move. They return a set % of their reported income — capped,
> time-limited — and the contract splits every settlement across funders automatically.
>
> Earn less, pay less. Earn nothing, pay nothing. Hit the cap, you're done.
>
> Live on Monad Testnet: LIVE_URL
> Code: REPO_URL
>
> @monad @monad_dev @geeky_kartikey

**LinkedIn version:**

> A fixed loan asks for the same payment whether you landed the job or not. That's backwards for
> anyone funding a career change.
>
> Income share agreements fix the shape of that risk — you return a percentage of what you actually
> earn, capped and time-limited. The instrument already works in education finance. It has never
> been a consumer product, because settling a variable percentage across many funders every month
> for years is an admin nightmare.
>
> So I built HumanYield at Monad Blitz: publish an agreement in a minute, anyone can fund it, and
> every settlement is computed and split on-chain.
>
> An ISA isn't one transaction — it's a settlement every month for three years, times every funder.
> That's why it's on Monad: when a settlement costs a fraction of a cent, monthly stops being the
> floor.
>
> Live on Monad Testnet: LIVE_URL
> Code and contract addresses: REPO_URL
>
> Testnet prototype. Demo assets, no real-world value.
>
> @monad @monad_dev @geeky_kartikey

---

## 2. Technical post (X thread)

> 1/ HumanYield — how the contracts work. Built for @monad Blitz.
>
> The primitive: person → funding agreement → future income share → programmable settlement →
> pro-rata distribution.

> 2/ Publishing an agreement deploys *its own contract*. The factory doesn't store a row in a
> mapping — you get an address on the explorer that is yours, holding your terms and your balance.

> 3/ Four rules live in Solidity, not the frontend:
> · income share % applied to each attested figure
> · minimum income floor → settle zero below it
> · repayment cap → final settlement is clipped, never exceeded
> · term deadline → no new income after it
>
> The UI calls `calculateContribution` on-chain rather than doing the maths in JS.

> 4/ Distribution is pull-based. Each funder's claim is
> `totalRepaid × contribution / totalRaised − alreadyClaimed`.
> No loop over investors in the payment path, so it doesn't degrade with funder count.

> 5/ The honest part: a chain can't see a payslip. Income here is self-reported and labelled as a
> demo attestation everywhere it appears. It routes through an `IIncomeVerifier` interface so a
> payroll or oracle provider drops in without touching agreement logic.

> 6/ Why Monad specifically: one 36-month agreement is 36 attestations, 36 settlements, and a claim
> per funder per settlement. At any scale that's millions of small transactions. Cost per settlement
> is what sets the minimum cadence — cheap settlement means weekly instead of monthly.

> 7/ 33 Foundry tests, OpenZeppelin throughout, contracts verified on Monad Testnet.
>
> Code: REPO_URL
> Factory: FACTORY_ADDRESS
> Live: LIVE_URL

---

## 3. Demo post (X — attach the 30s+ screen recording)

> Full lifecycle of an income share agreement on @monad Testnet, start to finish, in under a minute.
>
> Fund → publish an agreement → report income → contract computes the settlement → funders claim
> their share.
>
> Every step is a real transaction. Watch the confirmation times.
>
> LIVE_URL

---

## 4. Creative advertisement concept (video)

**Title: "The Same Payment"**

No product footage for the first 20 seconds. Plain type on white, one line at a time, cut on a beat.

```
0:00  "You got the loan."
0:03  "Month 1. You got the job."          →  $480 due
0:06  "Month 4. You got promoted."         →  $480 due
0:09  "Month 7. The company folded."       →  $480 due
0:13  "Month 8. Still looking."            →  $480 due
0:17  [beat, black frame]
0:19  "The payment never asked how you were doing."
0:23  [cut to product — an agreement page]
0:25  "HumanYield: 7% of what you actually earn."
0:28  [income field: 4,000 → settles 280]
0:31  [income field: 0 → settles 0]
0:34  "Capped. Time-limited. Settled on Monad."
0:38  "Fund a person's future."
0:41  [LIVE_URL]
```

Tone: dry, unhurried, no music swell. The joke is the repetition of `$480 due`. No emojis, no
stock footage, no voiceover.

**Caption:**

> Fixed repayment doesn't care what happened to you. Income share agreements do — they just never
> got a consumer product. Built one at Monad Blitz.
>
> LIVE_URL
>
> @monad @monad_dev @geeky_kartikey

---

## 5. Short video script (30–45s product demo)

See [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md).

---

## Posting checklist

- [ ] Replace every `LIVE_URL`, `REPO_URL`, `FACTORY_ADDRESS` placeholder
- [ ] Launch post includes @monad @monad_dev @geeky_kartikey
- [ ] Demo video is 30+ seconds and shows the product actually running
- [ ] Creative ad posted separately from the demo post
- [ ] Testnet/prototype disclaimer present on posts that show amounts
- [ ] Record actual view counts after posting — do not estimate or invent them
