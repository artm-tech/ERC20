const BN = require('bignumber.js');
const ArtmToken = artifacts.require("ArtmToken");

/*
Total Supply is 1 trillion tokens
*/
const tokenSupply = new BN(1000000000000).times( new BN(10).pow(18)); // 1 trillion tokens

module.exports = async function(deployer, network, accounts){
    // Deploy the ERC20..
    await deployer.deploy(ArtmToken, 'Artemis', 'ARTM', tokenSupply, accounts[0]);
    const token = await ArtmToken.deployed();

    // Pre-stage tokens for company & charity based on whitepaper
    company_amount = new BN(50000000000).times( new BN(10).pow(18)); // 5% of totalSupply
    charity_amount = new BN(25000000000).times( new BN(10).pow(18)); // 2.5% of totalSupply

    // Transfer tokens to their respective accounts
    token.transfer(accounts[1], company_amount, {from: accounts[0]});
    token.transfer(accounts[2], charity_amount, {from: accounts[0]});
}
