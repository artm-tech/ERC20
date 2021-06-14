const BN = require('bignumber.js');
const ArtmToken = artifacts.require("ArtmToken");
const ArtemisTimeLockFactory = artifacts.require('ArtemisTimeLockFactory');

const null_address = '0x0000000000000000000000000000000000000000';

const duration = {
    seconds: function (val) { return val; },
    minutes: function (val) { return val * this.seconds(60); },
    hours: function (val) { return val * this.minutes(60); },
    days: function (val) { return val * this.hours(24); },
    weeks: function (val) { return val * this.days(7); },
    years: function (val) { return val * this.days(365); },
}

async function timeJump(timeToInc) {
  return new Promise((resolve, reject) => {
      web3
          .currentProvider
          .send({
              jsonrpc: '2.0',
              method: 'evm_increaseTime',
              params: [(timeToInc)] // timeToInc is the time in seconds to increase
          }, function (err, result) {
              if (err) {
                  reject(err);
              }
              resolve(result);
          });
  })
}

contract('ArtemisTimeLockFactory', accounts => {
    beforeEach(async function(){
        this.contractFactory = await ArtemisTimeLockFactory.deployed();
        this.token = await ArtmToken.deployed();
    });

    // Make sure the contract factory was deployed
    describe("Deployed correctly", async function(){
        it("has an address", async function (){
            //this.contractFactory.address;
            console.log("Factory Address: " + this.contractFactory.address);
            this.contractFactory.address.should.not.equal(null_address);
        })

        // Make sure the contract factory deployed 2 child contracts
        it("has 1st child contract", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            console.log("Address 1: " + contract1_address);
            contract1_address.should.not.equal(null_address);
        })

    });

    describe("Behaves correctly", async function(){
        it("fails to deploy 2nd contract with null address", async function (){
            const timeNow = Math.floor(Date.now()/1000);
            const vestingStart = timeNow + duration.days(1);
            const unlockTime = timeNow + duration.weeks(24);

            try {
                await this.contractFactory.createTimeLock(1, this.token.address, null_address, unlockTime, vestingStart, 12, 8, 1250); // using null address
                assert.fail("Contract deployment should have failed.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }

        })

        it("fails to deploy 2nd contract with invalid percentages", async function (){
            const timeNow = Math.floor(Date.now()/1000);
            const vestingStart = timeNow + duration.days(1);
            const unlockTime = timeNow + duration.weeks(24);

            try {
                await this.contractFactory.createTimeLock(1, this.token.address, accounts[3], unlockTime, vestingStart, 12, 8, 2500); // requires 100%, provided 200%
                assert.fail("Contract deployment should have failed.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        })

        it("successfully deploys 2nd contract with correct params", async function (){
            const timeNow = Math.floor(Date.now()/1000);
            const vestingStart = timeNow + duration.days(1);
            const unlockTime = timeNow + duration.weeks(24);

            await this.contractFactory.createTimeLock(1, this.token.address, accounts[3], unlockTime, vestingStart, 12, 8, 1250);

            const contract2_address = await this.contractFactory.timeLocks(1);
            console.log("Address 2: " + contract2_address);
            contract2_address.should.not.equal(null_address);
        })

        it("fails to deploy contract with duplicate tokenId", async function (){
            const timeNow = Math.floor(Date.now()/1000);
            const vestingStart = timeNow + duration.days(1);
            const unlockTime = timeNow + duration.weeks(24);

            try {
                await this.contractFactory.createTimeLock(1, this.token.address, accounts[3], unlockTime, vestingStart, 12, 8, 1250);
                assert.fail("Contract deployment should have failed.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        })
    })
});
