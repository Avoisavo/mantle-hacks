const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Generate a random private key and save it to deployments/wallet.json
 * This will be used as the deployer wallet for smart accounts
 */
function generateWallet() {
  // Generate random private key
  const privateKey = "0x" + crypto.randomBytes(32).toString("hex");

  const walletData = {
    privateKey,
    address: null, // Will be filled after deriving address
    createdAt: new Date().toISOString(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save wallet data
  const walletPath = path.join(deploymentsDir, "wallet.json");
  fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));

  console.log("✅ Generated deployer wallet!");
  console.log("📁 Saved to:", walletPath);
  console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
  console.log("1. Never commit deployments/wallet.json to git!");
  console.log("2. Add 'deployments/' to your .gitignore");
  console.log("3. Use a funded wallet on Mantle Sepolia for deployments");
  console.log("4. Keep this private key secure!\n");

  console.log("Private Key:", privateKey);
  console.log("\nAdd this to your .env.local:");
  console.log(`DEPLOYER_PRIVATE_KEY=${privateKey}`);

  return privateKey;
}

/**
 * Derive address from private key (requires ethers or web3)
 * For now, this is a placeholder
 */
function deriveAddress(privateKey) {
  console.log("\n📝 To derive the address from this private key:");
  console.log("1. Install ethers: npm install ethers");
  console.log("2. Run: node -e \"const ethers = require('ethers'); const wallet = new ethers.Wallet('" + privateKey + "'); console.log('Address:', wallet.address);\"\n");
}

// Run if called directly
if (require.main === module) {
  const privateKey = generateWallet();
  deriveAddress(privateKey);
}

module.exports = { generateWallet };
