import React from 'react';
import { GameLog } from '@/lib/game/types';

export const HypeFeed = ({ logs }: { logs: GameLog[] }) => {
    return (
        <aside className="absolute right-8 top-32 bottom-32 w-72 flex flex-col gap-6 z-40 pointer-events-none hidden lg:flex">
            {/* Feed Container */}
            <div className="flex-1 overflow-hidden relative pointer-events-auto bg-white/5 backdrop-blur-xl rounded-[32px] border-[3px] border-white/20 sticker-shadow p-1">

                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#1E293B]/60 rounded-t-[28px]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse shadow-[0_0_10px_#00FF88]"></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">Live Feed</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 h-full overflow-y-auto p-3 pb-20 mask-linear-fade custom-scrollbar">
                    {logs.map((log) => {
                        let borderColor = 'border-white/10';
                        let bgColor = 'bg-[#1E293B]/60';
                        if (log.type === 'TRANSACTION') { borderColor = 'border-[#FFD700]/50'; bgColor = 'bg-[#1E293B]/90'; }
                        if (log.type === 'MOVEMENT') { borderColor = 'border-[#00FF88]/50'; bgColor = 'bg-[#1E293B]/80'; }

                        return (
                            <div key={log.id} className={`${bgColor} backdrop-blur-md p-3 rounded-[20px] border-l-[3px] border-t border-r border-b ${borderColor} shadow-sm transition-transform origin-left`}>
                                <div className="flex justify-between items-start mb-0.5">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded">{log.user}</span>
                                    <span className="text-[8px] text-slate-400 font-bold">{log.timestamp}</span>
                                </div>
                                <p className={`text-[11px] font-bold leading-tight text-white uppercase tracking-tight mt-1 opacity-90`}>
                                    {log.action}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </aside>
    );
};
