const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const ArtmToken = artifacts.require("ArtmToken");

//const BN = require('bignumber.js');
const chai = require('chai');
var expect = require('chai').expect;
chai.use(require('chai-bn')(BN)).should();


contract('ArtmToken', accounts => {
    const _name = 'Artemis';
    const _symbol = 'ARTM';
    const _decimals = 18;
    const _supply = '1000000000000000000000000000000';

    beforeEach(async function(){
        this.token = await ArtmToken.deployed();
        this.value = new BN(10000);
    });

    describe('Token attributes', function() {
        it('has the correct name', async function() {
            const name = await this.token.name();
            name.should.equal(_name);
        });

        it('has the correct symbol', async function() {
            const symbol = await this.token.symbol();
            symbol.should.equal(_symbol);
        });

        it('has the correct decimals', async function() {
            const decimals = await this.token.decimals();
            decimals.toNumber().should.equal(_decimals);
        });

        it('has the correct total supply', async function() {
            const supply = await this.token.totalSupply();
            supply.toString().should.equal(_supply.toString());
        });

    });

    describe('Token behavior', function() {
        it('reverts when transferring tokens to the zero address', async function () {
          // Conditions that trigger a require statement can be precisely tested
          await expectRevert(
            this.token.transfer(constants.ZERO_ADDRESS, this.value, { from: accounts[1] }),
            'ERC20: transfer to the zero address',
          );
        });

        it('emits a Transfer event on successful transfers', async function () {
          const receipt = await this.token.transfer(
            accounts[8], this.value, { from: accounts[1] }
          );

          // Event assertions can verify that the arguments are the expected ones
          expectEvent(receipt, 'Transfer', {
            from: accounts[1],
            to: accounts[8],
            value: this.value,
          });
        });

          // normal transfers without approvals
          it('transfers: ether transfer should be reversed.', async function () {
            const balanceBefore = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balanceBefore.toString(), '10000')

            let threw = false
            try {
              await web3.eth.sendTransaction({ from: accounts[8], to: this.this.token.address, value: web3.utils.toWei('10', 'Ether') })
            } catch (e) {
              threw = true
            }
            assert.equal(threw, true)

            const balanceAfter = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balanceAfter.toString(), '10000')
          })

          it('transfers: should transfer 10000 to accounts[9] with accounts[8] having 10000', async function () {
            await this.token.transfer(accounts[9], 10000, { from: accounts[8] })
            const balance = await this.token.balanceOf(accounts[9])
            assert.strictEqual(balance.toString(), '10000')
          })

          it('burn: msg.sender should burn 20', async function () {
            await this.token.burn(20, { from: accounts[9] }); // burn 20

            const balance = await this.token.balanceOf(accounts[9])
            assert.strictEqual(balance.toString(), '9980')
          })

          it('burn: msg.sender burn amount exceeds balance', async function () {
              let threw = false
              try {
                  await this.token.burn(10000, { from: accounts[9] }); // burn 20
              } catch (e) {
                threw = true
              }
              assert.equal(threw, true)
              await this.token.transfer(accounts[9], 10000, { from: accounts[1] }); // reset balance for remaining tests.
          })


          it('transfers: should fail when trying to transfer 10001 to accounts[9] with accounts[8] having 0', async function () {
            let threw = false
            try {
              await this.token.transfer(accounts[9], 10001, { from: accounts[8] })
            } catch (e) {
              threw = true
            }
            assert.equal(threw, true)
          })

          it('transfers: should handle zero-transfers normally', async function () {
            assert(await this.token.transfer(accounts[9], 0, { from: accounts[8] }), 'zero-transfer has failed');
            await this.token.transfer(accounts[8], this.value, { from: accounts[1] });
          })

          // APPROVALS
          it('approvals: approve to zero address fails', async function () {
              await expectRevert(
                this.token.approve(constants.ZERO_ADDRESS, this.value, { from: accounts[1] }),
                'ERC20: approve to the zero address',
              );
          })

          it('approvals: msg.sender should approve 100 to accounts[9]', async function () {
            await this.token.approve(accounts[9], 80, { from: accounts[8] })
            await this.token.increaseAllowance(accounts[9], 20, { from: accounts[8] }) // add 20
            const allowance = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance.toString(), '100')
          })

          // bit overkill. But is for testing a bug
          it('approvals: msg.sender increase allowance accounts[9] back to 100 & withdraws 20 once.', async function () {
            const balance0 = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balance0.toString(), '10000')

            //await this.token.increaseAllowance(accounts[9], 20, { from: accounts[8] }) // add 20
            const balance2 = await this.token.balanceOf(accounts[7])
            assert.strictEqual(balance2.toString(), '0', 'balance2 not correct')

            await this.token.allowance(accounts[8], accounts[9])
            await this.token.transferFrom(accounts[8], accounts[7], 20, { from: accounts[9] }) // -20
            const allowance01 = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance01.toString(), '80') // =80

            const balance22 = await this.token.balanceOf(accounts[7])
            assert.strictEqual(balance22.toString(), '20')

            const balance02 = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balance02.toString(), '9980')
          })

          // should approve 100 of msg.sender & withdraw 20, twice. (should succeed)
          it('approvals: msg.sender approves accounts[9] of 100 & withdraws 20 twice.', async function () {
            await this.token.approve(accounts[9], 100, { from: accounts[8] })
            const allowance01 = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance01.toString(), '100')

            await this.token.transferFrom(accounts[8], accounts[7], 20, { from: accounts[9] })
            const allowance012 = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance012.toString(), '80')

            const balance2 = await this.token.balanceOf(accounts[7])
            assert.strictEqual(balance2.toString(), '40')

            const balance0 = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balance0.toString(), '9960')

            // FIRST tx done.
            // onto next.
            await this.token.transferFrom(accounts[8], accounts[7], 20, { from: accounts[9] })
            const allowance013 = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance013.toString(), '60')

            const balance22 = await this.token.balanceOf(accounts[7])
            assert.strictEqual(balance22.toString(), '60')

            const balance02 = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balance02.toString(), '9940')
          })

          // should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
          it('approvals: msg.sender approves accounts[9] of 100 & withdraws 50 & 60 (2nd tx should fail)', async function () {
            await this.token.approve(accounts[9], 100, { from: accounts[8] })
            const allowance01 = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance01.toNumber(), 100)

            await this.token.transferFrom(accounts[8], accounts[7], 50, { from: accounts[9] })
            const allowance012 = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance012.toString(), '50')

            const balance2 = await this.token.balanceOf(accounts[7])
            assert.strictEqual(balance2.toString(), '110')

            const balance0 = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balance0.toString(), '9890')

            // FIRST tx done.
            // onto next.
            let threw = false
            try {
              await this.token.transferFrom(accounts[8], accounts[7], 60, { from: accounts[9] })
            } catch (e) {
              threw = true
            }
            assert.equal(threw, true)
          })

          it('approvals: attempt withdrawal from account with no allowance (should fail)', async function () {
            let threw = false
            try {
              await this.token.transferFrom(accounts[8], accounts[7], 60, { from: accounts[9] })
            } catch (e) {
              threw = true
            }
            assert.equal(threw, true)
          })

          it('approvals: allow accounts[9] 100 to withdraw from accounts[8]. Withdraw 60 and then approve 0 & attempt transfer.', async function () {
            await this.token.approve(accounts[9], 100, { from: accounts[8] })
            await this.token.transferFrom(accounts[8], accounts[7], 60, { from: accounts[9] })
            await this.token.approve(accounts[9], 0, { from: accounts[8] })
            let threw = false
            try {
              await this.token.transferFrom(accounts[8], accounts[7], 10, { from: accounts[9] })
            } catch (e) {
              threw = true
            }
            assert.equal(threw, true)
          })

          it('approvals: approve max (2^256 - 1)', async function () {
            const max = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
            await this.token.approve(accounts[9], max, { from: accounts[8] })
            const allowance = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance.toString(), max)
          })

          // should approve max of msg.sender & withdraw 20 without changing allowance (should succeed).
          it('approvals: msg.sender approves accounts[9] of max (2^256 - 1) & withdraws 20', async function () {
            const balance0 = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balance0.toString(), '9830')

            const max = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
            await this.token.approve(accounts[9], max, { from: accounts[8] })
            const balance2 = await this.token.balanceOf(accounts[7])
            assert.strictEqual(balance2.toString(), '170', 'balance2 not correct') // should be 170

            await this.token.transferFrom(accounts[8], accounts[7], 20, { from: accounts[9] })

            await this.token.decreaseAllowance(accounts[9], 20, { from: accounts[8] }) // reduce by 20
            await this.token.increaseAllowance(accounts[9], 40, { from: accounts[8] }) // add 40 back so max value is correct

            const allowance01 = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance01.toString(), max)

            const balance22 = await this.token.balanceOf(accounts[7])
            assert.strictEqual(balance22.toString(), '190')

            const balance02 = await this.token.balanceOf(accounts[8])
            assert.strictEqual(balance02.toString(), '9810')
          })

          it('approvals: decrease allowance below zero fails', async function () {
            await this.token.approve(accounts[9], 100, { from: accounts[8] })

            let threw = false
            try {
                await this.token.decreaseAllowance(accounts[9], 110, { from: accounts[8] }) // reduce by 110
            } catch (e) {
              threw = true
            }
            assert.equal(threw, true)

          })

          it('approvals: msg.sender should approve 20 to accounts[9] which burns 20', async function () {
            await this.token.approve(accounts[9], 20, { from: accounts[8] })
            await this.token.burnFrom(accounts[8], 20, { from: accounts[9] }) // burn 20
            const allowance = await this.token.allowance(accounts[8], accounts[9])
            assert.strictEqual(allowance.toString(), '0')
          })

          it('approvals: burn amount exceeds allowance', async function () {
            await this.token.approve(accounts[9], 20, { from: accounts[8] })

            let threw = false
            try {
                await this.token.burnFrom(accounts[8], 30, { from: accounts[9] }) // burn 30
            } catch (e) {
              threw = true
            }
            assert.equal(threw, true)
          })

    });

});
