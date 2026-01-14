import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, PerspectiveCamera, Float, RoundedBox, Sparkles, Cylinder, Sphere, Text, Text3D, Torus, Cone, Icosahedron, Box, Grid, Html, useGLTF, Center, Clone } from '@react-three/drei';
import * as THREE from 'three';
import { Player, Asset, AssetType } from '@/lib/game/types';
import { SkeletonUtils } from 'three-stdlib';

interface GameBoard3DProps {
  players: Player[];
  assets: Asset[];
  currentPlayerIndex: number;
  status: string;
  isRollHovered?: boolean;
  onAssetSelect?: (asset: Asset) => void;
  embedded?: boolean;
}

const SmoothPlayerToken: React.FC<{
  playerIndex: number;
  color: string;
  modelUrl?: string;
  targetPosition: [number, number, number];
  currentPosition: number;
}> = ({ playerIndex, color, modelUrl = '/models/ChickenGuy.glb', targetPosition, currentPosition }) => {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const previousPosition = useRef(currentPosition);

  // Spiral-like offset for multi-player tiles to prevent overlap
  const offset = useMemo(() => {
    const angle = (playerIndex / 4) * Math.PI * 2;
    const dist = 0.4;
    return new THREE.Vector3(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
  }, [playerIndex]);

  // Calculate actual target in 3D space
  const targetVec = useMemo(() => {
    const vec = new THREE.Vector3(...targetPosition).add(offset);
    return vec;
  }, [targetPosition, offset]);

  // Check if we hit a turning point (0, 9, 18, 27)
  useEffect(() => {
    const turningPoints = [0, 9, 18, 27];
    if (turningPoints.includes(currentPosition) && previousPosition.current !== currentPosition) {
      setTargetRotation(prev => prev - Math.PI / 2); // Subtract 90 degrees
    }
    previousPosition.current = currentPosition;
  }, [currentPosition]);

  // Handle smooth movement frame-by-frame
  useFrame((_state, delta) => {
    if (groupRef.current) {
      // Lerp current position to target with a fixed speed for consistency
      const lerpFactor = Math.min(15 * delta, 1.0);
      groupRef.current.position.lerp(targetVec, lerpFactor);
    }

    // Smoothly rotate the model on z-axis
    if (modelRef.current) {
      const currentRot = modelRef.current.rotation.z;
      const lerpFactor = Math.min(10 * delta, 1.0);
      modelRef.current.rotation.z = THREE.MathUtils.lerp(currentRot, targetRotation, lerpFactor);
    }
  });

  // Teleport on first mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(targetVec);
    }
  }, [targetVec]);

  // Load the GLB model
  const gltf = useGLTF(modelUrl);

  // Clone the scene uniquely for this player instance using deep clone
  const modelScene = useMemo(() => {
    // Use SkeletonUtils for deep cloning (includes materials, bones, etc.)
    const cloned = SkeletonUtils.clone(gltf.scene);

    // Force all children to be visible
    cloned.traverse((child) => {
      if (child instanceof THREE.Object3D) {
        child.visible = true;
      }
      if (child instanceof THREE.Mesh) {
        // Ensure materials render and clone them
        if (child.material) {
          child.material = child.material.clone();
          child.material.needsUpdate = true;
        }
      }
    });

    return cloned;
  }, [gltf.scene, playerIndex]);

  return (
    <group ref={groupRef} position={targetVec}>
        <pointLight position={[0, 0, 2]} intensity={10} distance={5} color={color} />

        {/* Base identity ring - glowing under the character */}
        <mesh position={[0, 0, 0.05]}>
            <torusGeometry args={[0.4, 0.04, 16, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={2}
              transparent
              opacity={0.8}
            />
        </mesh>

        {/* The Model Container - matching landing page settings */}
        <group ref={modelRef}>
          <primitive
              object={modelScene}
              position={[0, 0, 0]}
              rotation={[0, Math.PI / 2, Math.PI / 2]}
              scale={0.8}
          />
        </group>
    </group>
  );
};










// The Hologram Core Component
const HologramCore = ({ activeAsset, isHovering }: { activeAsset?: Asset | null, isHovering?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z += 0.01; // Spin locally
      // Bobbing
      ref.current.position.z = 2 + Math.sin(state.clock.getElapsedTime() * 2) * 0.2;
    }
  });

  return (
    <group position={[0, 0, 2]} ref={ref}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        {activeAsset ? (
          // IF ASSET: Show Representation (using simple shapes for now)
          <group>
            <Icosahedron args={[1, 0]} material-wireframe material-color="#FFD700" />
            <Icosahedron args={[0.9, 0]} material-color="#FFD700" material-transparent material-opacity={0.4} />
          </group>
        ) : (
          // IDLE: Show "V" Logo (Using 3D Text or Shape)
          <Torus args={[1, 0.3, 16, 100]} material-color="#00FF88" material-wireframe />
        )}
      </Float>

      <Sparkles count={20} scale={3} size={2} speed={0.4} opacity={0.5} color="#00FF88" />
    </group>
  );
};

export const GameBoard3D: React.FC<GameBoard3DProps> = ({ players, assets, currentPlayerIndex, onAssetSelect }) => {
  // Simple 6x6 Grid Layout
  const gridSize = 6;
  const tileSize = 2.2; // Spacing
  const offset = (gridSize * tileSize) / 2 - tileSize / 2;

  const getBoardPosition = (i: number) => {
    const sideLength = 9;
    const spacing = 1.3;
    const L = (sideLength * spacing) / 2;
    const posIndex = i % 36;

    let x = 0;
    let y = 0;

    // CLOCKWISE LOGIC (Left -> Top -> Right -> Bottom)
    // Starting from Front-Left Corner (-L, -L)
    if (posIndex < 9) {
      // Left Side (Front to Back)
      x = -L;
      y = -L + (posIndex * spacing);
    } else if (posIndex < 18) {
      // Top Side (Left to Right)
      x = -L + ((posIndex - 9) * spacing);
      y = L;
    } else if (posIndex < 27) {
      // Right Side (Back to Front)
      x = L;
      y = L - ((posIndex - 18) * spacing);
    } else {
      // Bottom Side (Right to Left)
      x = L - ((posIndex - 27) * spacing);
      y = -L;
    }
    return [x, y, 0] as [number, number, number];
  };

  const currentPlayer = players[currentPlayerIndex];
  const currentAsset = assets.find(a => a.position === currentPlayer.position);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>




      {/* --- BOARD TILES --- */}
      {assets.slice(0, 36).map((asset, i) => {
        // Shift Logic Index 'i' by 9 to start at Left Corner (Top-Left of Grid)
        // Visual Order: Left Corner -> Top -> Right -> Bottom -> Left
        const [x, y] = getBoardPosition((i + 9) % 36);
        const isOccupied = players.some(p => p.position === i);
        const color = asset.ownerId ? '#A855F7' : (isOccupied ? '#F59E0B' : '#FFFFFF');
        // Display index: tile 1 should be at current position 10, so we shift by 10
        const displayIndex = (i) % 36;

        return (
          <group key={asset.id} position={[x, y, 0]}>
            <mesh
              onClick={(e) => { e.stopPropagation(); onAssetSelect && onAssetSelect(asset); }}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              <boxGeometry args={[1.2, 1.2, 0.2]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Number label - skip the first tile (index 0) */}
            {displayIndex !== 0 && (
              <Html
                position={[0, 0, 0.3]}
                center
                distanceFactor={4}
                style={{
                  color: '#000000',
                  fontSize: '6px',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              >
                {displayIndex}
              </Html>
            )}
          </group>
        );
      })}

      {/* Players */}
      <Suspense fallback={null}>
        {players.map((p, i) => {
          // Apply same visual offset to players
          const [x, y] = getBoardPosition((p.position + 9) % 36);
          return (
              <SmoothPlayerToken
                  key={p.id}
                  playerIndex={i}
                  color={p.color}
                  modelUrl={p.modelUrl}
                  targetPosition={[x, y, 0.1]}
                  currentPosition={p.position}
              />
          )
        })}
      </Suspense>
    </group>
  );
};

useGLTF.preload('/models/ChickenGuy.glb');