import React, { useState, useRef } from 'react';

export const HyperPuck = ({ onClick, disabled, isTurn, onHoverChange }: { onClick: () => void, disabled: boolean, isTurn: boolean, onHoverChange: (isHovered: boolean) => void }) => {

    // "The Juice" - Dynamic reflection logic
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [reflectionPos, setReflectionPos] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (buttonRef.current && !disabled) {
            const rect = buttonRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setReflectionPos({ x, y });
        }
    };

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
            <button
                ref={buttonRef}
                onClick={onClick}
                onMouseEnter={() => !disabled && onHoverChange(true)}
                onMouseLeave={() => onHoverChange(false)}
                onMouseMove={handleMouseMove}
                disabled={disabled}
                className={`group relative w-32 h-32 transition-all duration-300 ${disabled ? 'opacity-60 grayscale scale-90 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            >
                {/* 1. Base Housing (Matte Dark) */}
                <div className="absolute inset-y-2 inset-x-0 bg-[#0F172A] rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.6)] translate-y-3"></div>

                {/* 2. The Metal Ring (Brushed Aluminum) */}
                <div className={`absolute inset-0 bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-400 rounded-full shadow-lg p-1.5 transition-all ${!disabled ? 'ring-4 ring-[#00FF88]/20' : ''}`}>
                    {/* Inner Shadow for depth */}
                </div>

                {/* 3. The Interactive Cap (Glass/Plastic) */}
                <div className="absolute inset-3 rounded-full bg-[#1E293B] border-[2px] border-slate-600 flex flex-col items-center justify-center overflow-hidden relative shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)]">

                    {/* Dynamic Reflection "Juice" */}
                    {!disabled && (
                        <div
                            className="absolute inset-0 opacity-40 mix-blend-overlay transition-opacity duration-75"
                            style={{
                                background: `radial-gradient(circle at ${reflectionPos.x}% ${reflectionPos.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`
                            }}
                        />
                    )}

                    {/* Rotating LED Dashes */}
                    {!disabled && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="44" fill="none" stroke="#00FF88" strokeWidth="2" strokeDasharray="10 20" strokeLinecap="round" className="opacity-60" />
                        </svg>
                    )}

                    {/* Label */}
                    <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform flex flex-col items-center">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Command</span>
                        <span className={`block text-xl font-black italic tracking-tighter ${disabled ? 'text-slate-600' : 'text-white neon-text'}`}>
                            {disabled ? 'WAIT' : 'EXECUTE'}
                        </span>
                    </div>

                    {/* Top Specular (Static) */}
                    <div className="absolute top-0 inset-x-4 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none"></div>
                </div>
            </button>
        </div>
    );
};
