# HumanYield — web

Next.js frontend for HumanYield. See the [repository README](../README.md) for the project
overview, deployed contract addresses, and full setup instructions.

## Quick start

```bash
cp .env.example .env.local     # then paste the deployed contract addresses
npm install
npm run dev
```

http://localhost:3000

## Layout

```
src/
├── app/
│   ├── page.tsx                  landing
│   ├── explore/                  all agreements (cards + table)
│   ├── agreement/[address]/      detail, invest, recipient controls, history
│   ├── dashboard/                investor portfolio and claims
│   ├── recipient/                income reporting and settlement
│   ├── create/                   publish an agreement
│   ├── transparency/             contracts, enforced rules, known limitations
│   └── providers.tsx             wagmi + react-query + demo + transaction providers
├── components/
│   ├── ui.tsx                    design-system primitives
│   ├── TransactionProvider.tsx   multi-step tx runner and status panel
│   ├── DemoProvider.tsx          read-only demo identities
│   ├── InvestPanel / RecipientPanel / PositionPanel
│   └── …
├── hooks/useAgreements.ts        every contract read, batched where possible
└── lib/
    ├── abis.ts                   generated — `node ../scripts/generate-abis.mjs`
    ├── chain.ts                  Monad Testnet config and explorer helpers
    ├── contracts.ts              deployed addresses from the environment
    ├── format.ts                 token, bps and date formatting
    └── wagmi.ts                  wagmi config (injected connector, multicall batching)
```

## Notes

- **No backend and no database.** Every figure on screen is read from the contracts.
- `src/lib/abis.ts` is generated from the Foundry build output. After changing a contract, run
  `cd ../contracts && forge build && cd .. && node scripts/generate-abis.mjs`.
- Light theme only. Design tokens are defined in `src/app/globals.css` under `@theme`.
- Deployment instructions, including the Vercel root-directory setting, are in
  [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).
