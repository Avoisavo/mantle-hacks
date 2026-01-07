import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2 } from 'lucide-react';
import { useAccount } from 'wagmi'; 
import ProofGenerator from '../components/identity/ProofGenerator';
import SuccessState from '../components/identity/SuccessState';
import ConnectButton from '../components/ConnectButton';

export default function IdentityPage() {
  const [step, setStep] = useState(1);
  const { address, isConnected } = useAccount();
  const { data: session } = useSession();
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

  // Fetch smart account if logged in via Google
  useEffect(() => {
    const fetchSmartAccount = async () => {
        if (session?.user?.email) {
            try {
                const response = await fetch("/api/account/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: session.user.email }),
                });
                const data = await response.json();
                if (data.data?.accountAddress) {
                    setSmartAccountAddress(data.data.accountAddress);
                    setStep(2); // Auto-advance
                }
            } catch (e) {
                console.error("Failed to fetch smart account", e);
            }
        }
    };
    fetchSmartAccount();
  }, [session]);

  useEffect(() => {
    // If wallet connected (traditional flow)
    if (isConnected && step === 1 && !session) {
      setStep(2);
    } else if (!isConnected && !session && step !== 1) {
      setStep(1);
    }
  }, [isConnected, step, session]);

  const activeAddress = smartAccountAddress || address || '';

  const nextStep = () => setStep(3);

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F5F5] selection:bg-[#10B981]/30 selection:text-[#10B981]">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 max-w-2xl mx-auto pt-24 px-6">
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/5 text-[#10B981] text-xs font-mono mb-4"
          >
            <Lock size={12} />
            MANTLE IDENTITY VERIFICATION
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tighter font-space italic">
            Mantle<span className="text-[#10B981]">ID</span> Registration
          </h1>
          <p className="mt-4 text-zinc-500 max-w-md mx-auto">
            Securely verify your identity on Mantle using our gasless registration protocol.
          </p>
        </header>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#10B981]/20 to-[#050505] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden min-h-[400px]">
            
            <div className="flex justify-between mb-12 relative">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= i ? 'bg-[#10B981] text-black' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {step > i ? <CheckCircle2 size={16} /> : i}
                  </div>
                </div>
              ))}
              <div className="absolute top-4 left-0 w-full h-[1px] bg-zinc-800 -z-0" />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center justify-center space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Connect Wallet</h2>
                    <p className="text-zinc-500">Link your wallet to verify your on-chain identity.</p>
                  </div>
                  <div className="w-full max-w-xs">
                    <ConnectButton />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2">
                  {/* We pass the connected address. Signer is handled internally via hooks or passed if available */}
                  <ProofGenerator 
                    onComplete={nextStep} 
                    userAddress={activeAddress}
                    signer={null} 
                    isSmartAccount={!!smartAccountAddress}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3">
                  <SuccessState />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
