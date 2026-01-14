import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { 
  useAccount, 
  useBalance, 
  useSwitchChain, 
  usePublicClient, 
  useWalletClient,
  useReadContract
} from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Globe, 
  Copy, 
  CheckCircle2, 
  X, 
  Loader2, 
  Search, 
  Cpu, 
  ArrowRightLeft,
  ArrowRight,
  ShieldCheck,
  Power
} from 'lucide-react';
import { parseEther, formatEther, erc20Abi } from 'viem';
import { ethers } from 'ethers';
import { 
  L1_CHAIN_ID, 
  L2_CHAIN_ID, 
  L1_MNT_TOKEN_ADDRESS, 
  L2_MNT_TOKEN_ADDRESS 
} from '@/utils/address';
import { 
  publicClientToProvider, 
  walletClientToSigner, 
  createMessenger,
  getExplorerUrl 
} from '../lib/bridge';

export default function BridgeContent() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('10');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'approving' | 'depositing' | 'relaying' | 'done' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  // L1 Balances
  const { data: ethBalance } = useBalance({
    address,
    chainId: L1_CHAIN_ID,
  });

  const { data: mntBalanceRaw } = useReadContract({
    address: L1_MNT_TOKEN_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: L1_CHAIN_ID,
  });

  const mntBalanceFormatted = useMemo(() => {
    if (!mntBalanceRaw) return '0.00';
    return parseFloat(formatEther(mntBalanceRaw)).toFixed(2);
  }, [mntBalanceRaw]);

  const { data: l2MntBalance, refetch: refetchL2Balance } = useBalance({
    address,
    chainId: L2_CHAIN_ID,
  });

  const l1PublicClient = usePublicClient({ chainId: L1_CHAIN_ID });
  const l2PublicClient = usePublicClient({ chainId: L2_CHAIN_ID });
  const { data: walletClient } = useWalletClient({ chainId: L1_CHAIN_ID });

  const handleBridge = async () => {
    if (!walletClient || !l1PublicClient || !l2PublicClient) {
      setErrorMessage('Clients not initialized');
      return;
    }

    try {
      setErrorMessage('');
      setIsBridging(true);
      setBridgeStatus('approving');

      const l1Provider = publicClientToProvider(l1PublicClient);
      const l2Provider = publicClientToProvider(l2PublicClient);
      const l1Signer = walletClientToSigner(walletClient);
      const messenger = createMessenger(l1Signer, l2Provider);
      const amountWei = parseEther(amount).toString();

      const currentAllowance = await messenger.approval(L1_MNT_TOKEN_ADDRESS, L2_MNT_TOKEN_ADDRESS);
      const currentAllowanceBN = (typeof currentAllowance === 'boolean') 
        ? (currentAllowance ? ethers.constants.MaxUint256 : ethers.constants.Zero)
        : currentAllowance;

      if (currentAllowanceBN.lt(amountWei)) {
        const approveTx = await messenger.approveERC20(L1_MNT_TOKEN_ADDRESS, L2_MNT_TOKEN_ADDRESS, amountWei);
        setTxHash(approveTx.hash);
        await approveTx.wait();
      }

      setBridgeStatus('depositing');
      const depositTx = await messenger.depositMNT(amountWei);
      setTxHash(depositTx.hash);
      await depositTx.wait();

      setBridgeStatus('relaying');
      try {
        await messenger.waitForMessageStatus(depositTx, 3, {
          pollIntervalMs: 30000,
        }); 
        setBridgeStatus('done');
      } catch (logErr) {
        console.warn("Status polling issue, fallback to balance polling", logErr);
      }
      setIsBridging(false);
      refetchL2Balance();

    } catch (err: any) {
      const msg = err.reason || err.message || 'Bridge failed';
      setErrorMessage(msg);
      setBridgeStatus('error');
      setIsBridging(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bridgeStatus === 'relaying' || bridgeStatus === 'depositing') {
      interval = setInterval(() => refetchL2Balance(), 15000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [bridgeStatus, refetchL2Balance]);

  const [initialL2Balance, setInitialL2Balance] = useState<bigint | null>(null);
  useEffect(() => {
    if (bridgeStatus === 'idle' && l2MntBalance) setInitialL2Balance(l2MntBalance.value);
  }, [l2MntBalance, bridgeStatus]);

  useEffect(() => {
    if (bridgeStatus === 'relaying' && l2MntBalance && initialL2Balance !== null) {
      if (l2MntBalance.value > initialL2Balance) setBridgeStatus('done');
    }
  }, [l2MntBalance, bridgeStatus, initialL2Balance]);

  const isL1 = chainId === L1_CHAIN_ID;
  const ethBalanceVal = ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0;
  const mntBalanceVal = mntBalanceRaw ? parseFloat(formatEther(mntBalanceRaw)) : 0;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Lexend+Zetta:wght@900&family=Fredoka:wght@700&family=Luckiest+Guy&family=Lexend:wght@400;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet" />
        <style>{`
          .font-hype { font-family: 'Lexend Zetta', sans-serif; }
          .font-action { font-family: 'Fredoka', sans-serif; }
          .font-game { font-family: 'Luckiest Guy', cursive; }
          .font-chunky { font-family: 'Lexend', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          
          .neon-yellow-slanted {
            color: #ffff00;
            font-family: 'Lexend Zetta', sans-serif;
            font-weight: 900;
            font-style: italic;
            -webkit-text-stroke: 2px black;
            text-shadow: 4px 4px 0px rgba(0,0,0,1);
          }
          
          .glass-modal {
            background: rgba(11, 14, 20, 0.85);
            backdrop-filter: blur(25px);
            border: 4px solid white;
            box-shadow: 0 0 80px rgba(124, 58, 237, 0.4);
          }

          .hud-box {
            background: #1a1a1a;
            border: 2px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
          }

          .hud-grid {
            background-image: radial-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 0);
            background-size: 20px 20px;
          }

          .scan-line {
            height: 2px;
            background: #4ADE80;
            box-shadow: 0 0 15px #4ADE80;
            position: absolute;
            left: 0;
            right: 0;
            z-index: 10;
            animation: scan-move 4s linear infinite;
          }

          @keyframes scan-move {
            0% { top: 0%; opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }

          .slam-button {
            background: #4ADE80;
            border: 4px solid white;
            box-shadow: 0 8px 0 black;
            transition: all 0.1s;
          }

          .slam-button:active {
            transform: translateY(4px);
            box-shadow: 0 4px 0 black;
          }

          .puck-shadow {
            box-shadow: 0 6px 0 rgba(0,0,0,0.5);
          }

          .grid-bg {
            background-image: linear-gradient(rgba(124, 58, 237, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(124, 58, 237, 0.1) 1px, transparent 1px);
            background-size: 40px 40px;
          }
        `}</style>
      </Head>

      <div className="absolute inset-0 flex items-center justify-center p-4 grid-bg">
        
        {/* LIQUIDITY PORTAL MODAL */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, rotate: -1 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          className="relative w-full max-w-lg glass-modal rounded-[40px] p-8 md:p-10 z-10"
        >
          {/* Header */}
          <div className="text-center mb-8 relative">
            <motion.div 
               animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute -top-16 left-1/2 -translate-x-1/2"
            >
               <div className="w-20 h-20 bg-white rounded-2xl border-4 border-black flex items-center justify-center shadow-xl rotate-12">
                  <Zap size={48} className="text-[#ffff00] fill-[#ffff00]" strokeWidth={2.5} />
               </div>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl neon-yellow-slanted uppercase leading-none mt-4 tracking-tighter">
              LIQUIDITY PORTAL
            </h1>
            <p className="text-[#22d3ee] font-mono text-[10px] font-bold tracking-[0.3em] uppercase mt-2">
              Syncing Sepolia MNT to the Mantle Mainframe
            </p>
          </div>

          {/* Stepper with Power Pucks */}
          <div className="flex items-center justify-between mb-10 px-4">
             <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full border-[3px] border-white flex items-center justify-center puck-shadow transition-all ${step >= 1 ? 'bg-[#4ADE80]' : 'bg-zinc-800'}`}>
                   {step > 1 ? <CheckCircle2 size={24} className="text-black" strokeWidth={3} /> : <Search size={24} className="text-black" strokeWidth={3} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-white/50">SCAN</span>
             </div>

             <div className="flex-1 h-1 bg-white/10 mx-2 relative overflow-hidden">
                <motion.div 
                  animate={{ left: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[#4ADE80] to-transparent"
                />
             </div>

             <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full border-[3px] border-white flex items-center justify-center puck-shadow transition-all ${step === 2 ? 'bg-[#7C3AED] animate-pulse shadow-[0_0_20px_#7c3aed]' : step > 2 ? 'bg-[#4ADE80]' : 'bg-zinc-800'}`}>
                   {step > 2 ? <CheckCircle2 size={24} className="text-black" strokeWidth={3} /> : <ArrowRightLeft size={24} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-white/50">WARP</span>
             </div>

             <div className="flex-1 h-1 bg-white/10 mx-2" />

             <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full border-[3px] border-white flex items-center justify-center puck-shadow ${step === 3 ? 'bg-yellow-400' : 'bg-zinc-800'}`}>
                   <ShieldCheck size={24} className="text-black/30" strokeWidth={3} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-white/50">GATEWAY</span>
             </div>
          </div>

          {/* Main Content Area */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                {/* HUD Balance Display */}
                <div className="hud-box rounded-[25px] p-6 hud-grid relative group">
                  <div className="scan-line" />
                  
                  <div className="space-y-6 relative z-10">
                    <div>
                       <p className="text-[#22d3ee] font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Source: Ethereum Sepolia</p>
                       <div className="flex justify-between items-end">
                          <span className="text-white/40 font-mono text-xs uppercase">ETH Balance</span>
                          <span className="text-2xl md:text-3xl font-mono font-black text-white italic tracking-tighter">
                             {ethBalanceVal.toFixed(4)} <span className="text-[#22d3ee] text-sm">ETH</span>
                          </span>
                       </div>
                    </div>

                    <div className="h-[2px] bg-white/5" />

                    <div>
                       <div className="flex justify-between items-end">
                          <span className="text-[#4ADE80] font-mono text-xs uppercase font-bold">MNT Balance</span>
                          <span className="text-3xl md:text-4xl font-mono font-black text-[#4ADE80] italic tracking-tighter">
                             {mntBalanceFormatted} <span className="text-sm">MNT</span>
                          </span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {!isL1 ? (
                    <button 
                      onClick={() => switchChain({ chainId: L1_CHAIN_ID })}
                      className="w-full py-6 slam-button rounded-[30px] flex items-center justify-center gap-4 group"
                    >
                       <Power size={32} className="text-black group-hover:rotate-12 transition-transform" strokeWidth={3} />
                       <span className="text-2xl md:text-3xl font-action italic font-black text-black uppercase tracking-tight">SWITCH TO L1!</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setStep(2)}
                      disabled={mntBalanceVal < 0.1 || ethBalanceVal < 0.005}
                      className="w-full py-6 slam-button rounded-[30px] flex items-center justify-center gap-4 group disabled:opacity-50"
                    >
                       <span className="text-2xl md:text-3xl font-action italic font-black text-black uppercase tracking-tight">INITIALIZE SYNC!</span>
                       <ArrowRight size={32} className="text-black group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                    </button>
                  )}

                  {mntBalanceVal < 0.1 && address && (
                    <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl text-center">
                       <p className="text-red-400 font-bold text-[10px] uppercase tracking-wider italic">Low MNT reserves on Ethereum Sepolia!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="hud-box rounded-[25px] p-6 hud-grid">
                   <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Bridge Payload Configuration</p>
                   <div className="relative">
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-black/50 border-4 border-white/10 rounded-2xl p-4 text-4xl font-mono font-black text-[#4ADE80] focus:outline-none focus:border-[#4ADE80] transition-colors"
                        disabled={isBridging || bridgeStatus === 'done'}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black italic">MNT</div>
                   </div>
                </div>

                <div className="space-y-4">
                  {bridgeStatus === 'idle' && (
                    <button 
                      onClick={handleBridge}
                      className="w-full py-6 slam-button rounded-[30px] flex flex-col items-center justify-center"
                    >
                       <span className="text-3xl font-action italic font-black text-black uppercase">SWITCH & SYNC!</span>
                       <span className="text-[9px] font-mono text-black/50 font-bold">ACTIVATE WARP DRIVE</span>
                    </button>
                  ) }

                  {bridgeStatus !== 'idle' && bridgeStatus !== 'done' && (
                    <div className="hud-box rounded-[30px] p-8 text-center bg-black/40">
                       <Loader2 className="w-16 h-16 text-[#4ADE80] animate-spin mx-auto mb-4" strokeWidth={3} />
                       <h3 className="text-2xl font-black italic text-white uppercase mb-2 leading-none">
                          {bridgeStatus === 'approving' && 'Auth Scanning...'}
                          {bridgeStatus === 'depositing' && 'Warping MNT...'}
                          {bridgeStatus === 'relaying' && 'Crossing Rift...'}
                       </h3>
                       <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                          DO NOT CLOSE THE PORTAL GATE
                       </p>
                       
                       {txHash && (
                         <a 
                           href={getExplorerUrl(L1_CHAIN_ID, txHash)}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-mono text-white/50 hover:text-white transition-colors inline-flex items-center gap-2 mt-6 uppercase"
                         >
                           Monitor Pulse <ArrowRight size={12} />
                         </a>
                       )}
                    </div>
                  )}

                  {bridgeStatus === 'done' && (
                    <motion.div 
                       initial={{ scale: 0.8, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       className="hud-box rounded-[30px] p-8 text-center border-[#4ADE80]"
                    >
                       <div className="w-20 h-20 bg-[#4ADE80] rounded-full border-4 border-white flex items-center justify-center mx-auto mb-6 puck-shadow">
                          <CheckCircle2 size={48} className="text-black" strokeWidth={4} />
                       </div>
                       <h3 className="text-3xl font-black italic text-white uppercase mb-4 leading-none font-action">SYNC COMPLETE!</h3>
                       <p className="text-zinc-400 text-xs mb-8">MNT successfully materialized on Mantle Sepolia.</p>
                       
                       <button 
                         onClick={() => switchChain({ chainId: L2_CHAIN_ID })}
                         className="w-full py-4 bg-white text-black font-black rounded-2xl border-4 border-black puck-shadow flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none transition-all uppercase italic"
                       >
                         Switch to Mainframe <ArrowRight size={20} />
                       </button>
                    </motion.div>
                  )}

                  {errorMessage && bridgeStatus === 'error' && (
                    <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-2xl text-red-400 text-[10px] font-mono font-bold uppercase tracking-widest text-center">
                       ERROR CODE: {errorMessage.slice(0, 100)}...
                       <button onClick={() => setBridgeStatus('idle')} className="block w-full mt-2 text-white underline">RETRY SCAN</button>
                    </div>
                  )}

                  <button 
                    onClick={() => setStep(1)}
                    className="w-full py-2 text-zinc-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                    disabled={isBridging && bridgeStatus !== 'error'}
                  >
                    ← RE-INITIALIZE SCANNER
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Branding */}
          <div className="mt-8 flex justify-center opacity-30 select-none pointer-events-none">
             <div className="flex gap-2">
                <div className="w-4 h-4 bg-white rounded-sm" />
                <div className="w-4 h-4 bg-white/50 rounded-sm" />
                <div className="w-4 h-4 bg-white/20 rounded-sm" />
             </div>
             <div className="ml-4 font-mono text-[9px] font-bold tracking-[0.4em] text-white">COINTOWN // BRIDGE.EXE</div>
          </div>
        </motion.div>

        {/* Backdrop elements */}
        <div className="fixed inset-0 pointer-events-none -z-0 overflow-hidden">
           <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#7C3AED] rounded-full blur-[150px] opacity-10 animate-pulse"></div>
           <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#4ADE80] rounded-full blur-[150px] opacity-10 animate-pulse transition-all"></div>
        </div>

      </div>
    </main>
  );
}
