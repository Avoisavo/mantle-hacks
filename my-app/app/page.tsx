// app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cpu, Wallet, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

// Components
import WalletConnect from './components/zkme/WalletConnect';
import ProofGenerator from './components/zkme/ProofGenerator';
import SuccessState from './components/zkme/SuccessState';

export default function ZkMeSignUp() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<any>(null);

  const handleConnect = (address: string, signer: any) => {
    setUserAddress(address);
    setSigner(signer);
    setStep(2);
  };

  const nextStep = () => setStep(s => s + 1);

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F5F5] selection:bg-[#10B981]/30 selection:text-[#10B981]">
      {/* Dynamic Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 max-w-2xl mx-auto pt-24 px-6">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/5 text-[#10B981] text-xs font-mono mb-4"
          >
            <Lock size={12} />
            ZERO KNOWLEDGE IDENTITY PROTOCOL
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tighter font-space italic">
            zk<span className="text-[#10B981]">Me</span> Registration
          </h1>
          <p className="mt-4 text-zinc-500 max-w-md mx-auto">
            Verify your identity globally without ever sharing a single piece of raw personal data.
          </p>
        </header>

        {/* Main Interface Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#10B981]/20 to-[#050505] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden">
            
            {/* Step Progress */}
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
                >
                  <WalletConnect onConnect={handleConnect} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2">
                  <ProofGenerator 
                    onComplete={nextStep} 
                    userAddress={userAddress}
                    signer={signer}
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