#!/usr/bin/env bash
# One-shot Vercel setup + production deploy for the HumanYield frontend.
#
# Prerequisites (one time, interactive — a browser window opens):
#   npm i -g vercel
#   vercel login
#
# Then, from the repository root:
#   bash scripts/vercel-deploy.sh
#
# Running from inside web/ makes that the project root, so no dashboard setting is needed.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/web"

if ! vercel whoami > /dev/null 2>&1; then
  echo "Not logged in. Run 'vercel login' in an interactive terminal first." >&2
  exit 1
fi

echo "── Linking the project (accept the defaults; project root is web/)"
vercel link --yes

set_env() {
  local key="$1" value="$2"
  for target in production preview development; do
    # Replace any existing value so re-runs are idempotent.
    vercel env rm "$key" "$target" --yes > /dev/null 2>&1 || true
    printf '%s' "$value" | vercel env add "$key" "$target" > /dev/null
  done
  echo "   set $key"
}

echo "── Setting environment variables"
set_env NEXT_PUBLIC_MONAD_RPC_URL           "https://testnet-rpc.monad.xyz"
set_env NEXT_PUBLIC_CHAIN_ID                "10143"
set_env NEXT_PUBLIC_EXPLORER_URL            "https://testnet.monadexplorer.com"
set_env NEXT_PUBLIC_FACTORY_ADDRESS         "0xdaA1Dca29D758cEc7B3bA659c2921ccCcd494c01"
set_env NEXT_PUBLIC_TEST_USD_ADDRESS        "0x9aE4053b0aa7a042eA3355fe743E0C21F2Cb6e95"
set_env NEXT_PUBLIC_VERIFIER_ADDRESS        "0x1811389195AC43285f8c9489aDD72a83F2a0A34c"
set_env NEXT_PUBLIC_DEMO_SEED_ADDRESS       "0x64f39F5cDbF746d968e781D7e1b51315D6384C7e"
set_env NEXT_PUBLIC_DEMO_INVESTOR_ADDRESS   "0x64f39F5cDbF746d968e781D7e1b51315D6384C7e"
set_env NEXT_PUBLIC_DEMO_RECIPIENT_ADDRESS  "0x64f39F5cDbF746d968e781D7e1b51315D6384C7e"
set_env NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID "00b49d32ef901c222ae0449ca91ff660"
set_env NEXT_PUBLIC_REPO_URL                "https://github.com/Meeti09/HumanIPO"

echo ""
echo "── Deploying to production"
vercel --prod --yes

echo ""
echo "Done. Open the printed URL and confirm the explore page loads agreements from"
echo "Monad Testnet, then paste the URL back so the README and docs can be updated."
