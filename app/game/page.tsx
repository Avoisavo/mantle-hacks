'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';

import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Loader } from '@react-three/drei';
import { Crown, XCircle, ChevronRight } from 'lucide-react';

// Dynamic imports with SSR disabled
const GameBoard3D = dynamic(() => import('@/components/game/game/GameBoard3D').then(mod => mod.GameBoard3D), { ssr: false });
const SplineEnvironment = dynamic(() => import('@/components/game/game/SplineEnvironment'), { ssr: false });

import { CameraRig } from '@/components/game/game/CameraRig';
import { TournamentRibbon } from '@/components/game/ui/TournamentRibbon';
import { VaultStation } from '@/components/game/ui/VaultStation';
import { UtilityCommand } from '@/components/game/ui/UtilityCommand';
import { HyperPuck } from '@/components/game/ui/HyperPuck';
import { HypeFeed } from '@/components/game/ui/HypeFeed';
import { AvatarIcon } from '@/components/game/ui/AvatarIcon';

import { INITIAL_ASSETS, AVATAR_OPTIONS } from '@/lib/game/constants';
import { Player, Asset, GameLog, GameState } from '@/lib/game/types';

const PLAYER_MODEL = '/game/ChickenGuy.glb';
const COLOR_OPTIONS = ['#26D07C', '#3498DB', '#E74C3C', '#F1C40F', '#8E44AD', '#E67E22', '#1ABC9C', '#1E293B'];

export default function GamePage() {
    const [gameState, setGameState] = useState<GameState>({
        players: [
            { id: '1', name: 'Satoshi (You)', balance: 150000, color: '#26D07C', position: 0, assets: [], avatar: 'Crown', modelUrl: PLAYER_MODEL, isMoving: false },
            { id: '2', name: 'Zuck_Bot', balance: 145000, color: '#A855F7', position: 0, assets: [], isAI: true, avatar: 'Watch', modelUrl: PLAYER_MODEL, isMoving: false },
            { id: '3', name: 'Elon_Bot', balance: 160000, color: '#3B82F6', position: 0, assets: [], isAI: true, avatar: 'Plane', modelUrl: PLAYER_MODEL, isMoving: false },
        ],
        currentPlayerIndex: 0,
        assets: INITIAL_ASSETS,
        logs: [
            { id: 'initial', user: 'System', action: 'Vault initialized.', timestamp: 'Now', type: 'SYSTEM' }
        ],
        prizePot: 240500,
        status: 'PLAYING'
    });

    const [isRolling, setIsRolling] = useState(false);
    const [showAssetOverlay, setShowAssetOverlay] = useState(false);
    const [showCustomizer, setShowCustomizer] = useState(false);
    const [movementQueue, setMovementQueue] = useState<number[]>([]);
    const [isRollHovered, setIsRollHovered] = useState(false);
    const [inspectedAsset, setInspectedAsset] = useState<Asset | null>(null);

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const humanPlayer = gameState.players.find(p => p.id === '1')!;
    const currentAsset = gameState.assets.find(a => a.position === currentPlayer.position);

    // Logic Hooks
    const securedValue = useMemo(() => {
        return humanPlayer.assets.reduce((sum, id) => {
            const asset = gameState.assets.find(a => a.id === id);
            return sum + (asset?.price || 0);
        }, 0);
    }, [humanPlayer.assets, gameState.assets]);

    const addLog = useCallback((user: string, action: string, type: 'TRANSACTION' | 'MOVEMENT' | 'SYSTEM' = 'SYSTEM') => {
        const newLog: GameLog = {
            id: Math.random().toString(36).substr(2, 9),
            user,
            action,
            timestamp: 'Just now',
            type
        };
        setGameState(prev => ({
            ...prev,
            logs: [newLog, ...prev.logs].slice(0, 50)
        }));
    }, []);

    const nextTurn = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
        }));
        setShowAssetOverlay(false);
    }, []);

    // Movement Logic
    useEffect(() => {
        if (gameState.status !== 'PLAYING') return;
        if (movementQueue.length > 0) {
            const timer = setTimeout(() => {
                const nextPos = movementQueue[0];
                setGameState(prev => {
                    const newPlayers = [...prev.players];
                    const p = newPlayers[prev.currentPlayerIndex];
                    p.position = nextPos;
                    p.isMoving = movementQueue.length > 1;
                    return { ...prev, players: newPlayers };
                });
                setMovementQueue(prev => prev.slice(1));
                if (movementQueue.length === 1) setShowAssetOverlay(true);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [movementQueue, gameState.currentPlayerIndex, gameState.status]);

    const rollDice = useCallback(() => {
        if (gameState.status !== 'PLAYING') return;
        if (isRolling || showAssetOverlay || showCustomizer || movementQueue.length > 0) return;
        setIsRolling(true);
        setIsRollHovered(false); // Reset hover state on click
        setInspectedAsset(null); // Clear inspection on roll
        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setIsRolling(false);
            const path: number[] = [];
            let currentPos = currentPlayer.position;
            for (let i = 1; i <= roll; i++) {
                currentPos = (currentPos + 1) % gameState.assets.length;
                path.push(currentPos);
            }
            addLog(currentPlayer.name, `Rolled a ${roll}!`, 'MOVEMENT');
            setMovementQueue(path);
        }, 800);
    }, [currentPlayer, gameState.assets.length, isRolling, showAssetOverlay, addLog, showCustomizer, movementQueue.length, gameState.status]);

    // Asset Logic
    const buyAsset = useCallback(() => {
        if (!currentAsset || currentAsset.ownerId) return;
        if (currentPlayer.balance < currentAsset.price) return;
        setGameState(prev => {
            const newPlayers = [...prev.players];
            const p = newPlayers[prev.currentPlayerIndex];
            const newAssets = [...prev.assets];
            const a = newAssets.find(asset => asset.id === currentAsset.id)!;
            p.balance -= currentAsset.price;
            p.assets.push(currentAsset.id);
            a.ownerId = p.id;
            return { ...prev, players: newPlayers, assets: newAssets };
        });
        addLog(currentPlayer.name, `Sniped ${currentAsset.name}`, 'TRANSACTION');
        nextTurn();
    }, [currentAsset, currentPlayer, addLog, nextTurn]);

    const payRent = useCallback(() => {
        if (!currentAsset || !currentAsset.ownerId || currentAsset.ownerId === currentPlayer.id) {
            nextTurn();
            return;
        }
        const owner = gameState.players.find(p => p.id === currentAsset.ownerId);
        if (!owner) return;
        setGameState(prev => {
            const newPlayers = [...prev.players];
            const p = newPlayers[prev.currentPlayerIndex];
            const o = newPlayers.find(pl => pl.id === owner.id)!;
            p.balance -= Math.min(p.balance, currentAsset.rent);
            o.balance += currentAsset.rent;
            return { ...prev, players: newPlayers };
        });
        addLog(currentPlayer.name, `Paid $${currentAsset.rent} yield to ${owner.name}`, 'TRANSACTION');
        nextTurn();
    }, [currentAsset, currentPlayer, gameState.players, addLog, nextTurn]);

    // AI & Game Loop
    useEffect(() => {
        if (gameState.status !== 'PLAYING') return;
        const isHumanTurn = gameState.currentPlayerIndex === 0;
        const isBusy = isRolling || showAssetOverlay || showCustomizer || movementQueue.length > 0;
        if (!isHumanTurn && !isBusy) {
            const timer = setTimeout(() => rollDice(), 1500);
            return () => clearTimeout(timer);
        }
    }, [gameState.currentPlayerIndex, isRolling, showAssetOverlay, rollDice, showCustomizer, movementQueue.length, gameState.status]);

    useEffect(() => {
        if (gameState.status !== 'PLAYING') return;
        const p = gameState.players[gameState.currentPlayerIndex];
        if (p.isAI && showAssetOverlay) {
            const timer = setTimeout(() => {
                if (!currentAsset?.ownerId && p.balance > currentAsset!.price * 1.2) buyAsset();
                else payRent();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState.currentPlayerIndex, gameState.players, showAssetOverlay, currentAsset, buyAsset, payRent, gameState.status]);

    const updateHumanProfile = (avatar: string, color: string) => {
        setGameState(prev => {
            const newPlayers = [...prev.players];
            const p = newPlayers.find(pl => pl.id === '1')!;
            p.avatar = avatar;
            p.color = color;
            return { ...prev, players: newPlayers };
        });
    };

    // --- OVERLAY LOGIC ---
    const activeOverlayAsset = inspectedAsset || (showAssetOverlay ? currentAsset : null);
    const isActionable = showAssetOverlay && activeOverlayAsset?.id === currentAsset?.id && gameState.currentPlayerIndex === 0;

    return (
        <div className="h-screen w-full bg-[#87CEEB] overflow-hidden font-['Lexend',sans-serif] relative select-none text-slate-100">

            {/* 2. 3D RENDER LAYER */}
            <div id="three-canvas-container" className="absolute inset-0 z-0">
                <Canvas
                    shadows
                    gl={{ antialias: true, toneMappingExposure: 1.2 }}
                    camera={{ position: [-1335, 883, 1932], fov: 35, near: 10, far: 20000 }}
                >
                    <Suspense fallback={null}>
                        <SplineEnvironment
                            fallbackPosition={[465.26, -317.75, 132.91]}
                            fallbackScale={[90, 90, 90]}
                        >
                            {/* Final Board Placement */}
                            <GameBoard3D
                                players={gameState.players}
                                assets={gameState.assets}
                                currentPlayerIndex={gameState.currentPlayerIndex}
                                status={gameState.status}
                                isRollHovered={isRollHovered}
                                onAssetSelect={setInspectedAsset}
                                embedded={true}
                            />

                        </SplineEnvironment>
                        <CameraRig isRolling={isRolling} />
                    </Suspense>
                </Canvas>
                <Loader />
            </div>

            {/* 3. NEW SOVEREIGN UI LAYER */}

            <TournamentRibbon
                players={gameState.players}
                currentPlayerIndex={gameState.currentPlayerIndex}
                prizePot={gameState.prizePot}
            />

            <VaultStation value={securedValue} />

            <UtilityCommand />

            <HypeFeed logs={gameState.logs} />

            <HyperPuck
                onClick={rollDice}
                onHoverChange={setIsRollHovered} // Capture hover
                disabled={gameState.currentPlayerIndex !== 0 || isRolling || showAssetOverlay || showCustomizer || movementQueue.length > 0}
                isTurn={gameState.currentPlayerIndex === 0}
            />

            {/* --- OVERLAYS --- */}

            {/* ASSET ACQUISITION (Glassmorphism + Gold) */}
            {
                activeOverlayAsset && (
                    <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300 pointer-events-auto">
                        <div className="bg-[#1E293B] max-w-sm md:max-w-md w-full rounded-[48px] sticker-shadow overflow-hidden animate-pop-in relative border-[8px] border-white">
                            <div className="h-72 relative group">
                                <img src={activeOverlayAsset.image} alt={activeOverlayAsset.name} className="object-cover h-full w-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] to-transparent" />
                                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-xs shadow-lg uppercase tracking-widest text-white border-2 border-white/20">
                                    {activeOverlayAsset.type}
                                </div>
                                {/* Close Button if Manual Inspection */}
                                {!isActionable && (
                                    <button onClick={() => setInspectedAsset(null)} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors">
                                        <XCircle size={32} />
                                    </button>
                                )}

                                <div className="absolute bottom-6 left-6 text-white">
                                    <h2 className="text-3xl md:text-4xl font-black uppercase leading-none mb-1 drop-shadow-md">{activeOverlayAsset.name}</h2>
                                    <p className="text-sm font-medium opacity-70">{activeOverlayAsset.description}</p>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 bg-[#1E293B] relative">
                                <div className="flex justify-between items-end mb-8 bg-[#0F172A] p-4 rounded-[32px] border-[4px] border-slate-700">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Acquisition Cost</p>
                                        <p className="text-3xl font-black text-white">${activeOverlayAsset.price.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Expected Yield</p>
                                        <p className="text-2xl font-black text-[#00FF88]">+${activeOverlayAsset.rent.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {isActionable ? (
                                        activeOverlayAsset.ownerId ? (
                                            <button onClick={payRent} className="col-span-2 bg-orange-500 text-white py-4 rounded-[32px] font-black uppercase shadow-[0_6px_0_#c2410c] active:shadow-none active:translate-y-[6px] transition-all border-[4px] border-[#1E293B] text-lg hover:brightness-110">
                                                Pay Rent
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={buyAsset} disabled={currentPlayer.balance < activeOverlayAsset.price} className="bg-[#00FF88] text-[#1E293B] py-4 rounded-[32px] font-black uppercase shadow-[0_6px_0_#15803D] active:shadow-none active:translate-y-[6px] transition-all border-[4px] border-[#1E293B] text-lg disabled:opacity-50 disabled:grayscale hover:bg-[#22c55e]">
                                                    Acquire
                                                </button>
                                                <button onClick={nextTurn} className="bg-slate-700 text-slate-300 py-4 rounded-[32px] font-black uppercase shadow-[0_6px_0_#334155] active:shadow-none active:translate-y-[6px] transition-all border-[4px] border-[#1E293B] text-lg hover:bg-slate-600">
                                                    Pass
                                                </button>
                                            </>
                                        )
                                    ) : (
                                        <button onClick={() => setInspectedAsset(null)} className="col-span-2 bg-slate-700 text-slate-300 py-4 rounded-[32px] font-black uppercase shadow-[0_6px_0_#334155] active:shadow-none active:translate-y-[6px] transition-all border-[4px] border-[#1E293B] text-lg hover:bg-slate-600">
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CUSTOMIZER */}
            {
                showCustomizer && (
                    <div className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-xl flex items-center justify-center z-[250] p-6 animate-in fade-in duration-300 pointer-events-auto">
                        <div className="bg-[#1E293B] max-w-lg w-full rounded-[48px] p-8 animate-pop-in relative border-[8px] border-[#FFD700] shadow-[0_0_100px_rgba(255,215,0,0.2)] sticker-shadow">
                            <button onClick={() => setShowCustomizer(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                                <XCircle size={32} />
                            </button>
                            <div className="text-center mb-8">
                                <div className="inline-block p-3 rounded-2xl bg-[#FFD700]/10 mb-4 border border-[#FFD700]/30">
                                    <Crown className="text-[#FFD700]" size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Sovereign Identity</h2>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-[#0F172A] p-6 rounded-[32px] border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block text-center">Select Sigil</span>
                                    <div className="grid grid-cols-4 gap-3">
                                        {AVATAR_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => updateHumanProfile(opt.icon, humanPlayer.color)}
                                                className={`aspect-square rounded-[20px] border-4 transition-all flex items-center justify-center ${humanPlayer.avatar === opt.icon ? 'border-[#00FF88] bg-[#00FF88] text-[#1E293B] shadow-xl scale-110' : 'border-[#334155] bg-[#1E293B] text-slate-500 hover:border-slate-500 hover:text-white'}`}
                                            >
                                                <AvatarIcon name={opt.icon} size={28} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-[#0F172A] p-6 rounded-[32px] border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block text-center">Mint Color</span>
                                    <div className="grid grid-cols-4 gap-3">
                                        {COLOR_OPTIONS.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => updateHumanProfile(humanPlayer.avatar, c)}
                                                className={`h-16 rounded-[20px] border-4 transition-all shadow-sm ${humanPlayer.color === c ? 'border-white scale-110 ring-4 ring-white/20' : 'border-[#334155] hover:border-slate-500'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowCustomizer(false)} className="w-full bg-[#F8FAFC] text-[#1E293B] py-5 rounded-[32px] font-black uppercase shadow-[0_8px_0_#94A3B8] active:shadow-none active:translate-y-[8px] transition-all mt-8 text-xl group hover:bg-white">
                                Confirm Identity <ChevronRight className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
