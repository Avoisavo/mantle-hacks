
export enum AssetType {
  GOLD = 'GOLD',
  WATCH = 'WATCH',
  REAL_ESTATE = 'REAL_ESTATE',
  FINE_ART = 'FINE_ART',
  EQUITY = 'EQUITY'
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  price: number;
  rent: number;
  image: string;
  glb?: string; // Optional path to GLB 3D model
  description: string;
  ownerId: string | null;
  position: number;
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  color: string;
  position: number;
  assets: string[]; // IDs of owned assets
  isAI?: boolean;
  avatar: string; // Key for the Lucide icon
  modelUrl: string; // URL to the GLB character
  isMoving?: boolean;
  targetRotation?: number; // Y rotation to face movement
}

export interface GameLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type?: 'TRANSACTION' | 'MOVEMENT' | 'SYSTEM';
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  assets: Asset[];
  logs: GameLog[];
  prizePot: number;
  status: 'LOBBY' | 'PLAYING' | 'LIQUIDATED';
}
