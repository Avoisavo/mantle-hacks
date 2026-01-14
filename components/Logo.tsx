interface LogoProps {
  className?: string;
  imgClassName?: string;
}

export default function Logo({ className = "flex items-center", imgClassName = "filter drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]" }: LogoProps) {
  return (
    <div className={className}>
      <div className="relative w-40 h-40">
        <img 
          src="/logo.png" 
          alt="CoinTown Logo" 
          className={`w-full h-full object-contain ${imgClassName}`}
        />
      </div>
    </div>
  );
}
