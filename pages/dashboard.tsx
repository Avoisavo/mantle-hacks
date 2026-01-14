import { useSession, signIn, signOut } from "next-auth/react";
import { useAccount, useDisconnect, useSignMessage, useBalance, useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { TOWN_TOKEN_NATIVE_ADDRESS } from "@/utils/address";
import { ABI as TownTokenABI } from "@/utils/towntoken";
import { formatEther } from "viem";

interface SmartAccountData {
  accountAddress: string;
  ownerAddress: string;
  exists: boolean;
  balance?: string;
  kycStatus?: boolean;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { address: connectedWallet } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [accountData, setAccountData] = useState<SmartAccountData | null>(null);
  const [loading, setLoading] = useState(true);

  const CHAIN_ID = 5003;

  // -- WALLET BALANCES (EOA) --
  // Native MNT
  const { data: walletMntBalance } = useBalance({
    address: connectedWallet,
    chainId: CHAIN_ID,
  });

  // TOWN Token (ERC20) - Explicitly using useReadContract to avoid MNT fallback
  const { data: walletTownBalance, error: walletTownError } = useReadContract({
    address: TOWN_TOKEN_NATIVE_ADDRESS as `0x${string}`,
    abi: TownTokenABI,
    functionName: "balanceOf",
    args: connectedWallet ? [connectedWallet] : undefined,
    chainId: CHAIN_ID,
  });

  // -- SMART ACCOUNT BALANCES --
  // TOWN Token (ERC20) for Smart Account
  const { data: smartAccountTownBalance, error: smartAccountTownError } = useReadContract({
    address: TOWN_TOKEN_NATIVE_ADDRESS as `0x${string}`,
    abi: TownTokenABI,
    functionName: "balanceOf",
    args: accountData?.accountAddress ? [accountData.accountAddress as `0x${string}`] : undefined,
    chainId: CHAIN_ID,
  });

  const { chain, isConnected } = useAccount();

  console.log("Dashboard Debug:", {
    isConnected,
    connectedWallet,
    currentChain: chain?.name,
    chainID: chain?.id,
    targetChainID: CHAIN_ID,
    townTokenAddress: TOWN_TOKEN_NATIVE_ADDRESS,
    walletMntBalance: walletMntBalance ? formatEther(walletMntBalance.value) : "undefined",
    walletTownBalanceRaw: walletTownBalance?.toString(),
    walletTownError: walletTownError?.message,
    smartAccountAddress: accountData?.accountAddress,
    smartAccountMntBalance: accountData?.balance,
    smartAccountTownBalance: smartAccountTownBalance?.toString(),
    smartAccountTownError: smartAccountTownError?.message
  });

  const handleSignOut = async () => {
    if (session) {
      await signOut({ redirect: false });
    }
    if (connectedWallet) {
      await disconnect();
    }
    router.push("/");
  };

  useEffect(() => {
    if (status === "unauthenticated" && !connectedWallet) {
      signIn();
    }
  }, [status, connectedWallet]);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);

        let emailOrAddress = "";
        if (session?.user?.email) {
          emailOrAddress = session.user.email;
        } else if (connectedWallet) {
          emailOrAddress = connectedWallet;
        }

        if (emailOrAddress) {
          const response = await fetch("/api/account/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailOrAddress }),
          });

          const data = await response.json();
          if (data.success) {
            const accData = data.data;
            
            // Also fetch current balance
            try {
              console.log("Fetching balance for smart account:", accData.accountAddress);
              const balanceRes = await fetch(`/api/account/balance?address=${accData.accountAddress}`);
              const balanceData = await balanceRes.json();
              console.log("Smart account balance response:", balanceData);
              if (balanceData.success) {
                accData.balance = balanceData.data.balanceInMNT;
              }
            } catch (e) {
              console.error("Failed to fetch smart account balance", e);
            }
            
            setAccountData(accData);
          }
        }
      } catch (error) {
        console.error("Error fetching account data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" || connectedWallet) {
      fetchAccountData();
    }
  }, [session, connectedWallet, status]);

  const [isVerified, setIsVerified] = useState(false);
  useEffect(() => {
    if (accountData?.accountAddress || connectedWallet) {
        const checkKYC = async () => {
             const target = accountData?.accountAddress || connectedWallet;
             // We can use a public provider here to check the contract quickly
             // Implementation details: importing ethers and checking contract
             // For brevity/cleanliness, let's just assume we can fetch it or trust local state if we just came back from verification.
             // Actually, simplest way:
             try {
                // We will use a quick JSON-RPC call directly to allow client-side check without heavy imports
                const KYC_ADDRESS = "0x8faA61d0C635392D09A67C41C54C9191D55E0E4c"; // Hardcoded or env
                // ... Actually, better to use the same logic as ProofGenerator but we are in a page.
                
                // Let's rely on a small helper or just assume unverified -> verified transition happens if we have a query param? 
                // No, user requested "show that they are verified".
                
                // Let's add a lightweight check.
                const response = await fetch('/api/verify', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        // Hacky: we use the verify endpoint to "check" by sending a dummy check payload?
                        // No, verify endpoint is for writing.
                        
                        // Let's add a simple check.
                    })
                });
             } catch(e) {}
        }
        // checkKYC();
    }
  }, [accountData, connectedWallet]);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-2xl font-bold animate-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Animated starfield background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(200)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
            animate={{
              opacity: [Math.random() * 0.7 + 0.3, Math.random() * 0.3, Math.random() * 0.7 + 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-black/50" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <Logo />
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-10 h-10 rounded-full border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.5)]"
              />
            )}
            <span className="text-cyan-300 font-bold tracking-wider">
              {session?.user?.name || connectedWallet?.slice(0, 6) + "..." + connectedWallet?.slice(-4)}
            </span>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,215,0,0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 border-2 border-red-400 rounded-lg text-white text-sm font-bold hover:bg-red-500 transition-all shadow-[0_0_10px_rgba(239,68,68,0.4)]"
            >
              EXIT
            </motion.button>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          {/* Main Title - Arcade Style */}
          <h1 className="text-6xl md:text-7xl font-black text-center mb-12 relative">
            <span className="absolute inset-0 text-purple-600 blur-sm" style={{ textShadow: '4px 4px 0px #8b00ff' }}>
              YOUR DASHBOARD
            </span>
            <span className="relative text-yellow-400" style={{
              textShadow: '2px 2px 0px #ff69b4, 4px 4px 0px #8b00ff, 6px 6px 0px #00ffff, 0 0 20px #ffd700'
            }}>
              YOUR DASHBOARD
            </span>
          </h1>

          {/* Account Info Cards - Arcade Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Smart Account Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-cyan-500 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative bg-gradient-to-br from-gray-900 to-black border-4 border-cyan-400 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-400/10 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-400/10 rounded-tr-full"></div>

                <h2 className="text-2xl font-black text-cyan-300 mb-4 tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,255,255,0.5)' }}>
                  🎮 SMART ACCOUNT
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-cyan-500/80 text-xs font-bold tracking-widest uppercase">Address</p>
                    <p className="text-white font-mono text-sm break-all bg-black/50 p-2 rounded border border-cyan-500/30">
                      {accountData?.accountAddress || "Loading..."}
                    </p>
                  </div>
                  {accountData?.exists && (
                    <div>
                      <p className="text-cyan-500/80 text-xs font-bold tracking-widest uppercase">Balance</p>
                      <p className="text-white font-mono text-lg font-bold">
                        {accountData.balance ? `${parseFloat(accountData.balance).toFixed(4)} MNT` : "0 MNT"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Login Method Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative bg-gradient-to-br from-gray-900 to-black border-4 border-pink-400 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,105,180,0.3)]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-pink-400/10 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-400/10 rounded-tr-full"></div>

                <h2 className="text-2xl font-black text-pink-300 mb-4 tracking-wider" style={{ textShadow: '2px 2px 4px rgba(255,105,180,0.5)' }}>
                  🔐 LOGIN METHOD
                </h2>
                <div className="space-y-3">
                  {session?.user?.email ? (
                    <>
                      <div>
                        <p className="text-pink-500/80 text-xs font-bold tracking-widest uppercase">Provider</p>
                        <p className="text-white font-bold flex items-center gap-2 text-lg">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          </svg>
                          GOOGLE OAUTH
                        </p>
                      </div>
                      <div>
                        <p className="text-pink-500/80 text-xs font-bold tracking-widest uppercase">Email</p>
                        <p className="text-white bg-black/50 p-2 rounded border border-pink-500/30">{session.user.email}</p>
                      </div>
                    </>
                  ) : connectedWallet ? (
                    <>
                      <div>
                        <p className="text-pink-500/80 text-xs font-bold tracking-widest uppercase">Provider</p>
                        <p className="text-white font-bold text-lg">🦊 WEB3 WALLET</p>
                      </div>
                      <div>
                        <p className="text-pink-500/80 text-xs font-bold tracking-widest uppercase">Wallet Address</p>
                        <p className="text-white font-mono text-sm break-all bg-black/50 p-2 rounded border border-pink-500/30">
                          {connectedWallet}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-purple-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-purple-300/60 text-sm">MNT Balance</span>
                          <span className="text-purple-200 font-mono font-bold">
                            {walletMntBalance ? `${Number(formatEther(walletMntBalance.value)).toFixed(4)} MNT` : "..."}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300/60 text-sm">TOWN Balance</span>
                          <span className="text-pink-300 font-mono font-bold">
                            {walletTownBalance !== undefined ? `${parseFloat(formatEther(walletTownBalance as bigint)).toFixed(2)} TOWN` : "0.00 TOWN"}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons - Arcade Style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <button 
              onClick={() => router.push('/bridge')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-full text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
              Bridge MNT
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-white font-semibold hover:opacity-90 transition-opacity">
              Fund Account
            </button>
            <button className="px-6 py-3 bg-white/10 backdrop-blur border border-pink-400/50 rounded-full text-white font-semibold hover:bg-white/20 transition-all">
              Send Transaction
            </button>
            {/* Only show explorer button if we have a reason to (e.g. account deployed or recent tx) */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,215,0,0.8)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 border-4 border-yellow-300 rounded-xl text-black font-black text-lg tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:from-yellow-300 hover:to-yellow-500 transition-all"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              💰 FUND ACCOUNT
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0,255,255,0.8)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 border-4 border-cyan-300 rounded-xl text-white font-black text-lg tracking-wider shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              📤 SEND TX
            </motion.button>

            {accountData?.exists && (
              <motion.a
                href={`https://sepolia.mantlescan.xyz/address/${accountData.accountAddress}`}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,105,180,0.8)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 border-4 border-pink-300 rounded-xl text-white font-black text-lg tracking-wider shadow-[0_0_20px_rgba(255,105,180,0.5)] hover:from-pink-400 hover:to-purple-500 transition-all flex items-center gap-2"
              >
                🔍 EXPLORER
              </motion.a>
            )}

            {isVerified ? (
              <div className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 border-4 border-green-300 rounded-xl text-white font-black text-lg tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                VERIFIED ✓
              </div>
            ) : (
              <motion.button
                onClick={() => router.push('/identity')}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(16,185,129,0.8)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 border-4 border-green-300 rounded-xl text-white font-black text-lg tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:from-green-400 hover:to-emerald-500 transition-all flex items-center gap-2"
              >
                🛡️ VERIFY ID
              </motion.button>
            )}
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}
