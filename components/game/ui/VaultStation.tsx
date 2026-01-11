import React, { useEffect, useState } from 'react';
import { Archive, Layers } from 'lucide-react';
import { useOdometer } from '@/lib/game/hooks';

export const VaultStation = ({ value }: { value: number }) => {
    const displayValue = useOdometer(value);

    return (
        <div className="absolute bottom-6 left-8 z-50 pointer-events-none flex flex-col items-start select-none mix-blend-screen">

            {/* Minimal HUD Label */}
            <div className="flex items-center gap-2 mb-0 px-1 opacity-70">
                <Archive size={14} className="text-[#00FF88]" />
                <span className="text-[10px] font-black text-[#00FF88] uppercase tracking-[0.3em] font-mono">
                    Vaulted Value
                </span>
            </div>

            {/* Digital Filament Number */}
            <div className="relative">
                <span className="font-mono text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]">
                    ${displayValue.toLocaleString()}
                </span>

                {/* Visual Glitch/Ghosting Effect */}
                <span className="absolute inset-0 font-mono text-6xl md:text-7xl font-black text-[#00FF88] tracking-tighter tabular-nums opacity-20 blur-sm animate-pulse">
                    ${displayValue.toLocaleString()}
                </span>
            </div>

            {/* Decorative Underline (Dock Line) */}
            <div className="w-full h-[2px] bg-gradient-to-r from-[#00FF88] to-transparent mt-2 opacity-50"></div>
        </div>
    );
};
