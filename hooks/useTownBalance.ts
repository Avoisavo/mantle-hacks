import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { TOWN_TOKEN_NATIVE_ADDRESS } from '@/utils/address';

const TOWN_TOKEN_ABI = [
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)'
];

export function useTownBalance(targetAddress?: string) {
    const { address: connectedAddress } = useAccount();
    const address = targetAddress || connectedAddress;
    
    const [balance, setBalance] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!address) {
            setBalance('0');
            return;
        }

        const fetchBalance = async () => {
            try {
                setIsLoading(true);
                const provider = new ethers.providers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz');
                const contract = new ethers.Contract(TOWN_TOKEN_NATIVE_ADDRESS, TOWN_TOKEN_ABI, provider);

                const [rawBalance, decimals] = await Promise.all([
                    contract.balanceOf(address),
                    contract.decimals()
                ]);

                const formatted = ethers.utils.formatUnits(rawBalance, decimals);
                // Format to 2 decimal places
                const balanceNum = parseFloat(formatted);
                setBalance(balanceNum.toFixed(2));
            } catch (error) {
                console.error('Failed to fetch TOWN balance:', error);
                setBalance('0');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
        // Refresh balance every 10 seconds
        const interval = setInterval(fetchBalance, 10000);

        return () => clearInterval(interval);
    }, [address]);

    return { balance, isLoading };
}
