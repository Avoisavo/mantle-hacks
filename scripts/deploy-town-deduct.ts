import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import { TOWN_TOKEN_NATIVE_ADDRESS } from "../utils/address.js";

const RPC = "https://rpc.sepolia.mantle.xyz";
const TOWN_TOKEN_ADDRESS = TOWN_TOKEN_NATIVE_ADDRESS;

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env.local");

    const provider = new ethers.providers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} MNT`);

    const abi = JSON.parse(readFileSync("./scripts/TownDeductNative.abi.json", "utf8"));
    const bytecode = readFileSync("./scripts/TownDeductNative.bin.json", "utf8").trim();

    console.log(`\nDeploying TownDeductNative...`);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(TOWN_TOKEN_ADDRESS);
    
    console.log(`Waiting for deployment to ${contract.address}...`);
    await contract.deployed();

    console.log(`\n========================================`);
    console.log(`✅ Deployment Successful!`);
    console.log(`========================================`);
    console.log(`TownDeductNative: ${contract.address}`);
    console.log(`TOWN Token:       ${TOWN_TOKEN_ADDRESS}`);
    console.log(`========================================`);
    console.log(`\nView on Mantle Explorer: https://sepolia.mantlescan.xyz/address/${contract.address}`);
}

main().catch(console.error);
