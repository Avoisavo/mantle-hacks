import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const KYCRegistry = await hre.ethers.getContractFactory("KYCRegistry");
  const kyc = await KYCRegistry.deploy(deployer.address);

  await kyc.waitForDeployment();
  const address = await kyc.getAddress();

  console.log("KYCRegistry deployed to:", address);
  console.log("Owner/Signer set to:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
