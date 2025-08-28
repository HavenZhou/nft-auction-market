require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-verify"); // 添加这行
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      // 增加超时配置
      timeout: 120000, // 120秒
      gas: "auto",
      gasPrice: "auto",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    seller: {
      default: 1,
    },
    bidder1: {
      default: 2,
    },
    bidder2: {
      default: 3,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
    gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
  },
  mocha: {
    timeout: 40000,
  },
};