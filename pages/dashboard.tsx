import { useSession, signIn, signOut } from "next-auth/react";
import { useAccount, useDisconnect, useSignMessage, useBalance, useReadContract, useWriteContract, useSwitchChain } from "wagmi";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { TOWN_TOPUP_NATIVE_ADDRESS, TOWN_TOKEN_NATIVE_ADDRESS } from "@/utils/address";
import { ABI as TownTokenABI } from "@/utils/towntoken";
import { ABI as TownTopUpNativeABI } from "@/utils/towntopnative";
import { formatEther, parseEther } from "viem";

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

  const { writeContract, isPending: isMinting } = useWriteContract();

  const CHAIN_ID = 5003;

  const handleMintTown = async () => {
    if (!connectedWallet) {
      alert("Please connect your wallet first");
      return;
    }

    // Ensure we are on the right chain
    if (chainId !== CHAIN_ID) {
      try {
        await switchChain({ chainId: CHAIN_ID });
        // NOTE: switchChain is often async in wallet, but wagmi's switchChain might not wait.
        // For better UX, we just return here and let the user click again, 
        // or wait for the chain to change. 
        // But most wallets will pop up the switch request.
        return; 
      } catch (err: any) {
        alert(`Please switch to Mantle Sepolia manually. Error: ${err.message}`);
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
      }, {
        onSuccess: (hash) => {
          alert(`Successfully bought TOWN! Transaction: ${hash}`);
        },
        onError: (err) => {
          console.error("Purchase failed:", err);
          alert(`Purchase failed: ${err.message}`);
        }
      });
    } catch (err: any) {
      console.error("Purchase error:", err);
      alert(`Error: ${err.message}`);
    }
  };

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
    if (status === "unauthenticated" && !connectedWallet) {
      signIn();
    }
  }, [status, connectedWallet]);

  useEffect(() => {
    // Fetch smart account info
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-purple-300/60 text-sm">MNT Balance</p>
                        <p className="text-purple-200 font-mono font-bold">
                          {accountData.balance !== undefined ? `${Number(accountData.balance).toFixed(4)} MNT` : "0.0000 MNT"}
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-300/60 text-sm">TOWN Balance</p>
                        <p className="text-pink-300 font-mono font-bold">
                          {smartAccountTownBalance ? `${parseFloat(formatEther(smartAccountTownBalance as bigint)).toFixed(2)} TOWN` : "0.00 TOWN"}
                        </p>
                      </div>
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
                        <p className="text-purple-200 font-mono text-sm break-all mb-4">
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

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={handleMintTown}
              disabled={isMinting}
              className="px-6 py-3 bg-pink-500/20 border border-pink-400/50 rounded-full text-pink-300 font-semibold hover:bg-pink-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isMinting ? "Minting..." : chainId !== CHAIN_ID ? "Switch to Mantle" : "mint TOWN"}
            </button>
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
