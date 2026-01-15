'use client';

import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as CANNON from 'cannon-es';
import { useSession, signOut } from 'next-auth/react';
import { useAccount, useDisconnect } from 'wagmi';
import { LogOut, Wallet, AlertCircle } from 'lucide-react';
import { AvatarIcon } from '@/components/game/ui/AvatarIcon';
import NFTCard from '@/components/nftcard';

// Helper function to create dice textures
function createDiceTextures(): THREE.Texture[] {
    const textures: THREE.Texture[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (!ctx) return textures;

    // Dice face configurations: number of dots and their positions
    const faceConfigs = [
        // Face 1: one dot in center
        [{ x: 128, y: 128 }],
        // Face 2: two dots
        [{ x: 64, y: 64 }, { x: 192, y: 192 }],
        // Face 3: three dots
        [{ x: 64, y: 64 }, { x: 128, y: 128 }, { x: 192, y: 192 }],
        // Face 4: four dots
        [{ x: 64, y: 64 }, { x: 192, y: 64 }, { x: 64, y: 192 }, { x: 192, y: 192 }],
        // Face 5: five dots
        [{ x: 64, y: 64 }, { x: 192, y: 64 }, { x: 128, y: 128 }, { x: 64, y: 192 }, { x: 192, y: 192 }],
        // Face 6: six dots
        [{ x: 64, y: 64 }, { x: 192, y: 64 }, { x: 64, y: 128 }, { x: 192, y: 128 }, { x: 64, y: 192 }, { x: 192, y: 192 }]
    ];

    for (let face = 0; face < 6; face++) {
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);

        // Add subtle gradient
        const gradient = ctx.createLinearGradient(0, 0, 256, 256);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f0f0f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        // Draw border
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 252, 252);

        // Draw dots for this face
        ctx.fillStyle = face % 2 === 0 ? '#1a1a2e' : '#e74c3c'; // Alternate between dark blue and red
        for (const dot of faceConfigs[face]) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 24, 0, Math.PI * 2);
            ctx.fill();

            // Add shadow to dots
            ctx.beginPath();
            ctx.arc(dot.x + 2, dot.y + 2, 24, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fill();
            ctx.fillStyle = face % 2 === 0 ? '#1a1a2e' : '#e74c3c';
        }

        const texture = new THREE.CanvasTexture(canvas.cloneNode(true) as HTMLCanvasElement);
        const tempCanvas = canvas.cloneNode(true) as HTMLCanvasElement;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.drawImage(canvas, 0, 0);
        }
        const newTexture = new THREE.CanvasTexture(tempCanvas);
        textures.push(newTexture);
    }

    return textures;
}

// Determine which face is up based on rotation
function getDiceValue(diceBody: CANNON.Body): number {
    // Three.js BoxGeometry face order: right, left, top, bottom, front, back
    // These correspond to the texture array indices: 0, 1, 2, 3, 4, 5
    // Local face normals for a cube (which face points in which direction)
    const faces = [
        { normal: new CANNON.Vec3(1, 0, 0), value: 1 },   // right (face 0)
        { normal: new CANNON.Vec3(-1, 0, 0), value: 2 },  // left (face 1)
        { normal: new CANNON.Vec3(0, 1, 0), value: 3 },   // top (face 2)
        { normal: new CANNON.Vec3(0, -1, 0), value: 4 },  // bottom (face 3)
        { normal: new CANNON.Vec3(0, 0, 1), value: 5 },   // front (face 4)
        { normal: new CANNON.Vec3(0, 0, -1), value: 6 }   // back (face 5)
    ];

    let maxDot = -Infinity;
    let topFace = 1;

    for (const face of faces) {
        // Transform local normal to world space
        const worldNormal = new CANNON.Vec3();
        diceBody.quaternion.vmult(face.normal, worldNormal);

        // Dot product with up vector (0, 1, 0)
        const dot = worldNormal.dot(new CANNON.Vec3(0, 1, 0));

        if (dot > maxDot) {
            maxDot = dot;
            topFace = face.value;
        }
    }

    return topFace;
}

// Helper to remove root motion (forward/backward movement) from animation
function removeRootMotion(clip: THREE.AnimationClip) {
    clip.tracks.forEach(track => {
        // Look for position tracks of the root/hips
        // Most Mixamo animations use "mixamorigHips.position" or "Hips.position"
        if (track.name.endsWith('.position') &&
            (track.name.toLowerCase().includes('hips') || track.name.toLowerCase().includes('root'))) {

            const values = track.values;
            // The values array is [x1, y1, z1, x2, y2, z2, ...]
            // We want to keep Y (vertical bounce) but flatten X and Z to the initial position

            const startX = values[0];
            const startZ = values[2];

            for (let i = 0; i < values.length; i += 3) {
                values[i] = startX;     // Normalize X
                values[i + 2] = startZ; // Normalize Z
            }
        }
    });
}

// Player data interface
interface Player {
    id: number;
    name: string;
    balance: number;
    image: string;
}

export default function Game2Page() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const houseCanvasRef = useRef<HTMLCanvasElement>(null);
    const houseContainerRef = useRef<HTMLDivElement>(null);
    const lightningCanvasRef = useRef<HTMLCanvasElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isMoving, setIsMoving] = useState(false);
    const [isCharging, setIsCharging] = useState(false);
    const [chargePower, setChargePower] = useState(0);
    const chargePowerRef = useRef(chargePower);
    const isChargingRef = useRef(false);
    const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [showTileOverlay, setShowTileOverlay] = useState(false);
    const [introComplete, setIntroComplete] = useState(false);
    const [showDiceResult, setShowDiceResult] = useState(false);
    const diceResultCanvasRef = useRef<HTMLCanvasElement>(null);
    const lightningAnimationRef = useRef<number | null>(null);
    const diceMeshRef = useRef<THREE.Mesh | null>(null);
    const cityRef = useRef<THREE.Object3D | null>(null);
    const blackRunModelRef = useRef<THREE.Group | null>(null);
    const blackStandModelRef = useRef<THREE.Group | null>(null);
    const blackRunMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const blackStandMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const smRunModelRef = useRef<THREE.Group | null>(null);
    const smStandModelRef = useRef<THREE.Group | null>(null);
    const smRunMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const smStandMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const yellowRunModelRef = useRef<THREE.Group | null>(null);
    const yellowStandModelRef = useRef<THREE.Group | null>(null);
    const yellowRunMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const yellowStandMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const cyanRunModelRef = useRef<THREE.Group | null>(null);
    const cyanStandModelRef = useRef<THREE.Group | null>(null);
    const cyanRunMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const cyanStandMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const mixers: THREE.AnimationMixer[] = [];

    // Game player interface (for 3D game logic)
    interface GamePlayer {
        id: number;
        model: THREE.Group | THREE.Object3D | null;
        currentPosition: number; // 0-31
        mixer: THREE.AnimationMixer | null;
        name: string;
        rotation: number;
    }

    const sceneRef = useRef<THREE.Scene | null>(null);
    const playersRef = useRef<GamePlayer[]>([
        { id: 0, name: 'Black', model: null, currentPosition: 0, mixer: null, rotation: 0 },
        { id: 1, name: 'Yellow', model: null, currentPosition: 8, mixer: null, rotation: 0 },
        { id: 2, name: 'SM', model: null, currentPosition: 16, mixer: null, rotation: 0 },
        { id: 3, name: 'Chicken', model: null, currentPosition: 24, mixer: null, rotation: 0 },
    ]);
    const currentPlayerIndexRef = useRef(0);
    const papersRef = useRef<Map<number, THREE.Mesh>>(new Map());
    const currentTileRef = useRef<number>(0);
    const [rightViewMode, setRightViewMode] = useState<'model' | 'nft'>('model');

    // Camera transition refs
    const isCameraTransitioningRef = useRef(false);
    const cameraTransitionStartTimeRef = useRef(0);
    const cameraTransitionStartPosRef = useRef<THREE.Vector3 | null>(null);
    const cameraTransitionStartTargetRef = useRef<THREE.Vector3 | null>(null);
    const cameraTransitionEndPosRef = useRef<THREE.Vector3 | null>(null);
    const cameraTransitionEndTargetRef = useRef<THREE.Vector3 | null>(null);

    // Account state
    const { data: session } = useSession();
    const { address: connectedWallet } = useAccount();
    const { disconnect } = useDisconnect();
    const router = useRouter();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const accountMenuRef = useRef<HTMLDivElement>(null);

    // Get account display info
    const displayName = session?.user?.name || connectedWallet?.slice(0, 6) + "..." + connectedWallet?.slice(-4);
    const displayImage = session?.user?.image;
    const isLoggedIn = session || connectedWallet;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
                setShowAccountMenu(false);
            }
        };

        if (showAccountMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAccountMenu]);

    const handleLogout = async () => {
        try {
            if (session) {
                await signOut({ redirect: false });
            }
            if (connectedWallet) {
                await disconnect();
            }
            setShowAccountMenu(false);
            router.push('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Player state
    const [players, setPlayers] = useState<Player[]>([
        { id: 1, name: 'You', balance: 1500, image: '/game2/me.png' },
        { id: 2, name: 'Player 2', balance: 1500, image: '/game2/player1.png' },
        { id: 3, name: 'Player 3', balance: 1500, image: '/game2/player2.png' },
        { id: 4, name: 'Player 4', balance: 1500, image: '/game2/player3.png' }
    ]);

    // Start charging when mouse/touch is pressed
    const startCharging = () => {
        if (isMoving) return;

        setIsCharging(true);
        setChargePower(0);

        // Increase power over time (up to 100% over 1 second)
        chargeIntervalRef.current = setInterval(() => {
            setChargePower((prev) => Math.min(prev + 4, 100));
        }, 40); // Update every 40ms (25fps)
    };

    // Release to roll with charged power
    const releaseCharging = () => {
        if (!isCharging || isMoving) return;

        setIsCharging(false);
        setIsMoving(true);
        setDiceValue(null); // Clear previous dice value
        // Don't hide dice result - let it show naturally when dice lands

        // Trigger dice roll with charge power
        const event = new CustomEvent('rollDice', { detail: { power: chargePower } });
        window.dispatchEvent(event);

        setChargePower(0);

        if (chargeIntervalRef.current) {
            clearInterval(chargeIntervalRef.current);
            chargeIntervalRef.current = null;
        }
    };

    // Clean up intervals on unmount
    useEffect(() => {
        return () => {
            if (chargeIntervalRef.current) {
                clearInterval(chargeIntervalRef.current);
            }
            if (lightningAnimationRef.current) {
                cancelAnimationFrame(lightningAnimationRef.current);
            }
        };
    }, []);

    // Lightning arc effect
    useEffect(() => {
        if (!isCharging || isMoving || !lightningCanvasRef.current || !buttonRef.current) {
            if (lightningAnimationRef.current) {
                cancelAnimationFrame(lightningAnimationRef.current);
                lightningAnimationRef.current = null;
            }
            // Clear canvas when not charging
            if (lightningCanvasRef.current) {
                const ctx = lightningCanvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, lightningCanvasRef.current.width, lightningCanvasRef.current.height);
                }
            }
            return;
        }

        const canvas = lightningCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match window
        const resizeCanvas = () => {
            if (lightningCanvasRef.current) {
                lightningCanvasRef.current.width = window.innerWidth;
                lightningCanvasRef.current.height = window.innerHeight;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let time = 0;

        // Generate straight lightning line
        function generateLightning(x1: number, y1: number, x2: number, y2: number, segments: number) {
            const points = [{ x: x1, y: y1 }];

            const dx = x2 - x1;
            const dy = y2 - y1;

            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const baseX = x1 + dx * t;
                const baseY = y1 + dy * t;

                // Add jitter for lightning effect
                points.push({
                    x: baseX + (Math.random() - 0.5) * 15,
                    y: baseY + (Math.random() - 0.5) * 10
                });
            }

            return points;
        }

        function drawLightning() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const buttonRect = buttonRef.current!.getBoundingClientRect();
            const buttonCenterX = buttonRect.left + buttonRect.width / 2;
            const buttonTopY = buttonRect.top;

            // Dice position (estimated based on screen center and typical camera position)
            // The dice floats in front of and slightly above the character
            // Based on the 20-degree camera angle and character positioning
            const diceX = canvas.width / 2; // Center of screen for straight up (90 degrees)
            const diceY = canvas.height * 0.65; // Longer arc - higher on screen

            // Number of lightning bolts based on charge power
            const numBolts = 2 + Math.floor(chargePower / 30);
            const intensity = chargePower / 100;

            for (let b = 0; b < numBolts; b++) {
                const segments = 15 + Math.floor(Math.random() * 10);
                const points = generateLightning(
                    buttonCenterX + (Math.random() - 0.5) * 40,
                    buttonTopY,
                    diceX + (Math.random() - 0.5) * 60,
                    diceY,
                    segments
                );

                // Draw main bolt with glow
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);

                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }

                // Outer glow
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 20 + intensity * 30;
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 + intensity * 0.4})`;
                ctx.lineWidth = 2 + intensity * 2;
                ctx.stroke();

                // Inner white core
                ctx.shadowBlur = 10;
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + intensity * 0.2})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Draw glowing particles along the path
            const numParticles = Math.floor(chargePower / 10);
            for (let i = 0; i < numParticles; i++) {
                const t = Math.random();
                const x = buttonCenterX + (diceX - buttonCenterX) * t + (Math.random() - 0.5) * 30;
                const y = buttonTopY + (diceY - buttonTopY) * t + (Math.random() - 0.5) * 30;
                const size = 1 + Math.random() * 2;

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + Math.random() * 0.5})`;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.fill();
            }

            // Add extra energy particles at the dice position
            for (let i = 0; i < 3; i++) {
                const x = diceX + (Math.random() - 0.5) * 40;
                const y = diceY + (Math.random() - 0.5) * 40;
                const size = 2 + Math.random() * 3;

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 255, ${0.7 + Math.random() * 0.3})`;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 15;
                ctx.fill();
            }

            time += 0.016;
            lightningAnimationRef.current = requestAnimationFrame(drawLightning);
        }

        drawLightning();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (lightningAnimationRef.current) {
                cancelAnimationFrame(lightningAnimationRef.current);
            }
        };
    }, [isCharging, isMoving, chargePower]);

    // Draw dice result when it should be shown
    useEffect(() => {
        if (showDiceResult && diceValue !== null && diceResultCanvasRef.current) {
            const canvas = diceResultCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 128;
            canvas.height = 128;

            // Draw dice face
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 128, 128);

            // Add gradient
            const gradient = ctx.createLinearGradient(0, 0, 128, 128);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#f0f0f0');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);

            // Draw border
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, 126, 126);

            // Get dots configuration for this face
            const faceConfigs = [
                [{ x: 64, y: 64 }],
                [{ x: 32, y: 32 }, { x: 96, y: 96 }],
                [{ x: 32, y: 32 }, { x: 64, y: 64 }, { x: 96, y: 96 }],
                [{ x: 32, y: 32 }, { x: 96, y: 32 }, { x: 32, y: 96 }, { x: 96, y: 96 }],
                [{ x: 32, y: 32 }, { x: 96, y: 32 }, { x: 64, y: 64 }, { x: 32, y: 96 }, { x: 96, y: 96 }],
                [{ x: 32, y: 32 }, { x: 96, y: 32 }, { x: 32, y: 64 }, { x: 96, y: 64 }, { x: 32, y: 96 }, { x: 96, y: 96 }]
            ];

            const dots = faceConfigs[diceValue - 1];

            // Draw dots
            ctx.fillStyle = (diceValue % 2 === 0) ? '#1a1a2e' : '#e74c3c';
            for (const dot of dots) {
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, 12, 0, Math.PI * 2);
                ctx.fill();

                // Add shadow
                ctx.beginPath();
                ctx.arc(dot.x + 1, dot.y + 1, 12, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fill();
                ctx.fillStyle = (diceValue % 2 === 0) ? '#1a1a2e' : '#e74c3c';
            }
        }
    }, [showDiceResult, diceValue]);

    // Show 3D dice when overlay closes
    useEffect(() => {
        if (!showTileOverlay && diceMeshRef.current) {
            diceMeshRef.current.visible = true;
        }
    }, [showTileOverlay]);

    // Keep refs in sync with state
    useEffect(() => {
        chargePowerRef.current = chargePower;
    }, [chargePower]);

    useEffect(() => {
        isChargingRef.current = isCharging;
    }, [isCharging]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
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
        let hasUpdatedIntroState = false;

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
        controls.target.set(0, 11, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
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

        // ============ PHYSICS WORLD SETUP ============
        const world = new CANNON.World();
        world.gravity.set(0, -20, 0);
        world.broadphase = new CANNON.NaiveBroadphase();

        // Create physics floor (table surface)
        const floorShape = new CANNON.Plane();
        const floorBody = new CANNON.Body({ mass: 0 }); // Static body
        floorBody.addShape(floorShape);
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        floorBody.position.set(0, 10.6, 0); // Match the paper/tile height
        world.addBody(floorBody);

        // Create dice materials for better bouncing
        const diceMaterial = new CANNON.Material('dice');
        const floorMaterial = new CANNON.Material('floor');
        const diceFloorContact = new CANNON.ContactMaterial(diceMaterial, floorMaterial, {
            friction: 0.3,
            restitution: 0.2 // Bounciness (0-1) - increased for more bounce
        });
        world.addContactMaterial(diceFloorContact);

        // Create dice textures
        const diceTextures = createDiceTextures();

        // Create dice mesh
        const diceSize = 0.25; // Increased size for better visibility
        const diceGeometry = new THREE.BoxGeometry(diceSize, diceSize, diceSize);
        const diceMaterials = diceTextures.map(texture =>
            new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.3,
                metalness: 0.1
            })
        );
        const diceMesh = new THREE.Mesh(diceGeometry, diceMaterials);
        diceMesh.castShadow = true;
        diceMesh.receiveShadow = true;
        diceMesh.visible = false; // Hide initially
        scene.add(diceMesh);

        // Store diceMesh in ref for later access
        diceMeshRef.current = diceMesh;

        // Create dice physics body
        const diceShape = new CANNON.Box(new CANNON.Vec3(diceSize / 2, diceSize / 2, diceSize / 2));
        const diceBody = new CANNON.Body({
            mass: 1,
            material: diceMaterial,
            linearDamping: 0.5,
            angularDamping: 0.2 // Reduced from 0.5 to 0.2 for smoother, faster spinning
        });
        diceBody.addShape(diceShape);
        diceBody.position.set(0, 15, 0); // Start above the table
        world.addBody(diceBody);

        // Track dice state
        let isDiceRolling = false;
        let diceShouldFloat = true; // Dice should float when not rolling
        let lastDiceVelocity = 0;
        let velocityCheckCount = 0;
        const VELOCITY_THRESHOLD = 0.1;
        const STABLE_FRAMES_NEEDED = 20; // Reduced from 30 to 20 for faster detection

        // ============ END PHYSICS SETUP ============

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
                        // Make materials transparent so we can fade them
                        const mesh = child as THREE.Mesh;
                        if (mesh.material) {
                            if (Array.isArray(mesh.material)) {
                                mesh.material.forEach(mat => {
                                    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                                        mat.transparent = true;
                                    }
                                });
                            } else {
                                const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
                                if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                                    mat.transparent = true;
                                }
                            }
                        }
                    }
                });
                cityRef.current = city;
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

        // Helper function to position a player at their current tile
        const positionPlayerAtTile = (player: GamePlayer, position: number) => {
            if (!player.model) return;

            const tilePos = tilePositions[position];

            // Calculate rotation based on position - face the direction they'll be walking
            let rotation = 0;
            if (position === 0) rotation = 0; // Black model at start - facing forward
            else if (position === 8) rotation = Math.PI / 2; // Facing forward along path
            else if (position === 16) rotation = Math.PI; // SM model at corner - facing forward (down)
            else if (position === 24) rotation = -Math.PI / 2; // Facing forward along path
            else if (position > 0 && position < 8) rotation = 0; // Left column - facing forward (up)
            else if (position > 8 && position < 16) rotation = Math.PI / 2; // Bottom row - facing forward (right)
            else if (position > 16 && position < 24) rotation = Math.PI; // Right column - facing forward (down)
            else if (position > 24) rotation = -Math.PI / 2; // Top row - facing forward (left)

            player.model.position.set(tilePos.x, 10.6, tilePos.z);
            player.model.rotation.y = rotation;
            player.rotation = rotation;
        };

        // let currentPosition = 0; // Replaced by playersRef
        // let currentRotation = 0; // Replaced by playersRef
        let hasStarted = false;
        currentTileRef.current = 0;

        const fbxLoader = new FBXLoader();

        // Load character (Black Stand) at first tile position
        fbxLoader.load(
            '/models/black-stand.fbx',
            (object) => {
                const player = playersRef.current[0];
                blackStandModelRef.current = object;
                player.model = object;
                character = object; // Keep for backward compatibility/camera init for now
                positionPlayerAtTile(player, player.currentPosition);
                // Ensure rotation matches the calculated rotation
                object.rotation.y = player.rotation;

                // Scale needed adjustment based on previous tests
                // User requested 0.7 size
                const scale = 0.7;
                character.scale.set(scale, scale, scale);

                // Setup animation mixer
                const charMixer = new THREE.AnimationMixer(character);
                blackStandMixerRef.current = charMixer;
                player.mixer = charMixer;
                mixers.push(charMixer);
                if (object.animations && object.animations.length > 0) {
                    const action = charMixer.clipAction(object.animations[0]);
                    action.play();
                    console.log('Playing animation:', object.animations[0].name);
                } else {
                    console.log('No animations found in black-stand.fbx');
                }

                character.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(character);
                console.log('Black stand loaded successfully');
                checkLoaded();
            },
            (xhr) => {
                console.log('Character loading:', (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading character:', error);
                checkLoaded();
            }
        );

        // Load Black Run model for movement animation
        fbxLoader.load(
            '/models/black-run.fbx',
            (object) => {
                blackRunModelRef.current = object;

                // Remove root motion from the run animation so it runs "in place"
                if (object.animations && object.animations.length > 0) {
                    removeRootMotion(object.animations[0]);
                }

                const scale = 0.7;
                object.scale.set(scale, scale, scale);
                object.visible = false; // Hide initially, only show when moving

                // Setup animation mixer for run model
                const runMixer = new THREE.AnimationMixer(object);
                blackRunMixerRef.current = runMixer;
                mixers.push(runMixer);
                if (object.animations && object.animations.length > 0) {
                    const action = runMixer.clipAction(object.animations[0]);
                    action.setLoop(THREE.LoopRepeat, Infinity); // Loop repeatedly
                    action.play();
                    console.log('Playing run animation:', object.animations[0].name);
                }

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(object);
                console.log('Black run loaded successfully');
            },
            undefined,
            (error) => console.error('Error loading black run:', error)
        );

        // Load secondary model (Yellow Stand) at position 8
        fbxLoader.load(
            '/models/yellow-stand.fbx',
            (object) => {
                object.scale.set(0.7, 0.7, 0.7);
                yellowStandModelRef.current = object;

                // Animation
                const yellowMixer = new THREE.AnimationMixer(object);
                yellowStandMixerRef.current = yellowMixer;
                const player = playersRef.current[1];
                player.model = object;
                player.mixer = yellowMixer;

                // Position at correct tile position
                positionPlayerAtTile(player, player.currentPosition);
                // Ensure rotation matches the calculated rotation
                object.rotation.y = player.rotation;
                mixers.push(yellowMixer);
                if (object.animations && object.animations.length > 0) {
                    const action = yellowMixer.clipAction(object.animations[0]);
                    action.play();
                }

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(object);
                console.log('Yellow stand loaded successfully');
            },
            undefined,
            (error) => console.error('Error loading yellow stand:', error)
        );

        // Load Yellow Run model
        fbxLoader.load(
            '/models/yellow-run.fbx',
            (object) => {
                yellowRunModelRef.current = object;

                // Remove root motion
                if (object.animations && object.animations.length > 0) {
                    removeRootMotion(object.animations[0]);
                }

                const scale = 0.7;
                object.scale.set(scale, scale, scale);
                object.visible = false;

                // Setup animation mixer
                const runMixer = new THREE.AnimationMixer(object);
                yellowRunMixerRef.current = runMixer;
                mixers.push(runMixer);
                if (object.animations && object.animations.length > 0) {
                    const action = runMixer.clipAction(object.animations[0]);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.play();
                    console.log('Playing yellow run animation:', object.animations[0].name);
                }

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(object);
                console.log('Yellow run loaded successfully');
            },
            undefined,
            (error) => console.error('Error loading yellow run:', error)
        );

        // Load Cyan Run model
        fbxLoader.load(
            '/models/cyan-run.fbx',
            (object) => {
                cyanRunModelRef.current = object;

                // Remove root motion
                if (object.animations && object.animations.length > 0) {
                    removeRootMotion(object.animations[0]);
                }

                const scale = 0.7;
                object.scale.set(scale, scale, scale);
                object.visible = false;

                // Setup animation mixer
                const runMixer = new THREE.AnimationMixer(object);
                cyanRunMixerRef.current = runMixer;
                mixers.push(runMixer);
                if (object.animations && object.animations.length > 0) {
                    const action = runMixer.clipAction(object.animations[0]);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.play();
                    console.log('Playing cyan run animation:', object.animations[0].name);
                }

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(object);
                console.log('Cyan run loaded successfully');
            },
            undefined,
            (error) => console.error('Error loading cyan run:', error)
        );

        // Load SM Stand model at position 16
        fbxLoader.load(
            '/models/sm-stand.fbx',
            (object) => {
                object.scale.set(0.7, 0.7, 0.7);
                smStandModelRef.current = object;

                // Animation
                const smMixer = new THREE.AnimationMixer(object);
                smStandMixerRef.current = smMixer;
                const player = playersRef.current[2];
                player.model = object;
                player.mixer = smMixer;

                // Position at correct tile position
                positionPlayerAtTile(player, player.currentPosition);
                // Ensure rotation matches the calculated rotation
                object.rotation.y = player.rotation;
                mixers.push(smMixer);
                if (object.animations && object.animations.length > 0) {
                    const action = smMixer.clipAction(object.animations[0]);
                    action.play();
                }

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(object);
                console.log('SM stand loaded successfully');
            },
            undefined,
            (error) => console.error('Error loading SM stand:', error)
        );

        // Load SM Run model
        fbxLoader.load(
            '/models/sm-run.fbx',
            (object) => {
                smRunModelRef.current = object;

                // Remove root motion
                if (object.animations && object.animations.length > 0) {
                    removeRootMotion(object.animations[0]);
                }

                const scale = 0.7;
                object.scale.set(scale, scale, scale);
                object.visible = false;

                // Setup animation mixer
                const runMixer = new THREE.AnimationMixer(object);
                smRunMixerRef.current = runMixer;
                mixers.push(runMixer);
                if (object.animations && object.animations.length > 0) {
                    const action = runMixer.clipAction(object.animations[0]);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.play();
                    console.log('Playing sm run animation:', object.animations[0].name);
                }

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(object);
                console.log('SM run loaded successfully');
            },
            undefined,
            (error) => console.error('Error loading sm run:', error)
        );

        // Load Cyan Stand (FBX) at position 24
        fbxLoader.load(
            '/models/cyan-stand.fbx',
            (object) => {
                object.scale.set(0.7, 0.7, 0.7);
                cyanStandModelRef.current = object;

                // Animation
                const cyanMixer = new THREE.AnimationMixer(object);
                cyanStandMixerRef.current = cyanMixer;
                const player = playersRef.current[3];
                player.model = object;
                player.mixer = cyanMixer;

                // Position at correct tile position
                positionPlayerAtTile(player, player.currentPosition);
                // Ensure rotation matches the calculated rotation
                object.rotation.y = player.rotation;
                mixers.push(cyanMixer);
                if (object.animations && object.animations.length > 0) {
                    const action = cyanMixer.clipAction(object.animations[0]);
                    action.play();
                }

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(object);
                console.log('Cyan stand loaded successfully');
            },
            undefined,
            (error) => console.error('Error loading Cyan stand:', error)
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

                    controls.target.lerp(new THREE.Vector3(0, 11, 0), easeOut);
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

                    // Update React state to show the roll button
                    if (!hasUpdatedIntroState) {
                        hasUpdatedIntroState = true;
                        setIntroComplete(true);
                    }

                    // Show dice and position it in front of camera
                    if (character) {
                        const distance = 1.0; // Increased distance for better visibility
                        const angle20 = (20 * Math.PI) / 180;
                        const offset = new THREE.Vector3(
                            -distance * Math.cos(angle20),
                            0.15, // Raised dice position to be fully visible
                            -distance * Math.sin(angle20)
                        );
                        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);
                        const dicePosition = character.position.clone().add(offset);

                        // Removed -0.55 offset that was causing clipping
                        diceBody.position.set(dicePosition.x, dicePosition.y, dicePosition.z);
                        diceMesh.visible = true;
                    }
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

            // Update city opacity based on distance from character
            if (introComplete && character && cityRef.current) {
                const cityCenter = new THREE.Vector3(0, 10.56, 0);
                const characterPos = character.position.clone();
                characterPos.y = cityCenter.y; // Use same Y level for distance calculation
                const distanceToCity = characterPos.distanceTo(cityCenter);

                // Fade out city when player is within 3 units, fully visible at 5+ units
                const fadeStartDistance = 3;
                const fadeEndDistance = 5;
                let opacity = 1;

                if (distanceToCity < fadeEndDistance) {
                    if (distanceToCity < fadeStartDistance) {
                        opacity = 0.1; // Almost invisible when very close
                    } else {
                        // Smooth fade between fadeStartDistance and fadeEndDistance
                        const fadeRange = fadeEndDistance - fadeStartDistance;
                        const distanceInRange = distanceToCity - fadeStartDistance;
                        opacity = 0.1 + (distanceInRange / fadeRange) * 0.9;
                    }
                }

                // Apply opacity to all city materials
                cityRef.current.traverse((child) => {
                    if (child.isMesh) {
                        const mesh = child as THREE.Mesh;
                        if (mesh.material) {
                            if (Array.isArray(mesh.material)) {
                                mesh.material.forEach(mat => {
                                    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                                        mat.opacity = opacity;
                                    }
                                });
                            } else {
                                const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
                                if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                                    mat.opacity = opacity;
                                }
                            }
                        }
                    }
                });
            }

            // Update camera to follow character with rotation (only after intro)
            if (introComplete && character) {
                // Handle smooth camera transition between players
                if (isCameraTransitioningRef.current) {
                    const transitionDuration = 1.5; // 1.5 seconds
                    const elapsed = time - cameraTransitionStartTimeRef.current;
                    const progress = Math.min(elapsed / transitionDuration, 1);

                    // Smooth ease-in-out curve
                    const easeInOut = progress < 0.5
                        ? 2 * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                    if (cameraTransitionStartPosRef.current && cameraTransitionEndPosRef.current &&
                        cameraTransitionStartTargetRef.current && cameraTransitionEndTargetRef.current) {
                        // Interpolate camera position
                        camera.position.lerpVectors(
                            cameraTransitionStartPosRef.current,
                            cameraTransitionEndPosRef.current,
                            easeInOut
                        );

                        // Interpolate camera target
                        controls.target.lerpVectors(
                            cameraTransitionStartTargetRef.current,
                            cameraTransitionEndTargetRef.current,
                            easeInOut
                        );
                    }

                    // Transition complete
                    if (progress >= 1) {
                        isCameraTransitioningRef.current = false;
                    }
                } else {
                    // Normal camera following (no transition)
                    // Player 2 (Yellow) gets a higher angle to avoid building blocking view
                    const currentPlayerIndex = currentPlayerIndexRef.current;
                    const isPlayer2 = currentPlayerIndex === 1;

                    const distance = 2.5;
                    // Player 2 uses a steeper angle (35 degrees) to see over the building
                    const angle = isPlayer2 ? (35 * Math.PI) / 180 : (20 * Math.PI) / 180;
                    const heightOffset = isPlayer2 ? 0.8 : 0.5; // Higher camera for player 2

                    const offset = new THREE.Vector3(
                        -distance * Math.cos(angle),
                        heightOffset,
                        -distance * Math.sin(angle)
                    );
                    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);
                    camera.position.copy(character.position).add(offset);
                    controls.target.copy(character.position);
                }
            }


            // Update animation mixers
            if (mixers.length > 0) {
                for (const mixer of mixers) {
                    mixer.update(deltaTime);
                }
            }

            // ============ PHYSICS UPDATE ============
            // Step the physics world
            world.step(1 / 60);

            // Sync dice mesh with physics body (only if visible)
            if (diceMesh.visible) {
                // If dice should float, keep it at floating position
                if (diceShouldFloat && character) {
                    // Use player-specific angle to match camera
                    const currentPlayerIndex = currentPlayerIndexRef.current;
                    const isPlayer2 = currentPlayerIndex === 1;
                    const distance = 1.4; // Increased distance for better visibility
                    const angle = isPlayer2 ? (35 * Math.PI) / 180 : (20 * Math.PI) / 180;
                    const offset = new THREE.Vector3(
                        -distance * Math.cos(angle),
                        0.15, // Raised dice position to be fully visible
                        -distance * Math.sin(angle)
                    );
                    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);
                    const floatPosition = character.position.clone().add(offset);

                    diceMesh.position.set(floatPosition.x, floatPosition.y, floatPosition.z);

                    // Rotate faster based on charge power when charging
                    if (isChargingRef.current) {
                        const currentChargePower = chargePowerRef.current;
                        const spinSpeed = 0.02 + (currentChargePower / 100) * 0.3; // 0.02 to 0.32 based on charge
                        diceMesh.rotation.y += spinSpeed;
                        diceMesh.rotation.x += spinSpeed * 0.5;
                    } else {
                        diceMesh.rotation.y += 0.02; // Slowly rotate while floating
                    }

                    // Keep physics body synced with floating position
                    diceBody.position.set(floatPosition.x, floatPosition.y, floatPosition.z);
                    diceBody.velocity.set(0, 0, 0);
                    diceBody.angularVelocity.set(0, 0, 0);
                } else {
                    // Normal physics sync when rolling/landed
                    diceMesh.position.set(diceBody.position.x, diceBody.position.y, diceBody.position.z);
                    diceMesh.quaternion.set(diceBody.quaternion.x, diceBody.quaternion.y, diceBody.quaternion.z, diceBody.quaternion.w);
                }
            }

            // Check if dice has landed
            const currentVelocity = diceBody.velocity.length();
            const angularVelocity = diceBody.angularVelocity.length();

            if (isDiceRolling) {
                if (currentVelocity < VELOCITY_THRESHOLD && angularVelocity < VELOCITY_THRESHOLD) {
                    velocityCheckCount++;

                    if (velocityCheckCount >= STABLE_FRAMES_NEEDED) {
                        // Dice has stopped - determine the value
                        const finalValue = getDiceValue(diceBody);
                        setDiceValue(finalValue);
                        isDiceRolling = false;
                        velocityCheckCount = 0;

                        // Show dice result immediately when dice finishes tumbling
                        setShowDiceResult(true);

                        // Trigger character movement after a shorter delay (reduced from 500ms to 300ms)
                        setTimeout(() => {
                            const event = new CustomEvent('moveCharacter', { detail: { steps: finalValue } });
                            window.dispatchEvent(event);
                        }, 300);
                    }
                } else {
                    velocityCheckCount = 0;
                }
            }
            // ============ END PHYSICS UPDATE ============

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // Function to swap black model between stand and run
        const swapBlackModel = (useRun: boolean) => {
            const player = playersRef.current[0];
            if (!player.model || !blackStandModelRef.current || !blackRunModelRef.current) return;

            if (useRun) {
                // Switch to run model
                blackStandModelRef.current.visible = false;
                blackRunModelRef.current.visible = true;
                // Copy position and rotation from stand to run
                blackRunModelRef.current.position.copy(blackStandModelRef.current.position);
                blackRunModelRef.current.rotation.copy(blackStandModelRef.current.rotation);
                blackRunModelRef.current.scale.copy(blackStandModelRef.current.scale);
                // Update player model and mixer references
                player.model = blackRunModelRef.current;
                if (blackRunMixerRef.current) {
                    player.mixer = blackRunMixerRef.current;
                    // Ensure run animation is playing smoothly without looping
                    if (blackRunModelRef.current.animations && blackRunModelRef.current.animations.length > 0) {
                        const action = blackRunMixerRef.current.clipAction(blackRunModelRef.current.animations[0]);
                        action.setLoop(THREE.LoopRepeat, Infinity); // Loop repeatedly
                        action.timeScale = 1.0; // Normal speed
                        action.reset().play(); // Reset and play smoothly
                    }
                }
                character = blackRunModelRef.current;
            } else {
                // Switch back to stand model
                blackRunModelRef.current.visible = false;
                blackStandModelRef.current.visible = true;
                // Copy position and rotation from run to stand
                blackStandModelRef.current.position.copy(blackRunModelRef.current.position);
                blackStandModelRef.current.rotation.copy(blackRunModelRef.current.rotation);
                blackStandModelRef.current.scale.copy(blackStandModelRef.current.scale);
                // Update player model and mixer references
                player.model = blackStandModelRef.current;
                if (blackStandMixerRef.current) {
                    player.mixer = blackStandMixerRef.current;
                }
                character = blackStandModelRef.current;
            }
        };

        // Function to swap SM model between stand and run
        const swapSmModel = (useRun: boolean) => {
            const player = playersRef.current[2];
            if (!player.model || !smStandModelRef.current || !smRunModelRef.current) return;

            if (useRun) {
                // Switch to run model
                smStandModelRef.current.visible = false;
                smRunModelRef.current.visible = true;
                // Copy position and rotation from stand to run
                smRunModelRef.current.position.copy(smStandModelRef.current.position);
                smRunModelRef.current.rotation.copy(smStandModelRef.current.rotation);
                smRunModelRef.current.scale.copy(smStandModelRef.current.scale);
                // Update player model and mixer references
                player.model = smRunModelRef.current;
                if (smRunMixerRef.current) {
                    player.mixer = smRunMixerRef.current;
                    // Ensure run animation is playing smoothly
                    if (smRunModelRef.current.animations && smRunModelRef.current.animations.length > 0) {
                        const action = smRunMixerRef.current.clipAction(smRunModelRef.current.animations[0]);
                        action.setLoop(THREE.LoopRepeat, Infinity);
                        action.timeScale = 1.0;
                        action.reset().play();
                    }
                }
                character = smRunModelRef.current;
            } else {
                // Switch back to stand model
                smRunModelRef.current.visible = false;
                smStandModelRef.current.visible = true;
                // Copy position and rotation from run to stand
                smStandModelRef.current.position.copy(smRunModelRef.current.position);
                smStandModelRef.current.rotation.copy(smRunModelRef.current.rotation);
                smStandModelRef.current.scale.copy(smStandModelRef.current.scale);
                // Update player model and mixer references
                player.model = smStandModelRef.current;
                if (smStandMixerRef.current) {
                    player.mixer = smStandMixerRef.current;
                }
                character = smStandModelRef.current;
            }
        };

        // Function to swap Yellow model between stand and run
        const swapYellowModel = (useRun: boolean) => {
            const player = playersRef.current[1];
            if (!player.model || !yellowStandModelRef.current || !yellowRunModelRef.current) return;

            if (useRun) {
                // Switch to run model
                yellowStandModelRef.current.visible = false;
                yellowRunModelRef.current.visible = true;
                // Copy position and rotation from stand to run
                yellowRunModelRef.current.position.copy(yellowStandModelRef.current.position);
                yellowRunModelRef.current.rotation.copy(yellowStandModelRef.current.rotation);
                yellowRunModelRef.current.scale.copy(yellowStandModelRef.current.scale);
                // Update player model and mixer references
                player.model = yellowRunModelRef.current;
                if (yellowRunMixerRef.current) {
                    player.mixer = yellowRunMixerRef.current;
                    // Ensure run animation is playing smoothly
                    if (yellowRunModelRef.current.animations && yellowRunModelRef.current.animations.length > 0) {
                        const action = yellowRunMixerRef.current.clipAction(yellowRunModelRef.current.animations[0]);
                        action.setLoop(THREE.LoopRepeat, Infinity);
                        action.timeScale = 1.0;
                        action.reset().play();
                    }
                }
                character = yellowRunModelRef.current;
            } else {
                // Switch back to stand model
                yellowRunModelRef.current.visible = false;
                yellowStandModelRef.current.visible = true;
                // Copy position and rotation from run to stand
                yellowStandModelRef.current.position.copy(yellowRunModelRef.current.position);
                yellowStandModelRef.current.rotation.copy(yellowRunModelRef.current.rotation);
                yellowStandModelRef.current.scale.copy(yellowStandModelRef.current.scale);
                // Update player model and mixer references
                player.model = yellowStandModelRef.current;
                if (yellowStandMixerRef.current) {
                    player.mixer = yellowStandMixerRef.current;
                }
                character = yellowStandModelRef.current;
            }
        };

        // Function to swap Cyan model between stand and run
        const swapCyanModel = (useRun: boolean) => {
            const player = playersRef.current[3];
            if (!player.model || !cyanStandModelRef.current || !cyanRunModelRef.current) return;

            if (useRun) {
                // Switch to run model
                cyanStandModelRef.current.visible = false;
                cyanRunModelRef.current.visible = true;
                // Copy position and rotation from stand to run
                cyanRunModelRef.current.position.copy(cyanStandModelRef.current.position);
                cyanRunModelRef.current.rotation.copy(cyanStandModelRef.current.rotation);
                cyanRunModelRef.current.scale.copy(cyanStandModelRef.current.scale);
                // Update player model and mixer references
                player.model = cyanRunModelRef.current;
                if (cyanRunMixerRef.current) {
                    player.mixer = cyanRunMixerRef.current;
                    // Ensure run animation is playing smoothly
                    if (cyanRunModelRef.current.animations && cyanRunModelRef.current.animations.length > 0) {
                        const action = cyanRunMixerRef.current.clipAction(cyanRunModelRef.current.animations[0]);
                        action.setLoop(THREE.LoopRepeat, Infinity);
                        action.timeScale = 1.0;
                        action.reset().play();
                    }
                }
                character = cyanRunModelRef.current;
            } else {
                // Switch back to stand model
                cyanRunModelRef.current.visible = false;
                cyanStandModelRef.current.visible = true;
                // Copy position and rotation from run to stand
                cyanStandModelRef.current.position.copy(cyanRunModelRef.current.position);
                cyanStandModelRef.current.rotation.copy(cyanRunModelRef.current.rotation);
                cyanStandModelRef.current.scale.copy(cyanStandModelRef.current.scale);
                // Update player model and mixer references
                player.model = cyanStandModelRef.current;
                if (cyanStandMixerRef.current) {
                    player.mixer = cyanStandMixerRef.current;
                }
                character = cyanStandModelRef.current;
            }
        };



        // Handle character movement
        const moveCharacter = async (event: Event) => {
            const customEvent = event as CustomEvent<{ steps: number }>;
            const steps = customEvent.detail.steps;

            const currentPlayerIndex = currentPlayerIndexRef.current;
            const player = playersRef.current[currentPlayerIndex];

            // If model isn't loaded yet, skip
            if (!player.model) return;

            // Switch models to run animation when movement starts
            if (currentPlayerIndex === 0) {
                swapBlackModel(true);
            } else if (currentPlayerIndex === 1) {
                swapYellowModel(true);
            } else if (currentPlayerIndex === 2) {
                swapSmModel(true);
            } else if (currentPlayerIndex === 3) {
                swapCyanModel(true);
            }

            // Update global 'character' reference for camera focus
            character = player.model as THREE.Group;

            for (let i = 0; i < steps; i++) {
                const nextPosition = (player.currentPosition + 1) % tilePositions.length;
                const targetPos = tilePositions[nextPosition];

                // Check if the next position is a corner (need to rotate when arriving at corners 8, 16, 24, 0)
                const corners = [0, 8, 16, 24];
                // Don't rotate if it's the very first move (starting at position 0 and moving to 1)
                // Special case: if we're at position 31 and moving to 0, we DO need to rotate
                const isCompletingLoop = player.currentPosition === 31 && nextPosition === 0;

                // For logic simplicity, let's assume if we hit a corner we rotate
                // But we need to check if we are *entering* a new side.
                // Corners are indices 8, 16, 24, 0.
                const needsRotation = corners.includes(nextPosition);

                await new Promise<void>((resolve) => {
                    const startPos = player.model!.position.clone();
                    const endPos = new THREE.Vector3(targetPos.x, 10.6, targetPos.z);
                    const startRot = player.model!.rotation.y;

                    // Specific rotation logic:
                    // 0 -> 0 rad
                    // 8 -> -PI/2
                    // 16 -> -PI
                    // 24 -> -3PI/2 (or PI/2)
                    // Calculate rotation for target position - face the direction they'll be walking
                    let targetRot = 0;
                    if (nextPosition === 0) targetRot = 0; // Black model at start - facing forward
                    else if (nextPosition === 8) targetRot = Math.PI / 2; // Facing forward along path
                    else if (nextPosition === 16) targetRot = Math.PI; // SM model at corner - facing forward (down)
                    else if (nextPosition === 24) targetRot = -Math.PI / 2; // Facing forward along path
                    else if (nextPosition > 0 && nextPosition < 8) targetRot = 0; // Left column - facing forward (up)
                    else if (nextPosition > 8 && nextPosition < 16) targetRot = Math.PI / 2; // Bottom row - facing forward (right)
                    else if (nextPosition > 16 && nextPosition < 24) targetRot = Math.PI; // Right column - facing forward (down)
                    else if (nextPosition > 24) targetRot = -Math.PI / 2; // Top row - facing forward (left)

                    // Ensure shortest path rotation (avoid spinning 270 degrees)
                    let deltaRot = targetRot - startRot;
                    // Normalize delta to [-PI, PI]
                    while (deltaRot > Math.PI) deltaRot -= 2 * Math.PI;
                    while (deltaRot < -Math.PI) deltaRot += 2 * Math.PI;
                    // Adjust targetRot to be the closest equivalent angle
                    targetRot = startRot + deltaRot;

                    // Player-specific movement speeds: Player 1 (Yellow) moves faster
                    const duration = currentPlayerIndex === 1 ? 600 : 800; // Player 1 moves faster (600ms vs 800ms)
                    const startTime = Date.now();

                    function animateMove() {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);

                        player.model!.position.lerpVectors(startPos, endPos, progress);
                        player.model!.rotation.y = startRot + (targetRot - startRot) * progress;

                        if (progress < 1) {
                            requestAnimationFrame(animateMove);
                        } else {
                            player.rotation = targetRot;
                            player.currentPosition = nextPosition;
                            currentTileRef.current = nextPosition;
                            hasStarted = true;
                            resolve();
                        }
                    }
                    animateMove();
                });
            }

            // Switch models back to stand animation when movement ends
            if (currentPlayerIndex === 0) {
                swapBlackModel(false);
            } else if (currentPlayerIndex === 1) {
                swapYellowModel(false);
            } else if (currentPlayerIndex === 2) {
                swapSmModel(false);
            } else if (currentPlayerIndex === 3) {
                swapCyanModel(false);
            }

            // End of turn logic
            setIsMoving(false);
            setShowDiceResult(false);

            if (diceMeshRef.current) {
                diceMeshRef.current.visible = false;
            }

            diceShouldFloat = true;

            // Don't switch players here - wait for button click
            // The overlay will show, and when player clicks a button, smooth transition will happen
            setTimeout(() => {
                setShowTileOverlay(true);
            }, 500);
        };

        window.addEventListener('moveCharacter', moveCharacter);

        // Handle dice roll
        const rollDiceHandler = (event: Event) => {
            const customEvent = event as CustomEvent<{ power: number }>;
            const power = customEvent.detail.power; // 0-100

            // Calculate dice spawn position based on character position
            // Use player-specific angle to match camera
            const currentPlayerIndex = currentPlayerIndexRef.current;
            const isPlayer2 = currentPlayerIndex === 1;
            const distance = 1.4; // Increased distance for better visibility
            const angle = isPlayer2 ? (35 * Math.PI) / 180 : (20 * Math.PI) / 180;
            const spawnOffset = new THREE.Vector3(
                -distance * Math.cos(angle),
                0.2, // Raised spawn position to be fully visible
                -distance * Math.sin(angle)
            );

            // Apply character rotation to offset
            spawnOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character!.rotation.y);

            // Set dice position at character position with offset
            const spawnPosition = character!.position.clone().add(spawnOffset);

            // Reset dice position and apply random force
            diceBody.position.set(spawnPosition.x, spawnPosition.y - 0.5, spawnPosition.z);
            diceBody.velocity.set(0, 0, 0);
            diceBody.angularVelocity.set(0, 0, 0);

            // Random rotation
            diceBody.quaternion.setFromEuler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Calculate throw direction and power based on charge
            const powerMultiplier = power / 100; // 0 to 1
            const throwDirection = new CANNON.Vec3(
                -spawnPosition.x * 0.15,
                2 + powerMultiplier * 3, // Upward force: 2 to 5
                -spawnPosition.z * 0.15
            );

            // Apply random impulse for throwing (affected by charge power)
            const impulseStrength = 2 + powerMultiplier * 3; // 2 to 5
            const impulse = new CANNON.Vec3(
                throwDirection.x + (Math.random() - 0.5) * impulseStrength,
                throwDirection.y + Math.random() * impulseStrength * 0.5,
                throwDirection.z + (Math.random() - 0.5) * impulseStrength
            );
            diceBody.applyImpulse(impulse);

            // Apply random torque for spinning (increased for faster, smoother spinning)
            const torqueStrength = 30 + powerMultiplier * 40; // Increased to 30-70 for faster spin
            const torque = new CANNON.Vec3(
                (Math.random() - 0.5) * torqueStrength,
                (Math.random() - 0.5) * torqueStrength,
                (Math.random() - 0.5) * torqueStrength
            );
            diceBody.applyTorque(torque);

            // Apply initial angular velocity for smoother, faster spinning start
            const angularVelStrength = 12 + powerMultiplier * 18; // 12-30 for smooth initial spin
            diceBody.angularVelocity.set(
                (Math.random() - 0.5) * angularVelStrength,
                (Math.random() - 0.5) * angularVelStrength,
                (Math.random() - 0.5) * angularVelStrength
            );

            // Enable physics and disable floating
            diceShouldFloat = false;
            isDiceRolling = true;
            velocityCheckCount = 0;
        };

        window.addEventListener('rollDice', rollDiceHandler);

        // Helper function to calculate rotation based on tile position
        const getRotationForPosition = (position: number): number => {
            const corners = [0, 8, 16, 24];
            if (position === 0) return 0;
            if (position === 8) return -Math.PI / 2;
            if (position === 16) return -Math.PI;
            if (position === 24) return -3 * Math.PI / 2;

            // For positions between corners, determine which side they're on
            if (position > 0 && position < 8) return 0; // Top side
            if (position > 8 && position < 16) return -Math.PI / 2; // Right side
            if (position > 16 && position < 24) return -Math.PI; // Bottom side
            if (position > 24) return -3 * Math.PI / 2; // Left side

            return 0;
        };

        // Handle smooth player switch
        const switchToNextPlayer = () => {
            const currentPlayerIndex = currentPlayerIndexRef.current;
            const currentPlayer = playersRef.current[currentPlayerIndex];
            const nextPlayerIndex = (currentPlayerIndex + 1) % 4;
            const nextPlayer = playersRef.current[nextPlayerIndex];

            // Check if both players have models loaded
            if (!currentPlayer.model || !nextPlayer.model) {
                // If models aren't ready, just switch immediately
                currentPlayerIndexRef.current = nextPlayerIndex;
                character = nextPlayer.model as THREE.Group;
                return;
            }

            // Position next player at their current tile position on the board
            positionPlayerAtTile(nextPlayer, nextPlayer.currentPosition);
            const nextPlayerRotation = nextPlayer.rotation;

            // Use actual current camera position and target (more accurate)
            const currentCameraPos = camera.position.clone();
            const currentTarget = controls.target.clone();

            // Calculate next player camera position and target
            // Player 2 (Yellow) gets a higher angle to avoid building blocking view
            const isPlayer2 = nextPlayerIndex === 1;
            const distance = 2.5;
            // Player 2 uses a steeper angle (35 degrees) to see over the building
            const angle = isPlayer2 ? (35 * Math.PI) / 180 : (20 * Math.PI) / 180;
            const heightOffset = isPlayer2 ? 0.8 : 0.5; // Higher camera for player 2

            const nextOffset = new THREE.Vector3(
                -distance * Math.cos(angle),
                heightOffset,
                -distance * Math.sin(angle)
            );
            nextOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), nextPlayerRotation);
            const nextCameraPos = nextPlayer.model.position.clone().add(nextOffset);
            const nextTarget = nextPlayer.model.position.clone();

            // Store transition start values
            cameraTransitionStartPosRef.current = currentCameraPos.clone();
            cameraTransitionStartTargetRef.current = currentTarget.clone();
            cameraTransitionEndPosRef.current = nextCameraPos.clone();
            cameraTransitionEndTargetRef.current = nextTarget.clone();

            // Start transition
            isCameraTransitioningRef.current = true;
            cameraTransitionStartTimeRef.current = Date.now() * 0.001;

            // Switch to next player after transition completes
            setTimeout(() => {
                currentPlayerIndexRef.current = nextPlayerIndex;
                character = nextPlayer.model as THREE.Group;

                // Show dice in front of the new player and make it ready to roll
                if (diceMeshRef.current && nextPlayer.model) {
                    // Use player-specific angle to match camera
                    const isPlayer2 = nextPlayerIndex === 1;
                    const distance = 0.8;
                    const angle = isPlayer2 ? (35 * Math.PI) / 180 : (20 * Math.PI) / 180;
                    const offset = new THREE.Vector3(
                        -distance * Math.cos(angle),
                        0.15, // Raised dice position to be fully visible
                        -distance * Math.sin(angle)
                    );
                    // Use the updated rotation
                    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), nextPlayer.rotation);
                    const dicePosition = nextPlayer.model.position.clone().add(offset);

                    diceBody.position.set(dicePosition.x, dicePosition.y, dicePosition.z);
                    diceMeshRef.current.visible = true;
                    diceShouldFloat = true;
                }

                // Reset dice value and state for next player
                setDiceValue(null);
                setShowDiceResult(false);
                setIsMoving(false);
            }, 1500); // Match transition duration
        };

        window.addEventListener('switchToNextPlayer', switchToNextPlayer);

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Function to create paper with player image on a tile
        const createPaperOnTile = (tileIndex: number, playerImage: string, scene: THREE.Scene) => {
            // Remove existing paper if any
            if (papersRef.current.has(tileIndex)) {
                const existingPaper = papersRef.current.get(tileIndex);
                if (existingPaper) {
                    scene.remove(existingPaper);
                }
                papersRef.current.delete(tileIndex);
            }

            // Load player image texture
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(playerImage, (texture) => {
                // Create canvas for paper with rounded top
                const paperCanvas = document.createElement('canvas');
                const paperCtx = paperCanvas.getContext('2d');
                const paperWidth = 256;
                const paperHeight = 320;
                paperCanvas.width = paperWidth;
                paperCanvas.height = paperHeight;

                if (paperCtx) {
                    // Draw paper with rounded top corners
                    const radius = 30;
                    const borderWidth = 8;

                    paperCtx.fillStyle = '#f5f5dc';
                    paperCtx.strokeStyle = '#d4d4aa';
                    paperCtx.lineWidth = borderWidth;

                    // Draw paper shape with rounded top corners
                    paperCtx.beginPath();
                    paperCtx.moveTo(radius, 0);
                    paperCtx.lineTo(paperWidth - radius, 0);
                    paperCtx.quadraticCurveTo(paperWidth, 0, paperWidth, radius);
                    paperCtx.lineTo(paperWidth, paperHeight);
                    paperCtx.lineTo(0, paperHeight);
                    paperCtx.lineTo(0, radius);
                    paperCtx.quadraticCurveTo(0, 0, radius, 0);
                    paperCtx.closePath();
                    paperCtx.fill();
                    paperCtx.stroke();

                    // Draw player image
                    const imageSize = 160;
                    const imageX = (paperWidth - imageSize) / 2;
                    const imageY = 40;

                    // Create circular clip for image
                    paperCtx.save();
                    paperCtx.beginPath();
                    paperCtx.arc(paperWidth / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2);
                    paperCtx.clip();
                    paperCtx.drawImage(texture.image, imageX, imageY, imageSize, imageSize);
                    paperCtx.restore();

                    // Draw border around image
                    paperCtx.beginPath();
                    paperCtx.arc(paperWidth / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2);
                    paperCtx.strokeStyle = '#ffd700';
                    paperCtx.lineWidth = 6;
                    paperCtx.stroke();
                }

                // Create texture from canvas
                const paperTexture = new THREE.CanvasTexture(paperCanvas);

                // Create paper geometry (width matches tile size: 1.25, height: 1.2)
                const paperGeometry = new THREE.PlaneGeometry(1.25, 1.2);
                const paperMaterial = new THREE.MeshStandardMaterial({
                    map: paperTexture,
                    side: THREE.DoubleSide,
                    transparent: true
                });
                const paperMesh = new THREE.Mesh(paperGeometry, paperMaterial);

                // Position paper on the tile
                const tilePos = tilePositions[tileIndex];

                // Determine position based on which side of the board the tile is on
                // Left column: x is min, place paper at left edge
                // Bottom row: z is max, place paper at bottom edge
                // Right column: x is max, place paper at right edge
                // Top row: z is min, place paper at top edge
                const isLeftCol = tileIndex >= 0 && tileIndex < 9;
                const isBottomRow = tileIndex >= 9 && tileIndex < 17;
                const isRightCol = tileIndex >= 17 && tileIndex < 25;
                const isTopRow = tileIndex >= 25 && tileIndex < 32;

                let paperX = tilePos.x;
                let paperZ = tilePos.z;
                let rotationY = 0;

                if (isLeftCol) {
                    // Left side - place paper at inner edge (facing center)
                    paperX = tilePos.x + 0.6;
                    rotationY = -Math.PI / 2; // Face right (toward center)
                } else if (isBottomRow) {
                    // Bottom side - place paper at inner edge (facing center)
                    paperZ = tilePos.z - 0.6;
                    rotationY = Math.PI; // Face backward (toward center)
                } else if (isRightCol) {
                    // Right side - place paper at inner edge (facing center)
                    paperX = tilePos.x - 0.6;
                    rotationY = Math.PI / 2; // Face left (toward center)
                } else if (isTopRow) {
                    // Top side - place paper at inner edge (facing center)
                    paperZ = tilePos.z + 0.6;
                    rotationY = 0; // Face forward (toward center)
                }

                // Position paper (laying flat initially)
                paperMesh.position.set(paperX, 11, paperZ);
                paperMesh.rotation.x = -Math.PI / 2; // Lay flat initially
                paperMesh.rotation.y = rotationY;
                paperMesh.castShadow = true;
                paperMesh.receiveShadow = true;

                scene.add(paperMesh);
                papersRef.current.set(tileIndex, paperMesh);

                // Delay animation to wait for overlay to close
                setTimeout(() => {
                    // Animate paper standing up
                    const startRotationX = paperMesh.rotation.x;
                    const targetRotationX = 0; // Stand up vertically
                    const duration = 400; // Slightly longer duration
                    const startTime = Date.now();

                    function animatePaper() {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeOut = 1 - Math.pow(1 - progress, 3);

                        paperMesh.rotation.x = startRotationX + (targetRotationX - startRotationX) * easeOut;

                        if (progress < 1) {
                            requestAnimationFrame(animatePaper);
                        }
                    }
                    animatePaper();
                }, 800); // 800ms delay before animation starts (wait for overlay to close)
            });
        };

        // Listen for paper placement events
        const handlePlacePaper = (event: Event) => {
            const customEvent = event as CustomEvent<{ tileIndex: number; playerImage: string }>;
            const { tileIndex, playerImage } = customEvent.detail;
            createPaperOnTile(tileIndex, playerImage, scene);
        };

        window.addEventListener('placePaper', handlePlacePaper);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('moveCharacter', moveCharacter);
            window.removeEventListener('rollDice', rollDiceHandler);
            window.removeEventListener('switchToNextPlayer', switchToNextPlayer);
            window.removeEventListener('placePaper', handlePlacePaper);
            renderer.dispose();
            controls.dispose();
        };
    }, []);

    // Separate scene for house display in overlay
    useEffect(() => {
        if (!houseCanvasRef.current || !houseContainerRef.current || !showTileOverlay) return;

        const scene = new THREE.Scene();
        // Transparent background - only show the house

        const camera = new THREE.PerspectiveCamera(
            50,
            houseContainerRef.current.clientWidth / houseContainerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(5, 4, 5);
        camera.lookAt(0, 1, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas: houseCanvasRef.current,
            antialias: true,
            alpha: true
        });
        renderer.setSize(houseContainerRef.current.clientWidth, houseContainerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        // Lighting for house scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffd700, 0.8, 20);
        pointLight.position.set(-3, 5, 3);
        scene.add(pointLight);

        // Load house model
        const loader = new GLTFLoader();
        let houseModel: THREE.Object3D | null = null;

        loader.load(
            '/game2/house_01.glb',
            (gltf) => {
                houseModel = gltf.scene;
                houseModel.position.set(0, 1.5, 0);
                houseModel.scale.set(2.4, 2.4, 2.4);
                houseModel.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                    }
                });
                scene.add(houseModel);
                console.log('House loaded successfully');
            },
            (progress) => {
                console.log('House loading:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading house:', error);
            }
        );

        // Animation loop
        let animationFrameId: number;
        function animate() {
            animationFrameId = requestAnimationFrame(animate);

            if (houseModel) {
                houseModel.rotation.y += 0.005;
            }

            renderer.render(scene, camera);
        }
        animate();

        // Handle resize
        const handleResize = () => {
            if (!houseContainerRef.current) return;
            const width = houseContainerRef.current.clientWidth;
            const height = houseContainerRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
        };
    }, [showTileOverlay]);

    // Helper function to handle action selection (END TURN, PAY, TRADE, BANKRUPT)
    const handleActionSelection = () => {
        // Hide dice immediately when action is selected
        if (diceMeshRef.current) {
            diceMeshRef.current.visible = false;
        }
        setShowTileOverlay(false);
        setShowDiceResult(false);
        // Smoothly switch to next player
        setTimeout(() => {
            const event = new CustomEvent('switchToNextPlayer');
            window.dispatchEvent(event);
        }, 300);
    };

    // Helper function to handle PAY action - places paper on current tile
    const handlePayAction = () => {
        // Hide dice immediately when action is selected
        if (diceMeshRef.current) {
            diceMeshRef.current.visible = false;
        }

        // Get current player info
        const currentPlayerIndex = currentPlayerIndexRef.current;
        const currentTile = currentTileRef.current;

        // Get player image from the players array (first 4 are the game players)
        const playerImage = players[currentPlayerIndex]?.image || '/game2/greenguy.glb';

        // Close overlay immediately
        setShowTileOverlay(false);
        setShowDiceResult(false);

        // Dispatch event to place paper on current tile
        const event = new CustomEvent('placePaper', {
            detail: {
                tileIndex: currentTile,
                playerImage: playerImage
            }
        });
        window.dispatchEvent(event);

        // Switch to next player after paper animation completes
        setTimeout(() => {
            const switchEvent = new CustomEvent('switchToNextPlayer');
            window.dispatchEvent(switchEvent);
        }, 1200); // 800ms delay + 400ms animation duration
    };

    return (
        <>
            <Head>
                <link rel="preload" href="/fonts/LuckiestGuy.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <link rel="preload" href="/fonts/LuckiestGuy-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
            </Head>
            <div ref={containerRef} className="h-screen w-full overflow-hidden relative" style={{
                background: 'linear-gradient(135deg, #0a0015 0%, #1a0033 50%, #0a0015 100%)'
            }}>
                {/* Account Display - Top Right */}
                {isLoggedIn && introComplete && (
                    <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                        {/* User Account Button */}
                        <div className="relative" ref={accountMenuRef}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAccountMenu(!showAccountMenu);
                                }}
                                className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-pink-500/40 rounded-full px-4 py-2 hover:border-pink-400/60 transition-all"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-pink-400 flex items-center justify-center bg-pink-500/10">
                                    {displayImage ? (
                                        <img
                                            src={displayImage}
                                            alt={displayName || "User"}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <AvatarIcon name="default" size={16} className="text-pink-400" />
                                    )}
                                </div>
                                <span className="text-white font-medium text-sm">{displayName}</span>
                            </button>

                            {/* Account Dropdown Menu */}
                            {showAccountMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-xl border border-pink-500/40 rounded-2xl overflow-hidden">
                                    <div className="p-3 border-b border-pink-500/20">
                                        <p className="text-purple-300/60 text-xs">Signed in as</p>
                                        <p className="text-white text-sm font-medium truncate">{displayName}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLogout();
                                        }}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        <span className="text-sm font-medium">Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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

                {/* Player Board Overlay - Top Left */}
                {introComplete && (
                    <div className="absolute top-4 left-4 z-10">
                        <style jsx>{`
                        @keyframes pulse-border {
                            0%, 100% { opacity: 0.5; }
                            50% { opacity: 1; }
                        }
                    `}</style>
                        <div className="relative bg-slate-900/70 backdrop-blur-lg rounded-xl p-3 border border-cyan-500/40 shadow-2xl overflow-hidden" style={{ maxWidth: '240px' }}>
                            {/* Subtle grid pattern */}
                            <div className="absolute inset-0 opacity-5" style={{
                                backgroundImage: `
                                linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px),
                                linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px)
                            `,
                                backgroundSize: '8px 8px'
                            }} />

                            {/* Corner accents */}
                            <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-cyan-400/60 rounded-tl" />
                            <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-cyan-400/60 rounded-tr" />
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-cyan-400/60 rounded-bl" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-cyan-400/60 rounded-br" />

                            {players.map((player, index) => (
                                <div key={player.id} className="relative">
                                    <div className={`flex items-center gap-3 py-2.5 px-2 rounded-lg transition-all duration-300 ${index === 0 ? 'bg-cyan-500/15 border border-cyan-500/30' : ''}`}>
                                        {/* Player Image */}
                                        <div className="relative w-12 h-12 flex-shrink-0">
                                            {index === 0 && (
                                                <>
                                                    {/* Rotating dashed ring for active player */}
                                                    <div className="absolute inset-0 rounded-lg border border-dashed border-cyan-500/40 animate-spin" style={{ animationDuration: '8s' }} />
                                                    {/* Solid border */}
                                                    <div className="absolute -inset-0.5 rounded-lg border border-cyan-400/50" style={{ animation: 'pulse-border 2s ease-in-out infinite' }} />
                                                </>
                                            )}
                                            <div className="w-full h-full rounded-lg overflow-hidden bg-slate-800">
                                                <img
                                                    src={player.image}
                                                    alt={player.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        {/* Player Name and Balance */}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-cyan-300 text-sm font-bold tracking-wide uppercase"
                                                style={{ fontFamily: '"Rajdhani", "Orbitron", sans-serif', textShadow: index === 0 ? '0 0 10px rgba(0, 255, 255, 0.5)' : 'none' }}>
                                                {player.name}
                                            </span>
                                            <span className="text-emerald-400 text-xs font-medium tracking-wider"
                                                style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                                                ⬡ {player.balance.toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Active indicator */}
                                        {index === 0 && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-2 h-2 bg-cyan-400 rounded-full" style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.9)' }} />
                                                <div className="text-[8px] text-cyan-400 font-mono tracking-wider">ACT</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    {index < players.length - 1 && (
                                        <div className="relative h-px my-2 mx-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-400/60 rounded-full" />
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-400/60 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lightning arc canvas */}
                <canvas
                    ref={lightningCanvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 15 }}
                />

                {/* Dice Roll Button */}
                {introComplete && (
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 z-10">
                        {showDiceResult && diceValue !== null && (
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
                                <canvas
                                    ref={diceResultCanvasRef}
                                    className="w-20 h-20"
                                />
                            </div>
                        )}

                        <button
                            ref={buttonRef}
                            onMouseDown={startCharging}
                            onMouseUp={releaseCharging}
                            onMouseLeave={releaseCharging}
                            onTouchStart={startCharging}
                            onTouchEnd={releaseCharging}
                            disabled={isMoving}
                            className="relative disabled:opacity-50 select-none"
                            style={{
                                background: 'rgba(10, 10, 26, 0.8)',
                                border: '2px solid #00ffff',
                                boxShadow: isCharging ? '0 0 15px rgba(0, 255, 255, 0.5)' : 'none'
                            }}
                        >
                            <span className="font-bold py-3 px-6 text-lg block"
                                style={{
                                    color: isCharging ? '#00ffff' : '#00ffcc',
                                    fontFamily: '"Luckiest Guy", cursive, fantasy, sans-serif',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {isMoving ? '[MOVING...]' : isCharging ? '[RELEASE TO LAUNCH]' : '[HOLD & ROLL]'}
                            </span>
                        </button>

                        {/* Add custom styles */}
                        <style jsx>{`
                    @keyframes scan {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(100%); }
                    }
                    @keyframes border-flow {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.5; }
                        50% { opacity: 0.8; }
                    }
                    .text-shadow-glow {
                        text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
                    }
                `}</style>
                    </div>
                )}

                {/* Tile Overlay with split-screen layout */}
                {showTileOverlay && (
                    <div className="absolute inset-0 flex z-40">
                        {/* Unified blur layer behind everything */}
                        <div className="absolute inset-0 backdrop-blur-md bg-black/30 -z-10"></div>

                        {/* Left side - buttons (40%) */}
                        <div className="w-[40%] relative flex flex-col justify-center items-end gap-4 p-8">
                            <style jsx>{`
                            @keyframes pulse-glow {
                                0%, 100% { opacity: 0.5; }
                                50% { opacity: 1; }
                            }
                        `}</style>
                            {/* Option buttons */}
                            <button
                                onClick={handleActionSelection}
                                className="w-[60%] relative group text-left font-bold py-3 px-5 rounded-lg transition-all duration-300 transform hover:scale-102 active:scale-98 flex items-center gap-3"
                                style={{
                                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
                                    border: '2px solid #00ffff',
                                    fontFamily: '"Luckiest Guy", cursive, fantasy, sans-serif',
                                    color: '#00ffcc',
                                    fontSize: '1.25rem',
                                    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>✕</span>
                                <span>END TURN</span>
                            </button>

                            <button
                                onClick={handlePayAction}
                                className="w-[60%] relative group text-left font-bold py-3 px-5 rounded-lg transition-all duration-300 transform hover:scale-102 active:scale-98 flex items-center gap-3"
                                style={{
                                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
                                    border: '2px solid #ffd700',
                                    fontFamily: '"Luckiest Guy", cursive, fantasy, sans-serif',
                                    color: '#ffd700',
                                    fontSize: '1.25rem',
                                    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>💵</span>
                                <span>PAY</span>
                            </button>

                            <button
                                onClick={handleActionSelection}
                                className="w-[60%] relative group text-left font-bold py-3 px-5 rounded-lg transition-all duration-300 transform hover:scale-102 active:scale-98 flex items-center gap-3"
                                style={{
                                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
                                    border: '2px solid #a855f7',
                                    fontFamily: '"Luckiest Guy", cursive, fantasy, sans-serif',
                                    color: '#d8b4fe',
                                    fontSize: '1.25rem',
                                    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>⇄</span>
                                <span>TRADE</span>
                            </button>

                            <button
                                onClick={handleActionSelection}
                                className="w-[60%] relative group text-left font-bold py-3 px-5 rounded-lg transition-all duration-300 transform hover:scale-102 active:scale-98 flex items-center gap-3"
                                style={{
                                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
                                    border: '2px solid #ef4444',
                                    fontFamily: '"Luckiest Guy", cursive, fantasy, sans-serif',
                                    color: '#f87171',
                                    fontSize: '1.25rem',
                                    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>⚠</span>
                                <span>BANKRUPT</span>
                            </button>
                        </div>

                        {/* Right side - house 3D scene (60%) */}
                        <div className="w-[60%] relative">
                            {/* Toggle buttons - vertically centered on right */}
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10 flex flex-col gap-2">
                                <button
                                    onClick={() => setRightViewMode('model')}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        rightViewMode === 'model'
                                            ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50 scale-110'
                                            : 'bg-black/50 text-cyan-400 border border-cyan-500/50 hover:bg-black/70'
                                    }`}
                                    title="View 3D Model"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 20h20"></path>
                                        <path d="m5 16 4-8 4 6 5-10 4 8"></path>
                                        <path d="M3.5 12h17"></path>
                                        <path d="M7 8v8"></path>
                                        <path d="M12 10v4"></path>
                                        <path d="M17 8v8"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setRightViewMode('nft')}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        rightViewMode === 'nft'
                                            ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/50 scale-110'
                                            : 'bg-black/50 text-purple-400 border border-purple-500/50 hover:bg-black/70'
                                    }`}
                                    title="View NFT Card"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="9" x2="21" y2="9"></line>
                                        <line x1="9" y1="21" x2="9" y2="9"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Content - conditionally render model or NFT card */}
                            {/* House 3D Scene - always rendered but visibility controlled */}
                            <div ref={houseContainerRef} className="w-full h-full relative" style={{ display: rightViewMode === 'model' ? 'block' : 'none' }}>
                                <canvas ref={houseCanvasRef} className="absolute inset-0 w-full h-full" />
                            </div>

                            {/* NFT Card Display - visibility controlled */}
                            <div className="w-full h-full flex items-center justify-center p-8" style={{ display: rightViewMode === 'nft' ? 'flex' : 'none' }}>
                                <div className="w-full max-w-md" style={{ transform: 'translate(10%, 10%)' }}>
                                    <NFTCard
                                        id={1}
                                        name="Luxury Villa"
                                        image="/game2/house_01.glb"
                                        rarity="LEGENDARY"
                                        price="1,500,000"
                                        description="A stunning luxury villa with panoramic views, featuring modern architecture, premium finishes, and state-of-the-art amenities. Perfect for those seeking the ultimate in comfort and style."
                                        color="#00ffff"
                                        glowColor="#00ffff"
                                        contractAddress="0x1234567890abcdef1234567890abcdef12345678"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}