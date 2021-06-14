// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

/**
 * @title A Fancy Test Token.
 * @dev Token is only used to test the crowdsale contract and will not be deployed.
 */
contract TestingOnlyToken is ERC20, ERC20Detailed {
    /**
     * @dev Constructs a test token.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        address owner
    )
    ERC20Detailed(
        name,
        symbol,
        decimals
    )
    public
    {
        _mint(owner, totalSupply);
    }
}
