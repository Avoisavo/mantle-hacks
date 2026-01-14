import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

// Check the first contract: Manhattan House
const CONTRACT_ADDRESS = "0x0CBfC37b9346f5Aa39fAaB7dc37330Bfa74D04F6";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: "mantle-sepolia" });

    // Load artifact
    const artifactPath = "./artifacts/contracts/mynft.sol/MyNFT.json";
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));

    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, provider);

    console.log(`Checking contract: ${CONTRACT_ADDRESS}`);

    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);

    const tokenId = 0;
    try {
        const tokenURI = await contract.tokenURI(tokenId);
        if (tokenURI.startsWith("data:application/json;base64,")) {
            const base64Data = tokenURI.replace("data:application/json;base64,", "");
            const jsonString = Buffer.from(base64Data, "base64").toString("utf8");
            const metadata = JSON.parse(jsonString);
            console.log("Metadata Name:", metadata.name);
        }
    } catch (e) {
        console.log("Error fetching token URI:", e);
    }
}

main().catch(console.error);
