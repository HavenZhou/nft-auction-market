const { ethers } = require("hardhat");

async function main() {
  console.log("Debugging NFT contract on Sepolia...");
  
  const nftAddress = process.env.NFT_ADDRESS;
  if (!nftAddress) {
    console.error("Please set NFT_ADDRESS in .env file");
    process.exit(1);
  }
  
  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);
  
  // 检查网络
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  
  // 检查余额 - 使用正确的方式
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  // 检查合约代码
  try {
    const code = await ethers.provider.getCode(nftAddress);
    console.log("Contract code length:", code.length);
    console.log("Is contract deployed?", code !== "0x");
    
    if (code !== "0x") {
      const MyNFT = await ethers.getContractFactory("MyNFT");
      const nft = MyNFT.attach(nftAddress);
      
      // 检查合约所有者
      try {
        const owner = await nft.owner();
        console.log("✅ NFT contract owner:", owner);
        console.log("Is deployer the owner?", owner === deployer.address);
      } catch (e) {
        console.log("⚠️  Cannot get owner (might not have owner function):", e.message);
      }
      
      // 检查当前tokenId
      try {
        const currentTokenId = await nft.currentTokenId();
        console.log("✅ Current token ID:", currentTokenId.toString());
      } catch (e) {
        console.log("⚠️  Cannot get current token ID:", e.message);
      }
      
      // 检查名称和符号
      try {
        const name = await nft.name();
        const symbol = await nft.symbol();
        console.log("✅ NFT Name:", name);
        console.log("✅ NFT Symbol:", symbol);
      } catch (e) {
        console.log("⚠️  Cannot get name/symbol:", e.message);
      }
    } else {
      console.error("❌ Contract not deployed at address:", nftAddress);
      console.log("请确认合约地址是否正确，或重新部署合约");
    }
  } catch (error) {
    console.error("❌ Error checking contract:", error.message);
    
    if (error.code === 'CALL_EXCEPTION') {
      console.log("这可能意味着合约地址不正确或合约未部署");
    }
  }
}

main().catch(error => {
  console.error("❌ Script failed:", error.message);
  process.exit(1);
});