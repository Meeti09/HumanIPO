// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISAAgreement} from "./ISAAgreement.sol";

/// @title ISAFactory
/// @notice Registry and deployer for HumanYield Income Share Agreements.
/// @dev Each agreement is its own contract so it has a distinct address on the explorer and a
///      self-contained balance. The factory keeps the indexes the frontend needs and exposes a
///      batched snapshot reader so the explore page loads in a single eth_call.
contract ISAFactory is Ownable {
    /// @notice Settlement token every agreement created by this factory uses.
    address public immutable settlementToken;

    /// @notice Income attestation module assigned to newly created agreements.
    address public defaultVerifier;

    address[] private _agreements;
    mapping(address => address[]) private _agreementsByRecipient;
    mapping(address => bool) public isAgreement;

    event AgreementCreated(
        address indexed agreement,
        address indexed recipient,
        uint256 indexed agreementId,
        string displayName,
        uint256 fundingGoal,
        uint16 incomeShareBps,
        uint16 termMonths,
        uint256 repaymentCap
    );
    event DefaultVerifierUpdated(address indexed previousVerifier, address indexed newVerifier);

    error ZeroAddress();

    constructor(address settlementToken_, address defaultVerifier_, address owner_) Ownable(owner_) {
        if (settlementToken_ == address(0) || defaultVerifier_ == address(0)) revert ZeroAddress();
        settlementToken = settlementToken_;
        defaultVerifier = defaultVerifier_;
    }

    /// @notice Deploy a new Income Share Agreement owned by `msg.sender`.
    /// @param fundingGoal Capital to raise, in settlement-token units.
    /// @param repaymentCap Hard ceiling on total repayment; must be >= fundingGoal.
    /// @param minIncomeThreshold Monthly income below which nothing is owed.
    /// @param incomeShareBps Share of income owed, in basis points (700 = 7%).
    /// @param termMonths Agreement duration in months from activation.
    function createAgreement(
        uint256 fundingGoal,
        uint256 repaymentCap,
        uint256 minIncomeThreshold,
        uint16 incomeShareBps,
        uint16 termMonths,
        string calldata displayName,
        string calldata headline,
        string calldata description,
        string calldata category
    ) external returns (address agreement) {
        uint256 agreementId = _agreements.length;

        agreement = address(
            new ISAAgreement(
                address(this),
                settlementToken,
                defaultVerifier,
                msg.sender,
                fundingGoal,
                repaymentCap,
                minIncomeThreshold,
                incomeShareBps,
                termMonths,
                displayName,
                headline,
                description,
                category
            )
        );

        _agreements.push(agreement);
        _agreementsByRecipient[msg.sender].push(agreement);
        isAgreement[agreement] = true;

        emit AgreementCreated(
            agreement,
            msg.sender,
            agreementId,
            displayName,
            fundingGoal,
            incomeShareBps,
            termMonths,
            repaymentCap
        );
    }

    /// @notice Replace the verifier assigned to future agreements.
    /// @dev Existing agreements keep the verifier they were created with; it is immutable there.
    function setDefaultVerifier(address newVerifier) external onlyOwner {
        if (newVerifier == address(0)) revert ZeroAddress();
        address previous = defaultVerifier;
        defaultVerifier = newVerifier;
        emit DefaultVerifierUpdated(previous, newVerifier);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getAgreementCount() external view returns (uint256) {
        return _agreements.length;
    }

    function getAgreement(uint256 index) external view returns (address) {
        return _agreements[index];
    }

    function getAgreements() external view returns (address[] memory) {
        return _agreements;
    }

    function getAgreementsByRecipient(address recipient) external view returns (address[] memory) {
        return _agreementsByRecipient[recipient];
    }

    /// @notice Batched snapshot read used by the explore and dashboard pages.
    /// @param offset Index to start from.
    /// @param limit Maximum number of agreements to return.
    function getAgreementSnapshots(uint256 offset, uint256 limit)
        external
        view
        returns (ISAAgreement.Snapshot[] memory snapshots)
    {
        uint256 total = _agreements.length;
        if (offset >= total) return new ISAAgreement.Snapshot[](0);
        uint256 end = offset + limit;
        if (end > total) end = total;
        snapshots = new ISAAgreement.Snapshot[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            snapshots[i - offset] = ISAAgreement(_agreements[i]).getAgreementDetails();
        }
    }

    /// @notice Batched investor position read for the portfolio dashboard.
    function getInvestorPositions(address investor, uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory agreements, uint256[] memory contributions, uint256[] memory claimables)
    {
        uint256 total = _agreements.length;
        if (offset >= total) {
            return (new address[](0), new uint256[](0), new uint256[](0));
        }
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 size = end - offset;

        agreements = new address[](size);
        contributions = new uint256[](size);
        claimables = new uint256[](size);
        for (uint256 i = offset; i < end; i++) {
            ISAAgreement a = ISAAgreement(_agreements[i]);
            agreements[i - offset] = _agreements[i];
            contributions[i - offset] = a.contributionOf(investor);
            claimables[i - offset] = a.claimable(investor);
        }
    }
}
