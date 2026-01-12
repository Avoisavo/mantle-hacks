/**
 * Deploy MyNFT contract to Mantle Sepolia and mint the first NFT
 * Run: npx ts-node scripts/deploy-nft-mantle.ts
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Mantle Sepolia RPC
const RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

// NFT Metadata URL - customize this!
const TOKEN_URI = "https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fjdcny.com%2Fbuilding%2Fmanhattan-house%2F&ved=0CBYQjRxqFwoTCMiA8pzshZIDFQAAAAAdAAAAABAH&opi=89978449";

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env.local");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: "mantle-sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} MNT\n`);

    if (balance === 0n) {
        throw new Error("Deployer has no MNT on Mantle Sepolia. Get some from the faucet first.");
    }

    // Load artifact
    const artifact = JSON.parse(readFileSync("./artifacts/contracts/mynft.sol/MyNFT.json", "utf8"));

    // ========== STEP 1: Deploy Contract ==========
    console.log("📦 Deploying MyNFT contract to Mantle Sepolia...");
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`✅ Contract deployed to: ${contractAddress}\n`);

    // ========== STEP 2: Mint First NFT ==========
    console.log("🎨 Minting first NFT...");
    console.log(`   To: ${wallet.address}`);
    console.log(`   Token URI: ${TOKEN_URI}`);

    const tx = await contract.mint(wallet.address, TOKEN_URI);
    console.log(`   Transaction: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`   Confirmed in block: ${receipt.blockNumber}`);

    const tokenId = 0; // First token is always ID 0

    // ========== Summary ==========
    console.log("\n" + "=".repeat(50));
    console.log("🎉 SUCCESS!");
    console.log("=".repeat(50));
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Owner: ${wallet.address}`);
    console.log(`\nView on Mantle Explorer: https://sepolia.mantlescan.xyz/address/${contractAddress}`);
    console.log(`Token page: https://sepolia.mantlescan.xyz/token/${contractAddress}/instance/${tokenId}`);
}

main().catch(console.error);
