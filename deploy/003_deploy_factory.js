// deploy/003_deploy_factory.js
const { ethers, upgrades } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  // 获取实现合约地址
  const auctionImpl = await get("AuctionImpl");
  console.log("Using Auction implementation at:", auctionImpl.address);

  console.log("Deploying AuctionFactory as UUPS proxy...");
  
  // 使用 OpenZeppelin upgrades 部署 UUPS 代理
  const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
  //   关键差异点包括：
  // - 部署结构：deploy直接部署单一合约；deployProxy会部署三个合约（代理、逻辑、代理管理员）
  // - 升级功能：deployProxy部署的合约支持后续升级，deploy的不支持
  // - 存储管理：deployProxy保持存储槽兼容性，deploy会重置存储
  // - 初始化机制：deployProxy用initializer方法，deploy用构造函数
  const factory = await upgrades.deployProxy(
    AuctionFactory,
    [auctionImpl.address],
    {
      initializer: "initialize",
      kind: "uups",
      txOverrides: {
        from: deployer,
        gasLimit: 10000000
      }
    }
  );
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("AuctionFactory deployed to:", factoryAddress);
  
  // 保存部署记录到 hardhat-deploy
  const { save } = deployments;
  await save("AuctionFactory", {
    address: factoryAddress,
    abi: AuctionFactory.interface.formatJson(),
    implementation: await upgrades.erc1967.getImplementationAddress(factoryAddress),
  });
  
  return factoryAddress;
};

module.exports.tags = ["AuctionFactory"];
module.exports.dependencies = ["AuctionImpl"];