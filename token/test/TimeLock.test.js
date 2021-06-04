const BN = require('bignumber.js');
const ArtmToken = artifacts.require("ArtmToken");
const ArtemisTimeLockFactory = artifacts.require('ArtemisTimeLockFactory');
const ArtemisTimeLock = artifacts.require('ArtemisTimeLock');

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
    describe("Is deployed", async function(){
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

        it("has 2nd child contract", async function (){
            const contract2_address = await this.contractFactory.timeLocks(1);
            console.log("Address 2: " + contract2_address);
            contract2_address.should.not.equal(null_address);
        })

        it("fails to deploy 3rd contract with null address", async function (){
            const timeNow = Math.floor(Date.now()/1000);
            const vestingStart = timeNow + duration.days(1);
            const unlockTime = timeNow + duration.weeks(24);

            try {
                await this.contractFactory.createTimeLock(2, this.token.address, null_address, unlockTime, vestingStart, 12, 8, 1250); // using null address
                assert.fail("Contract deployment should have failed.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }

        })

        it("fails to deploy 3rd contract with invalid percentages", async function (){
            const timeNow = Math.floor(Date.now()/1000);
            const vestingStart = timeNow + duration.days(1);
            const unlockTime = timeNow + duration.weeks(24);

            try {
                await this.contractFactory.createTimeLock(2, this.token.address, accounts[3], unlockTime, vestingStart, 12, 8, 2500); // requires 100%, provided 200%
                assert.fail("Contract deployment should have failed.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        })

        it("successfully deploys 3rd contract with correct params", async function (){
            const timeNow = Math.floor(Date.now()/1000);
            const vestingStart = timeNow + duration.days(1);
            const unlockTime = timeNow + duration.weeks(24);

            await this.contractFactory.createTimeLock(2, this.token.address, accounts[3], unlockTime, vestingStart, 12, 8, 1250);

            const contract3_address = await this.contractFactory.timeLocks(2);
            console.log("Address 2: " + contract3_address);
            contract3_address.should.not.equal(null_address);
        })

    })
    // Make sure the child contract is in good shape
    describe("Child contract 1 has properties..", async function(){
        it("...has correct beneficiary", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            contract1_beneficiary = await contract1.beneficiary();
            console.log("Contract1 Beneficiary: " + contract1_beneficiary);
            contract1_beneficiary.should.equal(accounts[3]);
        })

        it("...has the correct this.token.", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);
            token_address = await contract1.token();
            console.log("Token: " + token_address);
            token_address.should.equal(this.token.address);
        })


        it("...has a release time.", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);
            release_time = await contract1.releaseTime();
            release_time.should.not.equal('');
        })

        it("...has correct initial token balance", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            const contract_balance = new BN(await this.token.balanceOf(contract1_address)).div(new BN(10).pow(18));

            amount = new BN(250000000000); // 250 bil tokens
            contract_balance.toString().should.equal(amount.toString());
        })
    })

    describe("Child contract releases tokens properly..", async function(){
        it('...fails to release, releaseTime not yet met.', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("RelaseTime not met, should have failed.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 1", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            const starting_balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));
            console.log("Starting Balance: " + starting_balance);

            timeJump(duration.weeks(24)); // jump ahead 24 weeks for the first tranche

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('31250000000');
        })

        it('...fails to release tranche 2 early', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 2", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            timeJump(duration.weeks(12)); // jump ahead 12 weeks to next tranche

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('62500000000');
        })

        it('...fails to release tranche 3 early', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 3", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            timeJump(duration.weeks(12)); // jump ahead 1 week into tranche 3

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('93750000000');
        })

        it('...fails to release tranche 4 early', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 4", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            timeJump(duration.weeks(12)); // jump ahead 12 weeks into tranche 4

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('125000000000');
        })

        it('...fails to release tranche 5 early', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 5", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            timeJump(duration.weeks(12));

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('156250000000');
        })
        it('...fails to release tranche 6 early', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 6", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            timeJump(duration.weeks(12));

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('187500000000');
        })

        it('...fails to release tranche 7 early', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 7", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            timeJump(duration.weeks(12));

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('218750000000');
        })

        it('...fails to release tranche 8 early', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 8", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            timeJump(duration.weeks(12));

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('250000000000');
        })

        it('...fails release of additional tranche, zero tokens remaining.', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Did not fail, additional tokens were released.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it('...contract received more tokens.', async function() {
            const contract1_address = await this.contractFactory.timeLocks(0);

            amount = new BN(5000000000).times( new BN(10).pow(18));
            this.token.transfer(contract1_address, amount, {from: accounts[3]}); //  transfer tokens back into timelock

            const balance = new BN(await this.token.balanceOf(contract1_address)).div(new BN(10).pow(18));
            balance.toString().should.equal('5000000000');
        });

        // Testing with timelock_v2 - does not require additional tranche to release in v2.
        /*it("...fails to release tokens, requires 1 more tranche cycle.", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            try {
                await contract1.release();
                assert.fail("Did not fail, additional tokens were released.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        })*/

        it("...fully vested contract releases additional tokens.", async function (){
            const contract1_address = await this.contractFactory.timeLocks(0);
            contract1 = await ArtemisTimeLock.at(contract1_address);

            // no time jump required in timelock_v2 - tokens should just release.
            //timeJump(duration.weeks(12)); // jump ahead 12 weeks into tranche 5

            await contract1.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('250000000000'); // the original balance
        })

    })
});
