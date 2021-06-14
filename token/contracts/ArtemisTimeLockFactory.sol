// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;


import "./ArtemisTimeLock.sol";

/**
 * @title Artemis Token Time Lock Factory
 */
contract ArtemisTimeLockFactory {
    // mapping of timelock contract addresses
    mapping(uint256 => address) public timeLocks;

    /**
    * @dev Creates an instance of the Artemis Time Lock contract.
    * @param _timeLockId is the numeric ID value that is used to
    * retrieve the address of the corresponding timelock.
    * @param token_ is the address of the ERC20 token being stored.
    * @param beneficiary_ is the address where tokens will be distributed to.
    * @param releaseTime_ is the initial date/time when the release
    * @param _startTime is the date/time the vesting schedule starts at.
    * function will be available to call.
    * @param _trancheWeeks is the number of weeks in each tranche cycle.
    * @param _maxTranches is the total number of tranches that represent
    * the full vesting time for the contract.
    * @param _tranchePercent is the percentage of tokens that will be released
    * during each tranche period.
    */
    function createTimeLock(
        uint256 _timeLockId,
        IERC20 token_,
        address beneficiary_,
        uint256 releaseTime_,
        uint256 _startTime,
        uint256 _trancheWeeks,
        uint256 _maxTranches,
        uint256 _tranchePercent
    ) external {
        // Ensure the timeLock ID is not already in use.
        require(timeLocks[_timeLockId] == address(0), "ArtemisTimeLockFactory: timeLock ID already in use.");

        // creates a new timelock contract with provided params.
        ArtemisTimeLock timeLock = new ArtemisTimeLock(
            token_,
            beneficiary_,
            releaseTime_,
            _startTime,
            _trancheWeeks,
            _maxTranches,
            _tranchePercent
        );

        // adds new contract to timeLocks mapping
        timeLocks[_timeLockId] = address(timeLock);
    }
}
