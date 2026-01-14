import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

const CONTRACTS = [
    { name: "Manhattan House", address: "0x0CBfC37b9346f5Aa39fAaB7dc37330Bfa74D04F6" },
    { name: "Phoenix Suburbs", address: "0x82068a566E4a1aE88FbdeBDbfdbFb8c1c4294B8b" },
    { name: "California Cool", address: "0x3eAfB87575023DBa4537fFC87aC5d7E7537C55fD" },
    { name: "Arkansas Affordable", address: "0xDdcD4075fc8a09Aa8db3Fe6a17640D77Aee22745" }
];

async function main() {
    const CONTRACT_ADDRESS = "0x38b362B18c37243C92aa8A0D4e2127a8dD0EDa1f";
    const provider = new ethers.JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: "mantle-sepolia" });

    // Load artifact
    const artifactPath = "./artifacts/contracts/mynft.sol/MyNFT.json";
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));

    console.log(`Checking metadata for contract: ${CONTRACT_ADDRESS}\n`);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, provider);

    // Check a few tokens
    const tokensToCheck = [0, 15, 31];

    for (const tokenId of tokensToCheck) {
        console.log(`--- Token ID: ${tokenId} ---`);
        try {
            const tokenURI = await contract.tokenURI(tokenId);
            console.log(`Token URI (Raw): ${tokenURI.substring(0, 50)}...`);

            if (tokenURI.startsWith("data:application/json;base64,")) {
                const base64Data = tokenURI.split(",")[1];
                const jsonString = Buffer.from(base64Data, "base64").toString("utf8");
                const metadata = JSON.parse(jsonString);

                console.log("Decoded Metadata:");
                console.log(JSON.stringify(metadata, null, 2));
            } else {
                console.log("Token URI is not base64 encoded JSON.");
            }
        } catch (error) {
            console.error(`Error fetching tokenURI for ${tokenId}:`, error);
        }
        console.log("\n");
    }
}

main().catch(console.error);
