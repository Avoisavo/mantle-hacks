import React, { useState, useRef, useEffect } from 'react';
import { Dice5 } from 'lucide-react';

export const HyperPuck = ({ onClick, disabled, isTurn, onHoverChange, turn, maxTurns }: { onClick: () => void, disabled: boolean, isTurn: boolean, onHoverChange: (isHovered: boolean) => void, turn: number, maxTurns: number }) => {
    
    // "The Juice" - Dynamic reflection logic
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isPressed, setIsPressed] = useState(false);
    
    // Zone D: Progress Ring Logic
    const radius = 62; // Perfect fit on the rim
    const circumference = 2 * Math.PI * radius;
    const progress = (turn / maxTurns) * circumference;
    const isEndgame = turn >= 12;

    const [ripple, setRipple] = useState(false);

    const handleClick = () => {
        if (disabled) return;
        setIsPressed(true);
        setRipple(true);
        setTimeout(() => setIsPressed(false), 150);
        setTimeout(() => setRipple(false), 1000);
        onClick();
    };

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center justify-center">
            
            {/* Haptic Ripple Effect */}
            {ripple && (
                <div className="absolute inset-0 rounded-full border-4 border-[#00FF88] animate-ping opacity-50 z-[-2]"></div>
            )}

            {/* 1. THE PHYSICAL HOUSING (Base) */}
            <div className={`
                relative w-40 h-40 rounded-full 
                bg-gradient-to-br from-slate-800 to-slate-950 
                shadow-[0_25px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.1)]
                flex items-center justify-center
                border border-slate-700
            `}>
                
                {/* 2. THE INTERACTIVE CORE (Mint Puck) */}
                <button
                    ref={buttonRef}
                    onClick={handleClick}
                    onMouseEnter={() => !disabled && onHoverChange(true)}
                    onMouseLeave={() => onHoverChange(false)}
                    disabled={disabled || isTurn === false}
                    className={`
                        relative w-32 h-32 rounded-full 
                        bg-[#00FF88]
                        shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2),inset_0_4px_12px_rgba(255,255,255,0.6),0_10px_20px_rgba(0,255,136,0.3)]
                        transition-all duration-100 cubic-bezier(0.1, 0.7, 0.1, 1)
                        overflow-hidden
                        group
                        ${disabled ? 'opacity-60 grayscale cursor-not-allowed contrast-75' : 'cursor-pointer hover:brightness-105'}
                        ${isPressed ? 'translate-y-1 scale-[0.98] shadow-none' : '-translate-y-1'}
                    `}
                >
                    {/* The Specular Gloss (High End Finish) */}
                    <div className="absolute top-0 left-6 right-6 h-12 bg-gradient-to-b from-white/80 to-transparent rounded-b-full pointer-events-none opacity-60 blur-[1px]"></div>

                    {/* Zone D: THE BEZEL (Progress Ring) */}
                    <div className="absolute inset-0 pointer-events-none rotate-[-90deg]">
                        <svg className="w-full h-full text-slate-900/10">
                            {/* Track */}
                             <circle 
                                cx="64" cy="64" r={radius} 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="4"
                            />
                            {/* Progress Fill */}
                            <circle 
                                cx="64" cy="64" r={radius} 
                                fill="none" 
                                stroke={isEndgame ? "#EF4444" : "#FFD700"} 
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - progress}
                                className={`transition-all duration-1000 ease-out drop-shadow-[0_0_2px_rgba(255,215,0,0.6)] ${isEndgame ? 'animate-pulse' : ''}`}
                            />
                        </svg>
                    </div>

                    <div className="absolute inset-0 flex flex-col items-center">
                        
                        {/* Zone A: THE PROGRESS INSET (Top 25%) */}
                        <div className="mt-5 bg-[#0b2e23] w-20 h-8 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center gap-1.5 border-b border-white/10 z-10">
                             <span className="text-xl font-black text-[#00FF88] leading-none drop-shadow-[0_0_8px_rgba(0,255,136,0.5)] font-mono">
                                {String(turn).padStart(2, '0')}
                             </span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none pt-0.5">
                                of {maxTurns}
                             </span>
                        </div>

                        {/* Zone B: THE ACTION HERO (Center 50%) */}
                        <div className={`
                            flex-1 flex items-center justify-center
                            text-[#0F172A] 
                            drop-shadow-md 
                            transition-transform duration-300 transform
                            ${!disabled && !isPressed ? 'animate-bounce-subtle' : ''} 
                            group-active:scale-90 group-active:rotate-12
                            translate-y-[-2px]
                        `}>
                             {/* Filled white dice with dark dots */}
                             <div className="relative">
                                <Dice5 
                                    size={42} 
                                    strokeWidth={1.5} 
                                    className="fill-white text-[#0F172A]" 
                                />
                             </div>
                        </div>

                        {/* Zone C: THE INSTRUCTION (Bottom 25%) */}
                        <div className="w-full h-8 relative mb-2">
                            <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
                                {/* Adjusted curve to hug the bottom perfectly */}
                                <path id="curve" d="M 20,8 Q 50,22 80,8" fill="transparent" />
                                <text width="100">
                                    <textPath 
                                        href="#curve" 
                                        startOffset="50%" 
                                        textAnchor="middle" 
                                        className="text-[12px] font-[900] fill-white tracking-[0.25em]"
                                        dominantBaseline="middle"
                                    >
                                        ROLL
                                    </textPath>
                                </text>
                            </svg>
                        </div>

                    </div>
                </button>
            </div>
        </div>
    );
};
