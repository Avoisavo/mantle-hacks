import React, { useEffect, useState } from 'react';
import { GameLog } from '@/lib/game/types';
import { Coins, TrendingUp, Zap, DollarSign, Trophy, Sparkles, Flame, Target } from 'lucide-react';

interface FloatingEvent extends GameLog {
    isVisible: boolean;
}

const getEventIcon = (action: string, type?: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('snipe') || actionLower.includes('bought') || actionLower.includes('acquired')) {
        return { Icon: Target, color: '#FFD700', bg: '#FFD700/20' };
    }
    if (actionLower.includes('tax') || actionLower.includes('rent') || actionLower.includes('yield') || actionLower.includes('paid')) {
        return { Icon: DollarSign, color: '#FF6B6B', bg: '#FF6B6B/20' };
    }
    if (actionLower.includes('collected')) {
        return { Icon: Coins, color: '#00FF88', bg: '#00FF88/20' };
    }
    if (actionLower.includes('roll')) {
        return { Icon: Zap, color: '#3B82F6', bg: '#3B82F6/20' };
    }
    if (type === 'TRANSACTION') {
        return { Icon: TrendingUp, color: '#A855F7', bg: '#A855F7/20' };
    }
    
    return { Icon: Sparkles, color: '#64748B', bg: '#64748B/20' };
};

const getPlayerColor = (playerName: string) => {
    if (playerName.includes('Satoshi') || playerName.includes('You')) return '#26D07C';
    if (playerName.includes('Zuck')) return '#A855F7';
    if (playerName.includes('Elon')) return '#3B82F6';
    return '#FFFFFF';
};

const getHypeLevel = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('patek') || actionLower.includes('rolex') || actionLower.includes('picasso')) {
        return 'MEGA';
    }
    if (actionLower.includes('snipe') || actionLower.includes('tax')) {
        return 'HIGH';
    }
    return 'NORMAL';
};

const transformAction = (action: string): string => {
    let transformed = action;
    
    // Transform verbs to maximalist language
    transformed = transformed.replace(/Bought/gi, 'SNIPED');
    transformed = transformed.replace(/Acquired/gi, 'SNIPED');
    transformed = transformed.replace(/Paid.*yield to/gi, 'GOT TAXED BY');
    transformed = transformed.replace(/Paid.*rent to/gi, 'GOT TAXED BY');
    transformed = transformed.replace(/Collected/gi, 'COLLECTED 💰');
    transformed = transformed.replace(/Rolled a/gi, '🎲 ROLLED');
    
    return transformed;
};

export const HypeFeed = ({ logs }: { logs: GameLog[] }) => {
    const [visibleLogs, setVisibleLogs] = useState<FloatingEvent[]>([]);
    const maxVisible = 5;

    useEffect(() => {
        // Convert logs to floating events
        const newEvents: FloatingEvent[] = logs.slice(0, maxVisible).map((log, index) => ({
            ...log,
            isVisible: true
        }));
        
        setVisibleLogs(newEvents);
    }, [logs]);

    return (
        <aside className="absolute right-8 top-32 bottom-32 w-80 flex flex-col gap-3 z-40 pointer-events-none hidden lg:flex">
            {/* Header Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg self-start">
                <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse shadow-[0_0_10px_#00FF88]"></div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE ACTIONS</span>
            </div>

            {/* Floating Event Cards */}
            <div className="flex flex-col gap-4 w-full relative">
                {visibleLogs.map((log, index) => {
                    const { Icon, color, bg } = getEventIcon(log.action, log.type);
                    const playerColor = getPlayerColor(log.user);
                    const hypeLevel = getHypeLevel(log.action);
                    const transformedAction = transformAction(log.action);
                    
                    return (
                        <div
                            key={log.id}
                            className="w-full transition-all duration-500 ease-out animate-slide-in-right"
                            style={{
                                opacity: log.isVisible ? 1 : 0,
                                transform: log.isVisible ? 'translateX(0)' : 'translateX(100%)',
                                animationDelay: `${index * 100}ms`
                            }}
                        >
                            {/* Glassmorphic Bubble */}
                            <div className={`
                                relative group
                                bg-gradient-to-br from-white/15 to-white/5 
                                backdrop-blur-xl 
                                rounded-[24px] 
                                border border-white/20 
                                shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                                p-4
                                hover:scale-[1.02] 
                                hover:border-white/40
                                transition-all duration-300
                                ${hypeLevel === 'MEGA' ? 'ring-2 ring-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.4)]' : ''}
                                ${hypeLevel === 'HIGH' ? 'ring-1 ring-white/30' : ''}
                            `}>
                                {/* Hype Glow Effect */}
                                {hypeLevel === 'MEGA' && (
                                    <div className="absolute -inset-1 bg-gradient-to-r from-[#FFD700]/20 via-[#FF6B6B]/20 to-[#FFD700]/20 rounded-[24px] blur-xl animate-pulse -z-10"></div>
                                )}
                                
                                {/* Top Row: Icon + Player Name */}
                                <div className="flex items-center gap-3 mb-2">
                                    {/* Dynamic Icon */}
                                    <div 
                                        className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg`}
                                        style={{ 
                                            backgroundColor: bg,
                                            boxShadow: `0 0 20px ${color}40`
                                        }}
                                    >
                                        <Icon size={18} style={{ color }} strokeWidth={2.5} />
                                    </div>
                                    
                                    {/* Player Name in Their Color */}
                                    <div className="flex-1">
                                        <span 
                                            className="text-xs font-black uppercase tracking-wider drop-shadow-md"
                                            style={{ color: playerColor }}
                                        >
                                            {log.user}
                                        </span>
                                        <div className="text-[8px] text-white/60 font-bold mt-0.5">
                                            {log.timestamp}
                                        </div>
                                    </div>

                                    {/* Hype Indicator */}
                                    {hypeLevel === 'MEGA' && (
                                        <div className="flex items-center gap-1 bg-[#FFD700]/20 px-2 py-1 rounded-full">
                                            <Flame size={10} className="text-[#FFD700]" />
                                            <span className="text-[8px] font-black text-[#FFD700] uppercase">MEGA</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Text */}
                                <p className="text-sm font-black text-white uppercase tracking-tight leading-tight pl-13">
                                    {transformedAction}
                                </p>

                                {/* Subtle Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[24px] pointer-events-none"></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.5s ease-out forwards;
                }
            `}</style>
        </aside>
    );
};
