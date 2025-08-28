// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./IAuction.sol";

interface IAuctionFactory {
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed auctionAddress,
        address indexed seller,
        address nftAddress,
        uint256 tokenId,
        uint256 startTime,
        uint256 endTime,
        address paymentToken
    );
    
    function createAuction(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _startTime,
        uint256 _endTime,
        address _paymentToken
    ) external returns (address);
    
    function getAuction(uint256 _auctionId) external view returns (address);
    
    function getAuctionsCount() external view returns (uint256);
}