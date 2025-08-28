// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol"; // Initializable：提供安全的一次性初始化机制，包括存储冲突
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol"; // OwnableUpgradeable：提供可升级的权限管理
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";
import "./interfaces/IAuction.sol";


contract Auction is Initializable,OwnableUpgradeable,IAuction {
    uint256 public auctionId;        // 拍卖ID
    address public seller;           // 卖家地址    
    address public nftAddress;       // NFT合约地址
    uint256 public tokenId;          // Token ID    
    uint256 public startTime;       // 开始时间
    uint256 public endTime;         // 结束时间 
    address public paymentToken;    // 支付代币地址,如果是ETH出价,则为address(0)

    AuctionStatus public auctionStatus; // 拍卖状态
    Bid[] public bids;                  // 最高出价记录数组
    uint256 public highestBid;          // 最高出价记录
    address public highestBidder;       // 最高出价者

    address public ethUsdPriceFeed;     // ETH/USD价格预言机地址,ETH 是原生货币，没有合约地址,默认address(0)即可
    // ERC20/USD价格预言机地址映射，ERC20是有合约地址的，且成千上万（USDC,USTD,DAI等等），需要为每个ERC20代币都设置一个价格预言机地址
    mapping (address => address) public erc20UsdPriceFeed;  

    modifier onlyActive() {
        require(auctionStatus == AuctionStatus.Active, "Auction is not active");
        _;
    }

    /**
        override： 重写父类的函数，IAuction 接口中的 initialize 函数
        initializer： 初始化函数修饰符，确保该函数只能被调用一次,特殊修饰符：来自 OpenZeppelin 的 Initializable 合约
     */
    function initialize(
        uint256 _actionId,   
        address _seller,
        address _nftAddress,
        uint256 _tokenId,
        uint256 _startTime,
        uint256 _endTime,
        address _paymentToken
    ) public override initializer {
        __Ownable_init(msg.sender);
     
        require(_seller != address(0), "Invalid seller address");
        require(_nftAddress != address(0), "Invalid NFT address");
        // 添加更严格的时间检查
        require(_startTime >= block.timestamp, "Start time must be in future");
        require(_endTime > block.timestamp + 1, "Auction too short"); // 最小持续时间
        require(_startTime < _endTime, "Invalid time range");
        if(_paymentToken != address(0)){
            require(erc20UsdPriceFeed[_paymentToken] != address(0), "Payment token not supported");
        }

        auctionId = _actionId;
        seller = _seller;
        nftAddress = _nftAddress;
        tokenId = _tokenId;
        startTime = _startTime;
        endTime = _endTime;
        paymentToken = _paymentToken;
        auctionStatus = AuctionStatus.Active;

        console.log("Auction.sol,Auction initialized by:", msg.sender);

        // 检查合约是否被授权可以转移该NFT
        //require(IERC721(nftAddress).getApproved(tokenId) == address(this), "Contract not approved to transfer this NFT");
        // require(IERC721(nftAddress).ownerOf(tokenId) == seller, "Seller does not own this NFT");
        // // 将NFT从卖家地址转移到拍卖合约地址
        // console.log("Transferring NFT from seller to auction contract,nftAddress:",nftAddress);
        // console.log("Transferring NFT from seller to auction contract,seller:",seller);
        // console.log("Transferring NFT from seller to auction contract,this:",address(this));
    
        // IERC721(nftAddress).transferFrom(seller, address(this), tokenId); 

        // 喂价器地址设置
        ethUsdPriceFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306; // 以太坊主网 ETH/USD 价格预言机地址

        erc20UsdPriceFeed[0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238] = 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E; // seplia测试网络，USDC/USD 价格预言机地址

        emit AuctionCreated(_actionId, _seller, _nftAddress, _tokenId, _startTime, _endTime, _paymentToken);
    }

    // 出价函数
    function placeBid (uint256 _amount) external payable onlyActive override {
        require(block.timestamp >= startTime, "Auction not started");
        require(block.timestamp < endTime, "Auction ended");

        require(msg.sender != seller, "Seller cannot bid on own auction");
        require(_amount > 0, "Bid amount must be greater than zero");
        require(_amount > highestBid, "Bid amount too low"); 

        if(paymentToken == address(0)){
            // 以太坊原生货币出价
            require(msg.value == _amount, "Sent ETH amount does not match bid amount");
        } else{
            // ERC20代币出价
            require(msg.value == 0, "Do not send ETH when bidding with ERC20");
            // 将出价代币从出价者地址转移到拍卖合约地址
            require(IERC20(paymentToken).transferFrom(msg.sender, address(this), _amount), "ERC20 transfer failed");
        }

        // 退还之前的最高出价者
        if(highestBidder != address(0)){
            if(paymentToken == address(0)){
                // 以太坊原生货币退还
                payable(highestBidder).transfer(highestBid);
            } else{
                // ERC20代币退还
                require(IERC20(paymentToken).transfer(highestBidder, highestBid), "ERC20 refund failed");
            }            
        }

        // 记录新的最高出价记录
        highestBid = _amount;
        highestBidder = msg.sender;
        bids.push(Bid({
            bidder: msg.sender,
            amount: _amount,
            timestamp: block.timestamp,
            bidType: paymentToken == address(0) ? BidType.ETH : BidType.ERC20
        }));

        emit BidPlaced(auctionId, msg.sender, _amount,paymentToken == address(0) ? BidType.ETH : BidType.ERC20 );
    }   

    // 结束拍卖函数
    function endAuction() external onlyActive override {
        require(block.timestamp >= endTime || msg.sender==seller, "Auction not yet ended or caller is not seller");
        auctionStatus = AuctionStatus.Ended;

        if(highestBidder != address(0)){
            // 有出价者,将NFT转移给最高出价者,将款项转移给卖家
            IERC721(nftAddress).transferFrom(address(this), highestBidder, tokenId);   
            console.log("--------------------what is address(this)---------------------------Transferring NFT to highestBidder,this:",address(this));
            if(paymentToken == address(0)){
                // 以太坊原生货币支付
                payable(seller).transfer(highestBid);
            } else{
                // ERC20代币支付
                require(IERC20(paymentToken).transfer(seller, highestBid), "ERC20 payment to seller failed");
            }            
        } else{
            // 无出价者,将NFT退还给卖家
            IERC721(nftAddress).transferFrom(address(this), seller, tokenId);   
        }
        emit AuctionEnded(auctionId, highestBidder, highestBid);
    }

    // 获取最高出价
    function getHighestBid() external view override returns (uint256) {  
        return highestBid;
    }

    // 获取最高出价者
    function getHighestBidder() external view override returns (address) {  
        return highestBidder;
    }

    // 获取所有有效出价记录总数
    function getBidCount() external view returns (uint256) {
        return bids.length;
    }

    // 获取指定索引的出价记录
    function getBidAtIndex(uint256 index) external view returns (Bid memory) {
        require(index < bids.length, "Index out of bounds");
        return bids[index];
    }

    function getEthUsdPriceInUSD() public view returns (int256) {
        (, int256 price, , , ) = AggregatorV3Interface(ethUsdPriceFeed).latestRoundData();
        return price; // 返回价格，通常有8位小数
    }   

    function getErc20UsdPriceInUSD(address erc20) public view returns (int256) {
        address priceFeed = erc20UsdPriceFeed[erc20];
        require(priceFeed != address(0), "Price feed not set for this ERC20");
        (, int256 price, , , ) = AggregatorV3Interface(priceFeed).latestRoundData();
        return price; // 返回价格，通常有8位小数
    }

    function convertBidToUSD(uint256 amount, BidType bidType,address token) public view returns (uint256) {
      
        if(bidType == BidType.ETH){
            // 以太坊原生货币
            int256 ethPrice = getEthUsdPriceInUSD();
            require(ethPrice > 0, "Invalid ETH price");
            return (amount * uint256(ethPrice)) / 1e8; // 假设价格有8位小数
        } else{
            // ERC20代币
            int256 erc20Price = getErc20UsdPriceInUSD(token);
            require(erc20Price > 0, "Invalid ERC20 price");
            return (amount * uint256(erc20Price)) / 1e8; // 假设价格有8位小数
        }
    }

}

