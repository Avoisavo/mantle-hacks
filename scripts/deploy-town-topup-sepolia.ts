/**
 * Deploy TownTopUpERC20 contract to Ethereum Sepolia
 * This version accepts SepoliaMNT (ERC20) tokens for TOWN
 * 
 * Run: npx ts-node scripts/deploy-town-topup-sepolia.ts
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Ethereum Sepolia RPC
const RPC = "https://ethereum-sepolia-rpc.publicnode.com";

// SepoliaMNT token address on Ethereum Sepolia
const SEPOLIA_MNT_TOKEN = "0x65e37B558F64E2Be5768DB46DF22F93d85741A9E";

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env.local");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: 11155111, name: "sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        throw new Error("Deployer has no ETH on Sepolia. Get some from a faucet first.");
    }

    // Load artifact
    const artifactPath = "./artifacts/contracts/TownTopUpERC20.sol/TownTopUpERC20.json";
    let artifact;
    try {
        artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    } catch (e) {
        throw new Error(`Artifact not found. Run 'npx hardhat compile' first.`);
    }

    console.log(`\nDeploying TownTopUpERC20 with SepoliaMNT: ${SEPOLIA_MNT_TOKEN}...`);

    // Deploy with SepoliaMNT address as constructor argument
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy(SEPOLIA_MNT_TOKEN);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const townToken = await (contract as any).town();
    const paymentToken = await (contract as any).paymentToken();
    const rate = await (contract as any).RATE();

    console.log(`\n========================================`);
    console.log(`✅ Deployment Successful!`);
    console.log(`========================================`);
    console.log(`TownTopUpERC20: ${address}`);
    console.log(`TownToken:      ${townToken}`);
    console.log(`PaymentToken:   ${paymentToken} (SepoliaMNT)`);
    console.log(`Rate:           1 SepoliaMNT = ${rate} TOWN`);
    console.log(`========================================`);
    console.log(`\nUpdate your utils/address.ts with:`);
    console.log(`export const TOWN_TOPUP_ERC20_ADDRESS = "${address}";`);
    console.log(`export const TOWN_TOKEN_SEPOLIA_ADDRESS = "${townToken}";`);
}

main().catch(console.error);
