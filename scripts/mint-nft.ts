/**
 * Mint an NFT from MyNFT contract on Sepolia
 * Run: npx hardhat run scripts/mint-nft.ts --network sepolia
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const NFT_CONTRACT = "0x1e62daaf56f25b6d6d38fe14f2FE75E3a437b7CA";

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: 11155111, name: "sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Minting from: ${wallet.address}`);

    // Load artifact
    const artifact = JSON.parse(readFileSync("./artifacts/contracts/mynft.sol/MyNFT.json", "utf8"));

    // Connect to contract
    const contract = new ethers.Contract(NFT_CONTRACT, artifact.abi, wallet);

    // Mint NFT to yourself with a sample tokenURI
    const tokenURI = "https://example.com/nft/0.json";  // You can replace this with your metadata URL
    const recipientAddress = wallet.address;  // Mint to yourself

    console.log(`Minting NFT to: ${recipientAddress}`);
    console.log(`Token URI: ${tokenURI}`);

    const tx = await contract.mint(recipientAddress, tokenURI);
    console.log(`Transaction hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

    // Get the token ID from the current nextTokenId (it was the value before increment)
    const nextTokenId = await contract.nextTokenId();
    const mintedTokenId = Number(nextTokenId) - 1;

    console.log(`\n✅ NFT minted successfully!`);
    console.log(`Token ID: ${mintedTokenId}`);
    console.log(`Owner: ${recipientAddress}`);
    console.log(`View on OpenSea: https://testnets.opensea.io/assets/sepolia/${NFT_CONTRACT}/${mintedTokenId}`);
}

main().catch(console.error);
