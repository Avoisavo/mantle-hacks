import React from 'react';
import { Player } from '@/lib/game/types';
import { Trophy, Crown, Signal } from 'lucide-react';
import { AvatarIcon } from './AvatarIcon';

interface TournamentRibbonProps {
    players: Player[];
    currentPlayerIndex: number;
    prizePot: number;
}

export const TournamentRibbon: React.FC<TournamentRibbonProps> = ({ players, currentPlayerIndex, prizePot }) => {
    const maxBalance = Math.max(...players.map(p => p.balance));
    const sortedBots = players.filter(p => p.id !== '1').sort((a, b) => b.balance - a.balance);
    const human = players.find(p => p.id === '1');

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 pointer-events-none">

            {/* 1. THE UNIFIED COMMAND BAR */}
            <div className="relative w-full h-20 bg-[#0F172A]/80 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl flex items-center justify-between px-2 md:px-6 pointer-events-auto overflow-visible ring-1 ring-white/5">

                {/* LEFT WING: COMMANDER CARD */}
                <div className="flex items-center gap-4 h-full py-2">
                    {human && (
                        <div className="flex items-center gap-3 bg-[#1E293B]/50 pr-6 rounded-[18px] border border-white/5 h-full group hover:bg-[#1E293B] transition-colors cursor-pointer">
                            <div className="relative h-full aspect-square p-1">
                                <div className={`w-full h-full rounded-[14px] flex items-center justify-center border-[2px] ${human.balance === maxBalance ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#26D07C] bg-[#26D07C]/10'} shadow-inner`}>
                                    <AvatarIcon name={human.avatar} size={24} className={human.balance === maxBalance ? 'text-[#FFD700]' : 'text-[#26D07C]'} />
                                </div>
                                {/* Online Dot */}
                                <div className="absolute top-0 right-0 w-3 h-3 bg-[#00FF88] rounded-full border-2 border-[#0F172A] shadow-sm animate-pulse"></div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sovereign ID</span>
                                    {human.balance === maxBalance && <Crown size={12} className="text-[#FFD700] fill-[#FFD700]" />}
                                </div>
                                <span className="text-xl font-black text-white tabular-nums leading-none mt-0.5">${human.balance.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT WING: INTEL ARRAY (Leaderboard) */}
                <div className="flex flex-col justify-center gap-1.5 h-full py-2 min-w-[200px]">
                    {sortedBots.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-[#1E293B]/40 px-3 py-1 rounded-lg border border-white/5 gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center border border-white/10">
                                    <AvatarIcon name={p.avatar} size={10} className="text-slate-400" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${p.balance === maxBalance ? 'text-[#FFD700]' : 'text-slate-400'}`}>
                                        {p.name}
                                    </span>
                                    {p.balance === maxBalance && <Crown size={10} className="text-[#FFD700] fill-[#FFD700]" />}
                                </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">${p.balance.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. THE CENTERPIECE: DROP-DOWN POT */}
            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-64 pointer-events-auto z-50">
                {/* The Physical "Drop" Frame */}
                <div className="bg-[#0F172A] rounded-b-[32px] rounded-t-[0px] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-4 border-x-2 border-[#FFD700] margin-0-auto relative group cursor-pointer transition-transform hover:translate-y-1">

                    {/* Top "Hinge" visual hiding the bar seam */}
                    <div className="absolute -top-4 inset-x-4 h-4 bg-[#0F172A] z-10"></div>

                    <div className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] rounded-b-[28px] pt-4 pb-4 px-6 flex flex-col items-center relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-1 opacity-80">
                            <Trophy size={14} className="text-[#FFD700] fill-[#FFD700]" />
                            <span className="text-[9px] font-black text-[#FFD700] uppercase tracking-[0.3em]">Current Yield</span>
                        </div>
                        <span className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                            ${prizePot.toLocaleString()}
                        </span>

                        {/* Fiber Optic Decor */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-[#FFD700] shadow-[0_0_10px_#FFD700]"></div>
                    </div>
                </div>

                {/* 3. CONNECTING CABLES (Visual only) */}
                <svg className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] pointer-events-none opacity-40 overflow-visible" style={{ marginLeft: '0px' }}>
                    <defs>
                        <linearGradient id="cableGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Left Cable */}
                    <path d="M 0 0 C -100 50, -300 150, -400 300" stroke="url(#cableGradient)" strokeWidth="2" fill="none" className="drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                    {/* Right Cable */}
                    <path d="M 0 0 C 100 50, 300 150, 400 300" stroke="url(#cableGradient)" strokeWidth="2" fill="none" className="drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                    {/* Animated Data Packets (Circles moving down lines) */}
                    <circle r="3" fill="#00FF88">
                        <animateMotion path="M 0 0 C -100 50, -300 150, -400 300" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle r="3" fill="#00FF88">
                        <animateMotion path="M 0 0 C 100 50, 300 150, 400 300" dur="4s" repeatCount="indefinite" />
                    </circle>
                </svg>
            </div>

        </div>
    );
};
