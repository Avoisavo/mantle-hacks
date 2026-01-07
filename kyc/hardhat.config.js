import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const accounts = [];
if (process.env.PRIVATE_KEY) accounts.push(process.env.PRIVATE_KEY);
if (process.env.RELAY_PRIVATE_KEY) accounts.push(process.env.RELAY_PRIVATE_KEY);

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.20",
  networks: {
    "mantle-sepolia": {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: accounts.length > 0 ? accounts : [],
      chainId: 5003
    }
  }
};

export default config;
