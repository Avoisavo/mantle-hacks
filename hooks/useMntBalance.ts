import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { MNT_TOKEN_ADDRESS, L1_MNT_TOKEN_ADDRESS } from '@/utils/address';

// ERC20 ABI for Balance
const ERC20_ABI = [
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)'
];

interface UseMntBalanceProps {
    address?: string;
    chainId?: number;
}

export function useMntBalance({ address, chainId }: UseMntBalanceProps) {
    const [balance, setBalance] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!address || !chainId) {
            setBalance('0');
            return;
        }

        const fetchBalance = async () => {
            try {
                setIsLoading(true);
                let providerUrl = '';
                let isNative = false;
                let tokenAddress = '';

                if (chainId === 5003) {
                    // Mantle Sepolia (L2) - Native MNT
                    providerUrl = 'https://rpc.sepolia.mantle.xyz';
                    isNative = true;
                } else if (chainId === 11155111) {
                    // Sepolia (L1) - ERC20 MNT
                    providerUrl = 'https://rpc.sepolia.org'; // Or Infura/Alchemy if available, hoping public RPC works
                    // Fallback to a typically reliable public RPC if that fails? 
                    // Let's use a known public one or the one user might have configured?
                    // User didn't specify L1 RPC. I'll use a public one.
                    // 'https://1rpc.io/sepolia' or 'https://rpc.sepolia.org'
                    providerUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
                    isNative = false;
                    tokenAddress = L1_MNT_TOKEN_ADDRESS;
                } else {
                    return;
                }

                const provider = new ethers.providers.JsonRpcProvider(providerUrl);

                if (isNative) {
                    const rawBalance = await provider.getBalance(address);
                    const formatted = ethers.utils.formatEther(rawBalance);
                    setBalance(parseFloat(formatted).toFixed(2));
                } else {
                    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                    const [rawBalance, decimals] = await Promise.all([
                        contract.balanceOf(address),
                        contract.decimals()
                    ]);
                    const formatted = ethers.utils.formatUnits(rawBalance, decimals);
                    setBalance(parseFloat(formatted).toFixed(2));
                }

            } catch (error) {
                console.error(`Failed to fetch MNT balance for chain ${chainId}:`, error);
                setBalance('0');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [address, chainId]);

    return { balance, isLoading };
}
