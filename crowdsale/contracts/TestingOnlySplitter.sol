// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;


import "@openzeppelin/contracts/payment/PaymentSplitter.sol";

/**
 * @title Test Payment Splitting Wallet
 * @dev This is only used to test the crowdsale contract and will not be deployed.
 */
contract TestingOnlySplitter is PaymentSplitter {
    /**
     * @dev Constructs a payment splitting test wallet
     */
    constructor(
        address[] memory payees,
        uint256[] memory shares_
    )
    PaymentSplitter(
        payees,
        shares_
    )
    public
    {}
}
