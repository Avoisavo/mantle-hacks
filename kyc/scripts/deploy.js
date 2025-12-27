import hre from "hardhat";

async function main() {
  console.log("Deploying MockIdentity...");

  const MockIdentity = await hre.ethers.getContractFactory("MockIdentity");
  const mockIdentity = await MockIdentity.deploy();

  await mockIdentity.waitForDeployment();

  const address = await mockIdentity.getAddress();
  console.log(`MockIdentity deployed to: ${address}`);
  
  console.log("----------------------------------------------------");
  console.log("Make sure to update 'lib/abis.ts' with this address!");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
