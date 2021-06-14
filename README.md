# Artemis Token And Crowdsale

### Prerequisites
* Node.js v14.16.1+
* truffle v5.3.6+
* Ganache CLI v6.12.2+

This project is broken up into 2 parts based on the OpenZeppelin library in use -
* `token` implements OpenZeppelin v4.0.0
* `crowdsale` implements OpenZeppelin v2.5.1

### Running Tests
Please note that tests must be run separately from both the `/token` directory and
the `/crowdsale` directory.  Each part of the project has different dependencies
and compilation requirements.

To get started, execute the following commands from the `/token` directory -
* `npm update` to pull in required dependencies
* `npm install -g ganache-cli` to install ganache-cli (if needed)
* `ganache-cli -e 100000` to start ganache and pre-load 100,000 ETH in accounts

Then, run the test with the following command in a separate console starting in the `/token` directory -
* `truffle test`

When finished, run `truffle test` again from inside the `/crowdsale` directory.

Note: Due to the use of "evm_increaseTime" to simulate advancing time, it's important to
restart ganache-cli between tests so that you will have a clean blockchain.  This is
particularly important when running crowdsale tests.

### Migrations
Deployment scripts are located in the `/token/migrations`, and `/crowdsale/migrations` directories.  
Migration scripts can be adjusted to test for different deployment scenarios.

### Tests
Test files are located in the `/token/tests`, and `/crowdsale/tests` directories.  Similar
to migrations, these tests can also be modified and changes made to migrations.

#### Note on differing solidity versions
The OpenZeppelin v2.5.1 libraries are compiled using solidity ^0.5.0, whereas the
OpenZeppelin v4.0.0 libraries are compiled using solidity ^0.8.0.

The distinction is important because the contracts located in the `/crowdsale/contracts`
directory are compiled using solidity ^0.5.0, whereas the contracts located in the `/token/contracts`
directory are compiled with solidity 0.8.0.
