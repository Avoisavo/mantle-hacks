import { motion } from 'framer-motion';
import { Cpu, ShieldCheck, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ZkMeWidget, type Provider } from '@zkmelabs/widget';
import { zkMeConfig } from '@/lib/zkme-config';

interface ProofGeneratorProps {
  onComplete: () => void;
  userAddress: string | null;
  signer: any;
}

export default function ProofGenerator({ onComplete, userAddress, signer }: ProofGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'initializing' | 'open' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (userAddress && signer && !widgetRef.current) {
      initWidget();
    }
    
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [userAddress, signer]);

  const initWidget = async () => {
    try {
      setStatus('initializing');
      
      const provider: Provider = {
        async getAccessToken() {
          // In production, this should call your backend
          // return fetch('/api/zkme-token').then(res => res.json());
          console.warn("Using mock access token");
          return "mock_access_token";
        },

        async getUserAccounts() {
          return [userAddress!];
        },

        async delegateTransaction(tx) {
          const txResponse = await signer.sendTransaction(tx);
          return txResponse.hash;
        }
      };

      const widget = new ZkMeWidget(
        zkMeConfig.appId,
        "Mantle Hackathon App",
        zkMeConfig.chainId,
        provider,
        {
          lv: "MeID", // Using MeID for Anti-Sybil/Identity
          theme: "dark"
        }
      );

      widget.on('meidFinished', (results) => {
        if (results.isGrant) {
          onComplete();
        }
      });

      widget.on('close', () => {
        setStatus('idle');
      });

      widgetRef.current = widget;
      setStatus('idle');
    } catch (err: any) {
      console.error("Widget init error:", err);
      setError(err.message || "Failed to initialize zkMe widget");
      setStatus('failed');
    }
  };

  const launchLaunch = () => {
    if (widgetRef.current) {
      widgetRef.current.launch();
      setStatus('open');
    }
  };

  return (
    <div className="py-8 text-center">
      <div className="relative w-32 h-32 mx-auto mb-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-[#10B981]/20 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Cpu className={`w-12 h-12 ${status === 'open' ? 'text-[#10B981] animate-pulse' : 'text-zinc-600'}`} />
        </div>
      </div>

      {status === 'failed' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span className="font-bold">Initialization Failed</span>
          </div>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto">{error}</p>
          <button 
            onClick={initWidget}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-2">
            {status === 'open' ? 'Verification in Progress' : 'Ready to Verify'}
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xs mx-auto">
            {status === 'open' 
              ? 'Please follow the instructions in the zkMe popup to complete your face scan.'
              : 'Launch the zkMe secure identity vault to generate your zero-knowledge proof.'}
          </p>

          <button 
            onClick={launchLaunch}
            disabled={status === 'initializing' || status === 'open'}
            className="w-full py-4 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#10B981]/90 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            {status === 'initializing' ? 'Initializing...' : 'Launch zkMe Widget'}
          </button>
        </>
      )}

      <div className="mt-8 p-4 bg-black rounded-lg border border-white/5 text-left font-mono text-xs text-zinc-600">
        <p>{`> Initializing zkMe SDK...`}</p>
        {userAddress && <p className="text-[#10B981]">{`> Wallet connected: ${userAddress.slice(0,6)}...${userAddress.slice(-4)}`}</p>}
        {status === 'initializing' && <p>{`> Fetching protocol manifest...`}</p>}
        {status === 'open' && <p className="text-blue-400">{`> UI Overlay active. Waiting for ZK-Proof generation...`}</p>}
      </div>
    </div>
  );
}