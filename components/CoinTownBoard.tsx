import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Center } from '@react-three/drei';
import * as THREE from 'three';

interface TileProps {
  position: [number, number, number];
  number: number;
}

const NeonTile: React.FC<TileProps> = ({ position, number }) => {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.5 + number * 0.2) * 0.3 + 0.7;
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 0.8;
    }
  });

  const colors = {
    primary: new THREE.Color('#ff00ff'), // Neon pink
    secondary: new THREE.Color('#8b00ff'), // Purple
  };

  const color = number % 2 === 0 ? colors.primary : colors.secondary;

  return (
    <group ref={meshRef} position={position}>
      {/* Outer glowing rim */}
      <mesh>
        <boxGeometry args={[1.8, 0.4, 1.8]} />
        <meshStandardMaterial
          color="#0a0015"
          emissive={color}
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Inner hollow part */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.4, 0.3, 1.4]} />
        <meshStandardMaterial
          color="#05000a"
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Glowing bottom layer for neon effect */}
      <mesh ref={glowRef} position={[0, 0.21, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid pattern on top */}
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Number display */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor={color}
      >
        {number}
      </Text>
    </group>
  );
};

const Connector: React.FC<{ start: [number, number, number], end: [number, number, number], color: THREE.Color }> = ({ start, end, color }) => {
  return (
    <mesh position={[
      (start[0] + end[0]) / 2,
      0.2,
      (start[2] + end[2]) / 2
    ]}>
      <boxGeometry args={[
        Math.abs(end[0] - start[0]) + 1.8 || 0.15,
        0.05,
        Math.abs(end[2] - start[2]) + 1.8 || 0.15
      ]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.6}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
};

const BoardPath: React.FC = () => {
  const tiles = useMemo(() => {
    const tileSize = 2;
    const gap = 0.3;
    const sideLength = 10; // 10 tiles per side

    const positions: Array<{ position: [number, number, number], number: number }> = [];

    // Calculate the starting position to center the board
    const boardSize = sideLength * (tileSize + gap);
    const offset = boardSize / 2 - tileSize / 2;

    // Bottom side (left to right) - tiles 1-10
    for (let i = 0; i < sideLength; i++) {
      positions.push({
        position: [-offset + i * (tileSize + gap), 0, offset],
        number: i + 1
      });
    }

    // Right side (bottom to top) - tiles 11-20
    for (let i = 0; i < sideLength; i++) {
      positions.push({
        position: [offset, 0, offset - (i + 1) * (tileSize + gap)],
        number: sideLength + i + 1
      });
    }

    // Top side (right to left) - tiles 21-30
    for (let i = 0; i < sideLength; i++) {
      positions.push({
        position: [offset - (i + 1) * (tileSize + gap), 0, -offset],
        number: 2 * sideLength + i + 1
      });
    }

    // Left side (top to bottom) - tiles 31-40
    for (let i = 0; i < sideLength; i++) {
      positions.push({
        position: [-offset, 0, -offset + (i + 1) * (tileSize + gap)],
        number: 3 * sideLength + i + 1
      });
    }

    return positions;
  }, []);

  const connectors = useMemo(() => {
    const conn = [];
    const colors = [new THREE.Color('#ff00ff'), new THREE.Color('#8b00ff')];

    for (let i = 0; i < tiles.length; i++) {
      const nextIndex = (i + 1) % tiles.length;
      const color = colors[i % 2];
      conn.push({
        start: tiles[i].position,
        end: tiles[nextIndex].position,
        color
      });
    }
    return conn;
  }, [tiles]);

  return (
    <>
      {/* Connector lines between tiles */}
      {connectors.map((conn, index) => (
        <Connector
          key={`connector-${index}`}
          start={conn.start}
          end={conn.end}
          color={conn.color}
        />
      ))}

      {/* Tiles */}
      {tiles.map((tile) => (
        <NeonTile
          key={tile.number}
          position={tile.position}
          number={tile.number}
        />
      ))}
    </>
  );
};

const CoinTownBoard: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #0a0015 0%, #1a0033 50%, #0a0015 100%)' }}>
      <Canvas
        camera={{ position: [0, 20, 25], fov: 50 }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 20, 10]} intensity={1.5} color="#ff00ff" />
        <pointLight position={[-10, 20, -10]} intensity={1.5} color="#8b00ff" />
        <spotLight
          position={[0, 30, 0]}
          angle={0.3}
          penumbra={0.5}
          intensity={1}
          castShadow
        />

        {/* Grid floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial
            color="#0a0015"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Grid helper */}
        <gridHelper
          args={[50, 50, '#ff00ff', '#8b00ff']}
          position={[0, -0.4, 0]}
          material-transparent
          material-opacity={0.3}
        />

        {/* Board path */}
        <BoardPath />

        {/* Title */}
        <Text
          position={[0, 2, 0]}
          fontSize={3}
          color="#ff00ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#8b00ff"
        >
          COINTOWN
        </Text>

        {/* Orbit controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={15}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.5}
        />
      </Canvas>

      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: '#ff00ff',
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 0 10px #ff00ff, 0 0 20px #8b00ff'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>COINTOWN</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>Futuristic 3D Monopoly</p>
      </div>
    </div>
  );
};

export default CoinTownBoard;
