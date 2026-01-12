import React, { useState } from 'react';
import { Landmark, Briefcase, Zap, Timer } from 'lucide-react';

export const UtilityCommand = () => {
    const [active, setActive] = useState('Tour');

    const buttons = [
        { icon: Landmark, bg: 'bg-[#3B82F6]', border: 'border-[#1D4ED8]', label: 'Tour', glow: 'shadow-[#3B82F6]' },
        { icon: Briefcase, bg: 'bg-[#A855F7]', border: 'border-[#7E22CE]', label: 'Bag', glow: 'shadow-[#A855F7]' },
        { icon: Zap, bg: 'bg-[#EAB308]', border: 'border-[#A16207]', label: 'Pulse', glow: 'shadow-[#EAB308]' },
        { icon: Timer, bg: 'bg-[#64748B]', border: 'border-[#334155]', label: 'Ledger', glow: 'shadow-[#64748B]' },
    ];

    return (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-40 pointer-events-auto hidden lg:flex">
            {buttons.map((btn, idx) => {
                const isActive = active === btn.label;
                return (
                    <button
                        key={idx}
                        onClick={() => setActive(btn.label)}
                        className={`group relative w-14 h-14 rounded-full ${btn.bg} ${btn.border} border-b-[5px] border-x-[2px] border-t-[1px] sticker-shadow flex items-center justify-center transition-all duration-200 hover:scale-110 active:translate-y-[3px] active:shadow-[0_2px_0px_#0f172a] active:border-b-[2px] ${isActive ? `ring-2 ring-white ${btn.glow} shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110` : 'opacity-80 hover:opacity-100'}`}
                    >
                        {/* Glossy Overlay for Enamel Feel */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>

                        <btn.icon size={22} className="text-white drop-shadow-md relative z-10" strokeWidth={2.5} />

                        {/* Floating Tooltip */}
                        <div className="absolute left-full ml-4 bg-[#1E293B] text-white text-[9px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap tracking-widest uppercase border border-white/10 shadow-xl pointer-events-none translate-x-2 group-hover:translate-x-0 duration-200 z-50 sticker-shadow">
                            {btn.label}
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1E293B] rotate-45 border-l border-b border-white/10"></div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
