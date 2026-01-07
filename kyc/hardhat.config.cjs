const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const accounts = [];
if (process.env.PRIVATE_KEY) accounts.push(process.env.PRIVATE_KEY);
if (process.env.RELAY_PRIVATE_KEY) accounts.push(process.env.RELAY_PRIVATE_KEY);

const config = {
  solidity: "0.8.17",
  networks: {
    "mantle-sepolia": {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: accounts,
      chainId: 5003
    }
  }
};

module.exports = config;
