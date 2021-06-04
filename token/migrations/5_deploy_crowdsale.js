const BN = require('bignumber.js');

/*
* NOTE: Due to the crowdsale contract being compiled with a different version of solidity,
* to streamline testing and deployment, we take its compiled .json artifact from the
* `../crowdsale/build/contracts` directory and add it in our local build/contracts
* directory for deployment. The alternative is to simply deploy the crowdsale from
* it's own project directory with static values and to disable or remove this file.
*/
const ArtmCrowdsale = artifacts.require("ArtmCrowdsale");

const CrowdsaleWallet = artifacts.require("CrowdsaleWallet");
const ArtmToken = artifacts.require("ArtmToken");

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
}

const timeNow = Math.floor(Date.now()/1000);

const openingTime = timeNow + duration.days(1); // Open in 1 day
const closingTime = openingTime + duration.days(14); // Stay open for 14 days

// Set exchange rate to meet target launch price. THIS WILL LIKELY CHANGE AT LAUNCH, THIS VALUE IS FOR TESTING.
const exchangeRate = '10000000'; // 10 million ARTM per 1 ETH.

console.log('Opening: ' + openingTime);
console.log('Closing: ' + closingTime);
console.log('Exchange Rate: ' + exchangeRate);

module.exports = async function(deployer, network, accounts){
    const token = await ArtmToken.deployed();
    const crowdsaleWallet = await CrowdsaleWallet.deployed();
    const withdrawAddress = accounts[7];

    await deployer.deploy(
      ArtmCrowdsale, // the withdraw crowdsale contract
      exchangeRate, // exchange rate, X tokens for 1ETH.
      crowdsaleWallet.address, // the address that will receive the ETH.
      token.address, // Address of the token when deployed via scripts
      openingTime, //opening date/time from above
      closingTime, // closing date/time from above
      withdrawAddress // The address that tokens will be withdrawn to after the crowdsale is over.
    )

    crowdsale_amount = new BN(500000000000).times( new BN(10).pow(18)); // 500 billion tokens
    const crowdsale = await ArtmCrowdsale.deployed();

    console.log('Crowdsale Address: ' + crowdsale.address);

    // Transfer in the 500 billion tokens.
    token.transfer(crowdsale.address, crowdsale_amount, {from: accounts[0]});

    // End.
}
