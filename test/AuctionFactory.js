const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * AuctionFactory 测试
 * 本地部署账号地址使用address,
 * 部署合约使用target
 */
describe("AuctionFactory", function () {
  let nft, auctionImpl, factory;
  let owner, seller, user1;

  beforeEach(async function () {
    [owner, seller, user1] = await ethers.getSigners();

    // Deploy NFT
    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy();
    await nft.waitForDeployment();

    // Deploy Auction implementation
    const Auction = await ethers.getContractFactory("Auction");
    const auctionImpl = await Auction.deploy();
    await auctionImpl.waitForDeployment(); // 等待部署完成
    console.log("Auction implementation deployed to:", auctionImpl.target);

    // Deploy Factory
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    factory = await AuctionFactory.deploy();
    await factory.waitForDeployment();
    await factory.initialize(auctionImpl.target);
  });

  it("Should initialize correctly", async function () {
    console.log("Factory owner:", await factory.owner());
    console.log("Factory owner target:", await owner.address);
    expect(await factory.owner()).to.equal(await owner.address);
    expect(await factory.getAuctionsCount()).to.equal(0);
  });

  it("Should create auction", async function () {
    // Mint NFT to seller
    await nft.connect(owner).mint(seller.address);
    const tokenId = await nft.currentTokenId();

    //const startTime = Math.floor(Date.now() / 1000);
    //const endTime = startTime + 3600;
    const currentBlock = await ethers.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    const startTime = currentTimestamp + 5; // 
    const endTime = startTime + 10; // 

    // Approve NFT transfer
    await nft.connect(seller).approve(factory.target, tokenId);

    // Create auction,期望测试事件被触发，如果没触发表示失败
    await expect(factory.connect(seller).createAuction(
      nft.target,
      tokenId,
      startTime,
      endTime,
      ethers.ZeroAddress
    )).to.emit(factory, "AuctionCreated");


    expect(await factory.getAuctionsCount()).to.equal(1);
    
    const auctionAddress = await factory.getAuction(1);
    expect(auctionAddress).to.not.equal(ethers.ZeroAddress);

    const userAuctions = await factory.getUserAuctions(seller.address);
    expect(userAuctions.length).to.equal(1);
    expect(userAuctions[0]).to.equal(1);
  });

  it("Should not create auction with invalid parameters", async function () {
    await nft.connect(owner).mint(seller.address);
    const tokenId = await nft.currentTokenId();

    const currentBlock = await ethers.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    const startTime = currentTimestamp + 5; // 
    const endTime = startTime - 100; // 非法的结束时间 

    await nft.connect(seller).approve(factory.target, tokenId);

    await expect(factory.connect(seller).createAuction(
      nft.target,
      tokenId,
      startTime,
      endTime,
      ethers.ZeroAddress
    )).to.be.revertedWith("Invalid time range");
  });

  it("Should update beacon implementation", async function () {
    const newAuctionImpl = await (await ethers.getContractFactory("Auction")).deploy();
    await newAuctionImpl.waitForDeployment();
    console.log("New Auction implementation deployed to:", newAuctionImpl.target);
    console.log("New Auction implementation owner:", owner.address);
    console.log("Factory targe:", await factory.target);
    await factory.connect(owner).updateBeacon(newAuctionImpl.target);
    
    // Verify the beacon was updated
    const beacon = await ethers.getContractAt("UpgradeableBeacon", await factory.beacon());
    expect(await beacon.implementation()).to.equal(newAuctionImpl.target);
  });
});