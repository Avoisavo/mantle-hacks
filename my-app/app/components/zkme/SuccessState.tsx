// components/zkme/SuccessState.tsx
"use client";

import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

export default function SuccessState() {
  return (
    <div className="py-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="w-24 h-24 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="text-[#10B981] w-12 h-12" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold mb-2">Registration Complete</h2>
        <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
          Your identity has been verified and your zkMe profile is now active on the Mantle Network.
        </p>

        <div className="space-y-3">
          <button className="w-full py-4 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#10B981]/90 transition-colors flex items-center justify-center gap-2">
            Enter Dashboard <ArrowRight size={18} />
          </button>
          
          <button className="w-full py-4 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10">
            View on Explorer <ExternalLink size={16} />
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <ShieldCheck size={16} />
            <span>Secured by Zero-Knowledge Proofs</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
