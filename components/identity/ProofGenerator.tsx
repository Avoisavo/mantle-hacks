import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Scan, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Camera, UserSquare2, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { useSignMessage } from 'wagmi';

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

  const KYC_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS;
  const KYC_REGISTRY_ABI = ["function hasPassed(address user) external view returns (bool)"];

  const checkStatus = useCallback(async () => {
    if (!userAddress || !KYC_REGISTRY_ADDRESS) return false;
    try {
      const provider = new JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
      const contract = new Contract(KYC_REGISTRY_ADDRESS, KYC_REGISTRY_ABI, provider);
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
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

  const startVerificationFlow = () => {
    if (!userAddress) {
      setError("Wallet not connected");
      setStatus('failed');
      return;
    }
    setError(null);
    setStatus('face_prep');
  };

  const initFaceScan = async () => {
    await startCamera();
    setStatus('face_scan');
  };

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
    <div className="py-8 text-center text-white">
      <div className="relative w-full max-w-sm mx-auto mb-8">
        {(status === 'face_scan' || status === 'id_scan' || status === 'face_prep' || status === 'id_prep') ? (
            <div className={`relative mx-auto rounded-3xl overflow-hidden border-2 transition-all duration-500 bg-black shadow-[0_0_30px_rgba(16,185,129,0.2)] ${
                (status === 'face_scan' || status === 'id_scan') 
                    ? (status.includes('id') ? 'w-full aspect-[1.586/1] scale-100' : 'w-full aspect-square scale-100')
                    : (status === 'id_prep' ? 'w-64 aspect-[1.586/1] scale-95 opacity-50' : 'w-48 aspect-square scale-95 opacity-50')
            }`}>
                 <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                        (status === 'face_scan' || status === 'face_prep') ? 'transform scale-x-[-1]' : ''
                    }`} 
                 /> 
                {(status === 'face_scan' || status === 'id_scan') && (
                    <div className="absolute inset-0 bg-[#10B981]/10 z-30">
                        <motion.div initial={{ top: "0%" }} animate={{ top: "100%" }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[3px] bg-[#10B981] shadow-[0_0_20px_#10B981]" />
                        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
                    </div>
                )}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${(status === 'face_scan' || status === 'id_scan') ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{status.replace('_', ' ')}</span>
                </div>
            </div>
        ) : status === 'id_confirm' ? (
            <div className="h-0" /> /* Shrink the icon area to make room for form */
        ) : (
            <div className="w-32 h-32 mx-auto flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm z-10 border border-white/10 relative">
                <AnimatePresence mode="wait">
                    {(status === 'idle' || status === 'checking') && <ShieldCheck className="w-12 h-12 text-zinc-500" />}
                    {status === 'signing' && <Scan className="w-12 h-12 text-blue-500 animate-pulse" />}
                    {status === 'verifying' && <RefreshCw className="w-12 h-12 text-yellow-500 animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="w-16 h-16 text-[#10B981]" />}
                    {status === 'failed' && <AlertCircle className="w-12 h-12 text-red-500" />}
                </AnimatePresence>
            </div>
        )}
      </div>

      <div className={`${status === 'id_confirm' ? 'h-auto' : 'h-40'} px-4 flex flex-col items-center justify-center`}>
        <AnimatePresence mode="wait">
          {(status === 'idle' || status === 'checking') && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold mb-2">Identity Verification</h2>
              <p className="text-zinc-500 text-sm mb-4">{status === 'checking' ? 'Checking status...' : isSmartAccount ? 'Verify your Google Account' : 'Secure identification protocol'}</p>
            </motion.div>
          )}

          {status === 'face_prep' && (
              <motion.div key="face_prep" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Biometric Scan Required</h2>
                    <p className="text-zinc-400 text-sm">Please ensure you are in a well-lit area and your face is clearly visible.</p>
                  </div>
                  <button onClick={initFaceScan} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"><Camera size={18} /> Start Facial Scan</button>
              </motion.div>
          )}

          {status === 'face_scan' && (
              <motion.div key="face_scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold mb-2 text-[#10B981]">Scanning Face...</h2>
                  <p className="text-zinc-400 text-sm mb-4">Hold still. Do not close the window.</p>
                  <div className="w-64 h-1.5 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                      <motion.div className="h-full bg-[#10B981] shadow-[0_0_10px_#10B981]" animate={{ width: `${scanProgress}%` }} />
                  </div>
              </motion.div>
          )}

          {status === 'id_prep' && (
              <motion.div key="id_prep" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2 text-blue-400">Scan Identity Document</h2>
                    <p className="text-zinc-400 text-sm">Please hold your ID card up to the camera.</p>
                  </div>
                  <button onClick={() => setStatus('id_scan')} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-500 transition-colors flex items-center gap-2"><UserSquare2 size={18} /> Start ID Scan</button>
              </motion.div>
          )}

           {status === 'id_scan' && (
              <motion.div key="id_scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold mb-2 text-blue-400">Verifying Document...</h2>
                  <p className="text-zinc-400 text-sm mb-4">Align your ID card with the scanning guide.</p>
                   <div className="w-64 h-1.5 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                      <motion.div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" animate={{ width: `${scanProgress}%` }} />
                  </div>
              </motion.div>
          )}

          {status === 'id_confirm' && (
            <motion.div key="id_confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-blue-400 font-space italic">Confirm extracted info</h2>
                    <p className="text-zinc-500 text-sm mt-1">Please verify that the OCR correctly read your document.</p>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-left">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Full Name</label>
                        <p className="text-white font-medium bg-white/5 p-3 rounded-xl border border-white/5">Alice Smith</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Identity Number</label>
                        <p className="text-white font-medium bg-white/5 p-3 rounded-xl border border-white/5 font-mono">MNT-742-998</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Residential Address</label>
                        <p className="text-white font-medium bg-white/5 p-3 rounded-xl border border-white/5 text-sm leading-relaxed">123 Mantle Way, Sepolia District</p>
                    </div>
                </div>

                <button 
                  onClick={handleVerify}
                  className="w-full py-4 bg-[#10B981] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-[0.98]"
                >
                  Verify & Sign Protocol
                </button>
            </motion.div>
          )}

          {status === 'signing' && <motion.div key="signing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><h2 className="text-xl font-bold mb-2 text-blue-400">Sign Request</h2><p className="text-zinc-400 text-sm">Please sign the message in your wallet to prove ownership.</p></motion.div>}
          {status === 'verifying' && <motion.div key="verifying" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><h2 className="text-xl font-bold mb-2 text-yellow-500">Verifying On-Chain...</h2><p className="text-zinc-400 text-sm mb-2">Waiting for Mantle network confirmation.</p></motion.div>}
          {status === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <h2 className="text-2xl font-bold mb-2 text-[#10B981]">Verification Complete</h2>
              <p className="text-zinc-500 text-sm mb-3">Your identity has been secured on Mantle.</p>
              {txHash && (
                <a href={`https://sepolia.mantlescan.xyz/tx/${txHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-[#10B981] hover:underline bg-[#10B981]/10 px-4 py-2 rounded-full border border-[#10B981]/30">
                  <ExternalLink size={12} />
                  <span>View Transaction: {txHash.slice(0, 6)}...{txHash.slice(-4)}</span>
                </a>
              )}
            </motion.div>
          )}
          {status === 'failed' && <motion.div key="failed"><h2 className="text-xl font-bold mb-2 text-red-500">Verification Failed</h2><p className="text-red-400 text-sm mb-4">{error}</p></motion.div>}
        </AnimatePresence>
      </div>

      {status === 'idle' && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startVerificationFlow} className="mt-6 w-full py-4 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#10B981]/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          Verify Identity
        </motion.button>
      )}

      {status === 'failed' && (
         <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStatus('idle')} className="mt-6 w-full py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
          Try Again
        </motion.button>
      )}

      {status === 'verifying' && (
        <button onClick={() => checkStatus()} className="mt-4 text-xs text-zinc-500 hover:text-white underline">
          Is it taking too long? Refresh Status
        </button>
      )}
    </div>
  );
}
