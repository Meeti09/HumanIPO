// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title TestUSD
/// @notice Demo settlement asset for HumanYield on Monad Testnet. It has no real-world
///         value and is not redeemable for anything. 6 decimals, mirroring USDC.
/// @dev Anyone can pull a fixed amount from the faucet once per cooldown window.
contract TestUSD is ERC20 {
    uint8 private constant DECIMALS = 6;

    /// @notice Amount handed out per faucet call (10,000 tUSD).
    uint256 public constant FAUCET_AMOUNT = 10_000 * 10 ** DECIMALS;

    /// @notice Minimum time between faucet calls for one address.
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetClaim;

    event FaucetClaimed(address indexed account, uint256 amount);

    error FaucetCooldownActive(uint256 availableAt);

    constructor() ERC20("HumanYield Test USD", "tUSD") {}

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Mint demo tUSD to the caller. Testnet only.
    function faucet() external {
        uint256 last = lastFaucetClaim[msg.sender];
        if (last != 0 && block.timestamp < last + FAUCET_COOLDOWN) {
            revert FaucetCooldownActive(last + FAUCET_COOLDOWN);
        }
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Seconds remaining before `account` may call the faucet again.
    function faucetCooldownRemaining(address account) external view returns (uint256) {
        uint256 last = lastFaucetClaim[account];
        if (last == 0) return 0;
        uint256 ready = last + FAUCET_COOLDOWN;
        return block.timestamp >= ready ? 0 : ready - block.timestamp;
    }
}
