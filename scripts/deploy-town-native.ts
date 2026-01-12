/**
 * Deploy TownTopUpNative contract to Mantle Sepolia
 * This version accepts native MNT tokens directly
 * 
 * Run: npx ts-node scripts/deploy-town-native.ts
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Mantle Sepolia RPC
const RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env.local");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: "mantle-sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} MNT`);

    if (balance === 0n) {
        throw new Error("Deployer has no MNT on Mantle Sepolia. Get some from a faucet first.");
    }

    // Load artifact
    const artifactPath = "./artifacts/contracts/TownTopUpNative.sol/TownTopUpNative.json";
    let artifact;
    try {
        artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    } catch (e) {
        throw new Error(`Artifact not found. Run 'npx hardhat compile' first.`);
    }

    console.log(`\nDeploying TownTopUpNative (accepts native MNT)...`);

    // Deploy contract (no constructor arguments needed)
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const townToken = await (contract as any).town();
    const rate = await (contract as any).RATE();

    console.log(`\n========================================`);
    console.log(`✅ Deployment Successful!`);
    console.log(`========================================`);
    console.log(`TownTopUpNative: ${address}`);
    console.log(`TownToken:       ${townToken}`);
    console.log(`Rate:            1 MNT = ${rate} TOWN`);
    console.log(`========================================`);
    console.log(`\nView on Mantle Explorer: https://sepolia.mantlescan.xyz/address/${address}`);
    console.log(`\nUpdate your utils/address.ts with:`);
    console.log(`export const TOWN_TOPUP_NATIVE_ADDRESS = "${address}";`);
    console.log(`export const TOWN_TOKEN_NATIVE_ADDRESS = "${townToken}";`);
}

main().catch(console.error);
