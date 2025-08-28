const { ethers } = require("hardhat");

async function main() {
  const [bidder] = await ethers.getSigners();
  
  const auctionAddress = process.env.AUCTION_ADDRESS;
  const bidAmount = ethers.utils.parseEther(process.env.BID_AMOUNT || "1.0");
  
  const auction = await ethers.getContractAt("Auction", auctionAddress);
  
  // Check auction status
  const status = await auction.status();
  if (status !== 0) { // 0 = ACTIVE
    console.log("Auction is not active");
    return;
  }
  
  const paymentToken = await auction.paymentToken();
  let tx;
  
  if (paymentToken === ethers.constants.AddressZero) {
    // ETH bid
    console.log(`Placing ETH bid of ${ethers.utils.formatEther(bidAmount)} ETH...`);
    tx = await auction.connect(bidder).placeBid(bidAmount, { value: bidAmount });
  } else {
    // ERC20 bid
    console.log(`Placing ERC20 bid of ${ethers.utils.formatEther(bidAmount)} tokens...`);
    
    // First approve the auction contract to spend tokens
    const token = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", paymentToken);
    await token.connect(bidder).approve(auctionAddress, bidAmount);
    
    tx = await auction.connect(bidder).placeBid(bidAmount);
  }
  
  const receipt = await tx.wait();
  const bidPlacedEvent = receipt.events.find(e => e.event === "BidPlaced");
  
  if (bidPlacedEvent) {
    console.log("Bid placed successfully!");
    console.log(`Bidder: ${bidPlacedEvent.args.bidder}`);
    console.log(`Amount: ${ethers.utils.formatEther(bidPlacedEvent.args.amount)}`);
    console.log(`Bid Type: ${bidPlacedEvent.args.bidType === 0 ? "ETH" : "ERC20"}`);
  } else {
    console.log("Bid placed but event not found");
  }
  
  // Check new highest bid
  const highestBid = await auction.getHighestBid();
  const highestBidder = await auction.getHighestBidder();
  
  console.log(`Current highest bid: ${ethers.utils.formatEther(highestBid)}`);
  console.log(`Current highest bidder: ${highestBidder}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});