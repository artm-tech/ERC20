const BN = require('bignumber.js');
const CrowdsaleWallet = artifacts.require("CrowdsaleWallet");
const ArtmToken = artifacts.require("ArtmToken");

const chai = require('chai');

chai.use(require('chai-bn')(BN)).should();

contract('CrowdsaleWallet', accounts => {
    beforeEach(async function(){
    this.token = await ArtmToken.deployed();
    this.crowdsaleWallet = await CrowdsaleWallet.deployed();
    });

    describe('Crowdsale Wallet Functions properly', function() {
        it('Crowdsale wallet should have 2 eth', async function() {
            const wallet_address = await this.crowdsaleWallet.address;

            tx_eth = new BN(2 * 10**18); // 2 eth, but in wei.

            // simulate ETH coming from the crowdsale to this payment splitter
            await web3.eth.sendTransaction({from: accounts[0],to: wallet_address, value: tx_eth, gas: 2000000});
            const balance = await web3.eth.getBalance(wallet_address);
            balance.should.be.equal(tx_eth.toString());
        });

        it('Wallet 1 should be correct', async function() {
            const payee = await this.crowdsaleWallet.payee(0);
            payee.should.equal(accounts[5]);
        });

        it('Has total shares', async function() {
            const shares = await this.crowdsaleWallet.totalShares();
            shares.toNumber().should.equal(100);
        });

        it('Total release should be 0', async function() {
            const released = await this.crowdsaleWallet.totalReleased();
            released.toNumber().should.equal(0);
        });

        it('Wallet 1 share should be 50', async function() {
            const payee = await this.crowdsaleWallet.payee(0);
            const account_shares = await this.crowdsaleWallet.shares(payee);
            account_shares.toNumber().should.equal(50);
        });

        it('Released to Wallet 1 should be 0', async function() {
            const payee = await this.crowdsaleWallet.payee(0);
            const released = await this.crowdsaleWallet.released(payee);
            released.toNumber().should.equal(0);
        });

        it('Releases 1 Eth to Wallet 1', async function() {
            const payee = await this.crowdsaleWallet.payee(0);
            const starting_balance = new BN(await web3.eth.getBalance(payee));
            await this.crowdsaleWallet.release(payee);
            const new_balance = new BN(await web3.eth.getBalance(payee));

            expected_value = new BN(1 * 10**18);
            difference = new_balance.minus(starting_balance);
            difference.toNumber().should.be.equal(expected_value.toNumber());
        });

        it('Shows 1 Eth released to Wallet 1', async function() {
            const payee = await this.crowdsaleWallet.payee(0);
            const released = await this.crowdsaleWallet.released(payee);

            tx_eth = new BN(1 * 10**18);

            released.toString().should.equal(tx_eth.toString());
        });
    });
});
