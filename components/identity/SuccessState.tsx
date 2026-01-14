import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, ExternalLink, ArrowRight, Zap, Star, Trophy } from 'lucide-react';

interface SuccessStateProps {
  txHash?: string;
}

export default function SuccessState({ txHash }: SuccessStateProps) {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col items-center py-6 text-white font-chunky">
      
      {/* Achievement Artifact - Scaled Down */}
      <motion.div
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-[#4ADE80] blur-2xl opacity-30 animate-pulse"></div>
        <div className="relative w-28 h-28 bg-white rounded-[35px] border-[5px] border-black flex items-center justify-center shadow-xl transform hover:rotate-6 transition-transform">
           <Trophy size={48} className="text-green-600" strokeWidth={3} />
           <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full border-[3px] border-black flex items-center justify-center shadow-md">
              <Star size={16} className="text-black fill-black" />
           </div>
        </div>
        {/* Floating Sparks */}
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -left-6 top-0 text-cyan-400">
           <Zap size={20} />
        </motion.div>
      </motion.div>

      {/* Success Hype - Scaled Down */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-3 mb-8"
      >
        <h2 className="text-4xl font-black italic tracking-tighter uppercase font-action leading-none">SECURED!</h2>
        <p className="text-[#4ADE80] font-black tracking-widest text-[10px] uppercase px-6 py-1 bg-green-400/10 rounded-full border border-green-400/20 inline-block font-mono">
          IDENTITY VERIFIED
        </p>
        <p className="text-zinc-500 font-bold max-w-xs mx-auto text-xs leading-relaxed leading-none">
          Credentials fused. ready to enter cointown.
        </p>
      </motion.div>

      {/* Action Pucks - Compact */}
      <div className="w-full space-y-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/dashboard')}
          className="group relative w-full py-5 bg-[#4ADE80] rounded-[25px] border-[5px] border-white shadow-[0_10px_0_#166534] active:translate-y-[6px] active:shadow-[0_4px_0_#166534] transition-all flex items-center justify-center gap-4"
        >
          <span className="text-2xl font-black italic text-black uppercase font-action">ENTER DOMAIN</span>
          <ArrowRight size={24} className="text-black" strokeWidth={4} />
        </motion.button>
        
        {txHash && (
          <motion.a 
            href={`https://sepolia.mantlescan.xyz/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 bg-white/5 text-white/40 font-black rounded-[20px] border-2 border-white/5 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.1em] italic text-[9px]"
          >
            Proof: {txHash.slice(0, 8)}... <ExternalLink size={10} />
          </motion.a>
        )}
      </div>

      <div className="mt-8 text-center">
         <div className="flex items-center justify-center gap-2 text-zinc-600 font-black text-[9px] tracking-[0.3em] uppercase">
           <ShieldCheck size={12} />
           <span>Vault Lock: Active</span>
         </div>
      </div>
    </div>
  );
}
