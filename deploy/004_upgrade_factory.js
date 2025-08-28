const { ethers, upgrades } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  // 获取代理合约的地址
  const factoryProxyAddress = (await get("AuctionFactory")).address;

  // 使用 upgrades.upgradeProxy 来升级合约
  console.log("Upgrading AuctionFactory to V2...");
  
  const AuctionFactoryV2 = await ethers.getContractFactory("AuctionFactoryV2");
  const upgradedProxy = await upgrades.upgradeProxy(factoryProxyAddress, AuctionFactoryV2,{
    timeout: 120000,
    pollingInterval: 10000,
  });
  
  console.log("AuctionFactory upgraded to V2");
  console.log("New implementation address:", await upgrades.erc1967.getImplementationAddress(upgradedProxy.target));
};

module.exports.tags = ["AuctionFactoryUpgrade"];
module.exports.dependencies = ["AuctionFactory"];