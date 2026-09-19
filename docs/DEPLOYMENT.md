# Deploying HumanYield

Two things get deployed: the contracts (Monad Testnet) and the frontend (Vercel). The frontend
needs the contract addresses, so deploy contracts first.

---

## 1. Contracts → Monad Testnet

### Prepare a deployer account

Use a **throwaway key**, not a wallet holding anything you care about. It only needs a few testnet
MON for gas.

```bash
cast wallet new
```

Put the private key in `contracts/.env` (gitignored):

```bash
cd contracts
cp .env.example .env
# edit .env: PRIVATE_KEY=0x...
```

Fund the address from https://faucet.monad.xyz. About 1 MON covers the full deploy and seed.

### Deploy

```bash
cd contracts
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url "$MONAD_TESTNET_RPC_URL" --broadcast
```

Output includes the three addresses and writes `contracts/deployments/monad-testnet.json`:

```
NEXT_PUBLIC_TEST_USD_ADDRESS=0x...
NEXT_PUBLIC_VERIFIER_ADDRESS=0x...
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
```

### Seed the demo agreements

```bash
export FACTORY_ADDRESS=<ISAFactory address>
forge script script/Seed.s.sol:Seed --rpc-url "$MONAD_TESTNET_RPC_URL" --broadcast
```

Creates and partially funds the three labelled demo agreements so the explore page has realistic
on-chain progress.

### Verify the source

```bash
cd ..
bash scripts/verify.sh
```

Publishes to MonadVision, Socialscan and Monadscan in one call per contract. Confirm by opening
each address on https://testnet.monadexplorer.com and checking the Contract tab shows source.

---

## 2. Frontend → Vercel

The Next.js app lives in `web/`, so Vercel needs to be told where the project root is.

### Via the dashboard

1. **New Project** → import the GitHub repository.
2. **Root Directory**: set to `web`. *(This is the one setting that matters — Vercel will not find
   the app without it.)*
3. Framework preset: **Next.js** (auto-detected once the root directory is right).
4. Build command and output directory: leave as the defaults.
5. Add the environment variables below, for **Production, Preview and Development**.
6. **Deploy.**

### Via the CLI

```bash
npm i -g vercel
cd web
vercel link
vercel env add NEXT_PUBLIC_FACTORY_ADDRESS production
# … repeat for each variable …
vercel --prod
```

Running `vercel` from inside `web/` sets the root directory correctly without any dashboard step.

### Environment variables

Every variable is public — these ship to the browser. No secrets go into Vercel for this project.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_MONAD_RPC_URL` | `https://testnet-rpc.monad.xyz` |
| `NEXT_PUBLIC_CHAIN_ID` | `10143` |
| `NEXT_PUBLIC_EXPLORER_URL` | `https://testnet.monadexplorer.com` |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | from the deploy output |
| `NEXT_PUBLIC_TEST_USD_ADDRESS` | from the deploy output |
| `NEXT_PUBLIC_VERIFIER_ADDRESS` | from the deploy output |
| `NEXT_PUBLIC_DEMO_SEED_ADDRESS` | the deployer address (what the demo personas display) |
| `NEXT_PUBLIC_REPO_URL` | your GitHub repository URL |

> `NEXT_PUBLIC_*` variables are inlined at **build** time. Changing one in Vercel requires a
> redeploy, not just a restart.

### Custom domain (bonus points)

Vercel → Project → **Settings → Domains** → add your domain and follow the DNS instructions.

### Verify the deployment

Open the production URL in a **private window** and check:

- [ ] Landing page renders, no console errors
- [ ] Open agreements load (proves the RPC and factory address are right)
- [ ] `/explore` and `/transparency` show the correct contract addresses
- [ ] Footer explorer links resolve
- [ ] Connect wallet → wrong-network prompt appears if you are on another chain
- [ ] One full transaction (faucet is the cheapest test) confirms and links to the explorer
- [ ] Layout holds on a phone-width viewport

---

## Troubleshooting

**"Contracts not configured" notice in the app**
`NEXT_PUBLIC_FACTORY_ADDRESS` or `NEXT_PUBLIC_TEST_USD_ADDRESS` is unset or not a valid address.
On Vercel, set it and redeploy — build-time inlining means a restart is not enough.

**Explore page is empty**
The factory is deployed but has no agreements. Run the seed script, or create one in the app.

**Vercel build cannot find the app**
Root Directory is not set to `web`.

**`forge script` fails with "insufficient funds"**
The deployer address has no testnet MON. Fund it from https://faucet.monad.xyz.

**Verification returns an error**
Confirm `compilerVersion` in `scripts/verify.sh` matches your `solc` version (`forge --version`),
and that `contracts/out/` is up to date (`forge build`). The manual Sourcify fallback is in the
README.
