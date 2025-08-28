const { ethers } = require("hardhat");

async function main() {
  const [seller] = await ethers.getSigners();
  
  const nftAddress = process.env.NFT_ADDRESS;
  const tokenId = process.env.TOKEN_ID;
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + 86400; // 24 hours
  const paymentToken = process.env.PAYMENT_TOKEN || ethers.constants.AddressZero; // ETH by default
  
  const factory = await ethers.getContractAt("AuctionFactory", process.env.FACTORY_ADDRESS);
  
  // Approve NFT transfer
  const nft = await ethers.getContractAt("MyNFT", nftAddress);
  await nft.connect(seller).approve(factory.address, tokenId);
  
  // Create auction
  const tx = await factory.connect(seller).createAuction(
    nftAddress,
    tokenId,
    startTime,
    endTime,
    paymentToken
  );
  
  const receipt = await tx.wait();
  const auctionCreatedEvent = receipt.events.find(e => e.event === "AuctionCreated");
  const auctionId = auctionCreatedEvent.args.auctionId;
  const auctionAddress = auctionCreatedEvent.args.auctionAddress;
  
  console.log(`Auction created with ID: ${auctionId}`);
  console.log(`Auction address: ${auctionAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});