export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        {/* Neon glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
        {/* Main logo shape */}
        <div className="relative w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-pink-300/30">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Coin icon */}
            <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="3" fill="none" />
            <circle cx="20" cy="20" r="10" fill="white" fillOpacity="0.3" />
            <text
              x="20"
              y="26"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              fontFamily="system-ui"
            >
              $
            </text>
          </svg>
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
