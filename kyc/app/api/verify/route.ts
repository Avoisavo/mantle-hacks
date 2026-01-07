import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Enforce Node.js runtime for accessing private keys and EVM libraries safely
export const runtime = 'nodejs';

// In-memory rate limiting (simple implementation for Hackathon)
// Map<address, timestamp>
const attempts = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

const KYC_REGISTRY_ABI = [
    "function setApproved(address user, bool status) external",
    "function isVerified(address user) external view returns (bool)"
];

const SIGNER_PRIVATE_KEY = process.env.RELAY_PRIVATE_KEY;
const KYC_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS;
const RPC_URL = "https://rpc.sepolia.mantle.xyz";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userAddress, signature, message, chainId, contractAddress, timestamp } = body;

        if (!userAddress || !signature || !timestamp || !chainId || !contractAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Abuse Protection: Rate Limit
        const lastAttempt = attempts.get(userAddress.toLowerCase());
        if (lastAttempt && Date.now() - lastAttempt < RATE_LIMIT_WINDOW) {
            return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 });
        }
        attempts.set(userAddress.toLowerCase(), Date.now());

        // 2. Validate Timestamp (Must be within last 60 seconds)
        const now = Date.now();
        if (now - timestamp > 60000 || timestamp > now + 5000) {
            return NextResponse.json({ error: 'Signature expired or invalid timestamp' }, { status: 400 });
        }

        // 3. Reconstruct Message to Verify Signature
        // Expected Format: "KYC_APPROVE: <address> on chain <chainId> for contract <contractAddress> at <timestamp>"
        const expectedMessage = `KYC_APPROVE: ${userAddress} on chain ${chainId} for contract ${contractAddress} at ${timestamp}`;

        // Safety check: Ensure the message passed in body acts mainly as a transport, 
        // but strictly we should verify against our reconstructed message.
        // The user should have signed `expectedMessage`.

        const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);

        if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 4. Initialize Provider & Wallet
        if (!SIGNER_PRIVATE_KEY) {
            console.error("RELAY_PRIVATE_KEY is not set");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!KYC_REGISTRY_ADDRESS) {
            console.error("NEXT_PUBLIC_KYC_ADDRESS is not set");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Check if contractAddress matches (security against cross-contract replay if reused)
        if (contractAddress.toLowerCase() !== KYC_REGISTRY_ADDRESS.toLowerCase()) {
            return NextResponse.json({ error: 'Contract address mismatch' }, { status: 400 });
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(KYC_REGISTRY_ADDRESS, KYC_REGISTRY_ABI, wallet);

        // 5. Check if already verified (Save Gas)
        // We can filter this on-chain or off-chain. Reading first is cheaper.
        try {
            const isAlreadyVerified = await contract.isVerified(userAddress);
            if (isAlreadyVerified) {
                return NextResponse.json({ message: 'User already verified', status: 'ALREADY_VERIFIED' });
            }
        } catch (err) {
            console.error("Error checking verification status", err);
            // Fallthrough to try setting it anyway or error out? 
            // Safe to error out if we can't read state.
            return NextResponse.json({ error: 'Failed to check current status' }, { status: 500 });
        }

        // 6. Send Transaction
        // const tx = await contract.setApproved(userAddress, true);
        // Best to specify gas limit slightly higher just in case, but auto-estimation usually works.
        const tx = await contract.setApproved(userAddress, true);

        console.log(`Relay approved ${userAddress}, tx: ${tx.hash}`);

        // Return the hash so the frontend can wait for it
        return NextResponse.json({ txHash: tx.hash });

    } catch (error: any) {
        console.error('Relay Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
