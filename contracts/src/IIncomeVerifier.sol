// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title IIncomeVerifier
/// @notice Pluggable income attestation source for HumanYield agreements.
/// @dev An agreement asks the verifier to attest a reported monthly income figure before it
///      becomes a settlement obligation. The MVP ships `DemoIncomeVerifier`, which performs a
///      self-attestation on testnet. Production implementations would wrap a payroll provider,
///      an open-banking connection, or an oracle attestation, without touching agreement logic.
interface IIncomeVerifier {
    /// @notice Human-readable label shown in the UI next to every income figure.
    function sourceLabel() external view returns (string memory);

    /// @notice Attest a reported monthly income for `recipient` under `agreement`.
    /// @param agreement The ISAAgreement requesting the attestation.
    /// @param recipient The income earner named in the agreement.
    /// @param reportedIncome Monthly income, in the agreement's settlement token units.
    /// @param proof Opaque provider payload. Unused by the demo verifier.
    /// @return attestedIncome The income figure the agreement must settle against.
    function attestIncome(
        address agreement,
        address recipient,
        uint256 reportedIncome,
        bytes calldata proof
    ) external returns (uint256 attestedIncome);
}
