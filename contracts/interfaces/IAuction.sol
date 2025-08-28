// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IAuction {
    enum AuctionStatus {Active,Ended,Cancelled}
    enum BidType {ETH,ERC20}

    // Details of each auction
    struct Bid {
        address bidder;     // 出价人地址
        uint256 amount;     // 出价金额,单位为wei
        BidType bidType;    // 出价类型, ETH or ERC20
        uint256 timestamp;  // 出价时间
    }

    event AuctionCreated(
        uint256 indexed auctionId, 
        address indexed seller,     
        address indexed nftAddress, 
        uint256 tokenId,     
        uint256 startTime, 
        uint256 endTime,  
        address paymentToken
    );
    // 说明：出价事件
    event BidPlaced(
        uint256 indexed auctionId, 
        address indexed bidder, 
        uint256 amount, 
        BidType bidType
    );
    // 说明：拍卖结束事件
    event AuctionEnded(
        uint256 indexed auctionId, 
        address indexed winner, 
        uint256 winnerBid
    );

    // 说明：拍卖初始化
    function initialize(
        uint256 _auctionId,
        address _seller,
        address _nftAddress,
        uint256 _tokenId,
        uint256 _startTime,
        uint256 _endTime,
        address _paymentToken
    ) external;
    
    function placeBid(uint256 _auctionId) external payable;
    function endAuction() external;
    function getHighestBid() external view returns (uint256);
    function getHighestBidder() external view returns (address);
}