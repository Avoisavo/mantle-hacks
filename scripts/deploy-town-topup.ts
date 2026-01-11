/**
 * Deploy TownTopUp contract to Mantle Sepolia
 * Run: npx hardhat run scripts/deploy-town-topup.ts --network mantleSepolia
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: 11155111, name: "sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}`);

    // Load artifact
    const artifact = JSON.parse(readFileSync("./artifacts/contracts/TownTopUp.sol/TownTopUp.json", "utf8"));

    // Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const townToken = await (contract as any).town();
    const rate = await (contract as any).RATE();

    console.log(`\nTownTopUp: ${address}`);
    console.log(`TownToken: ${townToken}`);
    console.log(`Rate: 1 MNT = ${rate} TOWN`);
}

main().catch(console.error);
