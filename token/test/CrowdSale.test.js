const BN = require('bignumber.js');
const ArtmToken = artifacts.require("ArtmToken");
const ArtmCrowdsale = artifacts.require("ArtmCrowdsale");
const CrowdsaleWallet = artifacts.require("CrowdsaleWallet");

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

contract('ArtmCrowdsale', accounts => {
    const exchange_rate = '10000000'; // 10 million ARTM per 1 ETH.
    const crowdsale_amount = new BN(500000000000).times( new BN(10).pow(18)); // 500 billion tokens
    const withdraw_address = accounts[7]; // This is the address unsold tokens will be released to when crowdsale ends.

    beforeEach(async function(){
        this.token = await ArtmToken.deployed();
        this.crowdsale = await ArtmCrowdsale.deployed();
        this.crowdsaleWallet = await CrowdsaleWallet.deployed();
    });

    describe('Token Properties:', function() {
        // Check to make sure the crowdsale has the correct token.
        it('Has the correct token', async function() {
            const token_address = await this.token.address;
            crowdsale_token = await this.crowdsale.token();
            crowdsale_token.should.equal(token_address);
        });

        // Need to make sure the token supply actually exists.
        it('Has at least 500 billion tokens', async function() {
            tokensAvailable = new BN(await this.token.balanceOf(this.crowdsale.address)); // The Crowdsale itself. (finalizable crowdsale)
            crowdsale_amount.toNumber().should.equal(tokensAvailable.toNumber());
        });
    });

    describe('Crowdsale Propreties', function() {
        it('Has the correct address', async function() {
            const crowdsale_address = await this.crowdsale.address;
            crowdsale_address.should.equal(crowdsale_address);
        });

        // Check for correct exchange rate.
        it('Has the correct rate', async function() {
            const crowdsale_rate = await this.crowdsale.rate();
            crowdsale_rate.toString().should.equal(exchange_rate);
        });

        // Verify that we currently have 0 wei raised.
        it('weiRaised should initially be 0', async function() {
            const wei_raised = await this.crowdsale.weiRaised();
            wei_raised.toNumber().should.be.equal(0);
        });

        // Ensure withdraw address is correct.  Finalizable Crowdsale only.
        it('Withdraw address is correct', async function() {
            const withdrawAddress = await this.crowdsale.withdrawAddress();
            withdrawAddress.should.equal(withdraw_address);
        });

        // Check to make sure that the crowdsale is sending the ETH to the correct wallet.
        it('Sends ETH to the correct wallet', async function() {
            const crowdsale_wallet = await this.crowdsale.wallet();
            const wallet_address = await this.crowdsaleWallet.address;
            crowdsale_wallet.should.equal(wallet_address);
        });
    });

    describe('Crowdsale behaves correctly..', function() {
        it('Should initially be closed..', async function(){
            const open = await this.crowdsale.isOpen();
            open.should.equal(false);
        });

        it('Finalize should fail because the crowdsale is open', async function(){
            // Allows testing crowdsale opening time to the minute.
            timeJump(duration.hours(23));
            timeJump(duration.minutes(60)); // 59 minutes will fail to open

            try {
                await this.crowdsale.finalize();
                assert.fail("Crowdsale finalized, crowdsale was closed prematurely.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        // Verify eth made it to Crowdsale Wallet.
        it('Crowdsale wallet should initially have 0 eth', async function() {
            const wallet_address = await this.crowdsaleWallet.address;
            const balance = await web3.eth.getBalance(wallet_address);
            balance.should.be.equal('0');
        });

        // Send Ether to the crowdsale.
        it('Sends crowdsale wallet 1 eth', async function() {
            const crowdsale_address = await this.crowdsale.address;
            const wallet_address = await this.crowdsaleWallet.address;

            tx_eth = new BN(1 * 10**18); // 1 eth, but in wei.

            await web3.eth.sendTransaction({from: accounts[8],to: crowdsale_address, value: tx_eth, gas: 2000000});
            const balance = await web3.eth.getBalance(wallet_address);
            balance.should.be.equal(tx_eth.toString());
        });

        // Check to make sure purchaser received correct number of tokens
        it('Crowdsale recipient should now have 10000000 tokens', async function() {
            tokens_expected = new BN(exchange_rate).times( new BN(10).pow(18));
            tokens_purchased = new BN(await this.token.balanceOf(accounts[8]));
            tokens_expected.toNumber().should.be.equal(tokens_purchased.toNumber());
        });

        // Verify that we currently have 1 ETH worth wei raised.
        it('weiRaised should now represent the 1 ETH received', async function() {
            tx_eth = new BN(1 * 10**18); // 1 ETH from our test.
            const wei_raised = new BN(await this.crowdsale.weiRaised());
            wei_raised.toNumber().should.be.equal(tx_eth.toNumber());
        });

        // Send Ether to the crowdsale from another account.
        it('Crowdsale wallet should now have 2 eth', async function() {
            const crowdsale_address = await this.crowdsale.address;
            const wallet_address = await this.crowdsaleWallet.address;

            tx_eth = new BN(1 * 10**18);
            new_amount = new BN(2 * 10**18);

            await web3.eth.sendTransaction({from: accounts[9],to: crowdsale_address, value: tx_eth, gas: 2000000});
            const balance = await web3.eth.getBalance(wallet_address);
            balance.should.be.equal(new_amount.toString()); // 2 ETH in wei.
        });

        // Send Ether to the crowdsale.
        it('Crowdsale recipient #2 should now have 10000000 tokens', async function() {
            tokens_expected = new BN(exchange_rate).times( new BN(10).pow(18));
            tokens_purchased = new BN(await this.token.balanceOf(accounts[9]));
            tokens_expected.toNumber().should.be.equal(tokens_purchased.toNumber());
        });

        // Verify that we currently have 0 wei raised.
        it('weiRaised should now represent the 2 ETH received', async function() {
            tx_eth = new BN(2 * 10**18); // 2 ETH from our test.
            const wei_raised = new BN(await this.crowdsale.weiRaised());
            wei_raised.toNumber().should.be.equal(tx_eth.toNumber());
        });

        // The next 2 tests can be enabled to verify that all tokesn can be purchased.
        // However, it will essentially make it so that the finalize function
        // isn't actually transferring tokens as there shouldn't be any left.

        it('Purchase all tokens from crowdsale: 0 tokens left', async function() {
            const crowdsale_address = await this.crowdsale.address;

            tx_eth = new BN(49998 * 10**18); // 49,998 ETH should max out the crowdsale.

            await web3.eth.sendTransaction({from: accounts[9],to: crowdsale_address, value: tx_eth, gas: 2000000});
            const balance = await web3.eth.getBalance(crowdsale_address);
            balance.should.be.equal('0'); // 0 ETH remaining in crowdsale.
        });

        it('Fails to purchase additional tokens', async function() {
            const crowdsale_address = await this.crowdsale.address;
            tx_eth = new BN(1 * 10**18);

            try {
                await web3.eth.sendTransaction({from: accounts[9],to: crowdsale_address, value: tx_eth, gas: 2000000});
                assert.fail("The transaction did not fail when tokens were purchased.");
            } catch (err) {
                assert.include(err.message, "revert", "The error message should contain 'revert'");
            }
        });

        it('Finalize succeeds and transfers any remaining tokens..', async function(){
            // Allows testing crowdsale closure to the minute.
            timeJump(duration.days(13));
            timeJump(duration.hours(23));
            timeJump(duration.minutes(60)); // 59 minutes will fail this test.

            remaining_tokens = new BN(await this.token.balanceOf(this.crowdsale.address));
            await this.crowdsale.finalize();
            tokens_received = new BN(await this.token.balanceOf(withdraw_address));
            tokens_received.toNumber().should.be.equal(remaining_tokens.toNumber());
        });

        it('Should be finalized..', async function(){
            const finalized = await this.crowdsale.finalized();
            finalized.should.equal(true);
        });


    });
});
