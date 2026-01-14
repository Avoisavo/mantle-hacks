export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        {/* Neon glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
        {/* Main logo shape */}
        <div className="relative w-full h-full rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden shadow-[0_0_15px_rgba(236,72,153,0.5)]">
          <img 
            src="/logo.png" 
            alt="CoinTown Logo" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 drop-shadow-lg">
          CoinTown
        </h1>
        <p className="text-sm text-pink-300/80 font-medium tracking-wider">3D MONOPOLY</p>
      </div>
    </div>
  );
}
