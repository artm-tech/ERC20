// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;


import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol";

/**
 * @title The fixed supply Artemis (ARTM) ERC20 token contract
 */
contract ArtmToken is ERC20PresetFixedSupply{
    /**
     * @dev Constructs the Artemis token (ARTM) as a fixed supply token.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address owner
    )
    ERC20PresetFixedSupply(
        name,
        symbol,
        totalSupply,
        owner
    )
    {}
}
