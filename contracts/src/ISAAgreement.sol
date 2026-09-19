// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IIncomeVerifier} from "./IIncomeVerifier.sol";

/// @title ISAAgreement
/// @notice A single Income Share Agreement: a person raises capital from many funders and
///         settles a fixed percentage of their reported income back to those funders, pro rata,
///         until a repayment cap or a term deadline is reached.
/// @dev Economic rules (share percentage, term, cap, pro-rata split, overfunding) are enforced
///      here, not in the frontend. Distribution is pull-based to avoid unbounded loops.
contract ISAAgreement is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum Status {
        Funding, // open for investment
        Active, // funded; income is being reported and settled
        Completed, // repayment cap reached or term elapsed
        Cancelled // cancelled during funding; investors may refund

    }

    struct IncomePeriod {
        uint256 attestedIncome; // monthly income attested by the verifier
        uint256 obligation; // income * shareBps / 10_000, clipped by remaining cap
        uint256 reportedAt; // block timestamp of submission
        uint256 settledAt; // block timestamp of settlement, 0 while unsettled
        bool settled;
    }

    struct Profile {
        string displayName;
        string headline;
        string description;
        string category;
    }

    struct Terms {
        uint256 fundingGoal;
        uint256 repaymentCap;
        uint256 minIncomeThreshold;
        uint16 incomeShareBps;
        uint16 termMonths;
    }

    struct Snapshot {
        address agreement;
        address recipient;
        address token;
        address verifier;
        Profile profile;
        Terms terms;
        Status status;
        uint256 totalRaised;
        uint256 totalRepaid;
        uint256 totalClaimed;
        uint256 pendingObligation;
        uint256 startTime;
        uint256 endTime;
        uint256 investorCount;
        uint256 incomePeriodCount;
        bool capitalWithdrawn;
        uint256 lastAttestedIncome;
        uint256 createdAt;
    }

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint16 public constant MAX_INCOME_SHARE_BPS = 5_000; // 50%
    uint16 public constant MAX_TERM_MONTHS = 120; // 10 years
    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant MAX_STRING_BYTES = 600;

    // ---------------------------------------------------------------------
    // Immutable / storage
    // ---------------------------------------------------------------------

    address public immutable factory;
    IERC20 public immutable token;
    IIncomeVerifier public immutable verifier;
    address public immutable recipient;
    uint256 public immutable createdAt;

    Terms public terms;
    Profile public profile;

    Status public status;
    uint256 public totalRaised;
    uint256 public totalRepaid;
    uint256 public totalClaimed;
    uint256 public pendingObligation;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public lastAttestedIncome;
    bool public capitalWithdrawn;

    address[] private _investors;
    mapping(address => uint256) public contributionOf;
    mapping(address => uint256) public claimedOf;
    IncomePeriod[] private _incomePeriods;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event AgreementFunded(address indexed investor, uint256 amount, uint256 totalRaised, uint256 shareBps);
    event AgreementActivated(uint256 startTime, uint256 endTime, uint256 totalRaised);
    event CapitalWithdrawn(address indexed recipient, uint256 amount);
    event IncomeSubmitted(uint256 indexed periodId, uint256 attestedIncome, uint256 obligation);
    event RepaymentMade(uint256 indexed periodId, uint256 amount, uint256 totalRepaid);
    event InvestorClaimed(address indexed investor, uint256 amount, uint256 totalClaimed);
    event AgreementCompleted(uint256 totalRepaid, string reason);
    event AgreementCancelled(uint256 totalRaised);
    event InvestorRefunded(address indexed investor, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error ZeroAmount();
    error InvalidIncomeShare(uint16 bps);
    error InvalidTerm(uint16 months);
    error InvalidCap(uint256 cap, uint256 fundingGoal);
    error StringTooLong();
    error WrongStatus(Status expected, Status actual);
    error NotRecipient();
    error ExceedsFundingGoal(uint256 remaining);
    error NothingRaised();
    error CapitalAlreadyWithdrawn();
    error ObligationOutstanding(uint256 amount);
    error NoObligation();
    error TermElapsed(uint256 endTime);
    error NothingToClaim();
    error NotAnInvestor();

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyRecipient() {
        if (msg.sender != recipient) revert NotRecipient();
        _;
    }

    modifier inStatus(Status expected) {
        if (status != expected) revert WrongStatus(expected, status);
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(
        address factory_,
        address token_,
        address verifier_,
        address recipient_,
        uint256 fundingGoal_,
        uint256 repaymentCap_,
        uint256 minIncomeThreshold_,
        uint16 incomeShareBps_,
        uint16 termMonths_,
        string memory displayName_,
        string memory headline_,
        string memory description_,
        string memory category_
    ) {
        if (factory_ == address(0) || token_ == address(0) || verifier_ == address(0) || recipient_ == address(0))
        {
            revert ZeroAddress();
        }
        if (fundingGoal_ == 0) revert ZeroAmount();
        if (incomeShareBps_ == 0 || incomeShareBps_ > MAX_INCOME_SHARE_BPS) {
            revert InvalidIncomeShare(incomeShareBps_);
        }
        if (termMonths_ == 0 || termMonths_ > MAX_TERM_MONTHS) revert InvalidTerm(termMonths_);
        if (repaymentCap_ < fundingGoal_) revert InvalidCap(repaymentCap_, fundingGoal_);
        _requireShortString(displayName_);
        _requireShortString(headline_);
        _requireShortString(description_);
        _requireShortString(category_);

        factory = factory_;
        token = IERC20(token_);
        verifier = IIncomeVerifier(verifier_);
        recipient = recipient_;
        createdAt = block.timestamp;

        terms = Terms({
            fundingGoal: fundingGoal_,
            repaymentCap: repaymentCap_,
            minIncomeThreshold: minIncomeThreshold_,
            incomeShareBps: incomeShareBps_,
            termMonths: termMonths_
        });
        profile = Profile({
            displayName: displayName_,
            headline: headline_,
            description: description_,
            category: category_
        });
        status = Status.Funding;
    }

    // ---------------------------------------------------------------------
    // Funding
    // ---------------------------------------------------------------------

    /// @notice Invest `amount` of the settlement token into this agreement.
    /// @dev Overfunding is rejected rather than refunded. Reaching the goal activates the
    ///      agreement in the same transaction.
    function fund(uint256 amount) external nonReentrant inStatus(Status.Funding) {
        if (amount == 0) revert ZeroAmount();
        uint256 remaining = terms.fundingGoal - totalRaised;
        if (amount > remaining) revert ExceedsFundingGoal(remaining);

        if (contributionOf[msg.sender] == 0) _investors.push(msg.sender);
        contributionOf[msg.sender] += amount;
        totalRaised += amount;

        token.safeTransferFrom(msg.sender, address(this), amount);

        emit AgreementFunded(msg.sender, amount, totalRaised, investorShareBps(msg.sender));

        if (totalRaised == terms.fundingGoal) _activate();
    }

    /// @notice Close funding early and start the term with whatever has been raised.
    function activate() external onlyRecipient inStatus(Status.Funding) {
        if (totalRaised == 0) revert NothingRaised();
        _activate();
    }

    /// @notice Cancel an agreement that has not been activated. Investors may then refund.
    function cancel() external onlyRecipient inStatus(Status.Funding) {
        status = Status.Cancelled;
        emit AgreementCancelled(totalRaised);
    }

    /// @notice Reclaim a contribution from a cancelled agreement.
    function refund() external nonReentrant inStatus(Status.Cancelled) {
        uint256 amount = contributionOf[msg.sender];
        if (amount == 0) revert NotAnInvestor();
        contributionOf[msg.sender] = 0;
        totalRaised -= amount;
        token.safeTransfer(msg.sender, amount);
        emit InvestorRefunded(msg.sender, amount);
    }

    /// @notice Transfer the raised capital to the recipient once the agreement is active.
    function withdrawCapital() external nonReentrant onlyRecipient {
        if (status != Status.Active && status != Status.Completed) {
            revert WrongStatus(Status.Active, status);
        }
        if (capitalWithdrawn) revert CapitalAlreadyWithdrawn();
        capitalWithdrawn = true;
        uint256 amount = totalRaised;
        token.safeTransfer(recipient, amount);
        emit CapitalWithdrawn(recipient, amount);
    }

    function _activate() private {
        status = Status.Active;
        startTime = block.timestamp;
        endTime = block.timestamp + (uint256(terms.termMonths) * SECONDS_PER_MONTH);
        emit AgreementActivated(startTime, endTime, totalRaised);
    }

    // ---------------------------------------------------------------------
    // Income & settlement
    // ---------------------------------------------------------------------

    /// @notice Preview the settlement obligation for a given monthly income.
    /// @dev Applies the minimum income threshold, the share percentage, and the remaining cap.
    function calculateContribution(uint256 monthlyIncome) public view returns (uint256) {
        if (monthlyIncome < terms.minIncomeThreshold) return 0;
        uint256 owed = (monthlyIncome * terms.incomeShareBps) / BPS_DENOMINATOR;
        uint256 remainingCap = remainingObligation();
        return owed > remainingCap ? remainingCap : owed;
    }

    /// @notice Amount still owed before the repayment cap is reached.
    function remainingObligation() public view returns (uint256) {
        return totalRepaid >= terms.repaymentCap ? 0 : terms.repaymentCap - totalRepaid;
    }

    /// @notice Submit a monthly income figure for attestation and open a settlement obligation.
    /// @param reportedIncome Monthly income in settlement-token units.
    /// @param proof Opaque verifier payload; unused by the demo verifier.
    /// @return periodId Index of the newly created income period.
    /// @return obligation Amount the recipient must settle for this period.
    function submitIncome(uint256 reportedIncome, bytes calldata proof)
        external
        onlyRecipient
        inStatus(Status.Active)
        returns (uint256 periodId, uint256 obligation)
    {
        if (pendingObligation != 0) revert ObligationOutstanding(pendingObligation);
        if (block.timestamp > endTime) revert TermElapsed(endTime);

        uint256 attested = verifier.attestIncome(address(this), recipient, reportedIncome, proof);
        obligation = calculateContribution(attested);

        lastAttestedIncome = attested;
        periodId = _incomePeriods.length;
        _incomePeriods.push(
            IncomePeriod({
                attestedIncome: attested,
                obligation: obligation,
                reportedAt: block.timestamp,
                settledAt: obligation == 0 ? block.timestamp : 0,
                settled: obligation == 0
            })
        );
        pendingObligation = obligation;

        emit IncomeSubmitted(periodId, attested, obligation);

        // A zero-obligation period (income below threshold, or cap already reached) needs no
        // settlement, so close it out immediately.
        if (obligation == 0 && remainingObligation() == 0) {
            _complete("repayment cap reached");
        }
    }

    /// @notice Settle the outstanding obligation. Funds become claimable by investors pro rata.
    function makeRepayment() external nonReentrant onlyRecipient returns (uint256 amount) {
        if (status != Status.Active && status != Status.Completed) {
            revert WrongStatus(Status.Active, status);
        }
        amount = pendingObligation;
        if (amount == 0) revert NoObligation();

        pendingObligation = 0;
        totalRepaid += amount;

        uint256 periodId = _incomePeriods.length - 1;
        _incomePeriods[periodId].settled = true;
        _incomePeriods[periodId].settledAt = block.timestamp;

        token.safeTransferFrom(recipient, address(this), amount);

        emit RepaymentMade(periodId, amount, totalRepaid);

        if (remainingObligation() == 0 && status == Status.Active) {
            _complete("repayment cap reached");
        }
    }

    /// @notice Mark an active agreement complete once its term has elapsed.
    /// @dev Permissionless: anybody may finalise an expired agreement.
    function finalizeIfExpired() external returns (bool) {
        if (status == Status.Active && block.timestamp > endTime) {
            _complete("term elapsed");
            return true;
        }
        return false;
    }

    function _complete(string memory reason) private {
        status = Status.Completed;
        emit AgreementCompleted(totalRepaid, reason);
    }

    // ---------------------------------------------------------------------
    // Investor distribution (pull-based)
    // ---------------------------------------------------------------------

    /// @notice Investor ownership of future distributions, in basis points.
    function investorShareBps(address investor) public view returns (uint256) {
        if (totalRaised == 0) return 0;
        return (contributionOf[investor] * BPS_DENOMINATOR) / totalRaised;
    }

    /// @notice Amount an investor can withdraw right now.
    function claimable(address investor) public view returns (uint256) {
        if (totalRaised == 0) return 0;
        uint256 entitled = (totalRepaid * contributionOf[investor]) / totalRaised;
        uint256 claimed = claimedOf[investor];
        return entitled > claimed ? entitled - claimed : 0;
    }

    /// @notice Withdraw settled distributions.
    function claim() external nonReentrant returns (uint256 amount) {
        amount = claimable(msg.sender);
        if (amount == 0) revert NothingToClaim();
        claimedOf[msg.sender] += amount;
        totalClaimed += amount;
        token.safeTransfer(msg.sender, amount);
        emit InvestorClaimed(msg.sender, amount, totalClaimed);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getAgreementDetails() external view returns (Snapshot memory) {
        return Snapshot({
            agreement: address(this),
            recipient: recipient,
            token: address(token),
            verifier: address(verifier),
            profile: profile,
            terms: terms,
            status: status,
            totalRaised: totalRaised,
            totalRepaid: totalRepaid,
            totalClaimed: totalClaimed,
            pendingObligation: pendingObligation,
            startTime: startTime,
            endTime: endTime,
            investorCount: _investors.length,
            incomePeriodCount: _incomePeriods.length,
            capitalWithdrawn: capitalWithdrawn,
            lastAttestedIncome: lastAttestedIncome,
            createdAt: createdAt
        });
    }

    function getInvestorDetails(address investor)
        external
        view
        returns (uint256 contribution, uint256 shareBps, uint256 claimed, uint256 pendingClaim)
    {
        return (contributionOf[investor], investorShareBps(investor), claimedOf[investor], claimable(investor));
    }

    function getInvestors() external view returns (address[] memory) {
        return _investors;
    }

    function investorCount() external view returns (uint256) {
        return _investors.length;
    }

    function getIncomePeriods() external view returns (IncomePeriod[] memory) {
        return _incomePeriods;
    }

    function incomePeriodCount() external view returns (uint256) {
        return _incomePeriods.length;
    }

    function fundingProgressBps() external view returns (uint256) {
        return (totalRaised * BPS_DENOMINATOR) / terms.fundingGoal;
    }

    function _requireShortString(string memory value) private pure {
        if (bytes(value).length > MAX_STRING_BYTES) revert StringTooLong();
    }
}
