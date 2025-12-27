import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Scan, Globe, Lock, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Contract } from 'ethers';
import { MOCK_IDENTITY_ABI, MOCK_IDENTITY_ADDRESS } from '@/lib/abis';

interface ProofGeneratorProps {
  onComplete: () => void;
  userAddress: string | null;
  signer: any;
}

export default function ProofGenerator({ onComplete, userAddress, signer }: ProofGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'simulating' | 'verifying' | 'success' | 'failed'>('idle');
  const [simulationStep, setSimulationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const simulationTexts = [
    "Initializing ZK-Proof circuit...",
    "Scanning biometric hash...",
    "Verifying against Mantle Registry..."
  ];

  const MANTLE_SEPOLIA_CHAIN_ID = 5003;

  const handleVerify = async () => {
    if (!signer || !signer.provider) {
      setError("Please re-connect your wallet.");
      return;
    }
    
    try {
      setStatus('simulating');
      setError(null);

      // Check Network - Use direct RPC call to be more resilient to "network changed" errors
      const provider = signer.provider;
      let chainIdHex;
      try {
        chainIdHex = await provider.send("eth_chainId", []);
      } catch (err: any) {
        if (err.code === 'NETWORK_ERROR') {
          setStatus('idle');
          setError("Network change detected. Please click Verify again.");
          return;
        }
        throw err;
      }
      
      const currentChainId = parseInt(chainIdHex, 16);
      
      if (currentChainId !== MANTLE_SEPOLIA_CHAIN_ID) {
        setStatus('idle');
        try {
          // Request network switch
          await provider.send("wallet_switchEthereumChain", [{ chainId: `0x${MANTLE_SEPOLIA_CHAIN_ID.toString(16)}` }]);
          setError("Network switching... Please wait a moment then click Verify again.");
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
             setError("Please add Mantle Sepolia network to your wallet.");
          } else {
             setError("Please switch your wallet to Mantle Sepolia.");
          }
        }
        return;
      }

      // Step 1: Initializing
      setSimulationStep(0);
      await newqp(800);

      // Step 2: Scanning
      setSimulationStep(1);
      await newqp(1000);

      // Step 3: Registry Check
      setSimulationStep(2);
      await newqp(800);

      // Step 4: Blockchain Transaction
      setStatus('verifying'); 
      
      if ((MOCK_IDENTITY_ADDRESS as string) === "0x0000000000000000000000000000000000000000") {
         await newqp(1000);
         setStatus('success');
         onComplete();
         return;
      }

      // Verify Contract Code
      const code = await provider.getCode(MOCK_IDENTITY_ADDRESS);
      if (code === "0x") {
        throw new Error("Contract not found at this address on Mantle Sepolia. Please verify MOCK_IDENTITY_ADDRESS.");
      }

      const contract = new Contract(MOCK_IDENTITY_ADDRESS, MOCK_IDENTITY_ABI, signer);
      
      // Explicitly estimate gas to catch errors early
      try {
        await contract.verifyMe.estimateGas();
      } catch (gasErr: any) {
        console.error("Gas Estimation Error:", gasErr);
        throw new Error("Call would revert. Ensure you are on Mantle Sepolia and the contract is correctly deployed.");
      }

      const tx = await contract.verifyMe();
      await tx.wait();

      setStatus('success');
      onComplete();

    } catch (err: any) {
      console.error("Verification failed:", err);
      // Handle ethers v6 error complexity
      const msg = err.reason || err.message || "Verification failed";
      setError(msg);
      setStatus('failed');
    }
  };

  const newqp = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="py-8 text-center">
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Animated Rings */}
        <AnimatePresence mode="wait">
          {status === 'simulating' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <motion.div 
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-[#10B981]/40 rounded-full"
              />
              <motion.div 
                animate={{ rotate: -180, scale: [1, 0.9, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border border-[#10B981]/20 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm z-10">
          <AnimatePresence mode="wait">
            {status === 'idle' && <ShieldCheck className="w-12 h-12 text-zinc-500" />}
            {status === 'simulating' && simulationStep === 0 && (
               <Cpu className="w-12 h-12 text-[#10B981] animate-pulse" />
            )}
            {status === 'simulating' && simulationStep === 1 && (
               <Scan className="w-12 h-12 text-[#10B981] animate-pulse" />
            )}
            {status === 'simulating' && simulationStep === 2 && (
               <Globe className="w-12 h-12 text-[#10B981] animate-pulse" />
            )}
            {status === 'verifying' && <Lock className="w-12 h-12 text-yellow-500 animate-bounce" />}
            {status === 'success' && <CheckCircle2 className="w-16 h-16 text-[#10B981]" />}
            {status === 'failed' && <AlertCircle className="w-12 h-12 text-red-500" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Text Area */}
      <div className="h-24"> 
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-2xl font-bold mb-2">Identity Verification</h2>
              <p className="text-zinc-500 text-sm">Verify your humanity to access the game.</p>
            </motion.div>
          )}

          {status === 'simulating' && (
            <motion.div
              key={simulationStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-xl font-bold mb-2 text-[#10B981] animate-pulse">Processing...</h2>
              <p className="text-zinc-400 font-mono text-sm">{simulationTexts[simulationStep]}</p>
            </motion.div>
          )}
          
          {status === 'verifying' && (
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
             >
               <h2 className="text-xl font-bold mb-2 text-yellow-500">Sign Transaction</h2>
               <p className="text-zinc-400 text-sm">Confirm the verification on-chain.</p>
             </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2 className="text-2xl font-bold mb-2 text-[#10B981]">Verified!</h2>
              <p className="text-zinc-500 text-sm">Redirecting to event room...</p>
            </motion.div>
          )}
          
          {status === 'failed' && (
             <motion.div>
                <h2 className="text-xl font-bold mb-2 text-red-500">Verification Failed</h2>
                <p className="text-red-400 text-sm">{error}</p>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Button */}
      {status !== 'success' && status !== 'simulating' && status !== 'verifying' && (
         <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            className="mt-4 w-full py-4 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#10B981]/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
         >
            {status === 'failed' ? 'Try Again' : 'Verify Identity'}
         </motion.button>
      )}
      
      {/* Console Log (Aesthetic) */}
      <div className="mt-8 p-4 bg-black rounded-lg border border-white/5 text-left font-mono text-xs text-zinc-600 h-24 overflow-hidden flex flex-col justify-end">
        <p>{`> System ready.`}</p>
        {userAddress && <p className="text-[#10B981]">{`> Wallet connected: ${userAddress.slice(0,6)}...`}</p>}
        {status === 'simulating' && <p className="text-blue-400">{`> Executing ZK-SNARK protocol...`}</p>}
        {simulationStep > 0 && <p className="text-blue-400">{`> Biometric hash generated.`}</p>}
        {status === 'success' && <p className="text-[#10B981]">{`> Proof verified on Mantle Sepolia.`}</p>}
      </div>
    </div>
  );
}