const { createPublicClient, http } = require("viem");

// Mantle Sepolia config
const MANTLE_SEPOLIA = {
  id: 5003,
  name: "Mantle Sepolia Testnet",
  network: "mantle-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    public: { http: ["https://rpc.sepolia.mantle.xyz"] },
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Sepolia Explorer", url: "https://sepolia.mantle.xyz" },
  },
  testnet: true,
};

async function verifyDeployment() {
  const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x7c4d0215d5DffDab6c439075B48a1636754c8b26";
  const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;

  console.log("\n🔍 Verifying CoinTown Smart Contracts Deployment\n");
  console.log("=" .repeat(60));

  const client = createPublicClient({
    chain: MANTLE_SEPOLIA,
    transport: http(),
  });

  try {
    // Check factory contract bytecode
    console.log("\n📦 Checking Factory Contract...");
    console.log("Address:", FACTORY_ADDRESS);

    const bytecode = await client.getBytecode({
      address: FACTORY_ADDRESS,
    });

    if (bytecode && bytecode !== "0x") {
      console.log("✅ Factory contract is deployed!");
      console.log("Bytecode length:", bytecode.length / 2 - 1, "bytes");
    } else {
      console.log("❌ Factory contract NOT found at this address");
      console.log("📝 You need to deploy the SimpleAccountFactory contract");
    }

    // Check deployer wallet
    if (DEPLOYER_KEY) {
      console.log("\n💼 Deployer Wallet:");
      console.log("Private Key:", DEPLOYER_KEY.slice(0, 10) + "..." + DEPLOYER_KEY.slice(-6));

      // Derive address from private key
      const { privateKeyToAccount } = require("viem/accounts");
      const account = privateKeyToAccount(DEPLOYER_KEY);
      console.log("Address:", account.address);

      // Check balance
      const balance = await client.getBalance({
        address: account.address,
      });
      console.log("Balance:", balance.toString(), "wei");
      console.log("Balance in MNT:", (Number(balance) / 1e18).toFixed(4), "MNT");

      if (balance === 0n) {
        console.log("\n⚠️  WARNING: Deployer wallet has no MNT!");
        console.log("Get testnet MNT from: https://faucet.mantle.xyz/");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✨ Setup Complete!");
    console.log("\n📝 Your .env.local should have:");
    console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${FACTORY_ADDRESS}`);
    console.log(`DEPLOYER_PRIVATE_KEY=${DEPLOYER_KEY?.slice(0, 10)}...${DEPLOYER_KEY?.slice(-6)}`);
    console.log("\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\nMake sure Mantle Sepolia RPC is accessible");
  }
}

verifyDeployment();
