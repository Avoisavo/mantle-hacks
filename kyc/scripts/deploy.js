const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // We want the deployer to be the initial signer/owner
  // Ideally 'deployer' is the wallet from RELAY_PRIVATE_KEY
  const KYCRegistry = await hre.ethers.getContractFactory("KYCRegistry");
  const kyc = await KYCRegistry.deploy(deployer.address);

  await kyc.waitForDeployment();
  const address = await kyc.getAddress();

  console.log("KYCRegistry deployed to:", address);
  console.log("Owner/Signer set to:", deployer.address);

  // Verification hint
  console.log("\nMake sure to set this address in your .env file as NEXT_PUBLIC_KYC_ADDRESS");
  console.log("And ensure RELAY_PRIVATE_KEY matches the deployer address!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
