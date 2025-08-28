const { ethers } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying MyNFT contract...");
  const myNFT = await deploy("MyNFT", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`MyNFT deployed at: ${myNFT.address}`);
};

module.exports.tags = ["MyNFT"];