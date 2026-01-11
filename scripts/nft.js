import { ethers } from "hardhat";

async function main() {
    console.log("Deploying MyNFT contract...");

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNft = await MyNFT.deploy();
    await myNft.waitForDeployment();

    const address = await myNft.getAddress();
    console.log("MyNFT deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
