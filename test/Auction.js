const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function () {
  let nft, auction, factory;
  let owner, seller, bidder1, bidder2;

  beforeEach(async function () {
    [owner, seller, bidder1, bidder2] = await ethers.getSigners();
    console.log("Owner address:", owner.address);
    console.log("Seller address:", seller.address);
    console.log("Bidder1 address:", bidder1.address);
    console.log("Bidder2 address:", bidder2.address);

    // Deploy NFT
    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy();
    await nft.waitForDeployment(); // 等待部署完成
    console.log("NFT deployed to:", nft.target);
    
    // Mint NFT to seller
    await nft.connect(owner).mint(seller.address);
    const tokenId = await nft.currentTokenId();
    console.log("Minted NFT with tokenId:", tokenId);

    // Deploy Auction implementation
    const Auction = await ethers.getContractFactory("Auction");
    const auctionImpl = await Auction.deploy();
    await auctionImpl.waitForDeployment(); // 等待部署完成
    console.log("Auction implementation deployed to:", auctionImpl.target);

    // Deploy Factory
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    factory = await AuctionFactory.deploy();
    await factory.waitForDeployment(); // 等待部署完成
    await factory.initialize(auctionImpl.target);
    console.log("Factory deployed to:", factory.target);

    // Create auction
    const currentBlock = await ethers.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    const startTime = currentTimestamp + 2; // 
    const endTime = startTime + 10; // 10 seconds auction

    // 授权工厂合约可以转移卖家的 NFT
    await nft.connect(seller).approve(factory.target, tokenId);
    console.log("Approved factory to transfer NFT");

    await factory.connect(seller).createAuction(
      nft.target,
      tokenId,
      startTime,
      endTime,
      ethers.ZeroAddress // ETH auction
    );
    console.log("Auction created");
    const auctionAddress = await factory.getAuction(1);
    auction = await ethers.getContractAt("Auction", auctionAddress);
  });

  it("Should create auction correctly", async function () {
    expect(await auction.seller()).to.equal(seller.address);
    expect(await auction.nftAddress()).to.equal(nft.target);
    expect(await auction.tokenId()).to.equal(1);
    expect(await auction.auctionStatus()).to.equal(0); // ACTIVE
  });

  it("Should accept bids", async function () {
    const bidAmount = ethers.parseEther("1.0");
    console.log("当前时间：", new Date((await ethers.provider.getBlock('latest')).timestamp * 1000).toLocaleString());
    console.log("开始时间：", new Date(Number(await auction.startTime()) * 1000).toLocaleString());
    // Create auction
    const currentBlock = await ethers.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    console.log("1111等待拍卖开始,等待时间5秒");
    await new Promise(resolve => setTimeout(resolve, 1000*3));    // 等待拍卖结束
    await expect(auction.connect(bidder1).placeBid(bidAmount, { value: bidAmount }))
      .to.emit(auction, "BidPlaced");
    
    expect(await auction.getHighestBid()).to.equal(bidAmount);
    console.log("最高出价地址：", await auction.getHighestBidder());
    expect(await auction.getHighestBidder()).to.equal(bidder1.address);
  });

  it("Should reject lower bids", async function () {
    const bidAmount1 = ethers.parseEther("1.0");
    const bidAmount2 = ethers.parseEther("1.5");
    console.log("2222等待拍卖开始,等待时间5秒");
    await new Promise(resolve => setTimeout(resolve, 1000*3));    // 等待拍卖结束

    await auction.connect(bidder1).placeBid(bidAmount1, { value: bidAmount1 });
    
    await expect(auction.connect(bidder2).placeBid(bidAmount2, { value: bidAmount2 }));
  });

  it("Should end auction and transfer NFT", async function () {
    const bidAmount = ethers.parseEther("1.0");
    console.log("等待333拍卖开始,等待时间5秒");
    await new Promise(resolve => setTimeout(resolve, 1000*3));    // 等待拍卖结束

    await auction.connect(bidder1).placeBid(bidAmount, { value: bidAmount });
    console.log("拍卖结束时间：", new Date(Number(await auction.endTime()) * 1000).toLocaleString());

    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");
    
    await auction.connect(seller).endAuction();
    
    expect(await auction.auctionStatus()).to.equal(1); // ENDED
    expect(await nft.ownerOf(1)).to.equal(bidder1.address);
  });
});