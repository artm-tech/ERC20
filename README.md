# Artemis Token And Crowdsale

### Prerequisites
* Node.js v14.16.1+
* truffle v5.3.6+
* Ganache CLI v6.12.2+

This project is broken up into 2 parts based on the OpenZeppelin library in use -
* `token` implements OpenZeppelin v4.0.0
* `crowdsale` implements OpenZeppelin v2.5.1

### Running Tests
Please note that all tests are run from the `/token` directory.  The `/crowdsale`
directory is used for compiling the crowdsale contracts and supporting dependencies.

To get started, execute the following commands from the `/token` directory -
* `npm update` to pull in required dependencies
* `npm install -g ganache-cli` to install ganache-cli
* `ganache-cli -e 100000` to start ganache and pre-load 100,000 ETH in accounts

Then, run the test with the following command in a separate console from the `/token` directory -
* `truffle test`

Due to the use of "evm_increaseTime" to simulate advancing time, it's important to
restart ganache-cli between tests so that you will have a clean blockchain.

### Migrations
Deployment scripts are located in the `/migrations` directory.  Migration scripts
can be adjusted to test for different deployment scenarios.

### Tests
Test files are located in the `/tests` directory.  Similar to migrations, these
tests can also be modified and test changes made to migrations.

#### Note on differing solidity versions
The OpenZeppelin v2.5.1 libraries are compiled using solidity ^0.5.0, whereas the
OpenZeppelin v4.0.0 libraries are compiled using solidity ^0.8.0.

The distinction is important because the contracts located in the `/crowdsale/contracts`
directory must be compiled separately from the contracts located in the `/token/contracts`
directory.

To allow for automated testing using `truffle test`, if changes are made to the
contracts in the `/crowdsale/contracts` directory, they must be re-compiled
and their .json artifacts located in `/crowdsale/build/contracts` copied into the
`/token/build/contracts` directory.

Please note that this is unnecessary if these contracts are being deployed separately
or manually.
