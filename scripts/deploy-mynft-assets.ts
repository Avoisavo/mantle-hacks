import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Mantle Sepolia RPC
const RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

// Recipient address
const RECIPIENT = "0x9D93b988D4303D9b08cD03d4D64D1B81E12Da6b4";

// Assets data
const ASSETS = [
    {
        name: "Manhattan House",
        symbol: "MNH",
        description: "Luxury apartment in Manhattan. Prime location with modern amenities.",
        image: "https://jdcny.com/building/manhattan-house/",
        value: "High",
        location: "New York, NY"
    },
    {
        name: "Phoenix Suburbs",
        symbol: "PHX",
        description: "Comfortable middle-class home in the Phoenix suburbs.",
        image: "https://www.istockphoto.com/photos/arizona-house",
        value: "Medium",
        location: "Phoenix, AZ"
    },
    {
        name: "California Cool",
        symbol: "CAL",
        description: "Stylish home blending California design trends.",
        image: "https://www.tlcinteriors.com.au/trends-inspiration/the-california-cool-trend-blends-4-of-your-fave-design-styles/",
        value: "High",
        location: "California"
    },
    {
        name: "Arkansas Affordable",
        symbol: "ARK",
        description: "Affordable housing unit in Arkansas.",
        image: "https://www.archdaily.com/894973/7-lessons-from-new-yorks-new-affordable-housing-design-guide",
        value: "Very Low",
        location: "Arkansas"
    }
];

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env.local");

    const provider = new ethers.providers.JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: "mantle-sepolia" });
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} MNT\n`);

    if (balance.isZero()) {
        throw new Error("Deployer has no MNT on Mantle Sepolia. Get some from the faucet first.");
    }

    // Load artifact
    const artifactPath = "./artifacts/contracts/mynft.sol/MyNFT.json";
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    console.log(`Starting deployment of ${ASSETS.length} separate contracts...\n`);

    for (let i = 0; i < ASSETS.length; i++) {
        const asset = ASSETS[i];
        console.log(`--- Deploying Contract for: ${asset.name} ---`);

        // Deploy Contract
        const contract = await factory.deploy(asset.name, asset.symbol);
        await contract.deployed();
        const contractAddress = contract.address;
        console.log(`✅ Contract deployed to: ${contractAddress}`);

        // Construct Metadata
        const metadata = {
            name: asset.name,
            description: asset.description,
            image: asset.image,
            external_url: asset.image,
            attributes: [
                { trait_type: "Value", value: asset.value },
                { trait_type: "Location", value: asset.location }
            ]
        };

        // Encode Metadata
        const jsonString = JSON.stringify(metadata);
        const base64Json = Buffer.from(jsonString).toString("base64");
        const tokenURI = `data:application/json;base64,${base64Json}`;

        // Mint Asset
        console.log(`   Minting asset...`);
        const tx = await (contract as any).mint(RECIPIENT, tokenURI);
        await tx.wait();
        console.log(`   ✅ Minted to ${RECIPIENT}`);
        console.log(`   Explorer: https://sepolia.mantlescan.xyz/address/${contractAddress}\n`);
    }

    console.log("🎉 All deployments completed successfully!");
}

main().catch(console.error);
