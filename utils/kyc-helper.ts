import { ethers } from 'ethers';
import { KYC_REGISTRY_ADDRESS } from './address';
import { kyc as KYC_ABI } from './kyc';

export async function selfVerifyKYC(provider: ethers.providers.Web3Provider) {
    try {
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(KYC_REGISTRY_ADDRESS, KYC_ABI, signer);

        // Call the selfVerify function
        const tx = await contract.selfVerify();
        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('KYC verified! Block:', receipt.blockNumber);

        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber
        };
    } catch (error: any) {
        console.error('Self-verify failed:', error);

        // Check if already verified
        if (error.message?.includes('Already verified')) {
            return {
                success: true,
                alreadyVerified: true,
                message: 'User is already verified'
            };
        }

        return {
            success: false,
            error: error.message || 'Failed to verify'
        };
    }
}

/**
 * Check if a user has passed KYC verification
 */
export async function checkKYCStatus(address: string, provider: ethers.providers.Web3Provider) {
    try {
        const contract = new ethers.Contract(KYC_REGISTRY_ADDRESS, KYC_ABI, provider);
        const isVerified = await contract.hasPassed(address);
        return isVerified;
    } catch (error) {
        console.error('Failed to check KYC status:', error);
        return false;
    }
}