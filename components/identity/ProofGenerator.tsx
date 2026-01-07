import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Scan, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { useAccount, useSignMessage } from 'wagmi';

interface ProofGeneratorProps {
  onComplete: () => void;
  userAddress: string;
  // signer prop is no longer used, we use hooks
  signer?: any;
  isSmartAccount?: boolean;
}

const MANTLE_SEPOLIA_CHAIN_ID = 5003;

export default function ProofGenerator({ onComplete, userAddress, isSmartAccount }: ProofGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'signing' | 'verifying' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { signMessageAsync } = useSignMessage();

  // Read config from env
  const KYC_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS;
  const KYC_REGISTRY_ABI = [
    "function hasPassed(address user) external view returns (bool)"
  ];

  const checkStatus = useCallback(async () => {
    if (!userAddress || !KYC_REGISTRY_ADDRESS) return false;

    try {
      // 1. Network Check
      // signer.provider might vary based on how signer is passed (Wagmi signer vs Ethers signer)
      // Safest to rely on the connected chain from Wagmi in the parent, but here we double check if possible.
      try {
          // Network check removed or simplified as we don't have direct access to provider here without extra hooks
          // but calling the Contract with a public RPC is safer for reading state anyway.
      } catch (e) {
          // Provider might not be available
      }
      
      // Use a public provider for reading state to be robust against wallet network mismatch
      // Or use the signer if available (but we removed signer prop).
      // Let's use a simple JsonRpcProvider for Sepolia.
      const provider = new JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
      const contract = new Contract(KYC_REGISTRY_ADDRESS, KYC_REGISTRY_ABI, provider);
      
      const isVerified = await contract.hasPassed(userAddress);
      console.log(`Checking status for ${userAddress}: ${isVerified}`);

      if (isVerified) {
        setStatus('success');
        setTimeout(() => onComplete(), 2000);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to check status", err);
      return false;
    }
  }, [userAddress, KYC_REGISTRY_ADDRESS, onComplete]);

  // Initial check on mount only
  useEffect(() => {
    let active = true;
    
    const runInitialCheck = async () => {
      setStatus('checking');
      const verified = await checkStatus();
      if (active && !verified) {
        setStatus('idle');
      }
    };

    runInitialCheck();
    
    return () => { active = false; };
  }, [userAddress]); // Only re-run if the user address changes

  // Polling Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'verifying') {
      interval = setInterval(async () => {
        const verified = await checkStatus();
        if (verified) {
          clearInterval(interval);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [status, checkStatus]);

  const handleVerify = async () => {
    if (!userAddress) {
      setError("Wallet not connected");
      return;
    }

    if (!KYC_REGISTRY_ADDRESS) {
      setError("System Error: KYC Address not configured");
      return;
    }

    try {
      setError(null);
      setStatus('signing');

      // 1. Sign Message
      const timestamp = Date.now();
      const message = `KYC_APPROVE: ${userAddress} on chain ${MANTLE_SEPOLIA_CHAIN_ID} for contract ${KYC_REGISTRY_ADDRESS} at ${timestamp}`;

      let signature;
      
      // If smart account (trusted session), we skip signature
      if (isSmartAccount) {
        signature = "0x" + "00".repeat(65); // Dummy signature
        // We trust the backend relay to bypass verifyMessage if coming from trusted source
        // OR we just use a different message payload that API recognizes as "Trusted Admin Flow"
      } else {
        try {
          signature = await signMessageAsync({ message });
        } catch (signErr: any) {
          setStatus('idle'); // Go back to idle if user rejects
          console.warn("User rejected signature", signErr);
          return;
        }
      }

      // 2. Call Relay API
      setStatus('verifying'); // Show loading state immediately

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          signature,
          message, // Optional, just for info
          chainId: MANTLE_SEPOLIA_CHAIN_ID,
          contractAddress: KYC_REGISTRY_ADDRESS,
          timestamp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // If already verified, handles gracefully
        if (data.status === 'ALREADY_VERIFIED') {
          checkStatus();
          return;
        }
        throw new Error(data.error || 'Verification failed');
      }

      // 3. Set Tx Hash and Wait
      if (data.txHash) {
        setTxHash(data.txHash);
      }

      // The useEffect will handle polling now

    } catch (err: any) {
      console.error("Verify flow failed:", err);
      setError(err.message || "Something went wrong");
      setStatus('failed');
    }
  };

  return (
    <div className="py-8 text-center text-white">
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Animated Rings/Icon Container */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm z-10 border border-white/10">
          <AnimatePresence mode="wait">
            {(status === 'idle' || status === 'checking') && <ShieldCheck className="w-12 h-12 text-zinc-500" />}
            {status === 'signing' && <Scan className="w-12 h-12 text-blue-500 animate-pulse" />}
            {status === 'verifying' && <RefreshCw className="w-12 h-12 text-yellow-500 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-16 h-16 text-[#10B981]" />}
            {status === 'failed' && <AlertCircle className="w-12 h-12 text-red-500" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Text Area */}
      <div className="h-32 px-4">
        <AnimatePresence mode="wait">
          {(status === 'idle' || status === 'checking') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold mb-2">Identity Verification</h2>
              <p className="text-zinc-500 text-sm mb-4">
                {status === 'checking' ? 'Checking status...' : isSmartAccount ? 'Verify your Google Account' : 'Verify your humanity to access the game.'}
              </p>
            </motion.div>
          )}

          {status === 'signing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-bold mb-2 text-blue-400">Sign Request</h2>
              <p className="text-zinc-400 text-sm">Please sign the message in your wallet to prove ownership.</p>
            </motion.div>
          )}

          {status === 'verifying' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-bold mb-2 text-yellow-500">Verifying...</h2>
              <p className="text-zinc-400 text-sm mb-2">Relay is submitting your approval.</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2 className="text-2xl font-bold mb-2 text-[#10B981]">Verified!</h2>
              <p className="text-zinc-500 text-sm mb-3">Redirecting to event room...</p>
              {txHash && (
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#10B981] hover:underline"
                >
                  View Transaction <ExternalLink size={10} />
                </a>
              )}
            </motion.div>
          )}

          {status === 'failed' && (
            <motion.div>
              <h2 className="text-xl font-bold mb-2 text-red-500">Verification Failed</h2>
              <p className="text-red-400 text-sm mb-4">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Button */}
      {status !== 'success' && status !== 'checking' && status !== 'verifying' && status !== 'signing' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVerify}
          className="mt-2 w-full py-4 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#10B981]/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          {status === 'failed' ? 'Try Again' : 'Verify Identity'}
        </motion.button>
      )}

      {/* Manual Refresh during Verifying */}
      {status === 'verifying' && (
        <button
          onClick={() => checkStatus()}
          className="mt-4 text-xs text-zinc-500 hover:text-white underline"
        >
          Is it taking too long? Refresh Status
        </button>
      )}
    </div>
  );
}
