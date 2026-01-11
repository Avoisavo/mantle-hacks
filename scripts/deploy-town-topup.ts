/**
 * Deploy TownTopUp contract to Mantle Sepolia
 * 
 * Run: npx hardhat run scripts/deploy-town-topup.ts --network mantleSepolia
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MANTLE_SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";

async function main() {
    console.log("\n🚀 Deploying TownTopUp to Mantle Sepolia\n");
    console.log("=".repeat(50));

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("❌ DEPLOYER_PRIVATE_KEY not set in .env.local");
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA_RPC, {
        chainId: 5003,
        name: "mantle-sepolia"
    });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`📍 Deployer address: ${wallet.address}`);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} MNT`);

    if (balance === 0n) {
        throw new Error("❌ Deployer has no MNT. Get testnet tokens from https://faucet.sepolia.mantle.xyz/");
    }

    // Read compiled artifact
    const artifactPath = "./artifacts/build-info";
    let artifact;
    try {
        const buildInfoDir = readFileSync("./artifacts/contracts/towntopup.sol/TownTopUp.json", "utf8");
        artifact = JSON.parse(buildInfoDir);
    } catch (error) {
        throw new Error("❌ Contract not compiled. Run 'npx hardhat build' first");
    }

    console.log("\n📦 Deploying TownTopUp...\n");

    // Create contract factory
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    // Deploy
    const townTopUp = await factory.deploy();
    await townTopUp.waitForDeployment();

    const townTopUpAddress = await townTopUp.getAddress();
    console.log(`✅ TownTopUp deployed to: ${townTopUpAddress}`);

    // Get TownToken address
    const townTokenAddress = await townTopUp.town();
    console.log(`✅ TownToken deployed to: ${townTokenAddress}`);

    // Get rate
    const rate = await townTopUp.RATE();
    console.log(`📊 Exchange rate: 1 MNT = ${rate} TOWN`);

    console.log("\n" + "=".repeat(50));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(50));
    console.log(`TownTopUp:   ${townTopUpAddress}`);
    console.log(`TownToken:   ${townTokenAddress}`);
    console.log(`Owner:       ${wallet.address}`);
    console.log(`Rate:        1 MNT = ${rate} TOWN`);
    console.log("=".repeat(50));

    console.log("\n🔗 View on Explorer:");
    console.log(`   TownTopUp: https://sepolia.mantlescan.xyz/address/${townTopUpAddress}`);
    console.log(`   TownToken: https://sepolia.mantlescan.xyz/address/${townTokenAddress}`);

    console.log("\n📝 Add these to your .env.local:");
    console.log(`   TOWN_TOPUP_ADDRESS=${townTopUpAddress}`);
    console.log(`   TOWN_TOKEN_ADDRESS=${townTokenAddress}`);

    console.log("\n✅ Deployment complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error.message);
        process.exit(1);
    });
