// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;


import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";

/**
 * @title Artemis Token Time lock contract.
 */
contract ArtemisTimeLock is TokenTimelock {
    using SafeERC20 for IERC20;

    // The unique ID stored in the address mapping of the factory contract.
    uint immutable public timeLockId;

    // The number of tranches required for the contract to fully vest.
    uint256 immutable internal maxTranches;

    // The number of weeks comprising each tranche cycle.
    uint256 immutable internal trancheWeeks;

    // The percent of tokens to release for each tranche.
    uint256 immutable internal tranchePercent;

    // The Starting date/time for the vesting schedule.
    uint256 immutable internal startTime;

    // Track how many tranches have been released
    uint256 internal tranchesReleased = 0;

    /**
     * @dev The initial token balance observed during the first release function
     * call.  We use this this value to calculate the number of tokens to release
     * in each tranche.  If more tokens are added after this value is set, they will
     * be releasable after the contract is fully vested.
     */
    uint256 internal initialContractBalance = 0;

    /**
     * @dev Constructs the Artemis Time Lock contract.
     * @param _timeLockId is the numeric ID value that is used to
     * retrieve the address of the corresponding timelock.
     * @param token_ is the address of the ERC20 token being stored.
     * @param beneficiary_ is the address where tokens will be distributed to.
     * @param releaseTime_ is the initial date/time when the release
     * function will be available to call.
     * @param _startTime is the date/time the vesting schedule starts at.
     * @param _trancheWeeks is the number of weeks in each tranche cycle.
     * @param _maxTranches is the total number of tranches that represent
     * the full vesting time for the contract.
     * @param _tranchePercent is the percentage of tokens that will be released
     * during each tranche period.
     */
    constructor(
        uint256 _timeLockId,
        IERC20 token_,
        address beneficiary_,
        uint256 releaseTime_,
        uint256 _startTime,
        uint256 _trancheWeeks,
        uint256 _maxTranches,
        uint256 _tranchePercent
    )
    TokenTimelock(
        token_,
        beneficiary_,
        releaseTime_
    )
    {
        // Ensure the beneficiary has a valid address.
        require(beneficiary_ != address(0), "ArtemisTimeLockFactory: beneficiary has zero address");

        // Ensure that the tranches & percentages distributed add up to 100%.
        require(_maxTranches * _tranchePercent == 10000, "TokenTimeLock: percents and tranches do not = 100%");

        timeLockId = _timeLockId;
        trancheWeeks = _trancheWeeks;
        maxTranches = _maxTranches;
        tranchePercent = _tranchePercent;
        startTime = _startTime;
    }

    /**
     * @dev This is the core functionality of this smart contract.  This function
     * reverts if the release time has not been reached yet.  If it has been
     * reached, it then checks to ensure that the contract is still in possession
     * of the beneficiaries tokens.  If no tokens are available, it reverts.  If
     * tokens are available, it then it checks to see if the initialContractBalance
     * has been set.  If not set, it will set this value so that it can calculate
     * the dispersal rate.
     *
     * Next, it uses the current block.timstamp to determine which tranche the
     * contract is currently in.  The first evaluation looks to see if the
     * contract is fully vested.  If the current tranche is greater than the
     * max number of tranches, the contract is fully vested - release all tokens.
     *
     * Next, the contract evaluates that the number of tranches released is
     * less than the maxTranches value, as well as that the currentTranche is
     * greater than the tranchesReleased value.  If both statements evaluate to
     * true, this indicates that tokens are available for release.  At this point
     * the contract calculates the number of tokens to disperse and transfers them
     * to the beneficiary.
     *
     * If none of the above conditions apply, this indicates that an early release
     * call was made.  In this case, the contract reverts and provides an error.
     */
    function release() public override {
        // Requires that the releaseTime has arrived or the whole block fails.
        require(block.timestamp >= releaseTime(), "TokenTimelock: current time is before release time");

        // Sets the amount of tokens currently held by this contract for beneficiary.
        uint256 _remaining_balance = token().balanceOf(address(this));

        // revert with error if remaining balance is not greater than 0.
        require(_remaining_balance > 0, "TokenTimelock: no tokens to release");

        // The first time this function runs, it needs to determine the total balance of tokens.
        // This allows a simple method for performing calculations on the initial balance.
        if (initialContractBalance == 0) {
            initialContractBalance = token().balanceOf(address(this));
        }

        // Determine which tranche cycle we are currently in.
        uint256 currentTranche = uint256(block.timestamp - startTime) / (trancheWeeks * 1 weeks);

        // Disperse everything if the full vesting period is up.
        if (currentTranche >= maxTranches) {

            // increment the number of tranches released, even after fully vested.
            tranchesReleased++;
            
            // transfer ALL remaining tokens from the contract to the beneficiary.
            token().safeTransfer(beneficiary(), token().balanceOf(address(this)));

        // Transfer tokens if a tranche release is available.
        } else if (tranchesReleased < maxTranches && currentTranche > tranchesReleased) {

            // increment the number of tranches released
            // also prevents secondary release call from succeeding
            tranchesReleased++;

            // calculate the number of tokens needing to be dispersed
            uint256 disperseAmount = _calculateDisperse(initialContractBalance, tranchePercent);

            // transfer the disperseAmount to the beneficiary.
            token().safeTransfer(beneficiary(), disperseAmount);
        } else {

            // If none of the above conditions apply, early release was requested.  Revert w/error.
            revert("TokenTimelock: tranche unavailable, requested too early.");
        }
    }

    /**
     * @param amount The amount of tokens that we want to calculate a percentage for.
     * @param percent The percentage we are calculating with.
     * @return the total amount of tokens needing to be dispersed.
     */
    function _calculateDisperse(uint256 amount, uint256 percent) internal virtual returns (uint256) {
        return amount * percent / 10000;
    }
}
