import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Player } from '@/lib/game/types';

// "Cinematic Isometric" Rig with Lazy Tracking
export const CameraRig = ({
    isRolling,
    cameraMode = 'default',
    currentPlayer
}: {
    isRolling: boolean;
    cameraMode?: 'default' | 'side';
    currentPlayer: Player;
}) => {
    const group = useRef<THREE.Group>(null);
    const playerRef = useRef<THREE.Group>(null);

    // Smooth look-at target to prevent camera shake
    const smoothLookAt = useRef(new THREE.Vector3(0, 0, 0));
    const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

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

        if (cameraMode === 'side') {
            // Side camera mode - positioned at left side of character
            // Get current player position from board
            const sideLength = 9;
            const spacing = 1.3;
            const L = (sideLength * spacing) / 2;
            const posIndex = currentPlayer.position % 36;

            let playerX = 0;
            let playerY = 0;

            // Calculate player's board position
            if (posIndex < 9) {
                playerX = -L;
                playerY = -L + (posIndex * spacing);
            } else if (posIndex < 18) {
                playerX = -L + ((posIndex - 9) * spacing);
                playerY = L;
            } else if (posIndex < 27) {
                playerX = L;
                playerY = L - ((posIndex - 18) * spacing);
            } else {
                playerX = L - ((posIndex - 27) * spacing);
                playerY = -L;
            }

            // Create player position vector (accounting for board rotation and position)
            const playerPos = new THREE.Vector3(playerX, playerY, 0);

            // Side camera position - always at left side of character
            // Position camera to the left (-X direction relative to player)
            const sideOffset = new THREE.Vector3(-8, 4, 6); // Left side, slightly elevated, behind

            const sideCamPos = playerPos.clone().add(sideOffset);

            // Smooth camera movement - follow the actual movement
            state.camera.position.lerp(sideCamPos, 3 * delta);

            // Smooth look-at interpolation to prevent vertical shake
            // Use a consistent lerp factor that matches the camera movement
            smoothLookAt.current.lerp(playerPos, 4 * delta);
            state.camera.lookAt(smoothLookAt.current);
        } else {
            // Default camera mode
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
        }
    });

    return null; // This component just controls the camera
};
