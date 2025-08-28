// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "./interfaces/IAuctionFactory.sol";
import "./Auction.sol";

contract AuctionFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable, IAuctionFactory {
    UpgradeableBeacon public beacon;                    // 存储 UpgradeableBeacon 合约的地址
    
    uint256 public auctionCount;                        //  计数器，记录创建的总拍卖数量，也用作每个新拍卖的唯一ID。
    mapping(uint256 => address) public auctions;        //  映射，通过拍卖ID查找对应的拍卖合约（BeaconProxy）地址。
    mapping(address => uint256[]) public userAuctions;  //  映射，记录每个用户地址创建的所有拍卖ID，方便查询。
    
    function initialize(address _auctionImplementation) public initializer {
        __Ownable_init(msg.sender); // 初始化 Ownable，将部署者设为所有者
        __UUPSUpgradeable_init();   // 初始化 UUPS 可升级功能。
        // 将 beacon 的所有权转移给工厂合约
        beacon = new UpgradeableBeacon(_auctionImplementation,address(this)); // 将信标合约所有权转移给工厂合约，这样测试时才能通过工厂合约升级信标
        // beacon.transferOwnership(msg.sender);    //  将信标的所有权转移给调用者。这行代码可能有点多余，因为部署时已经设置了所有者。但它确保了所有权明确归属。
    }

    // 这是 UUPS 模式要求的函数，用于限制谁可以升级工厂合约本身。
    // 它被 onlyOwner 修饰符保护，意味着只有合约所有者可以执行升级。
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
         @dev 创建一个新的拍卖合约实例。
     */
    function createAuction(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _startTime,
        uint256 _endTime,
        address _paymentToken
    ) external override returns (address) {
        require(_startTime < _endTime, "Invalid time range");
        require(_endTime > block.timestamp, "End time must be in the future");
        
        // 生成新拍卖ID
        auctionCount++;
        uint256 auctionId = auctionCount;
        // 3. 部署新的 BeaconProxy
        BeaconProxy proxy = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(
                Auction.initialize.selector,
                auctionId,
                msg.sender,
                _nftAddress,
                _tokenId,
                _startTime,
                _endTime,
                _paymentToken
            )
        );
        
        console.log("New auction created with ID:", auctionId, "at address:", address(proxy));

        require(IERC721(_nftAddress).getApproved(_tokenId) == address(this), "Contract not approved to transfer this NFT");
        require(IERC721(_nftAddress).ownerOf(_tokenId) == msg.sender, "Seller does not own this NFT");
        // 添加 NFT 转移逻辑
        IERC721(_nftAddress).transferFrom(msg.sender, address(proxy), _tokenId); // 将 NFT 转移到新拍卖合约

        // 4. 记录新拍卖的信息
        address auctionAddress = address(proxy);
        auctions[auctionId] = auctionAddress;
        userAuctions[msg.sender].push(auctionId);
        
        emit AuctionCreated(
            auctionId,
            auctionAddress,
            msg.sender,
            _nftAddress,
            _tokenId,
            _startTime,
            _endTime,
            _paymentToken
        );
        
        return auctionAddress;
    }
    
    // 通过拍卖ID获取对应的拍卖合约地址
    function getAuction(uint256 _auctionId) external view override returns (address) {
        return auctions[_auctionId];
    }
    
    function getAuctionsCount() external view override returns (uint256) {
        return auctionCount;
    }
    
    function getUserAuctions(address user) external view returns (uint256[] memory) {
        return userAuctions[user];
    }
    
    // 允许合约所有者更新信标的实现地址，从而升级所有通过该信标创建的拍卖合约。
    // 它调用信标合约的 upgradeTo 方法，将其指向一个新的 Auction 逻辑合约地址。
    // 一旦执行，所有通过这个工厂创建的 BeaconProxy 拍卖合约，在下次被调用时，都会自动使用新的逻辑代码。 无需对成千上万个拍卖合约进行单独升级。
    function updateBeacon(address newImplementation) external onlyOwner {
        beacon.upgradeTo(newImplementation);
    }
}