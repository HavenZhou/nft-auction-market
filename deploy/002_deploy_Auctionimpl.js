// deploy/001_deploy_implementation.js
module.exports = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying Auction implementation...");
  const auctionImpl = await deploy("AuctionImpl", {
    from: deployer,
    contract: "Auction", // 明确指定合约名称
    log: true,
    args: [], // 如果有构造函数参数，在这里添加
  });

  console.log("Auction deployed to:", auctionImpl.address);
  return auctionImpl.address;
};

module.exports.tags = ["AuctionImpl"];