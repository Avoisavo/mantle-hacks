import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, Shield, Zap, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAccount } from 'wagmi'; 
import ProofGenerator from '../components/identity/ProofGenerator';
import SuccessState from '../components/identity/SuccessState';
import ConnectButton from '../components/ConnectButton';
import Head from 'next/head';

export default function IdentityPage() {
  const [step, setStep] = useState(1);
  const { address, isConnected } = useAccount();
  const { data: session } = useSession();
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

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
                    setStep(2);
                }
            } catch (e) {
                console.error("Failed to fetch smart account", e);
            }
        }
    };
    fetchSmartAccount();
  }, [session]);

  useEffect(() => {
    if (isConnected && step === 1 && !session) {
      setStep(2);
    } else if (!isConnected && !session && step !== 1) {
      setStep(1);
    }
  }, [isConnected, step, session]);

  const [verificationTxHash, setVerificationTxHash] = useState<string | undefined>();
  const activeAddress = smartAccountAddress || address || '';

  const handleComplete = (hash?: string) => {
    setVerificationTxHash(hash);
    setStep(3);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] text-white font-chunky">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Lexend+Zetta:wght@900&family=Fredoka:wght@700&family=Luckiest+Guy&family=Lexend:wght@400;900&display=swap" rel="stylesheet" />
        <style>{`
          .font-hype { font-family: 'Lexend Zetta', sans-serif; }
          .font-action { font-family: 'Fredoka', sans-serif; }
          .font-game { font-family: 'Luckiest Guy', cursive; }
          .font-chunky { font-family: 'Lexend', sans-serif; }
          
          .mantle-text {
            color: #ffff00;
            -webkit-text-stroke: 4px black;
            text-shadow: 0 0 20px rgba(255, 0, 255, 0.8);
          }
          
          .grid-floor {
            background-image: 
              linear-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.2) 1px, transparent 1px);
            background-size: 50px 50px;
            transform: perspective(500px) rotateX(60deg);
            position: absolute;
            bottom: -150px;
            left: -50%;
            right: -50%;
            height: 600px;
            z-index: 0;
            opacity: 0.4;
          }

          .sticker-border {
             border: 5px solid white;
             box-shadow: 0 10px 0 rgba(0,0,0,0.2);
          }

          .puck-shadow {
            box-shadow: 0 8px 0 rgba(0,0,0,0.4);
          }

          .city-silhouette {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 200px;
            background: linear-gradient(to top, #000 70%, transparent);
            z-index: 1;
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            pointer-events: none;
            opacity: 0.6;
          }

          .building {
            width: 60px;
            background: #000;
            border-top: 4px solid #ff00ff;
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
          }
           @keyframes scan {
            0% { transform: translateY(-40px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(40px); opacity: 0; }
          }
          .animate-scan {
            animation: scan 2s linear infinite;
          }
        `}</style>
      </Head>

      {/* Environmental Skybox */}
      <div className="absolute inset-0 z-0 overflow-hidden">
         <div className="blob absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600 rounded-full blur-[120px] opacity-20"></div>
         <div className="blob absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
         <div className="grid-floor"></div>
         
         {/* City Silhouettes */}
         <div className="city-silhouette">
            <div className="building h-[120px] w-[80px]"></div>
            <div className="building h-[180px] w-[60px]"></div>
            <div className="building h-[140px] w-[100px]"></div>
            <div className="building h-[200px] w-[70px]"></div>
            <div className="building h-[160px] w-[90px]"></div>
            <div className="building h-[130px] w-[60px]"></div>
         </div>
      </div>

      <div className="relative z-10 container mx-auto pt-8 pb-12 px-6 max-w-2xl min-h-[100vh] flex flex-col items-center justify-center">
        
        {/* Hype Header - Aggressively Scaled Down */}
        <header className="mb-6 text-center">
           <motion.div
             initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
             animate={{ scale: 1, rotate: -3, opacity: 1 }}
             className="relative"
           >
              <h1 className="text-4xl md:text-6xl font-black mantle-text font-hype italic tracking-tighter leading-none mb-3">
                MANTLE ID
              </h1>
              <div className="absolute inset-0 bg-yellow-400/10 blur-2xl rounded-full -z-10 animate-pulse"></div>
           </motion.div>
           
           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="inline-block bg-purple-900/40 backdrop-blur-xl px-6 py-2 rounded-full border border-white/20"
           >
              <p className="text-white font-black text-xs md:text-sm tracking-tight uppercase italic whitespace-nowrap">
                Secure your status on the Mantle Network.
              </p>
           </motion.div>
        </header>

        {/* Player Progression Stepper - Compact */}
        <div className="w-full max-w-lg flex items-center justify-between mb-8 relative px-6">
           {/* Fiber-Optic Cable */}
           <div className="absolute top-1/2 left-0 right-0 h-2 bg-zinc-900 -translate-y-1/2 rounded-full overflow-hidden z-0 border border-white/5">
              <motion.div 
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-sm"
              ></motion.div>
              <div className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                 step === 1 ? 'w-0' : step === 2 ? 'w-1/2 bg-cyan-500/80 shadow-[0_0_15px_#22d3ee]' : 'w-full bg-cyan-500/80 shadow-[0_0_15px_#22d3ee]'
              }`}></div>
           </div>

           {[1, 2, 3].map((i) => (
             <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  className={`w-12 h-12 rounded-full border-[3px] border-white flex items-center justify-center text-xl font-black puck-shadow transition-all duration-500 ${
                    step > i 
                    ? 'bg-[#4ADE80] text-black shadow-[0_0_15px_#4ade80]' 
                    : step === i 
                    ? 'bg-[#8B5CF6] text-white shadow-[0_0_20px_#8b5cf6] animate-pulse' 
                    : 'bg-[#1e1b4b] text-zinc-600'
                  }`}
                >
                   {step > i ? <CheckCircle2 size={24} strokeWidth={4} /> : i}
                </motion.div>
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${step === i ? 'text-white' : 'text-zinc-600'}`}>
                   {i === 1 ? 'LOGGED' : i === 2 ? 'CORE' : 'SECURED'}
                </span>
             </div>
           ))}
        </div>

        {/* Action Stage - Compact & High Energy */}
        <div className="w-full max-w-md relative group/card">
           {/* Cyan Aura / Glow spilling out on hover */}
           <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-cyan-400/0 group-hover/card:bg-cyan-400/20 blur-[60px] rounded-full transition-all duration-700 -z-10"></div>
           
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             className="relative bg-zinc-900/90 backdrop-blur-3xl rounded-[50px] p-8 border-[6px] border-white shadow-[0_20px_0_rgba(0,0,0,0.6)] overflow-hidden min-h-[420px] flex flex-col items-center justify-center transition-all"
           >
              {/* Internal Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
              
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className="flex flex-col items-center text-center space-y-10 py-4"
                  >
                    {/* Glowing Neon Orb - Artifact */}
                    <div className="relative">
                       <div className="absolute inset-[-40px] bg-purple-600/40 blur-[50px] rounded-full animate-pulse"></div>
                       <div className="relative w-36 h-36 bg-white rounded-full border-[6px] border-black flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.5)] overflow-visible">
                          <ShieldCheck size={80} className="text-purple-600" strokeWidth={3} />
                          <div className="absolute top-0 left-0 w-full h-[6px] bg-purple-400 opacity-60 animate-scan"></div>
                          
                          {/* LVL 1 Tag */}
                          <div className="absolute -bottom-2 -right-4 bg-yellow-400 border-[4px] border-black px-3 py-1 rounded-xl transform rotate-12 shadow-lg">
                             <span className="text-black font-black text-xs tracking-tighter">LVL 1</span>
                          </div>
                          
                          {/* Small Floating Sparks */}
                          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute -top-4 -left-4 text-cyan-400">
                             <Zap size={24} fill="currentColor" />
                          </motion.div>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none font-action">PLAYER VERIFICATION</h2>
                      <p className="text-zinc-400 font-black uppercase tracking-widest text-[11px] italic">Establish your secure link to Cointown.</p>
                    </div>

                    <div className="w-full scale-110">
                      <ConnectButton />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" className="w-full">
                    <ProofGenerator 
                      onComplete={handleComplete} 
                      userAddress={activeAddress}
                      isSmartAccount={!!smartAccountAddress}
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" className="w-full">
                    <SuccessState txHash={verificationTxHash} />
                  </motion.div>
                )}
              </AnimatePresence>
           </motion.div>
        </div>

      </div>
    </main>
  );
}
