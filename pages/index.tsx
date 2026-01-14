import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useAccount, useDisconnect } from "wagmi";
import { useRouter } from "next/router";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Wallet, Play, Package, AlertCircle } from "lucide-react";

// Dynamically import login components to avoid SSR issues
const ConnectButton = dynamic(() => import("@/components/ConnectButton"), { ssr: false });
const GoogleLoginButton = dynamic(() => import("@/components/GoogleLoginButton"), { ssr: false });

// 3D Model Component
function ChickenGuy({ isHit }: { isHit: boolean }) {
  const { scene } = useGLTF("/models/ChickenGuy.glb");
  const meshRef = useRef<THREE.Group>(null);
  const originalMaterials = useRef<Map<THREE.MeshStandardMaterial, { color: number; emissive: number; emissiveIntensity: number; transparent: boolean; opacity: number }>>(new Map());

  useEffect(() => {
    if (scene && originalMaterials.current.size === 0) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial && !originalMaterials.current.has(mat)) {
              originalMaterials.current.set(mat, {
                color: mat.color.getHex(),
                emissive: mat.emissive.getHex(),
                emissiveIntensity: mat.emissiveIntensity,
                transparent: mat.transparent,
                opacity: mat.opacity,
              });
            }
          });
        }
      });
    }
  }, [scene]);

  useEffect(() => {
    if (meshRef.current) {
      if (isHit) {
        // Change to red
        meshRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.color.setHex(0xff0000);
                mat.emissive.setHex(0xff0000);
                mat.emissiveIntensity = 0.2;
                mat.transparent = true;
                mat.opacity = 0.3;
              }
            });
          }
        });
      } else {
        // Restore original materials
        originalMaterials.current.forEach((original, mat) => {
          mat.color.setHex(original.color);
          mat.emissive.setHex(original.emissive);
          mat.emissiveIntensity = original.emissiveIntensity;
          mat.transparent = original.transparent;
          mat.opacity = original.opacity;
        });
      }
    }
  }, [isHit]);

  return <primitive ref={meshRef} object={scene} scale={1.5} position={[0, -2, 0]} rotation={[0, Math.PI / 8, 0]} castShadow />;
}

// Ground plane to receive shadow
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <shadowMaterial opacity={0.3} />
    </mesh>
  );
}

function Model({ chickenHit }: { chickenHit: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, -1, 6], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
      shadows
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ff00ff" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-5, 5, -5]} intensity={1.2} color="#8b00ff" />
      <pointLight position={[10, 10, 10]} intensity={2} color="#ff00ff" />
      <pointLight position={[-10, 10, -10]} intensity={2} color="#8b00ff" />
      <pointLight position={[0, -5, 5]} intensity={1.5} color="#00ffff" />
      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={2} color="#ffffff" castShadow />
      <ChickenGuy isHit={chickenHit} />
      <Ground />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        autoRotate={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </Canvas>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const { address: connectedWallet } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [chickenHit, setChickenHit] = useState(false);
  const [feathers, setFeathers] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([]);
  const [showModalDelayed, setShowModalDelayed] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

  // Get the active address (either from session or wallet)
  const activeAddress = smartAccountAddress || connectedWallet;

  // Auto-show menu when logged in
  useEffect(() => {
    if (status === "authenticated" || connectedWallet) {
      setShowMainMenu(true);
      
      const isWalletConnecting = typeof window !== 'undefined' ? localStorage.getItem('wallet_connecting') === 'true' : false;

      if (showLoginModal || isWalletConnecting) {
        setShowLoginModal(false);
        setShowModalDelayed(false);
        setChickenHit(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wallet_connecting');
        }
        router.push("/dashboard");
      }
    } else {
      setShowMainMenu(false);
    }
  }, [status, connectedWallet, showLoginModal, router]);

  // Fetch smart account if logged in via Google
  useEffect(() => {
    const fetchSmartAccount = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/account/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session.user.email }),
          });
          const data = await response.json();
          if (data.data?.accountAddress) {
            setSmartAccountAddress(data.data.accountAddress);
          }
        } catch (e) {
          console.error("Failed to fetch smart account", e);
        }
      }
    };
    fetchSmartAccount();
  }, [session]);

  // Check verification status when we have the active address
  useEffect(() => {
    const checkVerification = async () => {
      if (activeAddress) {
        try {
          console.log("Checking verification for address:", activeAddress);
          const response = await fetch(`/api/check-verification?address=${activeAddress}`);
          const data = await response.json();
          console.log("Verification response:", data);
          setIsVerified(data.verified);
        } catch (error) {
          console.error('Failed to check verification status:', error);
          setIsVerified(false);
        }
      } else {
        setIsVerified(null);
      }
    };
    checkVerification();
  }, [activeAddress]);

  // Track mouse position for custom crosshair
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleTap = () => {
    // Play gunshot sound
    const gunshot = new Audio("/gunshot.mp3");
    gunshot.play();

    // Stop gunshot after 30% duration and play chicken sound
    gunshot.onloadedmetadata = () => {
      const thirtyPercent = gunshot.duration * 0.3;
      setTimeout(() => {
        gunshot.pause();
        gunshot.currentTime = 0;
        const chicken = new Audio("/chicken.mp3");
        chicken.play();

        // Stop chicken after 80% duration
        chicken.onloadedmetadata = () => {
          const eightyPercent = chicken.duration * 0.8;
          setTimeout(() => {
            chicken.pause();
            chicken.currentTime = 0;
          }, eightyPercent * 1000);
        };
      }, thirtyPercent * 1000);
    };

    if (status === "authenticated" || connectedWallet) {
      // Menu is already shown via useEffect, do nothing on tap
      return;
    } else {
      // Turn chicken red
      setChickenHit(true);

      // Create feathers at cursor position
      const newFeathers = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: mousePosition.x,
        y: mousePosition.y,
        rotation: Math.random() * 360,
      }));
      setFeathers(newFeathers);

      // Show login modal after animation
      setTimeout(() => {
        setShowModalDelayed(true);
        setShowLoginModal(true);
      }, 1500);
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from NextAuth (Google)
      if (session) {
        await signOut({ redirect: false });
      }
      // Disconnect wallet (Web3)
      if (connectedWallet) {
        await disconnect();
      }
      setShowAccountMenu(false);
      setShowMainMenu(false);
      setIsVerified(null);
      setSmartAccountAddress(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleStartGame = () => {
    router.push("/game2");
  };

  const handleViewAssets = () => {
    router.push("/dashboard");
  };

  const isLoggedIn = status === "authenticated" || connectedWallet;
  const displayName = session?.user?.name || connectedWallet?.slice(0, 6) + "..." + connectedWallet?.slice(-4);
  const displayImage = session?.user?.image;

  return (
    <>
      <Head>
        <title>CoinTown - 3D Monopoly Game</title>
        <meta name="description" content="Play the ultimate 3D monopoly game with Web3 integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Chelsea+Market&family=Luckiest+Guy&family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+Old+Uyghur&display=swap" rel="stylesheet" />
      </Head>

      <main
        className="relative min-h-screen w-full overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0015 0%, #1a0033 50%, #0a0015 100%)",
          cursor: showModalDelayed ? "auto" : "none",
        }}
        onClick={() => !showLoginModal && !showAccountMenu && handleTap()}
      >
        {/* Custom Sniper Crosshair */}
        {!showModalDelayed && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: mousePosition.x,
              top: mousePosition.y,
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 15px rgba(0, 255, 255, 0.6))",
            }}
          >
          <svg width="80" height="80" viewBox="0 0 80 80" className="opacity-100">
            <defs>
              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Outer circle with glow */}
            <circle cx="40" cy="40" r="38" stroke="#00ffff" strokeWidth="2.5" fill="none" filter="url(#glow)" opacity="0.9" />
            {/* Second outer circle */}
            <circle cx="40" cy="40" r="34" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.7" />
            {/* Inner circle */}
            <circle cx="40" cy="40" r="25" stroke="#00ffff" strokeWidth="2" fill="none" filter="url(#glow)" opacity="0.8" />
            {/* Center dot - bright */}
            <circle cx="40" cy="40" r="3" fill="#ffffff" filter="url(#glow)" />
            <circle cx="40" cy="40" r="1.5" fill="#00ffff" />

            {/* Main crosshairs - bright with glow */}
            {/* Top line */}
            <line x1="40" y1="0" x2="40" y2="20" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />
            {/* Bottom line */}
            <line x1="40" y1="60" x2="40" y2="80" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />
            {/* Left line */}
            <line x1="0" y1="40" x2="20" y2="40" stroke="#00ffff" strokeWidth="3" filter="url(#glow)" />
            {/* Right line */}
            <line x1="60" y1="40" x2="80" y2="40" stroke="#00ffff" strokeWidth="3" filter="url(#glow)" />

            {/* Accent lines - cyan */}
            <line x1="40" y1="2" x2="40" y2="18" stroke="#00ffff" strokeWidth="1.5" opacity="0.8" />
            <line x1="40" y1="62" x2="40" y2="78" stroke="#00ffff" strokeWidth="1.5" opacity="0.8" />
            <line x1="2" y1="40" x2="18" y2="40" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
            <line x1="62" y1="40" x2="78" y2="40" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />

            {/* Diagonal corner brackets */}
            <line x1="8" y1="8" x2="18" y2="18" stroke="#00ffff" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
            <line x1="72" y1="8" x2="62" y2="18" stroke="#00ffff" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
            <line x1="8" y1="72" x2="18" y2="62" stroke="#00ffff" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
            <line x1="72" y1="72" x2="62" y2="62" stroke="#00ffff" strokeWidth="2" filter="url(#glow)" opacity="0.7" />

            {/* Tick marks */}
            <line x1="40" y1="22" x2="40" y2="28" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
            <line x1="40" y1="52" x2="40" y2="58" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
            <line x1="22" y1="40" x2="28" y2="40" stroke="#00ffff" strokeWidth="2" opacity="0.9" />
            <line x1="52" y1="40" x2="58" y2="40" stroke="#00ffff" strokeWidth="2" opacity="0.9" />

            {/* Small corner dots */}
            <circle cx="12" cy="12" r="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="68" cy="12" r="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="12" cy="68" r="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="68" cy="68" r="1.5" fill="#ffffff" opacity="0.8" />
          </svg>
          </div>
        )}

        {/* Account Display - Top Right */}
        {isLoggedIn && (
          <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
            {/* User Account Button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAccountMenu(!showAccountMenu);
                }}
                className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-pink-500/40 rounded-full px-4 py-2 hover:border-pink-400/60 transition-all"
              >
                {displayImage && (
                  <img
                    src={displayImage}
                    alt={displayName || "User"}
                    className="w-8 h-8 rounded-full border-2 border-pink-400"
                  />
                )}
                <span className="text-white font-medium text-sm">{displayName}</span>
              </motion.button>

              {/* Account Dropdown Menu */}
              {showAccountMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-xl border border-pink-500/40 rounded-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-pink-500/20">
                    <p className="text-purple-300/60 text-xs">Signed in as</p>
                    <p className="text-white text-sm font-medium truncate">{displayName}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        )}
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,0,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [perspective:1000px] [transform-style:preserve-3d]"></div>

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

        {/* 3D Model Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* 3D Cointown Text with CSS - Behind model */}
          <div
            className="absolute pointer-events-none"
            style={{
              perspective: "1000px",
              top: "5%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 0,
            }}
          >
            <h1
              style={{
                fontFamily: '"Luckiest Guy", cursive',
                fontSize: "clamp(5rem, 12vw, 10rem)",
                fontWeight: "bold",
                color: "#FFD700",
                textShadow: `
                  0 1px 0 #B19CD9,
                  0 2px 0 #B19CD9,
                  0 3px 0 #B19CD9,
                  0 4px 0 #B19CD9,
                  0 5px 0 #B19CD9,
                  0 6px 1px rgba(0,0,0,.1),
                  0 0 5px rgba(0,0,0,.1),
                  0 1px 3px rgba(0,0,0,.3),
                  0 3px 5px rgba(0,0,0,.2),
                  0 5px 10px rgba(0,0,0,.25),
                  0 10px 10px rgba(0,0,0,.2),
                  0 20px 20px rgba(0,0,0,.15),
                  0 0 20px #FFD700,
                  0 0 40px #FFD70055
                `,
                transform: "rotateX(0deg) rotateY(0deg)",
                transformStyle: "preserve-3d",
                letterSpacing: "0.05em",
              }}
            >
              Cointown
            </h1>
          </div>

          {/* Show 3D model or menu based on state */}
          <AnimatePresence mode="wait">
            {!showMainMenu ? (
              <motion.div
                key="model"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
                style={{ zIndex: 1, position: "relative" }}
              >
                <Model chickenHit={chickenHit} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 w-full flex flex-col items-center justify-center"
                style={{ zIndex: 10, marginTop: '120px' }}
              >
                {/* Main Menu */}
                <div className="flex flex-col items-center gap-6 w-full max-w-md px-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartGame}
                    className="relative group w-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                    <div className="relative bg-black/60 backdrop-blur-xl border-2 border-pink-500/50 rounded-2xl px-8 py-5 flex items-center justify-center gap-4 w-full">
                      <Play size={28} className="text-pink-400" />
                      <span
                        className="text-2xl font-bold text-white"
                        style={{ fontFamily: '"Luckiest Guy", cursive' }}
                      >
                        Start Game
                      </span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleViewAssets}
                    className="relative group w-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                    <div className="relative bg-black/60 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl px-8 py-5 flex items-center justify-center gap-4 w-full">
                      <Package size={28} className="text-purple-400" />
                      <span
                        className="text-2xl font-bold text-white"
                        style={{ fontFamily: '"Luckiest Guy", cursive' }}
                      >
                        View My Assets
                      </span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="relative group w-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                    <div className="relative bg-black/60 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl px-8 py-5 flex items-center justify-center gap-4 w-full">
                      <LogOut size={28} className="text-red-400" />
                      <span
                        className="text-2xl font-bold text-white"
                        style={{ fontFamily: '"Luckiest Guy", cursive' }}
                      >
                        Sign Out
                      </span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feather Animations */}
        {feathers.map((feather) => (
          <motion.div
            key={feather.id}
            className="fixed pointer-events-none z-40"
            style={{
              left: feather.x,
              top: feather.y,
            }}
            initial={{
              scale: 0,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              scale: [0, 1.5, 1],
              rotate: feather.rotation,
              opacity: [1, 1, 0],
              y: [0, -100],
              x: [0, (Math.random() - 0.5) * 100],
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
            }}
            onAnimationComplete={() => {
              setFeathers((prev) => prev.filter((f) => f.id !== feather.id));
            }}
          >
            <svg width="30" height="40" viewBox="0 0 30 40">
              <path
                d="M15 0 Q20 10 18 20 Q16 30 15 40 Q14 30 12 20 Q10 10 15 0"
                fill="#ffffff"
                stroke="#ffccaa"
                strokeWidth="1"
                opacity="0.9"
              />
              <line x1="15" y1="0" x2="15" y2="40" stroke="#ffccaa" strokeWidth="1" opacity="0.5" />
            </svg>
          </motion.div>
        ))}

        {/* Tap to start text - only show when not logged in */}
        {!isLoggedIn && (
          <div className="absolute bottom-20 left-0 right-0 text-center z-10">
            <p
              className="text-white text-xl font-medium animate-pulse"
              style={{
                fontFamily: '"Luckiest Guy", cursive',
                textShadow: "0 0 10px #ff00ff, 0 0 20px #8b00ff",
              }}
            >
              Tap anywhere to start
            </p>
          </div>
        )}

        {/* Login Modal */}
        {showModalDelayed && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowLoginModal(false);
              setShowModalDelayed(false);
              setChickenHit(false);
            }}
          >
            <div
              className="relative max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-[#bffff4]/5 rounded-3xl blur-3xl scale-110"></div>

              <div className="relative bg-[#130E22]/90 backdrop-blur-[20px] border border-white/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Subtle Rim Light atop the modal */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#bffff4]/30 to-transparent"></div>
                
                {/* Subtle Scanlines - reduced opacity */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] z-0 pointer-events-none bg-[length:100%_4px]"></div>

                <h3 className="relative z-10 text-2xl font-bold text-center text-white mb-10 tracking-widest drop-shadow-[0_0_8px_rgba(191,255,244,0.3)]" style={{ fontFamily: '"Luckiest Guy", cursive' }}>
                  MEMBER LOGIN
                </h3>

                {/* Google Login Button */}
                <div className="mb-4">
                  <GoogleLoginButton />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#bffff4]/40 to-transparent"></div>
                  <span className="text-[#bffff4]/80 text-sm font-medium" style={{ fontFamily: '"Chelsea Market", cursive' }}>or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#bffff4]/40 to-transparent"></div>
                </div>

                {/* Wallet Connect Button */}
                <div>
                  <ConnectButton />
                </div>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLoginModal(false);
                    setShowModalDelayed(false);
                    setChickenHit(false);
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('wallet_connecting');
                    }
                  }}
                  className="mt-6 w-full text-[#bffff4]/60 text-sm hover:text-[#bffff4] transition-colors"
                  style={{ fontFamily: '"Chelsea Market", cursive' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
