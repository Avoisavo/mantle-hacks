"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { useConnect, injected } from "wagmi";
import { useTownBalance } from "@/hooks/useTownBalance";

export default function ConnectButton() {
  const { connect } = useConnect();
  const { balance: townBalance } = useTownBalance();

  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const handleConnect = () => {
    if (isMobile()) {
      // On mobile, use RainbowKit modal (shows QR code)
      return;
    } else {
      // On desktop, directly connect to injected wallet (MetaMask extension)
      connect({ connector: injected() });
    }
  };

  return (
    <motion.div className="w-full">
      <RainbowConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
              className="w-full"
            >
              {(() => {
                if (!connected) {
                  return (
                      <motion.button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('wallet_connecting', 'true');
                          }
                          if (isMobile()) {
                            openConnectModal();
                          } else {
                            handleConnect();
                          }
                        }}
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full relative group"
                        style={{ cursor: "pointer" }}
                      >
                        {/* High-Energy Action Puck Button */}
                        <div className="relative w-full bg-gradient-to-r from-[#26D07C] to-[#00F0FF] rounded-[30px] px-8 py-5 flex items-center justify-center gap-3 border-[4px] border-white shadow-[0_8px_0_#0891b2] hover:shadow-[0_4px_0_#0891b2] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all overflow-hidden group">
                          {/* Inner Gloss / Sheen */}
                          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 blur-sm"></div>
                          <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[35deg] group-hover:left-[100%] transition-all duration-1000 ease-in-out"></div>
                          
                          {/* Text Content */}
                          <div className="flex items-center gap-3 relative z-10">
                            <svg className="w-6 h-6 text-[#001f3f] fill-current" viewBox="0 0 24 24">
                              <path d="M13 2L3 14h9v8l10-12h-9l1 10z" />
                            </svg>
                            <span className="text-[#001f3f] font-black text-xl md:text-2xl tracking-tighter uppercase font-hype" style={{ fontFamily: '"Lexend Zetta", sans-serif' }}>
                              CONNECT & SYNC!
                            </span>
                          </div>
                        </div>
                      </motion.button>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={openChainModal}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden group"
                    >
                      <div className="relative bg-white/5 backdrop-blur-xl border border-purple-400/40 rounded-full px-4 py-2.5 flex items-center gap-2 hover:border-purple-300/60 transition-all duration-300">
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              overflow: "hidden",
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                style={{ width: 16, height: 16 }}
                              />
                            )}
                          </div>
                        )}
                        <span className="text-white font-medium text-sm">{chain.name}</span>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={openAccountModal}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden group"
                    >
                      <div className="relative bg-white/5 backdrop-blur-xl border border-pink-400/40 rounded-full px-4 py-2.5 flex items-center gap-2 hover:border-pink-300/60 transition-all duration-300">
                        <span className="text-white font-medium text-sm">
                          {account.displayName}
                        </span>
                        <span className="text-cyan-400 text-xs font-bold">
                          {townBalance} TOWN
                        </span>
                      </div>
                    </motion.button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </RainbowConnectButton.Custom>
    </motion.div>
  );
}
