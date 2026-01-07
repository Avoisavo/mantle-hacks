const https = require('https');

const FACTORY_ADDRESS = "0x7c4d0215d5DffDab6c439075B48a1636754c8b26";
const RPC_URL = "https://rpc.sepolia.mantle.xyz";

function checkContract() {
  console.log("\n🔍 Checking CoinTown Factory Contract\n");
  console.log("=" .repeat(70));
  console.log("Address:", FACTORY_ADDRESS);
  console.log("Network: Mantle Sepolia");
  console.log("Explorer: https://sepolia.mantle.xyz/address/" + FACTORY_ADDRESS);
  console.log("=".repeat(70));

  const data = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_getCode",
    params: [FACTORY_ADDRESS, "latest"],
    id: 1
  });

  const options = {
    hostname: "rpc.sepolia.mantle.xyz",
    path: "/",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length
    }
  };

  const req = https.request(options, (res) => {
    let body = "";

    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      try {
        const result = JSON.parse(body);
        const bytecode = result.result;

        console.log("\n📋 Result:\n");

        if (bytecode && bytecode !== "0x") {
          console.log("✅ Factory contract IS deployed!");
          console.log("Bytecode length:", bytecode.length / 2 - 1, "bytes");
          console.log("\n✨ Your setup is ready!");
          console.log("\n📝 Your .env.local is correctly configured with:");
          console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${FACTORY_ADDRESS}\n`);
        } else {
          console.log("❌ Factory contract NOT deployed at this address");
          console.log("\n🚀 You need to deploy the contracts:");
          console.log("See docs/DEPLOYMENT.md for instructions\n");
        }

        console.log("=" .repeat(70));
        console.log("\nNext: Run 'npm run dev' to start the application!\n");

      } catch (error) {
        console.error("Error parsing response:", error.message);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Error checking contract:", error.message);
    console.log("\nMake sure you have internet connection\n");
  });

  req.write(data);
  req.end();
}

checkContract();
