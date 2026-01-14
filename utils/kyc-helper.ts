/**
 * Helper functions for interacting with KYC Registry
 * 
 * The KYC contract now supports 3 verification methods:
 * 1. selfVerify() - NEW! Anyone can verify themselves
 * 2. verifyMe(deadline, signature) - Backend-signed verification
 * 3. setApproved(user, bool) - Admin-only approval
 */

import { Contract, BrowserProvider } from 'ethers';
import { KYC_REGISTRY_ADDRESS } from './address';
import { kyc as KYC_ABI } from './kyc';

/**
 * Allow user to self-verify (NO ADMIN NEEDED!)
 * This is the easiest way - just call this function
 */
export async function selfVerifyKYC(provider: BrowserProvider) {
    try {
        const signer = await provider.getSigner();
        const contract = new Contract(KYC_REGISTRY_ADDRESS, KYC_ABI, signer);

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
export async function checkKYCStatus(address: string, provider: BrowserProvider) {
    try {
        const contract = new Contract(KYC_REGISTRY_ADDRESS, KYC_ABI, provider);
        const isVerified = await contract.hasPassed(address);
        return isVerified;
    } catch (error) {
        console.error('Failed to check KYC status:', error);
        return false;
    }
}

/**
 * Example usage in a React component:
 * 
 * import { useProvider } from 'wagmi';
 * import { selfVerifyKYC, checkKYCStatus } from '@/utils/kyc-helper';
 * 
 * function MyComponent() {
 *   const provider = useProvider();
 *   
 *   const handleVerify = async () => {
 *     const result = await selfVerifyKYC(provider);
 *     if (result.success) {
 *       alert('KYC Verified!');
 *     }
 *   };
 *   
 *   return <button onClick={handleVerify}>Verify KYC</button>;
 * }
 */
