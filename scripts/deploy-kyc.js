async function main() {
  const hre = await import("hardhat");
  const signers = await hre.ethers.getSigners();

  // Use the relay wallet (second account) as deployer so it becomes the owner
  // This ensures the relay can call setApproved() which has onlyOwner modifier
  const relayWallet = signers.length > 1 ? signers[1] : signers[0];

  console.log("Deploying KYCRegistry with relay wallet:", relayWallet.address);
  console.log("This wallet will be the contract owner and signer.");

  const KYCRegistry = await hre.ethers.getContractFactory("KYCRegistry", relayWallet);
  const kyc = await KYCRegistry.deploy(relayWallet.address);

  await kyc.waitForDeployment();
  const address = await kyc.getAddress();

  console.log("KYCRegistry deployed to:", address);
  console.log("Owner/Signer set to:", relayWallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
