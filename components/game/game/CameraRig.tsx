import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// "Cinematic Isometric" Rig with Lazy Tracking
export const CameraRig = ({ isRolling }: { isRolling: boolean }) => {
    const group = useRef<THREE.Group>(null);

    // Base "Hero Angle" (Isometric-ish)
    // We assume the camera parent is at [0,0,0]. 
    // The actual Camera object is positioned via the Canvas prop, looking at 0,0,0.
    // We will rotate the *Layout* (or the Camera Group) slightly based on mouse.

    // Actually, effective rig: Move camera based on mouse.
    useFrame((state, delta) => {
        // Soft "Lazy Tracking" targets
        const targetX = state.pointer.x * 200; // Sway range X
        const targetY = state.pointer.y * 200; // Sway range Y

        // Board Center (World Coords from SplineEnvironment)
        const center = new THREE.Vector3(465, -317, 132);

        // Offset vector for our "Front-Left High Angle"
        // We want to be roughly [-1200, 900, 1200] relative to 0,0,0, adjusted for the new center.
        // Let's use a clean diagonal offset.
        const offset = new THREE.Vector3(-1800, 1200, 1800);
        
        const basePos = center.clone().add(offset);

        // If rolling, zoom in slightly
        const zoomOffset = isRolling ? -400 : 0; 

        state.camera.position.lerp(
            new THREE.Vector3(
                basePos.x + targetX * 0.5 + (isRolling ? 300 : 0),
                basePos.y + targetY * 0.5 - (isRolling ? 200 : 0),
                basePos.z + zoomOffset
            ),
            1.5 * delta
        );

        state.camera.lookAt(center); // Look at the Board Center
    });

    return null; // This component just controls the camera
};
