/**
 * Deploy MyNFT contract and mint the first NFT
 * Run: npx hardhat run scripts/deploy-and-mint-nft.ts --network sepolia
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";

// ============================================
// 🎨 CUSTOMIZE YOUR NFT HERE
// ============================================

// NFT Collection Name and Symbol (shown on OpenSea/Etherscan)
// To change these, you need to modify the contract in contracts/mynft.sol:
//   constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}
//                        ↑ Name   ↑ Symbol

// NFT Metadata URL - This is where your NFT's name and image come from!
// Host this JSON file online (IPFS, Pinata, or any public URL)
const TOKEN_URI = "https://example.com/nft/metadata.json";

// ============================================

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: 11155111, name: "sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}\n`);

    // Load artifact
    const artifact = JSON.parse(readFileSync("./artifacts/contracts/mynft.sol/MyNFT.json", "utf8"));

    // ========== STEP 1: Deploy Contract ==========
    console.log("📦 Deploying MyNFT contract...");
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
    console.log(`\nView on OpenSea: https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`);
    console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
}

main().catch(console.error);
