import { useSession, signIn, signOut } from "next-auth/react";
import { useAccount, useDisconnect, useWriteContract, useSwitchChain } from "wagmi";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { TOWN_TOPUP_NATIVE_ADDRESS } from "@/utils/address";
import { ABI as TownTopUpNativeABI } from "@/utils/towntopnative";
import { parseEther } from "viem";
import Head from "next/head";
import { useTownBalance } from "@/hooks/useTownBalance";
import { useMntBalance } from "@/hooks/useMntBalance";
import {
  ShieldCheck,
  UserCheck,
  PlusCircle,
  Send,
  Copy,
  LogOut,
  Wallet as WalletIcon,
  CheckCircle2,
  X,
  Globe,
  Zap,
  Star,
  ArrowRight,
  Target,
  Crown,
  Flame
} from "lucide-react";

interface SmartAccountData {
  accountAddress: string;
  ownerAddress: string;
  exists: boolean;
  balance?: string;
  kycStatus?: boolean;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { address: connectedWallet, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const [accountData, setAccountData] = useState<SmartAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTreasury, setShowTreasury] = useState(false);
  const [showDifficultySelection, setShowDifficultySelection] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const { writeContract, isPending: isMinting } = useWriteContract();
  const CHAIN_ID = 5003;

  // -- EOA BALANCES --
  // MNT Balance (Native on Mantle)
  const { balance: eoaMntBalance } = useMntBalance({ 
    address: connectedWallet, 
    chainId: CHAIN_ID 
  });

  // TOWN Balance (on Mantle)
  const { balance: eoaTownBalance } = useTownBalance(connectedWallet);

  // -- SMART ACCOUNT BALANCES --
  // TOWN Balance (on Smart Account)
  const { balance: saTownBalance } = useTownBalance(accountData?.accountAddress);

  // Note: Smart Account MNT Balance is fetched via API in fetchAccountData currently.
  // We can keep it or use the hook if we wanted real-time updates without API calls, 
  // but API handles the abstraction. Let's keep the API one for SA MNT for now as per existing logic, 
  // unless that's what's broken. User said "grabbing my wallet address token balance ... and TOWN". 
  // The API fetch puts balance into accountData.balance.

  const handleMintTown = async () => {
    if (!connectedWallet) return;
    if (chainId !== CHAIN_ID) {
      try {
        await switchChain({ chainId: CHAIN_ID });
        return; 
      } catch (err: any) {
        return;
      }
    }

    try {
      writeContract({
        address: TOWN_TOPUP_NATIVE_ADDRESS as `0x${string}`,
        abi: TownTopUpNativeABI,
        functionName: "buyTOWN",
        value: parseEther("0.1"), // Send 0.1 MNT
        chainId: CHAIN_ID,
      });
    } catch (err: any) {}
  };

  const handleSignOut = async () => {
    if (session) await signOut({ redirect: false });
    if (connectedWallet) await disconnect();
    router.push("/");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    if (status === "unauthenticated" && !connectedWallet) {
      router.push("/");
    }
  }, [status, connectedWallet]);

  useEffect(() => {
    const fetchAccountData = async () => {
      // For Web3 wallet login, just use wallet address directly (no smart account needed)
      if (connectedWallet && !session?.user?.email) {
        const balanceRes = await fetch(`/api/account/balance?address=${connectedWallet}`);
        const balanceData = await balanceRes.json();
        setAccountData({
          accountAddress: connectedWallet,
          ownerAddress: connectedWallet,
          exists: true,
          balance: balanceData.success ? balanceData.data.balanceInMNT : '0'
        });
        setLoading(false);
        return;
      }

      // For email login, use smart account system
      if (!session?.user?.email) return;
      try {
        setLoading(true);
        const response = await fetch("/api/account/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        });
        const data = await response.json();
        if (data.success) {
          const accData = data.data;
          const balanceRes = await fetch(`/api/account/balance?address=${accData.accountAddress}`);
          const balanceData = await balanceRes.json();
          if (balanceData.success) {
            accData.balance = balanceData.data.balanceInMNT;
          }
          setAccountData(accData);
        }
      } catch (e) {
        console.error("Error fetching account data:", e);
      } finally {
        setLoading(false);
      }
    };
    if (status === "authenticated" || connectedWallet) fetchAccountData();
  }, [session, connectedWallet, status]);

  useEffect(() => {
    const checkVerification = async () => {
      const targetAddress = accountData?.accountAddress || connectedWallet;
      if (!targetAddress) return;
      try {
        const { ethers } = await import('ethers');
        const provider = new ethers.providers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
        const abi = ["function hasPassed(address user) external view returns (bool)"];
        const contract = new ethers.Contract("0x22F3Cd2Cf4C38453939f04a02fF6b15Aa237ef86", abi, provider);
        const passed = await contract.hasPassed(targetAddress);
        setIsVerified(passed);
      } catch (e) {
        console.error("KYC Check failed", e);
      }
    };
    checkVerification();
  }, [accountData, connectedWallet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#130E22] flex items-center justify-center">
        <div className="text-[#bffff4] text-4xl font-black italic animate-bounce">LOADING... 🚀</div>
      </div>
    );
  }

  const activeAddress = accountData?.accountAddress || connectedWallet;
  
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
        <style>{`
          .font-chunky { font-family: 'Lexend', sans-serif; }
          .sticker-border {
             border: 5px solid white;
             box-shadow: 0 10px 0 rgba(0,0,0,0.2);
          }
          .neon-yellow-text {
             color: #ffff00;
             text-shadow: 
                3px 3px 0 #ff00ff,
                -1px -1px 0 #ff00ff,
                1px -1px 0 #ff00ff,
                -1px 1px 0 #ff00ff,
                1px 1px 0 #ff00ff;
          }
          .bg-vibes {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 0;
            overflow: hidden;
          }
          .blob {
            position: absolute;
            filter: blur(80px);
            opacity: 0.3;
            border-radius: 50%;
            animation: move 20s infinite alternate;
          }
          @keyframes move {
            from { transform: translate(0, 0); }
            to { transform: translate(100px, 100px); }
          }
          @keyframes scan {
            0% { transform: translateY(-20px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(20px); opacity: 0; }
          }
          .animate-scan {
            animation: scan 2s linear infinite;
          }
        `}</style>
      </Head>

      <div className="bg-vibes">
         <div className="blob w-[500px] h-[500px] bg-purple-600 top-[-10%] left-[-10%]"></div>
         <div className="blob w-[600px] h-[600px] bg-blue-600 bottom-[-20%] right-[-10%] animate-[move_15s_infinite_reverse]"></div>
         <div className="blob w-[400px] h-[400px] bg-pink-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen font-chunky">
        
        {/* Floating HUD Elements */}
        <div className="fixed top-6 left-8 z-50">
           <div className="scale-[0.8] origin-top-left drop-shadow-2xl">
              <Logo />
           </div>
        </div>

        <div className="fixed top-8 right-8 z-50">
           <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full sticker-border group shadow-2xl">
              <div className="w-10 h-10 bg-purple-600 rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                 <img src={session?.user?.image || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${connectedWallet || 'cointown'}`} alt="User" className="w-full h-full" />
              </div>
              <span className="text-black font-black text-sm">
                {connectedWallet
                  ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}`
                  : session?.user?.name
                  ? session.user.name
                  : "NOT CONNECTED"}
              </span>
              <button 
                onClick={handleSignOut} 
                className="bg-red-500 p-2 rounded-full border-2 border-white hover:scale-110 active:scale-95 transition-all shadow-md ml-1"
                title="Terminate Session"
              >
                 <LogOut size={16} className="text-white" />
              </button>
           </div>
        </div>

        {/* Scaled Main Content Area */}
        <div className="flex-1 overflow-y-auto pt-20 pb-12 px-6">
           <div className="max-w-5xl mx-auto">
              
              {/* Identity Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
                 
                 {/* Card 1: Smart Account */}
                 <motion.div 
                   whileHover={{ y: -5 }}
                   className="relative bg-purple-900 rounded-[35px] p-6 border-[5px] border-[#22d3ee] shadow-[0_10px_0_#1e1b4b] overflow-hidden"
                 >
                    <div className="flex items-center gap-4 mb-5">
                       <div className="w-14 h-14 bg-white rounded-2xl border-4 border-black flex items-center justify-center shadow-lg transform -rotate-2">
                          <ShieldCheck size={32} className="text-purple-600" strokeWidth={3} />
                       </div>
                       <div>
                          <p className="text-white/60 text-[9px] font-black tracking-widest italic uppercase">Hardware Vault</p>
                          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Smart Account</h2>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-white font-black text-xs tracking-tighter uppercase">Vault Address</p>
                       <div className="bg-white rounded-xl p-3 flex items-center gap-3 border-[3px] border-black">
                          <span className="text-black font-black text-[11px] truncate flex-1 font-mono">
                            {accountData?.accountAddress || "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(accountData?.accountAddress || "")}
                            className="bg-[#34D399] p-2.5 rounded-lg border-2 border-black shadow-[0_3px_0_#064e3b] active:shadow-none active:translate-y-[3px] transition-all"
                          >
                             {isCopied ? <CheckCircle2 size={16} className="text-white" /> : <Copy size={16} className="text-white" />}
                          </button>
                       </div>
                    </div>
                 </motion.div>

                 {/* Card 2: Login Method */}
                 <motion.div 
                   whileHover={{ y: -5 }}
                   className="relative bg-purple-900 rounded-[35px] p-6 border-[5px] border-[#ff00ff] shadow-[0_10px_0_#1e1b4b] overflow-hidden"
                 >
                    <div className="flex flex-row-reverse items-center justify-between gap-4 h-full">
                       <div className="w-24 h-24 bg-white rounded-full border-[4px] border-black flex items-center justify-center shadow-xl shrink-0">
                          {session ? (
                             <img src="/google-g.svg" className="w-14 h-14" alt="Google" />
                          ) : (
                             <div className="bg-purple-100 p-3 rounded-full">
                                <WalletIcon size={40} className="text-purple-600" />
                             </div>
                          )}
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-white/60 text-[9px] font-black tracking-widest italic uppercase">Auth Successful</p>
                          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">Login Method</h2>
                          <div className="bg-white/10 px-4 py-1.5 rounded-xl border-2 border-white/20 inline-block mb-3">
                             <span className="text-white font-black text-sm uppercase leading-none">{session ? "Google ID" : "Web3 Wallet"}</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Identity Tag</p>
                            <p className="text-[11px] font-black text-[#ff00ff] truncate font-mono">
                               {session?.user?.email || connectedWallet || "X-IDENT-UNKNOWN"}
                            </p>
                          </div>
                       </div>
                    </div>
                 </motion.div>
              </div>

              {/* Action Trinity - Compact and Bright */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
                 
                 {/* Verify Identity */}
                 <div className="flex flex-col items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(isVerified ? '#' : '/identity')}
                      className={`w-32 h-32 rounded-[30px] border-[5px] border-white shadow-[0_8px_15px_rgba(139,92,246,0.2)] flex flex-col items-center justify-center gap-2 transition-all ${isVerified ? 'bg-green-600' : 'bg-purple-600'}`}
                    >
                       <div className="w-14 h-14 bg-white rounded-full border-[3px] border-black flex items-center justify-center shadow-inner">
                          {isVerified ? <Star size={28} className="text-yellow-400 fill-yellow-400" /> : <UserCheck size={28} className="text-purple-600" />}
                       </div>
                    </motion.button>
                    <span className="text-lg font-black italic text-white tracking-tighter uppercase drop-shadow-md">{isVerified ? 'VERIFIED!' : 'VERIFY!'}</span>
                 </div>

                 {/* Fund Account (Hero) */}
                 <div className="flex flex-col items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowTreasury(true)}
                      className="w-40 h-40 bg-[#bffff4] rounded-[40px] border-[6px] border-white shadow-[0_10px_20px_rgba(191,255,244,0.3)] flex flex-col items-center justify-center gap-2 group"
                    >
                       <div className="w-20 h-20 bg-white rounded-[25px] border-[3px] border-black flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
                          <PlusCircle size={40} className="text-black" strokeWidth={3} />
                       </div>
                    </motion.button>
                    <span className="text-2xl font-black italic text-[#bffff4] tracking-tight uppercase drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">GET FUNDS!</span>
                 </div>

                 {/* Send Transaction - Activated Color */}
                 <div className="flex flex-col items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-32 h-32 bg-[#22d3ee] rounded-[30px] border-[5px] border-white shadow-[0_8px_15px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center gap-2"
                    >
                       <div className="w-14 h-14 bg-white rounded-full border-[3px] border-black flex items-center justify-center shadow-inner relative overflow-hidden">
                          <Send size={28} className="text-[#22d3ee]" strokeWidth={3} />
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-white opacity-40 animate-scan"></div>
                       </div>
                    </motion.button>
                    <span className="text-lg font-black italic text-white tracking-tighter uppercase">SEND IT!</span>
                 </div>
              </div>

              {/* Grand Entrance: Slam Button - Re-fit */}
              <div className="flex justify-center mb-6">
                 <motion.button
                   animate={{ scale: [1, 1.01, 1] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   whileHover={{ scale: 1.06 }}
                   whileTap={{ scale: 0.94 }}
                   onClick={() => setShowDifficultySelection(true)}
                   className="relative group bg-[#4ADE80] px-10 py-5 rounded-[35px] border-[6px] border-white shadow-[0_12px_0_#166534] flex items-center gap-5 active:translate-y-[6px] active:shadow-[0_6px_0_#166534] transition-all"
                 >
                    <span className="relative z-10 text-3xl md:text-4xl font-black italic text-black tracking-tight uppercase" style={{ fontFamily: '"Luckiest Guy", cursive' }}>ENTER COINTOWN!</span>
                    <ArrowRight className="relative z-10 text-black" size={40} strokeWidth={4} />
                 </motion.button>
              </div>

           </div>
        </div>

        {/* Difficulty Selection Modal */}
        <AnimatePresence>
           {showDifficultySelection && (
             <>
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowDifficultySelection(false)}
                 className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
               />
               <motion.div
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.8, opacity: 0 }}
                 transition={{ type: "spring", damping: 25, stiffness: 300 }}
                 className="fixed inset-0 z-[101] flex items-center justify-center p-6"
               >
                  <div className="bg-[#130E22] border-[8px] border-[#4ADE80] rounded-[40px] p-10 max-w-2xl w-full shadow-[0_0_60px_rgba(74,222,128,0.3)]">
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="text-4xl md:text-5xl font-black text-[#4ADE80] italic tracking-tight uppercase leading-none">Select Difficulty</h2>
                        <button onClick={() => setShowDifficultySelection(false)} className="bg-white/10 p-3 rounded-full border-2 border-white/20 hover:bg-white/20 transition-all">
                           <X size={32} className="text-white" />
                        </button>
                     </div>

                     <p className="text-white/80 text-lg mb-10 text-center font-medium">Choose your challenge level and start your journey!</p>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Simple */}
                        <motion.button
                           whileHover={{ scale: 1.05, y: -5 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={() => router.push('/game2?difficulty=simple')}
                           className="group relative bg-gradient-to-br from-[#22c55e] to-[#16a34a] p-8 rounded-[30px] border-[6px] border-white shadow-[0_8px_0_#15803d] active:translate-y-[6px] active:shadow-[0_4px_0_#15803d] transition-all"
                        >
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                 <Target className="text-white" size={36} strokeWidth={3} />
                              </div>
                              <h3 className="text-3xl font-black text-white uppercase tracking-tight">Simple</h3>
                              <div className="flex gap-1 mt-2">
                                 <Star className="text-yellow-300" size={16} fill="#fde047" />
                                 <Star className="text-white/40" size={16} />
                                 <Star className="text-white/40" size={16} />
                              </div>
                           </div>
                        </motion.button>

                        {/* Moderate */}
                        <motion.button
                           whileHover={{ scale: 1.05, y: -5 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={() => router.push('/game2?difficulty=medium')}
                           className="group relative bg-gradient-to-br from-[#3b82f6] to-[#2563eb] p-8 rounded-[30px] border-[6px] border-white shadow-[0_8px_0_#1d4ed8] active:translate-y-[6px] active:shadow-[0_4px_0_#1d4ed8] transition-all"
                        >
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                 <Flame className="text-white" size={36} strokeWidth={3} />
                              </div>
                              <h3 className="text-3xl font-black text-white uppercase tracking-tight">Medium</h3>
                              <div className="flex gap-1 mt-2">
                                 <Star className="text-yellow-300" size={16} fill="#fde047" />
                                 <Star className="text-yellow-300" size={16} fill="#fde047" />
                                 <Star className="text-white/40" size={16} />
                              </div>
                           </div>
                        </motion.button>

                        {/* Luxury */}
                        <motion.button
                           whileHover={{ scale: 1.05, y: -5 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={() => router.push('/game2?difficulty=luxury')}
                           className="group relative bg-gradient-to-br from-[#a855f7] to-[#9333ea] p-8 rounded-[30px] border-[6px] border-white shadow-[0_8px_0_#7c3aed] active:translate-y-[6px] active:shadow-[0_4px_0_#7c3aed] transition-all"
                        >
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                 <Crown className="text-white" size={36} strokeWidth={3} />
                              </div>
                              <h3 className="text-3xl font-black text-white uppercase tracking-tight">Luxury</h3>
                              <div className="flex gap-1 mt-2">
                                 <Star className="text-yellow-300" size={16} fill="#fde047" />
                                 <Star className="text-yellow-300" size={16} fill="#fde047" />
                                 <Star className="text-yellow-300" size={16} fill="#fde047" />
                              </div>
                           </div>
                        </motion.button>
                     </div>
                  </div>
               </motion.div>
             </>
           )}
        </AnimatePresence>

        {/* Treasury Drawer */}
        <AnimatePresence>
           {showTreasury && (
             <>
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowTreasury(false)}
                 className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
               />
               <motion.div
                 initial={{ x: '100%' }}
                 animate={{ x: 0 }}
                 exit={{ x: '100%' }}
                 transition={{ type: "spring", damping: 25, stiffness: 120 }}
                 className="fixed top-0 right-0 h-full w-full max-w-md bg-[#130E22] border-l-[8px] border-[#bffff4] z-[101] p-10 overflow-y-auto"
               >
                  <div className="flex items-center justify-between mb-10">
                     <h2 className="text-4xl font-black text-[#bffff4] italic tracking-tight uppercase leading-none">TREASURY</h2>
                     <button onClick={() => setShowTreasury(false)} className="bg-white/10 p-3 rounded-full border-2 border-white/20 hover:bg-white/20 transition-all">
                        <X size={32} className="text-white" />
                     </button>
                  </div>

                  <div className="space-y-12">
                     {/* Balances */}
                     <div className="space-y-8">
                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <p className="text-white font-black text-2xl italic tracking-tighter uppercase">Wallet MNT</p>
                              <p className="text-[#bffff4] text-5xl font-black italic leading-none">{eoaMntBalance || "0.00"}</p>
                           </div>
                           <div className="h-8 bg-white/5 rounded-full border-4 border-white/10 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "65%" }}
                                className="h-full bg-[#34D399]"
                              />
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <p className="text-white font-black text-2xl italic tracking-tighter uppercase">Wallet TOWN</p>
                              <p className="text-[#ff00ff] text-5xl font-black italic leading-none">{eoaTownBalance || "0.00"}</p>
                           </div>
                           <div className="h-8 bg-white/5 rounded-full border-4 border-white/10 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "40%" }}
                                className="h-full bg-[#ff00ff]"
                              />
                           </div>
                        </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="grid grid-cols-1 gap-6">
                        <button 
                          onClick={() => router.push('/bridge')}
                          className="bg-orange-500 py-8 rounded-[30px] border-4 border-black shadow-[0_12px_0_#7c2d12] active:translate-y-2 active:shadow-[0_4px_0_#7c2d12] flex items-center justify-center gap-6 transition-all"
                        >
                           <Globe size={48} className="text-white" />
                           <span className="text-4xl font-black text-white italic tracking-tighter uppercase">BRIDGE MNT</span>
                        </button>
                        
                        <button 
                          onClick={handleMintTown}
                          disabled={isMinting}
                          className="bg-pink-500 py-8 rounded-[30px] border-4 border-black shadow-[0_12px_0_#831843] active:translate-y-2 active:shadow-[0_4px_0_#831843] flex items-center justify-center gap-6 transition-all disabled:opacity-50"
                        >
                           <Zap size={48} className="text-white" />
                           <span className="text-4xl font-black text-white italic tracking-tighter uppercase">{isMinting ? "PROCESS..." : "MINT TOWN"}</span>
                        </button>
                     </div>

                     <div className="pt-12 border-t-4 border-white/5">
                        <p className="text-white/30 font-black text-center text-sm tracking-[0.2em] uppercase italic">Authorized Access Only / Mantle Sepolia</p>
                     </div>
                  </div>
               </motion.div>
             </>
           )}
        </AnimatePresence>

      </div>
    </main>
  );
}
