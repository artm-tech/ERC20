// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;


import '@openzeppelin/contracts/crowdsale/Crowdsale.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/crowdsale/validation/TimedCrowdsale.sol';
import '@openzeppelin/contracts/crowdsale/distribution/FinalizableCrowdsale.sol';

/**
 * @title Artemis Crowdsale Contract.
 */
contract ArtmCrowdsale is Crowdsale, TimedCrowdsale, FinalizableCrowdsale {
    // Address where unsold tokens will be deposited when crowdsale is closed.
    address payable private _withdrawAddress;

    /**
     * @dev Constructs the crowdsale contract for the Artemis token
     * @param withdrawAddress Address of the wallet which will receive
     * any unsold tokens upon finalization.
     */
    constructor(
        uint256 exchangeRate,
        address payable ethWallet,
        IERC20 tokenAddress,
        uint256 openingTime,
        uint256 closingTime,
        address payable withdrawAddress
    )
    Crowdsale(
        exchangeRate,
        ethWallet,
        tokenAddress
    )
    TimedCrowdsale(
        openingTime,
        closingTime
    )
    FinalizableCrowdsale()
    public
    {
        require(withdrawAddress != address(0), "Crowdsale: withdraw address is the zero address");
        _withdrawAddress = withdrawAddress;
    }

    /**
     * @return the withdraw address
     */
    function withdrawAddress() public view returns (address) {
        return _withdrawAddress;
    }

    /**
     * @dev Override of _finalization logic to withdraw any unsold tokens once
     * the crowdsale is closed.
     */
    function _finalization() internal {
        token().safeTransfer(withdrawAddress(), token().balanceOf(address(this)));
        super._finalization();
    }
}
