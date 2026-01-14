/**
 * Deploy KYCRegistry contract to Mantle Sepolia
 * Run: npx ts-node scripts/deploy-kyc.ts
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Mantle Sepolia RPC
const RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

async function main() {
    const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
    const relayKey = process.env.RELAY_PRIVATE_KEY;

    if (!deployerKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env.local");
    if (!relayKey) throw new Error("RELAY_PRIVATE_KEY not set in .env.local");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: "mantle-sepolia" });

    // Use relay wallet as deployer so it becomes the owner
    // This ensures the relay can call setApproved() which has onlyOwner modifier
    const relayWallet = new ethers.Wallet(relayKey, provider);

    console.log(`\n🚀 Deploying KYCRegistry to Mantle Sepolia`);
    console.log(`Deployer (Relay Wallet): ${relayWallet.address}`);
    console.log(`This wallet will be the contract owner and signer.\n`);

    const balance = await provider.getBalance(relayWallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} MNT\n`);

    if (balance === 0n) {
        throw new Error("Relay wallet has no MNT on Mantle Sepolia. Get some from the faucet first.");
    }

    // Load artifact
    const artifact = JSON.parse(readFileSync("./artifacts/contracts/KYCRegistry.sol/KYCRegistry.json", "utf8"));

    // ========== Deploy Contract ==========
    console.log("📦 Deploying KYCRegistry contract...");
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, relayWallet);

    // Deploy with relay wallet address as the signer
    const contract = await factory.deploy(relayWallet.address);
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`✅ Contract deployed to: ${contractAddress}\n`);

    // ========== Summary ==========
    console.log("=".repeat(70));
    console.log("🎉 DEPLOYMENT SUCCESS!");
    console.log("=".repeat(70));
    console.log(`KYCRegistry Address: ${contractAddress}`);
    console.log(`Owner Address: ${relayWallet.address}`);
    console.log(`Signer Address: ${relayWallet.address}`);
    console.log(`\nView on Mantle Explorer: https://sepolia.mantlescan.xyz/address/${contractAddress}`);

    console.log("\n📝 Add this to your .env.local:");
    console.log(`NEXT_PUBLIC_KYC_REGISTRY_ADDRESS=${contractAddress}`);
    console.log(`KYC_SIGNER_ADDRESS=${relayWallet.address}\n`);
}

main().catch(console.error);
