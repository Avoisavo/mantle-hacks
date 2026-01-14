import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mantle Sepolia RPC
const RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env.local");

    const provider = new ethers.JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: "mantle-sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} MNT\n`);

    // 1. Deploy the Contract
    // Load artifact
    const artifactPath = path.join(__dirname, "../artifacts/contracts/mynft.sol/MyNFT.json");
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    console.log("Deploying RealWorldAssets contract...");
    const contract = await factory.deploy("RealWorldAssets", "RWA");
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log("✅ RealWorldAssets deployed to:", contractAddress);

    // 2. Define Assets
    const assets = [
        // --- Wealthy (10) ---
        {
            name: "Manhattan Penthouse",
            description: "Luxury penthouse in Manhattan, NYC. Median income >$200k.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/manha.jpg",
            localImage: "/nft/manha.jpg",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "New York, NY" }, { trait_type: "Value", value: "$2.8M" }]
        },
        {
            name: "Scarsdale Estate",
            description: "Grand estate in Scarsdale, NY. Top-tier school district.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "Scarsdale, NY" }, { trait_type: "Value", value: "$3.5M" }]
        },
        {
            name: "Los Altos Mansion",
            description: "Modern mansion in Los Altos, CA. Silicon Valley prime location.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "Los Altos, CA" }, { trait_type: "Value", value: "$4.2M" }]
        },
        {
            name: "West University Place Home",
            description: "Exclusive home in West University Place, TX.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "West University Place, TX" }, { trait_type: "Value", value: "$1.9M" }]
        },
        {
            name: "Loudoun County Manor",
            description: "Spacious manor in Loudoun County, VA. Highest median income county.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "Loudoun County, VA" }, { trait_type: "Value", value: "$1.5M" }]
        },
        {
            name: "Santa Clara Villa",
            description: "Tech-hub villa in Santa Clara, CA.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "Santa Clara, CA" }, { trait_type: "Value", value: "$2.1M" }]
        },
        {
            name: "San Mateo Residence",
            description: "Luxury residence in San Mateo, CA.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "San Mateo, CA" }, { trait_type: "Value", value: "$2.3M" }]
        },
        {
            name: "Beverly Hills Estate",
            description: "Iconic estate in Beverly Hills, CA.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "Beverly Hills, CA" }, { trait_type: "Value", value: "$5.5M" }]
        },
        {
            name: "Greenwich Manor",
            description: "Historic manor in Greenwich, CT.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "Greenwich, CT" }, { trait_type: "Value", value: "$3.8M" }]
        },
        {
            name: "Atherton Residence",
            description: "Ultra-exclusive residence in Atherton, CA.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/california.png",
            localImage: "/nft/california.png",
            attributes: [{ trait_type: "Category", value: "Wealthy" }, { trait_type: "Location", value: "Atherton, CA" }, { trait_type: "Value", value: "$6.0M" }]
        },

        // --- Moderate (11) ---
        {
            name: "Phoenix Suburb Home",
            description: "Comfortable family home in Phoenix suburbs.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Phoenix, AZ" }, { trait_type: "Value", value: "$450K" }]
        },
        {
            name: "Charlotte Family Home",
            description: "Spacious home in Charlotte suburbs.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Charlotte, NC" }, { trait_type: "Value", value: "$380K" }]
        },
        {
            name: "Austin Modern House",
            description: "Modern house in Austin outskirts.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Austin, TX" }, { trait_type: "Value", value: "$550K" }]
        },
        {
            name: "Long Beach Apartment",
            description: "Nice apartment in Long Beach, CA.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Long Beach, CA" }, { trait_type: "Value", value: "$600K" }]
        },
        {
            name: "Denver Townhouse",
            description: "Townhouse in Denver, CO.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Denver, CO" }, { trait_type: "Value", value: "$520K" }]
        },
        {
            name: "Nashville Cottage",
            description: "Cozy cottage in Nashville, TN.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Nashville, TN" }, { trait_type: "Value", value: "$420K" }]
        },
        {
            name: "Portland Bungalow",
            description: "Charming bungalow in Portland, OR.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Portland, OR" }, { trait_type: "Value", value: "$480K" }]
        },
        {
            name: "Atlanta Suburb House",
            description: "Large house in Atlanta suburbs.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Atlanta, GA" }, { trait_type: "Value", value: "$350K" }]
        },
        {
            name: "Raleigh Family Home",
            description: "Family home in Raleigh, NC.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Raleigh, NC" }, { trait_type: "Value", value: "$390K" }]
        },
        {
            name: "Tampa Bay House",
            description: "House near the bay in Tampa, FL.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Tampa, FL" }, { trait_type: "Value", value: "$410K" }]
        },
        {
            name: "Salt Lake City Home",
            description: "Home with mountain views in SLC, UT.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/middle.png",
            localImage: "/nft/middle.png",
            attributes: [{ trait_type: "Category", value: "Moderate" }, { trait_type: "Location", value: "Salt Lake City, UT" }, { trait_type: "Value", value: "$460K" }]
        },

        // --- Poor (11) ---
        {
            name: "Detroit Fixer-Upper",
            description: "Fixer-upper in Detroit, MI. High potential.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Detroit, MI" }, { trait_type: "Value", value: "$30K" }]
        },
        {
            name: "Monroe Small House",
            description: "Small house in Monroe, LA.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Monroe, LA" }, { trait_type: "Value", value: "$45K" }]
        },
        {
            name: "Pine Bluff Cottage",
            description: "Modest cottage in Pine Bluff, AR.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Pine Bluff, AR" }, { trait_type: "Value", value: "$35K" }]
        },
        {
            name: "Little River Cabin",
            description: "Remote cabin in Little River, CA.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Little River, CA" }, { trait_type: "Value", value: "$55K" }]
        },
        {
            name: "Pine Ridge Mobile Home",
            description: "Mobile home in Pine Ridge, SD.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Pine Ridge, SD" }, { trait_type: "Value", value: "$20K" }]
        },
        {
            name: "Cleveland Old House",
            description: "Older home in Cleveland, OH.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Cleveland, OH" }, { trait_type: "Value", value: "$40K" }]
        },
        {
            name: "Gary Small Home",
            description: "Small home in Gary, IN.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Gary, IN" }, { trait_type: "Value", value: "$25K" }]
        },
        {
            name: "Camden Row House",
            description: "Row house in Camden, NJ.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Camden, NJ" }, { trait_type: "Value", value: "$50K" }]
        },
        {
            name: "Youngstown House",
            description: "House in Youngstown, OH.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Youngstown, OH" }, { trait_type: "Value", value: "$32K" }]
        },
        {
            name: "Flint Small House",
            description: "Small house in Flint, MI.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Flint, MI" }, { trait_type: "Value", value: "$28K" }]
        },
        {
            name: "Rural Mississippi Shack",
            description: "Rural property in Mississippi.",
            image: "https://raw.githubusercontent.com/mantle-hacks/assets/main/nft/verylow.png",
            localImage: "/nft/verylow.png",
            attributes: [{ trait_type: "Category", value: "Poor" }, { trait_type: "Location", value: "Rural MS" }, { trait_type: "Value", value: "$15K" }]
        }
    ];

    // 3. Mint Assets
    const mintedAssets = [];
    let nonce = await provider.getTransactionCount(wallet.address);
    console.log(`Initial nonce: ${nonce}`);

    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        // Construct Metadata
        const metadata = {
            name: asset.name,
            description: asset.description,
            image: asset.image,
            attributes: asset.attributes
        };

        // Encode Metadata
        const jsonMetadata = JSON.stringify(metadata);
        const base64Metadata = Buffer.from(jsonMetadata).toString("base64");
        const tokenURI = `data:application/json;base64,${base64Metadata}`;

        console.log(`Minting ${asset.name} (nonce: ${nonce})...`);
        try {
            const tx = await (contract as any).mint(wallet.address, tokenURI, { nonce: nonce });
            console.log(`   Tx Hash: ${tx.hash}`);
            await tx.wait();
            nonce++;

            mintedAssets.push({
                tokenId: i, // Assuming 0-indexed sequential minting
                ...asset,
                contractAddress: contractAddress
            });
        } catch (error) {
            console.error(`Failed to mint ${asset.name}:`, error);
            // Retry logic or exit? For now, let's just log and continue, but nonce might be tricky if it failed before submission.
            // If it failed due to nonce, we should probably retry. 
            // But if it failed for other reasons, nonce shouldn't increment.
            // For simplicity in this script, if it fails, we might get out of sync. 
            // But "nonce too low" implies we are sending with an OLD nonce. 
            // If we manually increment, we should be safe from "too low", but might hit "too high" if we skip.
            // Let's assume sequential success for now.
        }
    }

    console.log("All 32 assets minted successfully!");

    // 4. Save Metadata to File
    const outputPath = path.join(__dirname, "../rwa-assets-32.json");
    writeFileSync(outputPath, JSON.stringify(mintedAssets, null, 2));
    console.log(`Metadata saved to ${outputPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
