const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Mantle Sepolia configuration
const MANTLE_SEPOLIA = {
  chainId: 5003,
  name: "mantle-sepolia",
  rpcUrl: "https://rpc.sepolia.mantle.xyz",
  explorerUrl: "https://sepolia.mantle.xyz",
};

// EntryPoint address (v0.6.0 on most networks)
// For Mantle Sepolia, we'll use a standard EntryPoint address
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

// Simple Account Bytecode (simplified version)
const SIMPLE_ACCOUNT_BYTECODE = "";
const SIMPLE_ACCOUNT_FACTORY_BYTECODE = "";

async function deploy() {
  console.log("\n🚀 Deploying CoinTown Smart Contracts to Mantle Sepolia\n");
  console.log("=" .repeat(70));

  // Get private key from environment
  const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not found in environment");
    console.log("Please set DEPLOYER_PRIVATE_KEY in your .env.local");
    process.exit(1);
  }

  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("\n📋 Deployment Configuration:");
  console.log("Network:", MANTLE_SEPOLIA.name);
  console.log("Chain ID:", MANTLE_SEPOLIA.chainId);
  console.log("Deployer:", wallet.address);
  console.log("RPC:", MANTLE_SEPOLIA.rpcUrl);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "MNT");

  if (balance === 0n) {
    console.log("\n❌ Insufficient balance!");
    console.log("Get testnet MNT from: https://faucet.mantle.xyz/");
    process.exit(1);
  }

  try {
    // For now, we'll use a simpler approach
    // Deploy minimal proxy factory pattern
    console.log("\n⚠️  Note: Full ERC-4337 contracts require compilation");
    console.log("Using simplified deployment strategy...\n");

    // Create deployment info
    const deployment = {
      network: MANTLE_SEPOLIA.name,
      chainId: MANTLE_SEPOLIA.chainId,
      deployer: wallet.address,
      entryPoint: ENTRY_POINT_ADDRESS,
      simpleAccount: "0x0000000000000000000000000000000000000000",
      factory: "0x0000000000000000000000000000000000000000",
      deployedAt: new Date().toISOString(),
    };

    console.log("📝 Deployment Summary:");
    console.log("-".repeat(70));
    console.log("EntryPoint:", deployment.entryPoint);
    console.log("Factory:", deployment.factory);
    console.log("\n⚠️  Contracts need to be compiled with Hardhat or Foundry");
    console.log("See README for deployment instructions\n");

    // Save deployment info
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, "mantle-sepolia.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

    console.log("💾 Deployment info saved to:", deploymentPath);
    console.log("\n" + "=".repeat(70));

    console.log("\n✨ Next Steps:");
    console.log("1. Install Hardhat: npm install --save-dev hardhat @nomicfoundation/hardhat-ethers");
    console.log("2. Compile contracts: npx hardhat compile");
    console.log("3. Deploy: npx hardhat run scripts/deploy.js --network mantleSepolia");
    console.log("\nOr use Foundry:");
    console.log("1. Install: curl -L https://foundry.paradigm.xyz | bash");
    console.log("2. Deploy: forge script script/Deploy.sb --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY\n");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

deploy()
  .then(() => {
    console.log("✅ Deployment script completed\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
