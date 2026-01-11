/**
 * Deploy MyNFT contract to Sepolia
 * Run: npx hardhat run scripts/deploy-nft.ts --network sepolia
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RPC = "https://rpc.sepolia.org";

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: 11155111, name: "sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}`);
    console.log("Deploying MyNFT contract...");

    // Load artifact
    const artifact = JSON.parse(readFileSync("./artifacts/contracts/mynft.sol/MyNFT.json", "utf8"));

    // Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`\nMyNFT deployed to: ${address}`);
}

main().catch(console.error);
