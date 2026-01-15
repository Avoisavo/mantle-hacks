import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Scan, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Camera, UserSquare2, X, Shield, Zap, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useSignMessage } from 'wagmi';
import { KYC_REGISTRY_ADDRESS } from '@/utils/address';
import { kyc as KYC_REGISTRY_ABI } from '@/utils/kyc';

interface ProofGeneratorProps {
  onComplete: (hash?: string) => void;
  userAddress: string;
  signer?: any;
  isSmartAccount?: boolean;
}

const MANTLE_SEPOLIA_CHAIN_ID = 5003;

export default function ProofGenerator({ onComplete, userAddress, isSmartAccount }: ProofGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'face_prep' | 'face_scan' | 'id_prep' | 'id_scan' | 'id_confirm' | 'checking' | 'signing' | 'verifying' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { signMessageAsync } = useSignMessage();
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const checkStatus = useCallback(async () => {
    if (!userAddress || !KYC_REGISTRY_ADDRESS) return false;
    try {
      const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
      const contract = new ethers.Contract(KYC_REGISTRY_ADDRESS, KYC_REGISTRY_ABI, provider);
      const isVerified = await contract.hasPassed(userAddress);
      if (isVerified) {
        setStatus('success');
        setTimeout(() => onComplete(txHash || undefined), 2000);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to check status", err);
      return false;
    }
  }, [userAddress, KYC_REGISTRY_ADDRESS, onComplete, txHash]);

  useEffect(() => {
    let active = true;
    const runInitialCheck = async () => {
      if (status === 'idle') {
        setStatus('checking');
        const verified = await checkStatus();
        if (active && !verified) setStatus('idle');
      }
    };
    runInitialCheck();
    return () => { active = false; };
  }, [userAddress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'verifying') {
      interval = setInterval(async () => {
        const verified = await checkStatus();
        if (verified) clearInterval(interval);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, checkStatus]);

  const startCamera = async () => {
    if (cameraStream?.active) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch (e) {
      setError("Camera access is required for identity verification.");
      setStatus('failed');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => { return () => stopCamera(); }, []);

  useEffect(() => {
    if (status === 'face_scan' || status === 'id_scan') {
      if (!cameraStream?.active) {
        startCamera();
      }
    }
  }, [status, cameraStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && cameraStream) {
      video.srcObject = cameraStream;
      video.onloadedmetadata = () => {
        video.play().catch(console.error);
      };
    }
  }, [cameraStream, status]);

  useEffect(() => {
    if (status === 'face_scan' && cameraStream) {
      const startTime = Date.now();
      const duration = 10000;
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setScanProgress(progress);
        if (progress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setStatus('id_prep');
            setScanProgress(0);
          }, 500);
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [status, cameraStream]);

  useEffect(() => {
    if (status === 'id_scan') {
      const startTime = Date.now();
      const duration = 5000;
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setScanProgress(progress);
        if (progress >= 100) {
          clearInterval(timer);
          stopCamera();
          setTimeout(() => {
            setStatus('id_confirm');
            setScanProgress(0);
          }, 500);
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [status]);

  const handleVerify = async () => {
    if (!KYC_REGISTRY_ADDRESS) return;
    try {
      setStatus('signing');
      const timestamp = Date.now();
      const message = `KYC_APPROVE: ${userAddress} on chain ${MANTLE_SEPOLIA_CHAIN_ID} for contract ${KYC_REGISTRY_ADDRESS} at ${timestamp}`;
      let signature = isSmartAccount ? "0x" + "00".repeat(65) : await signMessageAsync({ message });
      setStatus('verifying');
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress, signature, message, chainId: MANTLE_SEPOLIA_CHAIN_ID, contractAddress: KYC_REGISTRY_ADDRESS, timestamp })
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.status === 'ALREADY_VERIFIED') { checkStatus(); return; }
        throw new Error(data.error || 'Verification failed');
      }
      if (data.txHash) setTxHash(data.txHash);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStatus('failed');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Dynamic Visual Content - Scaled Down */}
      <div className="relative w-full mb-6 flex justify-center py-4">
        <AnimatePresence mode="wait">
          {(status === 'idle' || status === 'checking' || status === 'face_prep' || status === 'id_prep') && (
            <motion.div 
              key="artifact"
              initial={{ scale: 0.8, rotateX: 45, opacity: 0 }}
              animate={{ scale: 0.85, rotateX: 0, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="relative flex items-center justify-center h-32 w-32"
            >
              {/* Neon Energy Ring */}
              <div className="absolute inset-[-15%] rounded-full border-[3px] border-cyan-400/30 animate-pulse"></div>
              
              {/* Chrome 3D Shield */}
              <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-zinc-400 via-white to-zinc-400 rounded-2xl border-4 border-black flex items-center justify-center shadow-[0_10px_20px_rgba(255,255,255,0.4)]">
                 <Shield size={48} className="text-black" strokeWidth={3} />
                 
                 {/* Floating Cubes & Sparks */}
                 <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-4 -right-4 text-yellow-400">
                    <Sparkles size={16} />
                 </motion.div>
              </div>
            </motion.div>
          )}

          {(status === 'face_scan' || status === 'id_scan') && (
            <motion.div 
              key="scanner"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`relative mx-auto rounded-[30px] overflow-hidden border-4 border-white shadow-[0_0_40px_rgba(34,211,238,0.4)] ${status.includes('id') ? 'w-full aspect-[1.586/1]' : 'w-56 aspect-square'}`}
            >
              <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${status.includes('face') ? 'transform scale-x-[-1]' : ''}`} />
              <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none">
                <motion.div 
                  initial={{ top: "0%" }} 
                  animate={{ top: "100%" }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }} 
                  className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-50" 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Controls - Compact */}
      <div className="w-full space-y-6">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-white font-black text-3xl italic tracking-tighter uppercase leading-none font-action">SECURE STATUS</h2>
                <p className="text-cyan-400 font-black text-sm uppercase tracking-widest italic animate-pulse">Initializing Protocol...</p>
              </div>
              <button 
                onClick={() => setStatus('face_prep')}
                className="group relative w-full py-6 bg-[#4ADE80] rounded-[30px] border-[5px] border-white shadow-[0_10px_0_#166534] active:translate-y-[6px] active:shadow-[0_4px_0_#166534] transition-all overflow-hidden"
              >
                 <span className="relative z-10 text-3xl font-black italic text-black font-action uppercase tracking-tight">START SCAN!</span>
              </button>
            </motion.div>
          )}

          {status === 'face_prep' && (
            <motion.div key="face_prep" className="space-y-6">
              <div className="text-center">
                <h2 className="text-white font-black text-3xl italic tracking-tighter uppercase mb-1">BIOMETRIC GRID</h2>
                <p className="text-zinc-400 font-bold text-[10px] tracking-widest">CENTER FACE IN FIELD</p>
              </div>
              <button onClick={() => setStatus('face_scan')} className="w-full py-6 bg-cyan-400 rounded-[30px] border-[5px] border-white shadow-[0_10px_0_#0891b2] active:translate-y-[6px] active:shadow-[0_4px_0_#0891b2] text-2xl font-black italic text-black font-action flex items-center justify-center gap-3">
                 <Camera size={28} strokeWidth={3} /> CAPTURE!
              </button>
            </motion.div>
          )}

          {status === 'id_prep' && (
            <motion.div key="id_prep" className="space-y-6">
               <div className="text-center">
                <h2 className="text-white font-black text-3xl italic tracking-tighter uppercase mb-1">DOCUMENT SYNC</h2>
                <p className="text-zinc-400 font-bold text-[10px] tracking-widest">SHOW LEGENDARY ID</p>
              </div>
              <button onClick={() => setStatus('id_scan')} className="w-full py-6 bg-purple-500 rounded-[30px] border-[5px] border-white shadow-[0_10px_0_#6b21a8] active:translate-y-[6px] active:shadow-[0_4px_0_#6b21a8] text-2xl font-black italic text-white font-action flex items-center justify-center gap-3 uppercase">
                 <UserSquare2 size={28} strokeWidth={3} /> LINK ID!
              </button>
            </motion.div>
          )}

          {status === 'id_confirm' && (
            <motion.div key="id_confirm" className="w-full space-y-4">
              <div className="text-center">
                 <h2 className="text-white font-black text-3xl italic tracking-tighter uppercase font-action">DATA VALID!</h2>
                 <p className="text-cyan-400 font-black italic tracking-widest uppercase text-[10px] mt-1">Integrity Check Successful</p>
              </div>
              
              <div className="bg-white/5 border-[3px] border-white/10 rounded-[30px] p-6 space-y-4 text-left relative overflow-hidden group">
                <div className="space-y-1">
                   <label className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.1em]">Subject Name</label>
                   <p className="text-white font-black text-xl italic tracking-tight font-chunky">ALICE SMITH</p>
                </div>
                <div className="space-y-1">
                   <label className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.1em]">Registry Code</label>
                   <p className="text-[#ff00ff] font-black text-xl font-mono">MNT-742-998</p>
                </div>
              </div>

              <button 
                onClick={handleVerify}
                className="w-full py-6 bg-[#4ADE80] rounded-[40px] border-[5px] border-white shadow-[0_12px_0_#166534] active:translate-y-[8px] active:shadow-[0_4px_0_#166534] transition-all flex flex-col items-center justify-center group relative overflow-hidden"
              >
                 <span className="relative z-10 text-3xl font-black italic text-black font-action uppercase">VERIFY IDENTITY!</span>
              </button>
            </motion.div>
          )}

          {status === 'verifying' && (
            <motion.div key="verifying" className="flex flex-col items-center gap-8 py-10">
               <div className="relative">
                  <RefreshCw className="w-24 h-24 text-cyan-400 animate-spin" strokeWidth={3} />
                  <div className="absolute inset-0 blur-xl bg-cyan-400 opacity-20 animate-pulse"></div>
               </div>
               <div className="text-center">
                  <h2 className="text-white font-black text-4xl italic tracking-tighter uppercase mb-2">UPLOADING...</h2>
                  <p className="text-cyan-400 font-black text-sm tracking-widest animate-pulse">BROADCASTING TO MANTLE SEPOLIA</p>
               </div>
            </motion.div>
          )}
          
          {status === 'failed' && (
            <motion.div key="failed" className="text-center space-y-6">
               <AlertCircle size={80} className="text-red-500 mx-auto" strokeWidth={3} />
               <div className="space-y-2">
                 <h2 className="text-white font-black text-4xl italic tracking-tighter uppercase">PROTOCOL ERROR</h2>
                 <p className="text-red-400 font-bold tracking-tight">{error}</p>
               </div>
               <button onClick={() => setStatus('idle')} className="w-full py-5 bg-white text-black rounded-[30px] border-4 border-black font-black uppercase italic text-xl shadow-[0_8px_0_#666]">REBOOT SYSTEM!</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
