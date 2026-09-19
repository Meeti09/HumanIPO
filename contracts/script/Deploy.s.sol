// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TestUSD} from "../src/TestUSD.sol";
import {DemoIncomeVerifier} from "../src/DemoIncomeVerifier.sol";
import {ISAFactory} from "../src/ISAFactory.sol";

/// @notice Deploys the HumanYield stack to Monad Testnet.
/// forge script script/Deploy.s.sol:Deploy --rpc-url $MONAD_TESTNET_RPC_URL --broadcast
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        TestUSD token = new TestUSD();
        DemoIncomeVerifier verifier = new DemoIncomeVerifier();
        ISAFactory factory = new ISAFactory(address(token), address(verifier), deployer);

        vm.stopBroadcast();

        console.log("NEXT_PUBLIC_TEST_USD_ADDRESS=%s", address(token));
        console.log("NEXT_PUBLIC_VERIFIER_ADDRESS=%s", address(verifier));
        console.log("NEXT_PUBLIC_FACTORY_ADDRESS=%s", address(factory));
        console.log("DEPLOYER=%s", deployer);

        string memory json = string.concat(
            '{\n  "chainId": 10143,\n  "network": "monad-testnet",\n  "deployer": "',
            vm.toString(deployer),
            '",\n  "testUsd": "',
            vm.toString(address(token)),
            '",\n  "incomeVerifier": "',
            vm.toString(address(verifier)),
            '",\n  "isaFactory": "',
            vm.toString(address(factory)),
            '"\n}\n'
        );
        vm.writeFile("deployments/monad-testnet.json", json);
    }
}
