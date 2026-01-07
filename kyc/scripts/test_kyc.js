import hre from "hardhat";

async function main() {
    const [admin, user, malicious] = await hre.ethers.getSigners();

    // 1. Deploy
    const KYCRegistry = await hre.ethers.getContractFactory("KYCRegistry");
    const kyc = await KYCRegistry.deploy(admin.address);
    await kyc.waitForDeployment();
    const kycAddress = await kyc.getAddress();
    console.log("KYC Registry deployed at:", kycAddress);

    // 2. Admin signs for User
    console.log("\n--- Testing Signature Verification ---");
    // Hardhat local network is usually 31337
    const network = await hre.ethers.provider.getNetwork();
    const chainId = network.chainId;
    console.log("Testing on Chain ID:", chainId.toString());

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Create hash exactly as Solidity does
    // keccak256(abi.encodePacked(user, deadline, chainId, contractAddress))
    const messageHash = hre.ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "address"],
        [user.address, deadline, chainId, kycAddress]
    );

    // Sign passing the binary data
    const signature = await admin.signMessage(hre.ethers.getBytes(messageHash));

    console.log("Admin signed message for user:", user.address);

    // 3. User calls verifyMe
    try {
        const tx = await kyc.connect(user).verifyMe(deadline, signature);
        await tx.wait();
        console.log("SUCCESS: User verified via signature!");
    } catch (e) {
        console.error("FAILURE: User verification failed:", e.message);
        // Wait a bit to ensure logs are flushed
    }

    // 4. Check status
    const isVerified = await kyc.hasPassed(user.address);
    console.log(`User isVerified: ${isVerified}`);

    if (!isVerified) throw new Error("Verification failed logic check");

    // 5. Malicious user tries to replay
    console.log("\n--- Testing Replay Attack (Malicious User) ---");
    try {
        await kyc.connect(malicious).verifyMe(deadline, signature);
        console.log("FAILURE: Malicious user managed to verify with stolen signature!");
    } catch (e) {
        console.log("SUCCESS: Malicious user blocked as expected.");
        // e.message usually contains the revert reason
    }

    // 6. Test Admin Direct Approval (zkLogin Flow)
    console.log("\n--- Testing Admin Direct Approval (zkLogin Flow) ---");
    const zkUser = malicious.address; // Reusing malicious address as a gasless user
    await kyc.connect(admin).setApproved(zkUser, true);
    const zkVerified = await kyc.hasPassed(zkUser);
    console.log(`zkUser (Direct Approved) isVerified: ${zkVerified}`);
    if (!zkVerified) throw new Error("Direct approval failed");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
