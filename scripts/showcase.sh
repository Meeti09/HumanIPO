#!/usr/bin/env bash
# Creates one fully-exercised demo agreement on Monad Testnet so the product has a real
# settlement history to show: two funders, a completed raise, three reported income periods
# (including a zero-income month) and a claimed distribution.
#
# Every transaction here is real. Run once, from the repository root:
#   bash scripts/showcase.sh
#
# Requires contracts/.env (PRIVATE_KEY of the recipient/deployer) and a funded deployer.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/contracts"
source .env

RPC="$MONAD_TESTNET_RPC_URL"
FACTORY=$(node -e "console.log(JSON.parse(require('fs').readFileSync('deployments/monad-testnet.json','utf8')).isaFactory)")
TUSD=$(node -e "console.log(JSON.parse(require('fs').readFileSync('deployments/monad-testnet.json','utf8')).testUsd)")

send() { cast send "$@" --private-key "$1" --rpc-url "$RPC" > /dev/null; }

echo "Factory: $FACTORY"
echo "tUSD:    $TUSD"

# --- two throwaway funder accounts, each pulling its own faucet allocation ----------
echo ""
echo "── Creating funder accounts"
FUNDER_A=$(cast wallet new --json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const w=JSON.parse(d)[0];console.log(w.private_key+' '+w.address)})")
FUNDER_B=$(cast wallet new --json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const w=JSON.parse(d)[0];console.log(w.private_key+' '+w.address)})")
A_KEY=${FUNDER_A% *}; A_ADDR=${FUNDER_A#* }
B_KEY=${FUNDER_B% *}; B_ADDR=${FUNDER_B#* }
echo "Funder A: $A_ADDR"
echo "Funder B: $B_ADDR"

echo "── Funding them with gas"
cast send "$A_ADDR" --value 0.3ether --private-key "$PRIVATE_KEY" --rpc-url "$RPC" > /dev/null
cast send "$B_ADDR" --value 0.3ether --private-key "$PRIVATE_KEY" --rpc-url "$RPC" > /dev/null

echo "── Pulling tUSD from the faucet"
cast send "$TUSD" "faucet()" --private-key "$A_KEY" --rpc-url "$RPC" > /dev/null
cast send "$TUSD" "faucet()" --private-key "$B_KEY" --rpc-url "$RPC" > /dev/null

# --- the agreement ------------------------------------------------------------------
echo ""
echo "── Creating the agreement"
cast send "$FACTORY" \
  "createAgreement(uint256,uint256,uint256,uint16,uint16,string,string,string,string)" \
  4000000000 9000000000 1500000000 600 24 \
  "Priya Nair" \
  "Data Engineering Career Switch" \
  "Six-month part-time data engineering programme plus the income gap while I step down to three days a week of support work. Funding covers the course, the cloud certification exams, and four months of reduced hours." \
  "Career transition" \
  --private-key "$PRIVATE_KEY" --rpc-url "$RPC" > /dev/null

COUNT=$(cast call "$FACTORY" "getAgreementCount()(uint256)" --rpc-url "$RPC")
INDEX=$((COUNT - 1))
AGREEMENT=$(cast call "$FACTORY" "getAgreement(uint256)(address)" "$INDEX" --rpc-url "$RPC")
echo "Agreement: $AGREEMENT"

# --- funding ------------------------------------------------------------------------
echo "── Funder A invests 2,500 tUSD"
cast send "$TUSD" "approve(address,uint256)" "$AGREEMENT" 2500000000 --private-key "$A_KEY" --rpc-url "$RPC" > /dev/null
cast send "$AGREEMENT" "fund(uint256)" 2500000000 --private-key "$A_KEY" --rpc-url "$RPC" > /dev/null

echo "── Funder B invests 1,500 tUSD — fills the raise and activates the agreement"
cast send "$TUSD" "approve(address,uint256)" "$AGREEMENT" 1500000000 --private-key "$B_KEY" --rpc-url "$RPC" > /dev/null
cast send "$AGREEMENT" "fund(uint256)" 1500000000 --private-key "$B_KEY" --rpc-url "$RPC" > /dev/null

echo "   status (1 = Active): $(cast call "$AGREEMENT" 'status()(uint8)' --rpc-url "$RPC")"

echo "── Recipient withdraws the capital"
cast send "$AGREEMENT" "withdrawCapital()" --private-key "$PRIVATE_KEY" --rpc-url "$RPC" > /dev/null

# --- income and settlement ----------------------------------------------------------
settle() {
  local income="$1" label="$2"
  echo "── Reporting income: $label"
  cast send "$AGREEMENT" "submitIncome(uint256,bytes)" "$income" 0x \
    --private-key "$PRIVATE_KEY" --rpc-url "$RPC" > /dev/null
  local owed
  owed=$(cast call "$AGREEMENT" "pendingObligation()(uint256)" --rpc-url "$RPC")
  echo "   obligation: $owed"
  if [ "${owed%% *}" != "0" ]; then
    cast send "$TUSD" "approve(address,uint256)" "$AGREEMENT" "${owed%% *}" \
      --private-key "$PRIVATE_KEY" --rpc-url "$RPC" > /dev/null
    cast send "$AGREEMENT" "makeRepayment()" --private-key "$PRIVATE_KEY" --rpc-url "$RPC" > /dev/null
    echo "   settled"
  fi
}

settle 5000000000 "5,000 tUSD -> 6% = 300"
settle 0          "0 tUSD (no qualifying income this period) -> 0"
settle 6000000000 "6,000 tUSD -> 6% = 360"

# --- distribution --------------------------------------------------------------------
echo ""
echo "── Funder A claims"
echo "   claimable before: $(cast call "$AGREEMENT" 'claimable(address)(uint256)' "$A_ADDR" --rpc-url "$RPC")"
cast send "$AGREEMENT" "claim()" --private-key "$A_KEY" --rpc-url "$RPC" > /dev/null
echo "   claimed:         $(cast call "$AGREEMENT" 'claimedOf(address)(uint256)' "$A_ADDR" --rpc-url "$RPC")"
echo "   funder B leaves theirs unclaimed: $(cast call "$AGREEMENT" 'claimable(address)(uint256)' "$B_ADDR" --rpc-url "$RPC")"

echo ""
echo "── Final state"
echo "   total raised:  $(cast call "$AGREEMENT" 'totalRaised()(uint256)' --rpc-url "$RPC")"
echo "   total repaid:  $(cast call "$AGREEMENT" 'totalRepaid()(uint256)' --rpc-url "$RPC")"
echo "   periods:       $(cast call "$AGREEMENT" 'incomePeriodCount()(uint256)' --rpc-url "$RPC")"
echo "   agreement:     $AGREEMENT"
