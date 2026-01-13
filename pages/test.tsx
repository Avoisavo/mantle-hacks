import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFBX, useAnimations, OrbitControls, Environment } from '@react-three/drei';

function Model() {
  // The path corresponds to public/game/Rallying.fbx
  const fbx = useFBX('/models/white-stand.fbx');
  const { actions, names } = useAnimations(fbx.animations, fbx);

  useEffect(() => {
    console.log('Loaded FBX animations:', names);
    if (names.length > 0) {
      const action = actions[names[0]];
      action?.reset().fadeIn(0.5).play();
    }
  }, [actions, names]);

  return <primitive object={fbx} scale={1} />;
}

export default function TestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <Model />
        <OrbitControls />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
