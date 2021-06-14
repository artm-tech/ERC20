const BN = require('bignumber.js');
const ArtmToken = artifacts.require("ArtmToken");
const ArtemisTimeLock = artifacts.require("ArtemisTimeLock");
const ArtemisTimeLockFactory = artifacts.require("ArtemisTimeLockFactory");

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
}

const timeNow = Math.floor(Date.now()/1000);
const vestingStart = timeNow + duration.days(1); // This can be set to a date/time such as the end of a crowdsale.
const teamUnlockTime = timeNow + duration.weeks(24); // Initial unlock @24 weeks (6mos) per whitepaper
const communityUnlockTime = timeNow + duration.weeks(12); // Initial unlock @12 weeks (3mos) per whitepaper

team_amount = new BN(250000000000).times( new BN(10).pow(18)); // 25% of totalSupply
community_amount = new BN(175000000000).times( new BN(10).pow(18)); // 17.5% of totalSupply

module.exports = async function(deployer, network, accounts){
    // get the deployed instance of the Artemis Token
    const token = await ArtmToken.deployed();

    console.log("Token Address: " + token.address);
    console.log("Team Unlock Time: " + teamUnlockTime);
    console.log("Community Unlock Time: " + communityUnlockTime);

    // Deploy the "Token TimeLock Factory"
    await deployer.deploy(ArtemisTimeLockFactory); // deploy the factory contract

    //get deployed instance of the factory
    const timeLockFactory = await ArtemisTimeLockFactory.deployed();
    console.log("Factory Address: " + timeLockFactory.address);

    /*
    * Please take care that the numbers and math add up when you create these contracts.
    * You have the ability to create contracts that don't make sense mathematically.
    * Also note that you can unlock the contract well into the tranche schedule.  This is being done
    * on the team contracts where each tranche is 3 months long, but the initial unlock happens after 6.
    * In this case, the first 2 tranches are immediately available to the caller of release() after 6 mos.

    The token timelock constructor for reference
    constructor(
        IERC20 token_,
        address beneficiary_,
        uint256 releaseTime_,
        uint256 _startTime
        uint256 _trancheWeeks,
        uint256 _maxTranches,
        uint256 _tranchePercent,
    )
    */

    /*
     * Deploy timelock contract for community tokens using factory.
     * Note that the live deployment will likely break the team tokens up
     * into smaller increments by deploying additional timelocks.
     * Team tokens will not be greater than 25% based on the whitepaper.
     *
     * Also note that when using the factory, a unique uint256 _timeLockId must
     * be passed in as the first value.
     */
    await timeLockFactory.createTimeLock(0, token.address, accounts[4], communityUnlockTime, vestingStart, 12, 2, 5000); // 3 month tranche, 2 tranches, 50% dispersed per tranche.
    community_timelock_address = await timeLockFactory.timeLocks(0); //awaits timelock created with index 1.
    token.transfer(community_timelock_address, community_amount, {from: accounts[0]});

    // Deploy single instance of timelock contract with team tokens for testing purposes.
    await deployer.deploy(ArtemisTimeLock, token.address, accounts[3], teamUnlockTime, vestingStart, 12, 8, 1250); //  3 month tranche, 8 tranches, 12.5% disperse per tranche.
    const team_timeLock = await ArtemisTimeLock.deployed();
    token.transfer(team_timeLock.address, team_amount, {from: accounts[0]});

    // Log some useful console data
    console.log('Team Timelock Address: ' + team_timeLock.address);
    console.log('Community Timelock Address: ' + community_timelock_address);
}
