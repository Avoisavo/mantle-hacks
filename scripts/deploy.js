const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying CoinTown Smart Contracts to Mantle Sepolia\n");
  console.log("=" .repeat(70));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MNT");

  if (balance === 0n) {
    console.log("\n❌ Insufficient balance!");
    console.log("Get testnet MNT from: https://faucet.mantle.xyz/");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(70));

  // Deploy EntryPoint (if not already deployed)
  // For most networks, EntryPoint is already deployed at 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  console.log("\n✅ EntryPoint (pre-deployed):", ENTRY_POINT_ADDRESS);

  // Deploy SimpleAccount
  console.log("\n📦 Deploying SimpleAccount...");
  const SimpleAccount = await hre.ethers.getContractFactory("SimpleAccount");
  const simpleAccount = await SimpleAccount.deploy(ENTRY_POINT_ADDRESS, deployer.address);
  await simpleAccount.waitForDeployment();
  const simpleAccountAddress = await simpleAccount.getAddress();
  console.log("✅ SimpleAccount deployed to:", simpleAccountAddress);

  // Deploy SimpleAccountFactory
  console.log("\n📦 Deploying SimpleAccountFactory...");
  const SimpleAccountFactory = await hre.ethers.getContractFactory("SimpleAccountFactory");
  const factory = await SimpleAccountFactory.deploy(ENTRY_POINT_ADDRESS);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ SimpleAccountFactory deployed to:", factoryAddress);

  console.log("\n" + "=".repeat(70));
  console.log("\n✅ Deployment Complete!\n");

  // Save deployment info
  const deployment = {
    network: "mantle-sepolia",
    chainId: 5003,
    deployer: deployer.address,
    entryPoint: ENTRY_POINT_ADDRESS,
    simpleAccount: simpleAccountAddress,
    factory: factoryAddress,
    deployedAt: new Date().toISOString(),
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, "mantle-sepolia.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);

  console.log("\n📝 Add this to your .env.local:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}\n`);

  console.log("🔍 Verify on Explorer:");
  console.log(`${hre.network.config.blockExplorers.default.url}/address/${factoryAddress}\n`);

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
