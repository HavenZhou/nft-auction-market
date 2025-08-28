const { ethers } = require("hardhat");

async function main() {
  const [caller] = await ethers.getSigners();
  
  const auctionAddress = process.env.AUCTION_ADDRESS;
  const auction = await ethers.getContractAt("Auction", auctionAddress);
  
  // Check auction status
  const status = await auction.status();
  if (status !== 0) { // 0 = ACTIVE
    console.log("Auction is already ended or cancelled");
    return;
  }
  
  // Check if auction has ended
  const endTime = await auction.endTime();
  const currentTime = Math.floor(Date.now() / 1000);
  
  if (currentTime < endTime) {
    // Only seller can end auction early
    const seller = await auction.seller();
    if (caller.address !== seller) {
      console.log("Only seller can end auction early");
      return;
    }
    console.log("Ending auction early...");
  } else {
    console.log("Auction has ended, finalizing...");
  }
  
  // End the auction
  const tx = await auction.connect(caller).endAuction();
  const receipt = await tx.wait();
  
  const auctionEndedEvent = receipt.events.find(e => e.event === "AuctionEnded");
  
  if (auctionEndedEvent) {
    console.log("Auction ended successfully!");
    console.log(`Winner: ${auctionEndedEvent.args.winner}`);
    console.log(`Winning bid: ${ethers.utils.formatEther(auctionEndedEvent.args.winningBid)}`);
    
    // Check NFT ownership
    const nftAddress = await auction.nftAddress();
    const tokenId = await auction.tokenId();
    const nft = await ethers.getContractAt("IERC721", nftAddress);
    
    const owner = await nft.ownerOf(tokenId);
    console.log(`NFT owner: ${owner}`);
    
    if (auctionEndedEvent.args.winner !== ethers.constants.AddressZero) {
      console.log(`NFT transferred to winner: ${owner === auctionEndedEvent.args.winner}`);
    } else {
      console.log("No bids placed, NFT returned to seller");
    }
  }
  
  // Verify auction status
  const newStatus = await auction.status();
  console.log(`Auction status: ${newStatus === 0 ? "ACTIVE" : newStatus === 1 ? "ENDED" : "CANCELLED"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});