const ArtmToken = artifacts.require("ArtmToken");

const chai = require('chai');
const BN = require('bignumber.js');

chai.use(require('chai-bn')(BN)).should();

contract('ArtmToken', accounts => {
    const _name = 'Artemis';
    const _symbol = 'ARTM';
    const _decimals = 18;

    beforeEach(async function(){
        this.token = await ArtmToken.deployed();
    });

    describe('Token attributes', function() {
        it('Has the correct name', async function() {
            const name = await this.token.name();
            console.log("Token Name: " + name);
            name.should.equal(_name);
        });

        it('Has the correct symbol', async function() {
            const symbol = await this.token.symbol();
            symbol.should.equal(_symbol);
        });

        it('Has the correct decimals', async function() {
            const decimals = await this.token.decimals();
            decimals.toNumber().should.equal(_decimals);
        });

    });
});
