const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");

describe("Factory Upgrade", function () {
  let factory, factoryV2;
  let owner, user;

  beforeEach(async function () {
    [owner, user,seller] = await ethers.getSigners();

    // Deploy NFT
    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy();
    await nft.waitForDeployment(); // 等待部署完成
    console.log("NFT deployed to:", nft.target);
    
    // Mint NFT to seller
    await nft.connect(owner).mint(seller.address);
    const tokenId = await nft.currentTokenId();
    console.log("Minted NFT with tokenId:", tokenId);

    // Deploy Auction implementation first
    const Auction = await ethers.getContractFactory("Auction");
    const auctionImpl = await Auction.deploy();
    await auctionImpl.waitForDeployment();

    // Deploy V1 factory
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    factory = await upgrades.deployProxy(AuctionFactory, [auctionImpl.target], {
      initializer: "initialize",
    });
    await factory.waitForDeployment();
    const logicAddress = await upgrades.erc1967.getImplementationAddress(factory.target);
    console.log("V1当前逻辑合约地址:", logicAddress);

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
  });

  it("Should upgrade to V2", async function () {
    // Deploy V2 implementation
    const AuctionFactoryV2 = await ethers.getContractFactory("AuctionFactoryV2");
    
    // Upgrade the proxy
    factoryV2 = await upgrades.upgradeProxy(factory.target, AuctionFactoryV2);
    await factoryV2.waitForDeployment();
    const logicAddress = await upgrades.erc1967.getImplementationAddress(factoryV2.target);
    console.log("V2当前逻辑合约地址:", logicAddress);
    // Verify it's still the same address
    expect(factoryV2.target).to.equal(factory.target);

    // Test new V2 functionality
    await factoryV2.connect(owner).setFeaturedAuction(1, true);
    expect(await factoryV2.isFeaturedAuction(1)).to.be.true;

    const featuredAuctions = await factoryV2.getFeaturedAuctions();
    expect(featuredAuctions.length).to.equal(1);
    expect(featuredAuctions[0]).to.equal(1);
  });

  it("Should preserve state after upgrade", async function () {
    // Create some auctions first
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const nft = await MyNFT.deploy();
    await nft.waitForDeployment();

    await nft.connect(owner).mint(owner.address);
    const tokenId = await nft.currentTokenId();

    // Create auction
    const currentBlock = await ethers.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    const startTime = currentTimestamp + 2; // 
    const endTime = startTime + 10; // 10 seconds auction

    await nft.connect(owner).approve(factory.target, tokenId);
    await factory.connect(owner).createAuction(
      nft.target,
      tokenId,
      startTime,
      endTime,
      ethers.ZeroAddress
    );

    const auctionCountBefore = await factory.getAuctionsCount();

    // Upgrade to V2
    const AuctionFactoryV2 = await ethers.getContractFactory("AuctionFactoryV2");
    factoryV2 = await upgrades.upgradeProxy(factory.target, AuctionFactoryV2);

    // Verify state is preserved
    expect(await factoryV2.getAuctionsCount()).to.equal(auctionCountBefore);
    expect(await factoryV2.getAuction(1)).to.not.equal(ethers.ZeroAddress);

    // Test that old functionality still works
    await nft.connect(owner).mint(owner.address);
    const tokenId2 = await nft.currentTokenId();
    await nft.connect(owner).approve(factoryV2.target, tokenId2);
    
    // Create auction
    const currentBlock2 = await ethers.provider.getBlock("latest");
    const currentTimestamp2 = currentBlock2.timestamp;
    const startTime2 = currentTimestamp2 + 2; // 
    const endTime2 = startTime + 10; // 10 seconds auction

    await factoryV2.connect(owner).createAuction(
      nft.target,
      tokenId2,
      startTime2,
      endTime2,
      ethers.ZeroAddress
    );

    expect(await factoryV2.getAuctionsCount()).to.equal(3);
  });

  it("Should not allow non-owners to call admin functions", async function () {
    // 升级到 V2 首先
    const AuctionFactoryV2 = await ethers.getContractFactory("AuctionFactoryV2");
    factoryV2 = await upgrades.upgradeProxy(factory.target, AuctionFactoryV2);
    
    // 测试非所有者不能调用 setFeaturedAuction
    await expect(
      factoryV2.connect(user).setFeaturedAuction(1, true)
    ).to.be.revertedWithCustomError(factoryV2, "OwnableUnauthorizedAccount");
  });
});