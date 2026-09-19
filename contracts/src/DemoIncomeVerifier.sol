// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IIncomeVerifier} from "./IIncomeVerifier.sol";

/// @title DemoIncomeVerifier
/// @notice Testnet income attestation module for HumanYield.
/// @dev This verifier does NOT check real-world earnings. It records the recipient's own
///      reported figure on-chain so the demo has an auditable trail, and enforces a sanity
///      bound so the demo cannot be handed absurd values. Swapping this contract for a payroll
///      or oracle-backed implementation requires no change to ISAAgreement.
contract DemoIncomeVerifier is IIncomeVerifier {
    /// @notice Upper bound on a single attested monthly income (1,000,000 units).
    uint256 public constant MAX_MONTHLY_INCOME = 1_000_000 * 10 ** 6;

    event IncomeAttested(
        address indexed agreement, address indexed recipient, uint256 reportedIncome, uint256 attestedIncome
    );

    error IncomeAboveDemoBound(uint256 reportedIncome, uint256 maxIncome);

    function sourceLabel() external pure returns (string memory) {
        return "Demo income attestation (Monad Testnet) - self-reported, not verified";
    }

    /// @inheritdoc IIncomeVerifier
    function attestIncome(address agreement, address recipient, uint256 reportedIncome, bytes calldata)
        external
        returns (uint256 attestedIncome)
    {
        if (reportedIncome > MAX_MONTHLY_INCOME) {
            revert IncomeAboveDemoBound(reportedIncome, MAX_MONTHLY_INCOME);
        }
        attestedIncome = reportedIncome;
        emit IncomeAttested(agreement, recipient, reportedIncome, attestedIncome);
    }
}
