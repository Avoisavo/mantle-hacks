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
    const provider = new ethers.JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: "mantle-sepolia" });

    // Load artifact
    const artifactPath = "./artifacts/contracts/mynft.sol/MyNFT.json";
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));

    console.log(`Checking metadata for ${CONTRACTS.length} contracts...\n`);

    for (const c of CONTRACTS) {
        const contract = new ethers.Contract(c.address, artifact.abi, provider);
        console.log(`=== ${c.name} (${c.address}) ===`);

        try {
            const name = await contract.name();
            const symbol = await contract.symbol();
            console.log(`Contract Name: ${name}`);
            console.log(`Contract Symbol: ${symbol}`);

            const tokenId = 0; // Each contract has only 1 token (ID 0)
            const tokenURI = await contract.tokenURI(tokenId);

            if (tokenURI.startsWith("data:application/json;base64,")) {
                const base64Data = tokenURI.replace("data:application/json;base64,", "");
                const jsonString = Buffer.from(base64Data, "base64").toString("utf8");
                const metadata = JSON.parse(jsonString);

                console.log("Token Name:", metadata.name);
                console.log("Description:", metadata.description);
                console.log("Image:", metadata.image);
                console.log("Attributes:", metadata.attributes);
            } else {
                console.log("Token URI:", tokenURI);
            }
        } catch (error) {
            console.error(`Error fetching metadata:`, error);
        }
        console.log("\n");
    }
}

main().catch(console.error);
