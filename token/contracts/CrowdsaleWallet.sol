// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;


import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

/**
 * @title Artemis Payment Splitting Wallet
 */
contract CrowdsaleWallet is PaymentSplitter {
    /**
     * @dev Constructs the payment splitting crowdsale wallet
     */
    constructor(
        address[] memory payees,
        uint256[] memory shares_
    )
    PaymentSplitter(
        payees,
        shares_
    )
    {}
}
