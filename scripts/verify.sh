#!/usr/bin/env bash
# Verifies the deployed HumanYield contracts on the Monad explorers.
#
# The Monad verification API publishes source to MonadVision, Socialscan and Monadscan
# in one call. Run from the repository root after deploying:
#
#   bash scripts/verify.sh
#
# Requires contracts/deployments/monad-testnet.json (written by Deploy.s.sol).
#
# Note: node is invoked with the contracts directory as its cwd and relative paths
# throughout, so this works under Git Bash on Windows as well as on Linux/macOS.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS="$ROOT/contracts"
CHAIN_ID=10143
COMPILER="v0.8.28+commit.7893614a"
API="https://agents.devnads.com/v1/verify"

cd "$CONTRACTS"

if [ ! -f "deployments/monad-testnet.json" ]; then
  echo "Missing contracts/deployments/monad-testnet.json — deploy first." >&2
  exit 1
fi

mkdir -p .verify-tmp

read_address() {
  node -e "console.log(JSON.parse(require('fs').readFileSync('deployments/monad-testnet.json','utf8')).$1)"
}

verify() {
  local address="$1" contract_path="$2" contract_name="$3" ctor_args="${4:-}"

  echo ""
  echo "── Verifying $contract_name at $address"

  forge verify-contract "$address" "$contract_path:$contract_name" \
    --chain "$CHAIN_ID" --show-standard-json-input > ".verify-tmp/standard-input.json"

  CONTRACT_NAME="$contract_name" CONTRACT_PATH="$contract_path" ADDRESS="$address" \
  CTOR_ARGS="$ctor_args" CHAIN_ID="$CHAIN_ID" COMPILER="$COMPILER" node -e "
    const fs = require('fs')
    const name = process.env.CONTRACT_NAME
    const artifact = JSON.parse(
      fs.readFileSync('out/' + name + '.sol/' + name + '.json', 'utf8')
    )
    const payload = {
      chainId: Number(process.env.CHAIN_ID),
      contractAddress: process.env.ADDRESS,
      contractName: process.env.CONTRACT_PATH + ':' + name,
      compilerVersion: process.env.COMPILER,
      standardJsonInput: JSON.parse(
        fs.readFileSync('.verify-tmp/standard-input.json', 'utf8')
      ),
      foundryMetadata: artifact.metadata,
    }
    if (process.env.CTOR_ARGS) payload.constructorArgs = process.env.CTOR_ARGS
    fs.writeFileSync('.verify-tmp/request.json', JSON.stringify(payload))
  "

  curl -sS -X POST "$API" -H "Content-Type: application/json" -d @".verify-tmp/request.json"
  echo ""
}

TEST_USD=$(read_address testUsd)
VERIFIER=$(read_address incomeVerifier)
FACTORY=$(read_address isaFactory)
DEPLOYER=$(read_address deployer)

verify "$TEST_USD" "src/TestUSD.sol" "TestUSD"
verify "$VERIFIER" "src/DemoIncomeVerifier.sol" "DemoIncomeVerifier"

FACTORY_ARGS=$(cast abi-encode "constructor(address,address,address)" "$TEST_USD" "$VERIFIER" "$DEPLOYER")
verify "$FACTORY" "src/ISAFactory.sol" "ISAFactory" "${FACTORY_ARGS#0x}"

echo ""
echo "Done. Check each contract on https://testnet.monadexplorer.com/address/<address>"
rm -rf .verify-tmp
