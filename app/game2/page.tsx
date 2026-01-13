'use client';

import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
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
        // Darker starry night background with gradient effect and blur
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (context) {
            const gradient = context.createLinearGradient(0, 0, 0, 512);
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(0.3, '#05000a');
            gradient.addColorStop(0.5, '#0a0010');
            gradient.addColorStop(0.7, '#05000a');
            gradient.addColorStop(1, '#000000');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 2, 512);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        scene.background = texture;
        scene.fog = new THREE.FogExp2(0x000000, 0.02);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Initial camera position for intro animation (high above, looking down)
        camera.position.set(0, 50, 0);
        const targetCameraPosition = new THREE.Vector3(-7, 11.5, -7);
        let introAnimationTime = -1; // Start with -1 to create 1 second delay
        const phase1Duration = 3; // seconds
        const phase2Duration = 1.5; // seconds
        let introComplete = false;
        let secondPhaseStarted = false;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

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

        // Add purple/pink lights for the night theme
        const purpleLight = new THREE.PointLight(0xff00ff, 1, 50);
        purpleLight.position.set(10, 10, 10);
        scene.add(purpleLight);

        const pinkLight = new THREE.PointLight(0x8b00ff, 1, 50);
        pinkLight.position.set(-10, 10, -10);
        scene.add(pinkLight);

        // Create circular star texture
        const starCanvas = document.createElement('canvas');
        starCanvas.width = 32;
        starCanvas.height = 32;
        const starContext = starCanvas.getContext('2d');
        if (starContext) {
            const gradient = starContext.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            starContext.fillStyle = gradient;
            starContext.fillRect(0, 0, 32, 32);
        }
        const starTexture = new THREE.CanvasTexture(starCanvas);

        // Create stars with blur effect
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starSizes = [];
        for (let i = 0; i < 5000; i++) {
            const x = (Math.random() - 0.5) * 400;
            const y = (Math.random() - 0.5) * 400 + 200;
            const z = (Math.random() - 0.5) * 400;
            starPositions.push(x, y, z);
            starSizes.push(Math.random() * 1.5 + 0.5);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

        // Create a custom shader material for blurry stars
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            map: starTexture,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);

        // Create floating planets
        const planets: Array<{ mesh: THREE.Mesh; speed: number; rotationSpeed: number; distance: number; angle: number; baseY: number; material?: THREE.MeshStandardMaterial }> = [];

        // Create 3D "Cointown" text using canvas texture
        const textCanvas = document.createElement('canvas');
        const textCtx = textCanvas.getContext('2d');
        const textWidth = 1024;
        const textHeight = 256;
        textCanvas.width = textWidth;
        textCanvas.height = textHeight;

        if (textCtx) {
            // Clear with transparent background
            textCtx.clearRect(0, 0, textWidth, textHeight);

            // Draw text with 3D effect layers
            const text = 'Cointown';
            const fontSize = 140;
            textCtx.font = `bold ${fontSize}px Arial, sans-serif`;
            textCtx.textAlign = 'center';
            textCtx.textBaseline = 'middle';

            // Draw shadow layers for 3D effect
            const shadowColor = '#8B5CF6';
            const glowColor = '#A78BFA';
            const offsets = [8, 6, 4, 2];
            offsets.forEach((offset, index) => {
                textCtx.fillStyle = index < 2 ? glowColor : shadowColor;
                textCtx.fillText(text, textWidth / 2 + offset, textHeight / 2 + offset);
            });

            // Draw main text with gold color
            textCtx.fillStyle = '#FFD700';
            textCtx.fillText(text, textWidth / 2, textHeight / 2);

            // Add glow effect
            textCtx.shadowColor = '#FFD700';
            textCtx.shadowBlur = 20;
            textCtx.fillText(text, textWidth / 2, textHeight / 2);
        }

        const textTexture = new THREE.CanvasTexture(textCanvas);
        textTexture.needsUpdate = true;
        const textGeometry = new THREE.PlaneGeometry(30, 7.5);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 29.5, -10); // Position slightly below camera and in front
        textMesh.rotation.x = -0.3; // Tilt to face the camera better
        textMesh.renderOrder = 1; // Render on top
        scene.add(textMesh);

        // Planet 1 - Pink ring planet
        const planet1Geometry = new THREE.SphereGeometry(9, 32, 32);
        const planet1Material = new THREE.MeshStandardMaterial({
            color: 0xff69b4,
            emissive: 0xff1493,
            emissiveIntensity: 0.5,
            roughness: 0.8,
            metalness: 0.2
        });
        const planet1 = new THREE.Mesh(planet1Geometry, planet1Material);
        planet1.position.set(60, 25, -80);

        // Add large ring to planet 1
        const ring1Geometry = new THREE.RingGeometry(12, 19, 64);
        const ring1Material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
        ring1.rotation.x = Math.PI / 2.5;
        planet1.add(ring1);

        scene.add(planet1);
        planets.push({ mesh: planet1, speed: 0.0001, rotationSpeed: 0.002, distance: 60, angle: 0, baseY: 25 });

        // Planet 2 - Cyan planet with ring (closer)
        const planet2Geometry = new THREE.SphereGeometry(12, 32, 32);
        const planet2Material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aaaa,
            emissiveIntensity: 0.4,
            roughness: 0.7,
            metalness: 0.3
        });
        const planet2 = new THREE.Mesh(planet2Geometry, planet2Material);
        planet2.position.set(-50, 35, -60);

        // Add ring to planet 2
        const ringGeometry = new THREE.RingGeometry(15, 20, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 3;
        planet2.add(ring);
        scene.add(planet2);
        planets.push({ mesh: planet2, speed: 0.00015, rotationSpeed: 0.003, distance: 50, angle: Math.PI, baseY: 35 });

        // GLTF Loader
        const loader = new GLTFLoader();
        let loadedCount = 0;
        const totalModels = 2;

        function checkLoaded() {
            loadedCount++;
            if (loadedCount >= totalModels) {
                const loadingEl = document.getElementById('loading');
                if (loadingEl) {
                    // Fade out the loading text after models are loaded
                    loadingEl.style.transition = 'opacity 0.5s ease-out';
                    loadingEl.style.opacity = '0';
                    setTimeout(() => {
                        loadingEl.style.display = 'none';
                    }, 500);
                }
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

            const time = Date.now() * 0.001;
            const deltaTime = 0.016; // Approximate 60fps

            // Intro camera animation
            if (!introComplete) {
                introAnimationTime += deltaTime;

                // Hide loading text when animation starts (after 1 second delay)
                if (introAnimationTime >= 0 && introAnimationTime < 0.1) {
                    const loadingEl = document.getElementById('loading');
                    if (loadingEl) {
                        loadingEl.style.transition = 'opacity 0.1s ease-out';
                        loadingEl.style.opacity = '0';
                        setTimeout(() => {
                            loadingEl.style.display = 'none';
                        }, 500);
                    }
                    textMesh.visible = false;
                }

                // Wait for 1 second delay before starting animation
                if (introAnimationTime < 0) {
                    return; // Keep camera at (0, 50, 0) during delay
                }

                // Phase 1: Move from (0, 50, 0) to (-7, 11.5, -7) - 3 seconds
                if (introAnimationTime < phase1Duration) {
                    const progress = introAnimationTime / phase1Duration;
                    const easeOut = 1 - Math.pow(1 - progress, 3);

                    camera.position.lerpVectors(
                        new THREE.Vector3(0, 50, 0),
                        targetCameraPosition,
                        easeOut
                    );

                    controls.target.lerp(new THREE.Vector3(0, 10.6, 0), easeOut);
                }
                // Phase 2: Move from (-7, 11.5, -7) to 20-degree position - 2 seconds
                else if (introAnimationTime < phase1Duration + phase2Duration) {
                    if (!secondPhaseStarted) {
                        secondPhaseStarted = true;
                    }

                    const progress = (introAnimationTime - phase1Duration) / phase2Duration;
                    // Smoother ease-in-out function
                    const easeInOut = progress < 0.5
                        ? 4 * progress * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                    // Calculate target camera position (20-degree angle from character)
                    const distance = 2.5;
                    const angle20 = (20 * Math.PI) / 180;
                    const targetPos = new THREE.Vector3(
                        -distance * Math.cos(angle20),
                        0.5,
                        -distance * Math.sin(angle20)
                    );

                    if (character) {
                        targetPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);
                        targetPos.add(character.position);
                    }

                    camera.position.lerpVectors(
                        targetCameraPosition,
                        targetPos,
                        easeInOut
                    );

                    const targetLookAt = character ? character.position.clone() : new THREE.Vector3(0, 11, 0);
                    controls.target.lerp(targetLookAt, easeInOut);
                } else {
                    // Animation complete
                    introComplete = true;
                }
            }

            // Update planets - rotate and float
            planets.forEach((planet, index) => {
                planet.angle += planet.speed;
                planet.mesh.rotation.y += planet.rotationSpeed;
                planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
                planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
                planet.mesh.position.y = planet.baseY + Math.sin(planet.angle * 2) * 5; // Add gentle bobbing motion

                // Only apply blinking effect to cyan planet (index 1)
                if (index === 1 && planet.material) {
                    planet.material.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.3;
                }
            });

            // Update camera to follow character with rotation (only after intro)
            if (introComplete && character) {
                const distance = 2.5;
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
                const nextPosition = (currentPosition + 1) % tilePositions.length;
                const targetPos = tilePositions[nextPosition];

                // Check if the next position is a corner (need to rotate when arriving at corners 8, 16, 24, 0)
                const corners = [0, 8, 16, 24];
                // Don't rotate if it's the very first move (starting at position 0 and moving to 1)
                // Special case: if we're at position 31 and moving to 0, we DO need to rotate
                const isCompletingLoop = currentPosition === 31 && nextPosition === 0;
                const needsRotation = corners.includes(nextPosition) && (hasStarted || isCompletingLoop);

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
                            currentPosition = nextPosition;
                            hasStarted = true;
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
        <>
            <Head>
                <link rel="preload" href="/fonts/LuckiestGuy.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <link rel="preload" href="/fonts/LuckiestGuy-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
            </Head>
            <div ref={containerRef} className="h-screen w-full overflow-hidden relative" style={{
                background: 'linear-gradient(135deg, #0a0015 0%, #1a0033 50%, #0a0015 100%)'
            }}>
                {/* Loading text */}
                <div id="loading" className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
                    <h1
                        style={{
                            fontFamily: '"Luckiest Guy", cursive, fantasy, sans-serif',
                            fontSize: "clamp(5rem, 12vw, 10rem)",
                            fontWeight: "normal",
                            color: "#FFD700",
                            textShadow: `
                              0 1px 0 #B19CD9,
                              0 2px 0 #B19CD9,
                              0 3px 0 #B19CD9,
                              0 4px 0 #B19CD9,
                              0 5px 0 #B19CD9,
                              0 6px 1px rgba(0,0,0,.1),
                              0 0 5px rgba(0,0,0,.1),
                              0 1px 3px rgba(0,0,0,.3),
                              0 3px 5px rgba(0,0,0,.2),
                              0 5px 10px rgba(0,0,0,.25),
                              0 10px 10px rgba(0,0,0,.2),
                              0 20px 20px rgba(0,0,0,.15),
                              0 0 20px #FFD700,
                              0 0 40px #FFD70055
                            `,
                            letterSpacing: "0.05em",
                        }}
                    >
                        Cointown
                    </h1>
                </div>

            {/* Background blur layer */}
            <div className="absolute inset-0" style={{
                background: 'inherit',
                filter: 'blur(1px)',
                zIndex: 0
            }}></div>

            <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />

            {/* Dice Roll Button */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 z-50">
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
        </div>
        </>
    );
}
