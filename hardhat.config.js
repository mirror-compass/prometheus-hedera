require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Hedera Testnet via JSON-RPC Relay
    hederaTestnet: {
      url: process.env.HEDERA_JSON_RPC_URL || "https://testnet.hashio.io/api",
      chainId: 296,
      // Note: For Hedera, we use the Hedera SDK for deployment (scripts/deploy.js)
      // rather than Hardhat's deploy. Hardhat is used for compilation and testing.
    },
    // Local Hardhat network for testing
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
