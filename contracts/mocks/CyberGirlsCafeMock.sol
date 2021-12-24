// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../CyberGirlsCafe.sol";

contract CyberGirlsCafeMock is CyberGirlsCafe {
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        string memory contractURL,
        address proxyAddress
    ) CyberGirlsCafe(name, symbol, baseTokenURI, contractURL, proxyAddress) {
        setMintState(true, false);
    }

    function getTotalTokens() internal override pure returns (uint256) {
        return 30;
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}. WARNING! Very high gas usage. Use this function ONLY off-chain.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256) {
        uint256 _index = 0;
        uint256 length = _currentTokenId;
        for(uint256 i = 1; i <= length; i++) {
            if(_tokens[i].owner == owner && _index++ == index) {
                return i;
            }
        }

        revert("ERC721Enumerable: owner index out of bounds");
    }
}