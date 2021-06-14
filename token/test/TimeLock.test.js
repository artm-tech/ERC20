const BN = require('bignumber.js');
const ArtmToken = artifacts.require("ArtmToken");
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

const timeNow = Math.floor(Date.now()/1000);

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

contract('ArtemisTimeLock', accounts => {
    beforeEach(async function(){
        this.token = await ArtmToken.deployed();
        this.timeLock = await ArtemisTimeLock.deployed();
    });

    describe("has correct properties..", async function(){
        it("...has correct beneficiary", async function (){
            contract1_beneficiary = await this.timeLock.beneficiary();
            console.log("Contract1 Beneficiary: " + contract1_beneficiary);
            contract1_beneficiary.should.equal(accounts[3]);
        })

        it("...has the correct this.token.", async function (){
            token_address = await this.timeLock.token();
            console.log("Token: " + token_address);
            token_address.should.equal(this.token.address);
        })


        it("...has a release time.", async function (){
            release_time = await this.timeLock.releaseTime();
            release_time.should.not.equal('');
        })

        it("...has correct initial token balance", async function (){
            const contract1_address = await this.timeLock.address;
            const contract_balance = new BN(await this.token.balanceOf(contract1_address)).div(new BN(10).pow(18));

            amount = new BN(250000000000); // 250 bil tokens
            contract_balance.toString().should.equal(amount.toString());
            console.log('Initial Contract Balance: ' + contract_balance.toString());
        })
    })

    describe("releases tokens properly..", async function(){
        it('...fails to release, releaseTime not yet met.', async function() {
            try {
                await this.timeLock.release();
                assert.fail("RelaseTime not met, should have failed.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 1", async function (){
            const starting_balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));
            console.log("Initial Beneficiary Balance: " + starting_balance);

            timeJump(duration.weeks(24)); // jump ahead 24 weeks for the first tranche

            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('31250000000');
        })

        it('...fails to release tranche 2 early', async function() {
            try {
                await this.timeLock.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 2", async function (){
            timeJump(duration.weeks(12)); // jump ahead 12 weeks to next tranche

            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('62500000000');
        })

        it('...fails to release tranche 3 early', async function() {
            try {
                await this.timeLock.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 3", async function (){
            timeJump(duration.weeks(12)); // jump ahead 1 week into tranche 3

            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('93750000000');
        })

        it('...fails to release tranche 4 early', async function() {
            try {
                await this.timeLock.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 4", async function (){
            timeJump(duration.weeks(12)); // jump ahead 12 weeks into tranche 4

            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('125000000000');
        })

        it('...fails to release tranche 5 early', async function() {
            try {
                await this.timeLock.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 5", async function (){
            timeJump(duration.weeks(12));

            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('156250000000');
        })
        it('...fails to release tranche 6 early', async function() {
            try {
                await this.timeLock.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 6", async function (){
            timeJump(duration.weeks(12));

            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('187500000000');
        })

        it('...fails to release tranche 7 early', async function() {
            try {
                await this.timeLock.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 7", async function (){
            timeJump(duration.weeks(12));

            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('218750000000');
        })

        it('...fails to release tranche 8 early', async function() {
            try {
                await this.timeLock.release();
                assert.fail("Early tranche release did not fail as asserted.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it("...releases tranche 8", async function (){
            timeJump(duration.weeks(12));

            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('250000000000');
        })

        it('...fails release of additional tranche, zero tokens remaining.', async function() {
            try {
                await this.timeLock.release();
                assert.fail("Did not fail, additional tokens were released.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it('...contract received more tokens.', async function() {
            const contract1_address = await this.timeLock.address;

            amount = new BN(5000000000).times( new BN(10).pow(18));
            this.token.transfer(contract1_address, amount, {from: accounts[3]}); //  transfer tokens back into timelock

            const balance = new BN(await this.token.balanceOf(contract1_address)).div(new BN(10).pow(18));
            balance.toString().should.equal('5000000000');
        });

        it("...fully vested contract releases additional tokens.", async function (){
            await this.timeLock.release();

            const balance = new BN(await this.token.balanceOf(accounts[3])).div(new BN(10).pow(18));

            console.log("Balance: " + balance);
            balance.toString().should.equal('250000000000'); // the original balance
        })

    })
});
