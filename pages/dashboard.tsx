import { useSession, signIn, signOut } from "next-auth/react";
import { useAccount, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";
import { useSignMessage } from "wagmi";
import { useRouter } from "next/router";

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

  const handleSignOut = async () => {
    // Sign out from NextAuth (Google)
    if (session) {
      await signOut({ redirect: false });
    }
    // Disconnect wallet (Web3)
    if (connectedWallet) {
      await disconnect();
    }
    // Redirect to home
    router.push("/");
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  useEffect(() => {
    // Fetch smart account info
    const fetchAccountData = async () => {
      try {
        setLoading(true);

        // If logged in with Google (Web2)
        if (session?.user?.email) {
          const response = await fetch("/api/account/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session.user.email }),
          });

          const data = await response.json();
          if (data.success) {
            setAccountData(data.data);
          }
        }
        // If connected with wallet (Web3)
        else if (connectedWallet) {
          const response = await fetch("/api/account/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: connectedWallet }),
          });

          const data = await response.json();
          if (data.success) {
            setAccountData(data.data);
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

  // Separate effect to check KYC status once we have an address
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

  // REAL IMPLEMENTATION: We'll modify the UI to conditionally show the badge based on a new state `isVerified`.
  // To populate `isVerified`, we really need that contract check. 
  // I will add a `useEffect` that uses `ethers` (dynamically imported or from standard lib) to check `hasPassed`.
  
  useEffect(() => {
      const checkVerification = async () => {
          const targetAddress = accountData?.accountAddress || connectedWallet;
          if (!targetAddress) return;
          
          try {
             const { JsonRpcProvider, Contract } = await import('ethers');
             const provider = new JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
             const abi = ["function hasPassed(address user) external view returns (bool)"];
             // NOTE: Use environment variable in real app
             const contract = new Contract(process.env.NEXT_PUBLIC_KYC_ADDRESS || "", abi, provider);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-pink-950 flex items-center justify-center">
        <div className="text-purple-300 text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-pink-950">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [perspective:1000px] [transform-style:preserve-3d]"></div>

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
                className="w-10 h-10 rounded-full border-2 border-pink-400"
              />
            )}
            <span className="text-purple-200 font-medium">
              {session?.user?.name || connectedWallet?.slice(0, 6) + "..." + connectedWallet?.slice(-4)}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500/20 border border-red-400/50 rounded-lg text-red-300 text-sm font-medium hover:bg-red-500/30 transition-all"
            >
              Sign Out
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
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-8">
            Your Dashboard
          </h1>

          {/* Account Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Smart Account */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-black/30 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-pink-300 mb-4">Smart Account</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-purple-300/60 text-sm">Address</p>
                    <p className="text-purple-200 font-mono text-sm break-all">
                      {accountData?.accountAddress || "Loading..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-300/60 text-sm">Status</p>
                    <p className={`text-sm font-medium ${accountData?.exists ? "text-green-400" : "text-yellow-400"}`}>
                      {accountData?.exists ? "✓ Deployed" : "○ Not Deployed"}
                    </p>
                  </div>
                  {accountData?.exists && (
                    <div>
                      <p className="text-purple-300/60 text-sm">Balance</p>
                      <p className="text-purple-200 font-mono">
                        {accountData.balance ? `${parseFloat(accountData.balance).toFixed(4)} MNT` : "0 MNT"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Owner Info */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-black/30 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-purple-300 mb-4">Login Method</h2>
                <div className="space-y-3">
                  {session?.user?.email ? (
                    <>
                      <div>
                        <p className="text-purple-300/60 text-sm">Provider</p>
                        <p className="text-purple-200 font-medium flex items-center gap-2">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          </svg>
                          Google OAuth
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-300/60 text-sm">Email</p>
                        <p className="text-purple-200">{session.user.email}</p>
                      </div>
                    </>
                  ) : connectedWallet ? (
                    <>
                      <div>
                        <p className="text-purple-300/60 text-sm">Provider</p>
                        <p className="text-purple-200 font-medium">🦊 Web3 Wallet</p>
                      </div>
                      <div>
                        <p className="text-purple-300/60 text-sm">Wallet Address</p>
                        <p className="text-purple-200 font-mono text-sm break-all">
                          {connectedWallet}
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-white font-semibold hover:opacity-90 transition-opacity">
              Fund Account
            </button>
            <button className="px-6 py-3 bg-white/10 backdrop-blur border border-pink-400/50 rounded-full text-white font-semibold hover:bg-white/20 transition-all">
              Send Transaction
            </button>
            {/* Only show explorer button if we have a reason to (e.g. account deployed or recent tx) */}
            {accountData?.exists && (
              <a 
                href={`https://sepolia.mantlescan.xyz/address/${accountData.accountAddress}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-white/10 backdrop-blur border border-purple-400/50 rounded-full text-white font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
              >
                View Account on Explorer
              </a>
            )}
            {isVerified ? (
                <div className="px-6 py-3 bg-[#10B981]/20 border border-[#10B981] rounded-full text-[#10B981] font-semibold flex items-center gap-2 cursor-default">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  Verified Identity
                </div>
            ) : (
                <button 
                  onClick={() => router.push('/identity')}
                  className="px-6 py-3 bg-[#10B981] rounded-full text-black font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  Verify Identity
                </button>
            )}
          </motion.div>

          {/* Info Box */}
          {!accountData?.exists && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl"
            >
              <p className="text-yellow-200 text-sm">
                ⚠️ Your smart account hasn't been deployed yet. It will be automatically deployed when you make your first transaction.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
