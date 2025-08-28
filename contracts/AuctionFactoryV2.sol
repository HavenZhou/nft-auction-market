// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./AuctionFactory.sol";

contract AuctionFactoryV2 is AuctionFactory {
    // New functionality for V2
    mapping(uint256 => bool) public featuredAuctions;
    
    function setFeaturedAuction(uint256 auctionId, bool featured) external onlyOwner {
        featuredAuctions[auctionId] = featured;
    }
    
    function isFeaturedAuction(uint256 auctionId) external view returns (bool) {
        return featuredAuctions[auctionId];
    }
    
    function getFeaturedAuctions() external view returns (uint256[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= auctionCount; i++) {
            if (featuredAuctions[i]) {
                count++;
            }
        }
        
        uint256[] memory featured = new uint256[](count);
        uint256 index;
        for (uint256 i = 1; i <= auctionCount; i++) {
            if (featuredAuctions[i]) {
                featured[index] = i;
                index++;
            }
        }
        
        return featured;
    }
    
    // Additional new functions can be added here
}