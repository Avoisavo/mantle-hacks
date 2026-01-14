import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

const KYC_REGISTRY_ABI = [
  "function hasPassed(address user) external view returns (bool)"
];

const KYC_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS;
const RPC_URL = process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!KYC_REGISTRY_ADDRESS) {
      console.error("NEXT_PUBLIC_KYC_ADDRESS is not set");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(KYC_REGISTRY_ADDRESS, KYC_REGISTRY_ABI, provider);

    const isVerified = await contract.hasPassed(address);

    return res.status(200).json({ verified: isVerified });
  } catch (error: any) {
    console.error('Verification check error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
