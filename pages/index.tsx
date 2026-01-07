import Head from "next/head";
import Logo from "@/components/Logo";
import ConnectButton from "@/components/ConnectButton";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      <Head>
        <title>CoinTown - 3D Monopoly Game</title>
        <meta name="description" content="Play the ultimate 3D monopoly game with Web3 integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-pink-950">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [perspective:1000px] [transform-style:preserve-3d] animate-grid"></div>

        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-pink-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <Logo />
          </motion.div>

          {/* Login/Signup Section - Centered */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            {/* Login Card */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>

              <div className="relative bg-black/40 backdrop-blur-xl border border-pink-500/30 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6">
                Welcome to CoinTown
                </h3>

                {/* Google Login Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mb-4"
                >
                  <GoogleLoginButton />
                </motion.div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                  <span className="text-purple-300/60 text-sm font-medium">or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                </div>

                {/* Wallet Connect Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ConnectButton />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="absolute bottom-8 text-purple-400/60 text-sm"
          >
            <p>Powered by CoinTown</p>
          </motion.div>
        </div>

        {/* Custom animations */}
        <style jsx>{`
          @keyframes grid {
            0% {
              transform: perspective(1000px) rotateX(0deg);
            }
            100% {
              transform: perspective(1000px) rotateX(10deg);
            }
          }
          .animate-grid {
            animation: grid 20s ease-in-out infinite alternate;
          }
        `}</style>
      </main>
    </>
  );
}
