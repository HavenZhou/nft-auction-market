const { ethers } = require("hardhat");

async function main() {
  console.log("Minting NFT on Sepolia...");
  
  const nftAddress = process.env.NFT_ADDRESS;
  if (!nftAddress) {
    console.error("Please set NFT_ADDRESS in .env file");
    process.exit(1);
  }
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
    // 检查账户余额的替代方案
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log("Balance:", balanceInEth, "ETH");

    // 直接比较数值（更简单的方法）
    if (parseFloat(balanceInEth) < 0.01) {
    console.error("Insufficient balance for transaction");
    console.error("Current:", balanceInEth, "ETH");
    console.error("Required at least: 0.01 ETH");
    process.exit(1);
    }
  
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.attach(nftAddress);
  
  console.log("Minting NFT to:", deployer.address);
  
  try {
    // 估计gas
    const gasEstimate = await nft.mint.estimateGas(deployer.address);
    console.log("Estimated gas:", gasEstimate.toString());

    // 发送交易
    const tx = await nft.mint(deployer.address);
    
    console.log("Transaction sent. Waiting for confirmation...");
    console.log("Transaction hash:", tx.hash);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // 获取交易详情
    const txDetails = await ethers.provider.getTransaction(tx.hash);
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Gas price:", ethers.formatUnits(txDetails.gasPrice, "gwei"), "Gwei");
    
    const tokenId = await nft.currentTokenId();
    console.log("Minted NFT with token ID:", tokenId.toString());
    
    // 更新环境变量
    const fs = require('fs');
    if (fs.existsSync('.env')) {
      let envContent = fs.readFileSync('.env', 'utf8');
      
      // 移除旧的 TOKEN_ID（如果存在）
      envContent = envContent.replace(/TOKEN_ID=.*\n/g, '');
      
      // 添加新的 TOKEN_ID
      envContent += `\nTOKEN_ID=${tokenId.toString()}`;
      
      fs.writeFileSync('.env', envContent);
      console.log("Updated .env file with TOKEN_ID");
    }
    
  } catch (error) {
    console.error("Error minting NFT:", error);
    
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
    
    if (error.reason) {
      console.error("Error reason:", error.reason);
    }
    
    process.exit(1);
  }
}

main().catch(console.error);