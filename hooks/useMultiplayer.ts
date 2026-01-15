import { useEffect, useRef, useState, useCallback } from 'react';

interface MultiplayerState {
    connected: boolean;
    playerId: string | null;
    playerCount: number;
    players: { id: string; name: string }[];
}

interface GameMessage {
    type: string;
    playerId?: string;
    [key: string]: any;
}

type MessageHandler = (message: GameMessage) => void;

export function useMultiplayer(serverUrl?: string) {
    const [state, setState] = useState<MultiplayerState>({
        connected: false,
        playerId: null,
        playerCount: 0,
        players: []
    });

    const wsRef = useRef<WebSocket | null>(null);
    const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Default to localhost:3001
    const wsUrl = serverUrl || 'ws://localhost:3001';

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('🎮 Connected to game server');
                setState(prev => ({ ...prev, connected: true }));
            };

            ws.onmessage = (event) => {
                try {
                    const message: GameMessage = JSON.parse(event.data);

                    // Handle built-in message types
                    switch (message.type) {
                        case 'connected':
                            setState(prev => ({
                                ...prev,
                                playerId: message.playerId ?? null,
                                playerCount: message.playerCount
                            }));
                            break;
                        case 'player_joined':
                        case 'player_left':
                            setState(prev => ({
                                ...prev,
                                playerCount: message.playerCount
                            }));
                            break;
                    }

                    // Call registered handlers for this message type
                    const handlers = handlersRef.current.get(message.type) || [];
                    handlers.forEach(handler => handler(message));

                    // Also call 'all' handlers
                    const allHandlers = handlersRef.current.get('*') || [];
                    allHandlers.forEach(handler => handler(message));

                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            ws.onclose = () => {
                console.log('🔌 Disconnected from game server');
                setState(prev => ({ ...prev, connected: false }));

                // Attempt reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    connect();
                }, 3000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to connect:', error);
        }
    }, [wsUrl]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        wsRef.current?.close();
    }, []);

    // Send a message to the server
    const send = useCallback((type: string, data: Record<string, any> = {}) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, ...data }));
        } else {
            console.warn('WebSocket not connected, message not sent:', type);
        }
    }, []);

    // Register a handler for a specific message type
    const on = useCallback((type: string, handler: MessageHandler) => {
        if (!handlersRef.current.has(type)) {
            handlersRef.current.set(type, []);
        }
        handlersRef.current.get(type)!.push(handler);

        // Return cleanup function
        return () => {
            const handlers = handlersRef.current.get(type);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) handlers.splice(index, 1);
            }
        };
    }, []);

    // Convenience methods for common actions
    const rollDice = useCallback((value: number, power?: number) => {
        send('roll_dice', { value, power });
    }, [send]);

    const movePlayer = useCallback((position: number, targetPosition?: { x: number; y: number; z: number }) => {
        send('player_move', { position, targetPosition });
    }, [send]);

    const gameAction = useCallback((action: string, data: any) => {
        send('game_action', { action, data });
    }, [send]);

    const setName = useCallback((name: string) => {
        send('set_name', { name });
    }, [send]);

    const chat = useCallback((message: string) => {
        send('chat', { message });
    }, [send]);

    const syncState = useCallback((gameState: any) => {
        send('sync_state', { gameState });
    }, [send]);

    // Auto-connect on mount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        ...state,
        send,
        on,
        rollDice,
        movePlayer,
        gameAction,
        setName,
        chat,
        syncState,
        connect,
        disconnect
    };
}
