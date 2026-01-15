import WebSocket, { WebSocketServer } from 'ws';

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

interface Player {
    id: string;
    name: string;
    ws: WebSocket;
}

interface GameRoom {
    id: string;
    players: Map<string, Player>;
    gameState: any;
}

// Store all connected players and game rooms
const players = new Map<string, Player>();
const rooms = new Map<string, GameRoom>();

// Default room for everyone (open multiplayer)
const DEFAULT_ROOM = 'cointown-main';

// Initialize default room
rooms.set(DEFAULT_ROOM, {
    id: DEFAULT_ROOM,
    players: new Map(),
    gameState: {
        players: [],
        currentPlayerIndex: 0,
        diceValue: null,
        status: 'waiting'
    }
});

const wss = new WebSocketServer({ port: PORT });

console.log(`🎮 Cointown Game Server running on ws://localhost:${PORT}`);

// Generate unique player ID
function generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substring(2, 9);
}

// Broadcast message to all players in a room except sender
function broadcastToRoom(roomId: string, message: any, excludePlayerId?: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    room.players.forEach((player, id) => {
        if (id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(messageStr);
        }
    });
}

// Broadcast to all players in room including sender
function broadcastToRoomAll(roomId: string, message: any) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    room.players.forEach((player) => {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(messageStr);
        }
    });
}

wss.on('connection', (ws: WebSocket) => {
    const playerId = generatePlayerId();
    console.log(`✅ Player connected: ${playerId}`);

    // Add player to default room
    const player: Player = {
        id: playerId,
        name: `Player ${players.size + 1}`,
        ws
    };

    players.set(playerId, player);
    const room = rooms.get(DEFAULT_ROOM)!;
    room.players.set(playerId, player);

    // Send welcome message with player ID
    ws.send(JSON.stringify({
        type: 'connected',
        playerId,
        roomId: DEFAULT_ROOM,
        playerCount: room.players.size,
        gameState: room.gameState
    }));

    // Notify others about new player
    broadcastToRoom(DEFAULT_ROOM, {
        type: 'player_joined',
        playerId,
        playerCount: room.players.size
    }, playerId);

    ws.on('message', (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());
            console.log(`📨 Message from ${playerId}:`, message.type);

            switch (message.type) {
                case 'set_name':
                    // Update player name
                    player.name = message.name;
                    broadcastToRoomAll(DEFAULT_ROOM, {
                        type: 'player_updated',
                        playerId,
                        name: message.name
                    });
                    break;

                case 'roll_dice':
                    // Player rolled dice - broadcast to everyone
                    broadcastToRoomAll(DEFAULT_ROOM, {
                        type: 'dice_rolled',
                        playerId,
                        value: message.value,
                        power: message.power
                    });
                    break;

                case 'player_move':
                    // Player moved - broadcast position update
                    broadcastToRoomAll(DEFAULT_ROOM, {
                        type: 'player_moved',
                        playerId,
                        position: message.position,
                        targetPosition: message.targetPosition
                    });
                    break;

                case 'game_action':
                    // Generic game action (buy asset, pay rent, etc.)
                    broadcastToRoomAll(DEFAULT_ROOM, {
                        type: 'game_action',
                        playerId,
                        action: message.action,
                        data: message.data
                    });
                    break;

                case 'sync_state':
                    // Full game state sync from host
                    room.gameState = message.gameState;
                    broadcastToRoom(DEFAULT_ROOM, {
                        type: 'state_synced',
                        gameState: message.gameState
                    }, playerId);
                    break;

                case 'chat':
                    // Chat message
                    broadcastToRoomAll(DEFAULT_ROOM, {
                        type: 'chat',
                        playerId,
                        playerName: player.name,
                        message: message.message,
                        timestamp: Date.now()
                    });
                    break;

                case 'ping':
                    // Heartbeat
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;

                default:
                    // Forward any other message type to all players
                    broadcastToRoomAll(DEFAULT_ROOM, {
                        ...message,
                        fromPlayerId: playerId
                    });
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`❌ Player disconnected: ${playerId}`);

        // Remove from room and players list
        room.players.delete(playerId);
        players.delete(playerId);

        // Notify others
        broadcastToRoom(DEFAULT_ROOM, {
            type: 'player_left',
            playerId,
            playerCount: room.players.size
        });
    });

    ws.on('error', (error: Error) => {
        console.error(`WebSocket error for ${playerId}:`, error);
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down game server...');
    wss.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
