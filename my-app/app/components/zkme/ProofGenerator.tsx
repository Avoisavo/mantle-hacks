// components/zkme/ProofGenerator.tsx
import { motion } from 'framer-motion';
import { Cpu, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProofGenerator({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return prev + 1.5;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="py-8 text-center">
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Animated Orbits */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-[#10B981]/20 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Cpu className="text-[#10B981] w-12 h-12" />
        </div>
        
        {/* SVG Progress Circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="64" cy="64" r="60"
            fill="transparent"
            stroke="#10B981"
            strokeWidth="4"
            strokeDasharray={377}
            strokeDashoffset={377 - (377 * progress) / 100}
            className="transition-all duration-200"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold mb-2">Generating ZK-Proof</h2>
      <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
        Encrypting Identity Hash... {Math.round(progress)}%
      </p>

      <div className="mt-8 p-4 bg-black rounded-lg border border-white/5 text-left font-mono text-xs text-zinc-600">
        <p>{`> Initializing zkMe SDK...`}</p>
        <p>{`> Requesting zero-knowledge circuit...`}</p>
        {progress > 40 && <p className="text-[#10B981]">{`> Proof generated: 0x72a...f92`}</p>}
        {progress > 70 && <p>{`> Validating on-chain anchor...`}</p>}
      </div>
    </div>
  );
}