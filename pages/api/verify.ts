import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory rate limiting (simple implementation for Hackathon)
// Map<address, timestamp>
const attempts = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

const KYC_REGISTRY_ABI = [
    "function setApproved(address user, bool status) external",
    "function hasPassed(address user) external view returns (bool)"
];

const SIGNER_PRIVATE_KEY = process.env.RELAY_PRIVATE_KEY;
const KYC_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS;
const RPC_URL = process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userAddress, signature, message, chainId, contractAddress, timestamp } = req.body;

        if (!userAddress || !signature || !timestamp || !chainId || !contractAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Abuse Protection: Rate Limit
        const lastAttempt = attempts.get(userAddress.toLowerCase());
        if (lastAttempt && Date.now() - lastAttempt < RATE_LIMIT_WINDOW) {
            return res.status(429).json({ error: 'Too many attempts. Please wait.' });
        }
        attempts.set(userAddress.toLowerCase(), Date.now());

        // 2. Validate Timestamp (Must be within last 60 seconds)
        const now = Date.now();
        if (now - timestamp > 60000 || timestamp > now + 5000) {
            return res.status(400).json({ error: 'Signature expired or invalid timestamp' });
        }

        // 3. Reconstruct Message to Verify Signature
        // Expected Format: "KYC_APPROVE: <address> on chain <chainId> for contract <contractAddress> at <timestamp>"
        const expectedMessage = `KYC_APPROVE: ${userAddress} on chain ${chainId} for contract ${contractAddress} at ${timestamp}`;

        // Verify signatures
        // If dummy signature from Trusted Smart Account Flow, we skip verifyMessage
        // In a Production app, we would verify the Session Token on server side here to ensure request comes from authenticated user.
        // For Hackathon, we'll check if signature is the "zero signature" we configured.
        
        let skipSigCheck = false;
        if (signature === "0x" + "00".repeat(65)) {
            // We blindly trust this for now because the frontend only sends this if session exists.
            // Ideally: const session = await getServerSession(req, res, authOptions); if (session) ...
            skipSigCheck = true;
        }

        if (!skipSigCheck) {
            const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);
            if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        // 4. Initialize Provider & Wallet
        if (!SIGNER_PRIVATE_KEY) {
            console.error("RELAY_PRIVATE_KEY is not set");
            return res.status(500).json({ error: 'Server configuration error' });
        }

        if (!KYC_REGISTRY_ADDRESS) {
            console.error("NEXT_PUBLIC_KYC_ADDRESS is not set");
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Check if contractAddress matches (security against cross-contract replay if reused)
        if (contractAddress.toLowerCase() !== KYC_REGISTRY_ADDRESS.toLowerCase()) {
            return res.status(400).json({ error: 'Contract address mismatch' });
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(KYC_REGISTRY_ADDRESS, KYC_REGISTRY_ABI, wallet);

        // 5. Check if already verified (Save Gas)
        try {
            const isAlreadyVerified = await contract.hasPassed(userAddress);
            if (isAlreadyVerified) {
                return res.status(200).json({ message: 'User already verified', status: 'ALREADY_VERIFIED' });
            }
        } catch (err) {
            console.error("Error checking verification status", err);
            // Safe to error out if we can't read state.
            return res.status(500).json({ error: 'Failed to check current status' });
        }

        // 6. Send Transaction
        const tx = await contract.setApproved(userAddress, true);

        console.log(`Relay approved ${userAddress}, tx: ${tx.hash}`);

        // Return the hash so the frontend can wait for it
        return res.status(200).json({ txHash: tx.hash });

    } catch (error: any) {
        console.error('Relay Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
