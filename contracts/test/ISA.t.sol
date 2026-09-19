// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {TestUSD} from "../src/TestUSD.sol";
import {DemoIncomeVerifier} from "../src/DemoIncomeVerifier.sol";
import {ISAFactory} from "../src/ISAFactory.sol";
import {ISAAgreement} from "../src/ISAAgreement.sol";

contract ISATest is Test {
    uint256 constant USD = 1e6;

    TestUSD internal token;
    DemoIncomeVerifier internal verifier;
    ISAFactory internal factory;

    address internal owner = address(0xA11CE);
    address internal recipient = address(0xB0B);
    address internal alice = address(0xA1);
    address internal bob = address(0xB2);
    address internal carol = address(0xC3);

    function setUp() public {
        token = new TestUSD();
        verifier = new DemoIncomeVerifier();
        factory = new ISAFactory(address(token), address(verifier), owner);

        _mint(recipient, 100_000 * USD);
        _mint(alice, 100_000 * USD);
        _mint(bob, 100_000 * USD);
        _mint(carol, 100_000 * USD);
    }

    // -----------------------------------------------------------------
    // helpers
    // -----------------------------------------------------------------

    function _mint(address to, uint256 amount) internal {
        deal(address(token), to, amount, true);
    }

    function _defaultAgreement() internal returns (ISAAgreement) {
        vm.prank(recipient);
        address a = factory.createAgreement(
            5_000 * USD, // funding goal
            12_000 * USD, // repayment cap
            2_000 * USD, // minimum income threshold
            700, // 7%
            36, // months
            "Sarah Mehta",
            "AI Career Transition",
            "Twelve-week applied ML program plus three months of runway.",
            "Education"
        );
        return ISAAgreement(a);
    }

    function _fund(ISAAgreement a, address investor, uint256 amount) internal {
        vm.startPrank(investor);
        token.approve(address(a), amount);
        a.fund(amount);
        vm.stopPrank();
    }

    function _submitAndRepay(ISAAgreement a, uint256 income) internal returns (uint256 obligation) {
        vm.prank(recipient);
        (, obligation) = a.submitIncome(income, "");
        if (obligation > 0) {
            vm.startPrank(recipient);
            token.approve(address(a), obligation);
            a.makeRepayment();
            vm.stopPrank();
        }
    }

    // -----------------------------------------------------------------
    // creation
    // -----------------------------------------------------------------

    function test_CreateAgreement_StoresTermsAndIndexes() public {
        ISAAgreement a = _defaultAgreement();

        ISAAgreement.Snapshot memory s = a.getAgreementDetails();
        assertEq(s.recipient, recipient);
        assertEq(s.token, address(token));
        assertEq(s.verifier, address(verifier));
        assertEq(s.terms.fundingGoal, 5_000 * USD);
        assertEq(s.terms.repaymentCap, 12_000 * USD);
        assertEq(s.terms.incomeShareBps, 700);
        assertEq(s.terms.termMonths, 36);
        assertEq(uint8(s.status), uint8(ISAAgreement.Status.Funding));
        assertEq(s.profile.displayName, "Sarah Mehta");

        assertEq(factory.getAgreementCount(), 1);
        assertEq(factory.getAgreement(0), address(a));
        assertTrue(factory.isAgreement(address(a)));
        assertEq(factory.getAgreementsByRecipient(recipient).length, 1);
    }

    function test_RevertWhen_FundingGoalIsZero() public {
        vm.prank(recipient);
        vm.expectRevert(ISAAgreement.ZeroAmount.selector);
        factory.createAgreement(0, 1_000 * USD, 0, 700, 36, "X", "Y", "Z", "C");
    }

    function test_RevertWhen_IncomeShareOutOfRange() public {
        vm.startPrank(recipient);
        vm.expectRevert(abi.encodeWithSelector(ISAAgreement.InvalidIncomeShare.selector, uint16(0)));
        factory.createAgreement(1_000 * USD, 2_000 * USD, 0, 0, 36, "X", "Y", "Z", "C");

        vm.expectRevert(abi.encodeWithSelector(ISAAgreement.InvalidIncomeShare.selector, uint16(5_001)));
        factory.createAgreement(1_000 * USD, 2_000 * USD, 0, 5_001, 36, "X", "Y", "Z", "C");
        vm.stopPrank();
    }

    function test_RevertWhen_TermOutOfRange() public {
        vm.startPrank(recipient);
        vm.expectRevert(abi.encodeWithSelector(ISAAgreement.InvalidTerm.selector, uint16(0)));
        factory.createAgreement(1_000 * USD, 2_000 * USD, 0, 700, 0, "X", "Y", "Z", "C");

        vm.expectRevert(abi.encodeWithSelector(ISAAgreement.InvalidTerm.selector, uint16(121)));
        factory.createAgreement(1_000 * USD, 2_000 * USD, 0, 700, 121, "X", "Y", "Z", "C");
        vm.stopPrank();
    }

    function test_RevertWhen_CapBelowFundingGoal() public {
        vm.prank(recipient);
        vm.expectRevert(abi.encodeWithSelector(ISAAgreement.InvalidCap.selector, 999 * USD, 1_000 * USD));
        factory.createAgreement(1_000 * USD, 999 * USD, 0, 700, 36, "X", "Y", "Z", "C");
    }

    // -----------------------------------------------------------------
    // funding
    // -----------------------------------------------------------------

    function test_Fund_TracksSharesAndActivatesAtGoal() public {
        ISAAgreement a = _defaultAgreement();

        _fund(a, alice, 1_000 * USD);
        assertEq(a.totalRaised(), 1_000 * USD);
        assertEq(a.contributionOf(alice), 1_000 * USD);
        assertEq(a.investorShareBps(alice), 10_000); // sole investor so far
        assertEq(uint8(a.status()), uint8(ISAAgreement.Status.Funding));

        _fund(a, bob, 4_000 * USD);
        assertEq(a.totalRaised(), 5_000 * USD);
        assertEq(a.investorShareBps(alice), 2_000); // 20%
        assertEq(a.investorShareBps(bob), 8_000); // 80%
        assertEq(uint8(a.status()), uint8(ISAAgreement.Status.Active));
        assertEq(a.endTime(), a.startTime() + 36 * 30 days);
        assertEq(a.investorCount(), 2);
    }

    function test_RevertWhen_Overfunding() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 4_000 * USD);

        vm.startPrank(bob);
        token.approve(address(a), 2_000 * USD);
        vm.expectRevert(abi.encodeWithSelector(ISAAgreement.ExceedsFundingGoal.selector, 1_000 * USD));
        a.fund(2_000 * USD);
        vm.stopPrank();
    }

    function test_RevertWhen_FundingZero() public {
        ISAAgreement a = _defaultAgreement();
        vm.prank(alice);
        vm.expectRevert(ISAAgreement.ZeroAmount.selector);
        a.fund(0);
    }

    function test_RevertWhen_FundingAnActiveAgreement() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        vm.startPrank(bob);
        token.approve(address(a), 1 * USD);
        vm.expectRevert(
            abi.encodeWithSelector(
                ISAAgreement.WrongStatus.selector, ISAAgreement.Status.Funding, ISAAgreement.Status.Active
            )
        );
        a.fund(1 * USD);
        vm.stopPrank();
    }

    function test_ActivateEarly_ByRecipientOnly() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 3_000 * USD);

        vm.prank(alice);
        vm.expectRevert(ISAAgreement.NotRecipient.selector);
        a.activate();

        vm.prank(recipient);
        a.activate();
        assertEq(uint8(a.status()), uint8(ISAAgreement.Status.Active));
        assertEq(a.totalRaised(), 3_000 * USD);
    }

    function test_RevertWhen_ActivatingWithNothingRaised() public {
        ISAAgreement a = _defaultAgreement();
        vm.prank(recipient);
        vm.expectRevert(ISAAgreement.NothingRaised.selector);
        a.activate();
    }

    function test_WithdrawCapital_OnceOnly() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        uint256 before = token.balanceOf(recipient);
        vm.prank(recipient);
        a.withdrawCapital();
        assertEq(token.balanceOf(recipient) - before, 5_000 * USD);

        vm.prank(recipient);
        vm.expectRevert(ISAAgreement.CapitalAlreadyWithdrawn.selector);
        a.withdrawCapital();
    }

    function test_CancelAndRefund() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 1_000 * USD);
        _fund(a, bob, 500 * USD);

        vm.prank(recipient);
        a.cancel();
        assertEq(uint8(a.status()), uint8(ISAAgreement.Status.Cancelled));

        uint256 aliceBefore = token.balanceOf(alice);
        vm.prank(alice);
        a.refund();
        assertEq(token.balanceOf(alice) - aliceBefore, 1_000 * USD);

        vm.prank(alice);
        vm.expectRevert(ISAAgreement.NotAnInvestor.selector);
        a.refund();
    }

    // -----------------------------------------------------------------
    // income + repayment
    // -----------------------------------------------------------------

    function test_CalculateContribution_AppliesShareThresholdAndCap() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        // 4,000 * 7% = 280
        assertEq(a.calculateContribution(4_000 * USD), 280 * USD);
        // 6,000 * 7% = 420
        assertEq(a.calculateContribution(6_000 * USD), 420 * USD);
        // below the 2,000 threshold -> nothing owed
        assertEq(a.calculateContribution(1_500 * USD), 0);
        assertEq(a.calculateContribution(0), 0);
    }

    function test_SubmitIncomeAndRepay_MovesAccounting() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        vm.prank(recipient);
        (uint256 periodId, uint256 obligation) = a.submitIncome(4_000 * USD, "");
        assertEq(periodId, 0);
        assertEq(obligation, 280 * USD);
        assertEq(a.pendingObligation(), 280 * USD);
        assertEq(a.lastAttestedIncome(), 4_000 * USD);

        vm.startPrank(recipient);
        token.approve(address(a), 280 * USD);
        a.makeRepayment();
        vm.stopPrank();

        assertEq(a.totalRepaid(), 280 * USD);
        assertEq(a.pendingObligation(), 0);
        assertEq(a.remainingObligation(), 12_000 * USD - 280 * USD);

        ISAAgreement.IncomePeriod[] memory periods = a.getIncomePeriods();
        assertEq(periods.length, 1);
        assertTrue(periods[0].settled);
        assertEq(periods[0].attestedIncome, 4_000 * USD);
    }

    function test_ZeroIncome_CreatesNoObligation() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        vm.prank(recipient);
        (, uint256 obligation) = a.submitIncome(0, "");
        assertEq(obligation, 0);
        assertEq(a.pendingObligation(), 0);
        assertEq(a.getIncomePeriods()[0].settled, true);
        assertEq(a.totalRepaid(), 0);

        // a zero-obligation period does not block the next submission
        vm.prank(recipient);
        (, uint256 next) = a.submitIncome(4_000 * USD, "");
        assertEq(next, 280 * USD);
    }

    function test_RevertWhen_SubmittingWithOutstandingObligation() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        vm.startPrank(recipient);
        a.submitIncome(4_000 * USD, "");
        vm.expectRevert(abi.encodeWithSelector(ISAAgreement.ObligationOutstanding.selector, 280 * USD));
        a.submitIncome(5_000 * USD, "");
        vm.stopPrank();
    }

    function test_RevertWhen_NonRecipientSubmitsIncome() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        vm.prank(alice);
        vm.expectRevert(ISAAgreement.NotRecipient.selector);
        a.submitIncome(4_000 * USD, "");
    }

    function test_RevertWhen_RepayingWithoutObligation() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        vm.prank(recipient);
        vm.expectRevert(ISAAgreement.NoObligation.selector);
        a.makeRepayment();
    }

    function test_RevertWhen_SubmittingIncomeAfterTermElapsed() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        uint256 end = a.endTime();
        vm.warp(end + 1);
        bytes memory expected = abi.encodeWithSelector(ISAAgreement.TermElapsed.selector, end);
        vm.prank(recipient);
        vm.expectRevert(expected);
        a.submitIncome(4_000 * USD, "");
    }

    function test_FinalizeIfExpired_CompletesAgreement() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        assertFalse(a.finalizeIfExpired());
        vm.warp(a.endTime() + 1);
        assertTrue(a.finalizeIfExpired());
        assertEq(uint8(a.status()), uint8(ISAAgreement.Status.Completed));
        assertFalse(a.finalizeIfExpired());
    }

    function test_CapEnforced_LastPaymentIsClipped() public {
        vm.prank(recipient);
        ISAAgreement a = ISAAgreement(
            factory.createAgreement(1_000 * USD, 1_200 * USD, 0, 1_000, 24, "Cap", "Cap test", "d", "c")
        );
        _fund(a, alice, 1_000 * USD);

        // 10% of 5,000 = 500 per period. Cap is 1,200, so: 500, 500, then 200.
        assertEq(_submitAndRepay(a, 5_000 * USD), 500 * USD);
        assertEq(_submitAndRepay(a, 5_000 * USD), 500 * USD);
        assertEq(a.remainingObligation(), 200 * USD);

        assertEq(_submitAndRepay(a, 5_000 * USD), 200 * USD);
        assertEq(a.totalRepaid(), 1_200 * USD);
        assertEq(a.remainingObligation(), 0);
        assertEq(uint8(a.status()), uint8(ISAAgreement.Status.Completed));
    }

    function test_RevertWhen_SubmittingIncomeOnCompletedAgreement() public {
        vm.prank(recipient);
        ISAAgreement a = ISAAgreement(
            factory.createAgreement(1_000 * USD, 1_000 * USD, 0, 1_000, 24, "Cap", "Cap test", "d", "c")
        );
        _fund(a, alice, 1_000 * USD);
        _submitAndRepay(a, 10_000 * USD); // 10% of 10,000 = 1,000 -> cap reached
        assertEq(uint8(a.status()), uint8(ISAAgreement.Status.Completed));

        vm.prank(recipient);
        vm.expectRevert(
            abi.encodeWithSelector(
                ISAAgreement.WrongStatus.selector, ISAAgreement.Status.Active, ISAAgreement.Status.Completed
            )
        );
        a.submitIncome(4_000 * USD, "");
    }

    // -----------------------------------------------------------------
    // distribution
    // -----------------------------------------------------------------

    function test_ProportionalDistributionAcrossThreeInvestors() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 2_500 * USD); // 50%
        _fund(a, bob, 1_500 * USD); // 30%
        _fund(a, carol, 1_000 * USD); // 20%

        assertEq(a.investorShareBps(alice), 5_000);
        assertEq(a.investorShareBps(bob), 3_000);
        assertEq(a.investorShareBps(carol), 2_000);

        _submitAndRepay(a, 4_000 * USD); // 280 repaid

        assertEq(a.claimable(alice), 140 * USD);
        assertEq(a.claimable(bob), 84 * USD);
        assertEq(a.claimable(carol), 56 * USD);

        uint256 aliceBefore = token.balanceOf(alice);
        vm.prank(alice);
        a.claim();
        assertEq(token.balanceOf(alice) - aliceBefore, 140 * USD);
        assertEq(a.claimable(alice), 0);
        assertEq(a.claimedOf(alice), 140 * USD);

        // a second settlement adds to every investor's entitlement
        _submitAndRepay(a, 6_000 * USD); // 420 repaid
        assertEq(a.claimable(alice), 210 * USD);
        assertEq(a.claimable(bob), 84 * USD + 126 * USD);
    }

    function test_RevertWhen_ClaimingNothing() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        vm.prank(bob);
        vm.expectRevert(ISAAgreement.NothingToClaim.selector);
        a.claim();

        vm.prank(alice);
        vm.expectRevert(ISAAgreement.NothingToClaim.selector);
        a.claim();
    }

    function test_ClaimsNeverExceedRepayments() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 2_500 * USD);
        _fund(a, bob, 2_500 * USD);
        _submitAndRepay(a, 4_000 * USD);

        vm.prank(alice);
        a.claim();
        vm.prank(bob);
        a.claim();

        assertEq(a.totalClaimed(), a.totalRepaid());
        assertEq(token.balanceOf(address(a)), 5_000 * USD); // only the un-withdrawn capital remains

        vm.prank(alice);
        vm.expectRevert(ISAAgreement.NothingToClaim.selector);
        a.claim();
    }

    function test_FullLifecycle_FundWithdrawSettleClaimComplete() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 2_000 * USD);
        _fund(a, bob, 3_000 * USD);

        vm.prank(recipient);
        a.withdrawCapital();
        assertTrue(a.capitalWithdrawn());

        // 42 settlements of 280 = 11,760; the 43rd is clipped to 240 to hit the 12,000 cap.
        for (uint256 i = 0; i < 43; i++) {
            if (a.status() != ISAAgreement.Status.Active) break;
            _submitAndRepay(a, 4_000 * USD);
        }
        assertEq(a.totalRepaid(), 12_000 * USD);
        assertEq(uint8(a.status()), uint8(ISAAgreement.Status.Completed));

        vm.prank(alice);
        a.claim();
        vm.prank(bob);
        a.claim();
        assertEq(a.claimedOf(alice), 4_800 * USD); // 40% of 12,000
        assertEq(a.claimedOf(bob), 7_200 * USD); // 60% of 12,000
    }

    // -----------------------------------------------------------------
    // factory views & admin
    // -----------------------------------------------------------------

    function test_FactorySnapshotsAndPositions() public {
        ISAAgreement a1 = _defaultAgreement();
        ISAAgreement a2 = _defaultAgreement();
        _fund(a1, alice, 1_000 * USD);
        _fund(a2, alice, 500 * USD);

        ISAAgreement.Snapshot[] memory snaps = factory.getAgreementSnapshots(0, 10);
        assertEq(snaps.length, 2);
        assertEq(snaps[0].agreement, address(a1));
        assertEq(snaps[0].totalRaised, 1_000 * USD);

        assertEq(factory.getAgreementSnapshots(5, 10).length, 0);
        assertEq(factory.getAgreementSnapshots(1, 10).length, 1);

        (address[] memory ag, uint256[] memory contrib,) = factory.getInvestorPositions(alice, 0, 10);
        assertEq(ag.length, 2);
        assertEq(contrib[0], 1_000 * USD);
        assertEq(contrib[1], 500 * USD);
    }

    function test_SetDefaultVerifier_OnlyOwner() public {
        DemoIncomeVerifier next = new DemoIncomeVerifier();

        vm.prank(alice);
        vm.expectRevert();
        factory.setDefaultVerifier(address(next));

        vm.prank(owner);
        factory.setDefaultVerifier(address(next));
        assertEq(factory.defaultVerifier(), address(next));

        // existing agreements keep their original verifier
        ISAAgreement a = _defaultAgreement();
        assertEq(address(a.verifier()), address(next));
    }

    // -----------------------------------------------------------------
    // token
    // -----------------------------------------------------------------

    function test_Faucet_RespectsCooldown() public {
        address fresh = address(0xFEED);
        vm.prank(fresh);
        token.faucet();
        assertEq(token.balanceOf(fresh), 10_000 * USD);
        assertEq(token.decimals(), 6);

        vm.prank(fresh);
        vm.expectRevert(
            abi.encodeWithSelector(TestUSD.FaucetCooldownActive.selector, block.timestamp + 1 hours)
        );
        token.faucet();

        vm.warp(block.timestamp + 1 hours + 1);
        vm.prank(fresh);
        token.faucet();
        assertEq(token.balanceOf(fresh), 20_000 * USD);
    }

    function test_Verifier_RejectsAbsurdIncome() public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);

        bytes memory expected = abi.encodeWithSelector(
            DemoIncomeVerifier.IncomeAboveDemoBound.selector, 2_000_000 * USD, verifier.MAX_MONTHLY_INCOME()
        );
        vm.prank(recipient);
        vm.expectRevert(expected);
        a.submitIncome(2_000_000 * USD, "");
    }

    // -----------------------------------------------------------------
    // fuzz
    // -----------------------------------------------------------------

    function testFuzz_ContributionNeverExceedsCap(uint96 income) public {
        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, 5_000 * USD);
        uint256 capped = bound(uint256(income), 0, verifier.MAX_MONTHLY_INCOME());

        uint256 owed = a.calculateContribution(capped);
        assertLe(owed, a.remainingObligation());
        if (capped >= 2_000 * USD) {
            assertLe(owed, (capped * 700) / 10_000);
        } else {
            assertEq(owed, 0);
        }
    }

    function testFuzz_SharesSumToTotalRaised(uint96 x, uint96 y) public {
        uint256 amountA = bound(uint256(x), 1 * USD, 2_500 * USD);
        uint256 amountB = bound(uint256(y), 1 * USD, 2_500 * USD);

        ISAAgreement a = _defaultAgreement();
        _fund(a, alice, amountA);
        _fund(a, bob, amountB);

        assertEq(a.totalRaised(), amountA + amountB);
        assertEq(a.contributionOf(alice) + a.contributionOf(bob), a.totalRaised());
        assertLe(a.investorShareBps(alice) + a.investorShareBps(bob), 10_000);
    }
}
