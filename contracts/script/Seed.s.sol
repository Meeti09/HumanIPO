// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TestUSD} from "../src/TestUSD.sol";
import {ISAFactory} from "../src/ISAFactory.sol";
import {ISAAgreement} from "../src/ISAAgreement.sol";

/// @notice Creates the three labelled demo agreements and partially funds them so the explore
///         page has realistic on-chain progress. Every figure here is testnet demo data.
/// forge script script/Seed.s.sol:Seed --rpc-url $MONAD_TESTNET_RPC_URL --broadcast
contract Seed is Script {
    uint256 constant USD = 1e6;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        ISAFactory factory = ISAFactory(vm.envAddress("FACTORY_ADDRESS"));
        TestUSD token = TestUSD(factory.settlementToken());

        vm.startBroadcast(pk);

        if (token.balanceOf(vm.addr(pk)) < 5_000 * USD) {
            token.faucet();
        }

        address a1 = factory.createAgreement(
            5_000 * USD,
            12_000 * USD,
            2_000 * USD,
            700,
            36,
            "Sarah Mehta",
            "AI Career Transition",
            "Twelve-week applied machine learning program plus three months of living runway while I move from QA automation into an ML engineering role. Funding covers tuition, a GPU workstation, and the gap between contracts.",
            "Education"
        );

        address a2 = factory.createAgreement(
            3_000 * USD,
            7_000 * USD,
            1_500 * USD,
            500,
            24,
            "Arjun Rao",
            "Cloud Architecture Certification",
            "Two professional cloud certifications and the exam fees, taken alongside contract work. The certifications unlock senior infrastructure contracts that currently screen me out on paper.",
            "Certification"
        );

        address a3 = factory.createAgreement(
            2_500 * USD,
            6_000 * USD,
            1_200 * USD,
            400,
            24,
            "Maya Kapoor",
            "Independent Documentary Project",
            "Equipment and six months of production time for a self-funded documentary short. Funding covers a camera body, audio kit, and travel to two shoot locations.",
            "Creative"
        );

        // Partial funding so the explore page shows in-progress raises rather than empty bars.
        _fund(token, a1, 3_000 * USD);
        _fund(token, a2, 1_200 * USD);
        _fund(token, a3, 700 * USD);

        vm.stopBroadcast();

        console.log("AGREEMENT_1=%s", a1);
        console.log("AGREEMENT_2=%s", a2);
        console.log("AGREEMENT_3=%s", a3);
    }

    function _fund(TestUSD token, address agreement, uint256 amount) internal {
        token.approve(agreement, amount);
        ISAAgreement(agreement).fund(amount);
    }
}
