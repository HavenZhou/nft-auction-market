const { ethers } = require("hardhat");

async function main() {
  const auctionAddress = process.env.AUCTION_ADDRESS;
  const auction = await ethers.getContractAt("Auction", auctionAddress);
  
  console.log("=== Auction Information ===");
  console.log(`Auction ID: ${await auction.auctionId()}`);
  console.log(`Seller: ${await auction.seller()}`);
  console.log(`NFT Address: ${await auction.nftAddress()}`);
  console.log(`Token ID: ${await auction.tokenId()}`);
  console.log(`Start Time: ${new Date((await auction.startTime()).toNumber() * 1000)}`);
  console.log(`End Time: ${new Date((await auction.endTime()).toNumber() * 1000)}`);
  console.log(`Payment Token: ${await auction.paymentToken()}`);
  console.log(`Status: ${await getStatusName(await auction.status())}`);
  console.log(`Highest Bid: ${ethers.utils.formatEther(await auction.getHighestBid())}`);
  console.log(`Highest Bidder: ${await auction.getHighestBidder()}`);
  console.log(`Bid Count: ${await auction.getBidCount()}`);
  
  // Get all bids
  const bidCount = await auction.getBidCount();
  console.log(`\n=== Bids (${bidCount}) ===`);
  
  for (let i = 0; i < bidCount; i++) {
    const bid = await auction.getBid(i);
    console.log(`Bid ${i + 1}:`);
    console.log(`  Bidder: ${bid.bidder}`);
    console.log(`  Amount: ${ethers.utils.formatEther(bid.amount)}`);
    console.log(`  Type: ${bid.bidType === 0 ? "ETH" : "ERC20"}`);
    console.log(`  Time: ${new Date(bid.timestamp.toNumber() * 1000)}`);
  }
}

async function getStatusName(status) {
  const statusNames = ["ACTIVE", "ENDED", "CANCELLED"];
  return statusNames[status] || "UNKNOWN";
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});