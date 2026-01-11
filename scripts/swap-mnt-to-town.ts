/**
 * Swap MNT to TOWN tokens via TownTopUp contract
 * 
 * Rate: 1 MNT = 50 TOWN (as per TownTopUp.sol)
 * To get 100 TOWN, send 2 MNT
 * 
 * Usage:
 *   npm run swap                    # Swap 1 MNT for 50 TOWN
 *   npm run swap -- --amount 2      # Swap 2 MNT for 100 TOWN
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// ============= CONFIGURATION =============
const MANTLE_SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

// Contract addresses - set these after deployment
const TOWN_TOPUP_ADDRESS = process.env.TOWN_TOPUP_ADDRESS || "0x0000000000000000000000000000000000000000";
const TOWN_TOKEN_ADDRESS = process.env.TOWN_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

// Rate from contract: 1 MNT = 50 TOWN
const RATE = BigInt(50);

// Parse command line args for amount
const cmdArgs = process.argv.slice(2);
const amountIndex = cmdArgs.indexOf("--amount");
const mntAmountInput = amountIndex !== -1 && cmdArgs[amountIndex + 1] ? cmdArgs[amountIndex + 1] : "1";

// TownTopUp ABI
const TOWN_TOPUP_ABI = [
    "function buyTOWN() external payable",
    "function town() external view returns (address)",
    "function RATE() external view returns (uint256)",
    "function owner() external view returns (address)"
];

// TownToken ABI (ERC20)
const TOWN_TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address account) view returns (uint256)",
    "function totalSupply() view returns (uint256)"
];

// ============= MAIN FUNCTION =============
async function swapMNTToTown(): Promise<void> {
    console.log("\n🔄 Swap MNT to TOWN via TownTopUp on Mantle Sepolia\n");
    console.log("=".repeat(50));

    // Validate environment variables
    const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("❌ PRIVATE_KEY or DEPLOYER_PRIVATE_KEY not found in .env.local");
    }

    if (TOWN_TOPUP_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("❌ TOWN_TOPUP_ADDRESS not set. Please deploy TownTopUp first and set it in .env.local");
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA_RPC, {
        chainId: CHAIN_ID,
        name: "mantle-sepolia"
    });

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`📍 Wallet Address: ${wallet.address}`);

    // Calculate amounts
    const mntAmount = ethers.parseEther(mntAmountInput);
    const expectedTown = mntAmount * RATE;

    // Check MNT balance
    const mntBalance = await provider.getBalance(wallet.address);
    console.log(`💰 MNT Balance: ${ethers.formatEther(mntBalance)} MNT`);

    if (mntBalance < mntAmount) {
        throw new Error(`❌ Insufficient MNT balance. Need ${ethers.formatEther(mntAmount)} MNT, have ${ethers.formatEther(mntBalance)} MNT`);
    }

    // Connect to TownTopUp contract
    const topUpContract = new ethers.Contract(TOWN_TOPUP_ADDRESS, TOWN_TOPUP_ABI, wallet);

    // Get TOWN token address from contract (if not set in env)
    let townTokenAddress = TOWN_TOKEN_ADDRESS;
    if (townTokenAddress === "0x0000000000000000000000000000000000000000") {
        try {
            townTokenAddress = await topUpContract.town();
            console.log(`🏘️  TOWN Token Address: ${townTokenAddress}`);
        } catch (error) {
            console.log("⚠️  Could not get TOWN token address from contract");
        }
    }

    // Connect to TOWN token contract
    const townToken = new ethers.Contract(townTokenAddress, TOWN_TOKEN_ABI, wallet);

    // Get current TOWN balance
    let townBalanceBefore = BigInt(0);
    try {
        townBalanceBefore = await townToken.balanceOf(wallet.address);
        console.log(`🏘️  TOWN Balance Before: ${ethers.formatEther(townBalanceBefore)} TOWN`);
    } catch (error) {
        console.log("⚠️  Could not read TOWN balance");
    }

    console.log("\n" + "=".repeat(50));
    console.log("📤 Executing buyTOWN() Transaction...");
    console.log(`   Sending: ${ethers.formatEther(mntAmount)} MNT`);
    console.log(`   Expected: ${ethers.formatEther(expectedTown)} TOWN`);
    console.log("=".repeat(50) + "\n");

    // Call buyTOWN() with MNT value
    const tx = await topUpContract.buyTOWN({ value: mntAmount });
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Get updated balances
    const mntBalanceAfter = await provider.getBalance(wallet.address);
    console.log(`\n💰 MNT Balance After: ${ethers.formatEther(mntBalanceAfter)} MNT`);

    try {
        const townBalanceAfter = await townToken.balanceOf(wallet.address);
        console.log(`🏘️  TOWN Balance After: ${ethers.formatEther(townBalanceAfter)} TOWN`);

        const townReceived = townBalanceAfter - townBalanceBefore;
        console.log(`📈 TOWN Received: ${ethers.formatEther(townReceived)} TOWN`);
    } catch (error) {
        console.log("⚠️  Could not read TOWN balance after swap");
    }

    console.log("\n✅ Swap completed successfully!");
    console.log(`🔗 View on Explorer: https://sepolia.mantlescan.xyz/tx/${tx.hash}`);
}

// ============= RUN SCRIPT =============
swapMNTToTown()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    });
