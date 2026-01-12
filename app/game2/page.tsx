'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default function Game2Page() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    // Function to roll dice and move character
    const rollDice = () => {
        if (isMoving) return;

        const roll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(roll);
        setIsMoving(true);

        // Trigger character move
        const event = new CustomEvent('moveCharacter', { detail: { steps: roll } });
        window.dispatchEvent(event);
    };

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(-7, 11.5, -7);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Orbit Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 10.6, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-5, 5, -5);
        scene.add(pointLight);

        // GLTF Loader
        const loader = new GLTFLoader();
        let loadedCount = 0;
        const totalModels = 2;

        function checkLoaded() {
            loadedCount++;
            if (loadedCount >= totalModels) {
                const loadingEl = document.getElementById('loading');
                if (loadingEl) loadingEl.style.display = 'none';
            }
        }

        // Load and place table
        loader.load(
            '/game2/table.glb',
            (gltf) => {
                const table = gltf.scene;
                table.position.set(0, -5, 0);
                table.scale.set(11, 11, 11);
                table.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(table);
                console.log('Table loaded successfully');
                checkLoaded();
            },
            (progress) => {
                console.log('Table loading:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading table:', error);
                checkLoaded();
            }
        );

        // Create square paper in the middle of the table with rounded corners
        const paperShape = new THREE.Shape();
        const size = 6;
        const radius = 0.3;

        paperShape.moveTo(-size + radius, -size);
        paperShape.lineTo(size - radius, -size);
        paperShape.quadraticCurveTo(size, -size, size, -size + radius);
        paperShape.lineTo(size, size - radius);
        paperShape.quadraticCurveTo(size, size, size - radius, size);
        paperShape.lineTo(-size + radius, size);
        paperShape.quadraticCurveTo(-size, size, -size, size - radius);
        paperShape.lineTo(-size, -size + radius);
        paperShape.quadraticCurveTo(-size, -size, -size + radius, -size);

        const paperGeometry = new THREE.ExtrudeGeometry(paperShape, {
            depth: 0.05,
            bevelEnabled: false
        });
        const paperMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5dc
        });
        const paper = new THREE.Mesh(paperGeometry, paperMaterial);
        paper.rotation.x = -Math.PI / 2;
        paper.position.set(0, 10.5, 0);
        paper.receiveShadow = true;
        paper.castShadow = true;
        scene.add(paper);

        // Create 9x9 tiles around the square paper
        const gridSize = 9;
        const tileSize = 1.25;
        const gap = 0.08;
        const gridOffset = (gridSize * (tileSize + gap)) / 2 - (tileSize + gap) / 2;
        const tileRadius = 0.1;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = (j * (tileSize + gap)) - gridOffset;
                const z = (i * (tileSize + gap)) - gridOffset;

                // Check if this is an outer tile (edge of the grid)
                const isOuter = i === 0 || i === gridSize - 1 || j === 0 || j === gridSize - 1;

                if (isOuter) {
                    // Create tile shape with rounded corners
                    const tileShape = new THREE.Shape();
                    const halfSize = tileSize / 2;

                    tileShape.moveTo(-halfSize + tileRadius, -halfSize);
                    tileShape.lineTo(halfSize - tileRadius, -halfSize);
                    tileShape.quadraticCurveTo(halfSize, -halfSize, halfSize, -halfSize + tileRadius);
                    tileShape.lineTo(halfSize, halfSize - tileRadius);
                    tileShape.quadraticCurveTo(halfSize, halfSize, halfSize - tileRadius, halfSize);
                    tileShape.lineTo(-halfSize + tileRadius, halfSize);
                    tileShape.quadraticCurveTo(-halfSize, halfSize, -halfSize, halfSize - tileRadius);
                    tileShape.lineTo(-halfSize, -halfSize + tileRadius);
                    tileShape.quadraticCurveTo(-halfSize, -halfSize, -halfSize + tileRadius, -halfSize);

                    const tileGeometry = new THREE.ExtrudeGeometry(tileShape, {
                        depth: 0.02,
                        bevelEnabled: false
                    });
                    const tileMaterial = new THREE.MeshStandardMaterial({
                        color: 0xe0e0e0
                    });
                    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
                    tile.rotation.x = -Math.PI / 2;
                    tile.position.set(x, 10.56, z);
                    tile.receiveShadow = true;
                    tile.castShadow = true;
                    scene.add(tile);
                }
            }
        }

        // Load and place city in the middle of the paper
        loader.load(
            '/game2/city.glb',
            (gltf) => {
                const city = gltf.scene;
                city.position.set(0, 10.56, 0);
                city.scale.set(0.077, 0.08, 0.0615);
                city.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(city);
                console.log('City loaded successfully');
                checkLoaded();
            },
            (progress) => {
                console.log('City loading:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading city:', error);
                checkLoaded();
            }
        );

        // Load character (ChickenGuy) at first tile position
        const firstTileX = -((gridSize * (tileSize + gap)) / 2 - (tileSize + gap) / 2);
        const firstTileZ = -((gridSize * (tileSize + gap)) / 2 - (tileSize + gap) / 2);

        let character: THREE.Object3D | null = null;

        // Generate clockwise tile positions
        const tilePositions: { x: number; z: number }[] = [];
        const leftCol = Array.from({ length: gridSize }, (_, i) => ({
            x: -((gridSize * (tileSize + gap)) / 2 - (tileSize + gap) / 2),
            z: (i * (tileSize + gap)) - gridOffset
        }));
        const bottomRow = Array.from({ length: gridSize - 1 }, (_, j) => ({
            x: ((j + 1) * (tileSize + gap)) - gridOffset,
            z: ((gridSize * (tileSize + gap)) / 2 - (tileSize + gap) / 2)
        }));
        const rightCol = Array.from({ length: gridSize - 1 }, (_, i) => ({
            x: ((gridSize * (tileSize + gap)) / 2 - (tileSize + gap) / 2),
            z: ((gridSize - 2 - i) * (tileSize + gap)) - gridOffset
        }));
        const topRow = Array.from({ length: gridSize - 1 }, (_, j) => ({
            x: ((gridSize - 2 - j) * (tileSize + gap)) - gridOffset,
            z: -((gridSize * (tileSize + gap)) / 2 - (tileSize + gap) / 2)
        }));

        tilePositions.push(...leftCol, ...bottomRow, ...rightCol, ...topRow);

        let currentPosition = 0;
        let currentRotation = 0;
        let hasStarted = false;

        loader.load(
            '/game2/greenguy.glb',
            (gltf) => {
                character = gltf.scene;
                character.position.set(firstTileX, 11, firstTileZ);
                character.rotation.y = 0;
                character.scale.set(0.6, 0.6, 0.6);
                character.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(character);
                console.log('Character loaded successfully');
                checkLoaded();
            },
            (progress) => {
                console.log('Character loading:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading character:', error);
                checkLoaded();
            }
        );

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);

            // Update camera to follow character with rotation
            if (character) {
                const distance = 2;
                const angle20 = (20 * Math.PI) / 180; // 20 degrees in radians
                const offset = new THREE.Vector3(
                    -distance * Math.cos(angle20),
                    0.5,
                    -distance * Math.sin(angle20)
                );
                offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);
                camera.position.copy(character.position).add(offset);
                controls.target.copy(character.position);
            }

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // Handle character movement
        const moveCharacter = async (event: Event) => {
            const customEvent = event as CustomEvent<{ steps: number }>;
            const steps = customEvent.detail.steps;

            if (!character) return;

            for (let i = 0; i < steps; i++) {
                currentPosition = (currentPosition + 1) % tilePositions.length;
                const targetPos = tilePositions[currentPosition];

                // Check if we're at a corner (positions at end of each side, including start at 0)
                const corners = [0, 8, 16, 24];
                // Don't rotate if it's the very first move (hasStarted is false)
                const needsRotation = corners.includes(currentPosition) && hasStarted;
                hasStarted = true;

                await new Promise<void>((resolve) => {
                    const startPos = character!.position.clone();
                    const endPos = new THREE.Vector3(targetPos.x, 11, targetPos.z);
                    const startRot = character!.rotation.y;
                    const targetRot = needsRotation ? startRot + Math.PI / 2 : startRot;
                    const duration = 300;
                    const startTime = Date.now();

                    function animateMove() {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);

                        character!.position.lerpVectors(startPos, endPos, progress);
                        character!.rotation.y = startRot + (targetRot - startRot) * progress;

                        if (progress < 1) {
                            requestAnimationFrame(animateMove);
                        } else {
                            currentRotation = targetRot;
                            resolve();
                        }
                    }
                    animateMove();
                });
            }

            setIsMoving(false);
        };

        window.addEventListener('moveCharacter', moveCharacter);

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('moveCharacter', moveCharacter);
            renderer.dispose();
            controls.dispose();
        };
    }, []);

    return (
        <div ref={containerRef} className="h-screen w-full bg-[#87CEEB] overflow-hidden relative">
            <div id="loading" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-bold z-10">
                Loading...
            </div>

            {/* Dice Roll Button */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 z-10">
                {diceValue !== null && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-8 py-4 shadow-lg">
                        <p className="text-3xl font-bold text-gray-800">Rolled: {diceValue}</p>
                    </div>
                )}
                <button
                    onClick={rollDice}
                    disabled={isMoving}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed text-xl"
                >
                    {isMoving ? 'Moving...' : '🎲 Roll Dice'}
                </button>
            </div>

            <canvas ref={canvasRef} className="block" />
        </div>
    );
}
