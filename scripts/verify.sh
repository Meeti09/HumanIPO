#!/usr/bin/env bash
# Verifies the deployed HumanYield contracts on the Monad explorers.
#
# The Monad verification API publishes source to MonadVision, Socialscan and Monadscan
# in one call. Run from the repository root after deploying:
#
#   bash scripts/verify.sh
#
# Requires contracts/deployments/monad-testnet.json (written by Deploy.s.sol).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS="$ROOT/contracts"
DEPLOYMENTS="$CONTRACTS/deployments/monad-testnet.json"
CHAIN_ID=10143
COMPILER="v0.8.28+commit.7893614a"
API="https://agents.devnads.com/v1/verify"
TMP="$CONTRACTS/.verify-tmp"

if [ ! -f "$DEPLOYMENTS" ]; then
  echo "Missing $DEPLOYMENTS — deploy first." >&2
  exit 1
fi

mkdir -p "$TMP"

read_address() {
  node -e "console.log(require('$DEPLOYMENTS').$1)"
}

verify() {
  local address="$1" contract_path="$2" contract_name="$3" ctor_args="${4:-}"

  echo ""
  echo "── Verifying $contract_name at $address"

  (cd "$CONTRACTS" && forge verify-contract "$address" "$contract_path:$contract_name" \
    --chain "$CHAIN_ID" --show-standard-json-input) > "$TMP/standard-input.json"

  node -e "
    const fs = require('fs')
    const artifact = require('$CONTRACTS/out/$contract_name.sol/$contract_name.json')
    fs.writeFileSync('$TMP/metadata.json', JSON.stringify(artifact.metadata))
  "

  node -e "
    const fs = require('fs')
    const payload = {
      chainId: $CHAIN_ID,
      contractAddress: '$address',
      contractName: '$contract_path:$contract_name',
      compilerVersion: '$COMPILER',
      standardJsonInput: JSON.parse(fs.readFileSync('$TMP/standard-input.json', 'utf8')),
      foundryMetadata: JSON.parse(fs.readFileSync('$TMP/metadata.json', 'utf8')),
    }
    const args = '$ctor_args'
    if (args) payload.constructorArgs = args
    fs.writeFileSync('$TMP/request.json', JSON.stringify(payload))
  "

  curl -sS -X POST "$API" -H "Content-Type: application/json" -d @"$TMP/request.json"
  echo ""
}

TEST_USD=$(read_address testUsd)
VERIFIER=$(read_address incomeVerifier)
FACTORY=$(read_address isaFactory)
DEPLOYER=$(read_address deployer)

verify "$TEST_USD" "src/TestUSD.sol" "TestUSD"
verify "$VERIFIER" "src/DemoIncomeVerifier.sol" "DemoIncomeVerifier"

FACTORY_ARGS=$(cd "$CONTRACTS" && cast abi-encode "constructor(address,address,address)" "$TEST_USD" "$VERIFIER" "$DEPLOYER")
verify "$FACTORY" "src/ISAFactory.sol" "ISAFactory" "${FACTORY_ARGS#0x}"

echo ""
echo "Done. Check each contract on https://testnet.monadexplorer.com/address/<address>"
rm -rf "$TMP"
