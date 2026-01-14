export default function Logo() {
  return (
    <div className="flex items-center">
      <div className="relative w-40 h-40">
        <img 
          src="/logo.png" 
          alt="CoinTown Logo" 
          className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]"
        />
      </div>
    </div>
  );
}
