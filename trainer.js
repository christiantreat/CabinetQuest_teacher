/**
 * Trauma Room Trainer - Training Mode
 * First-person 3D medical equipment training simulator
 */

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

let scene, camera, renderer;
let cartMeshes = new Map(); // Map cartId -> THREE.Group
let currentScenario = null;
let foundItems = new Set(); // Track which items have been found
let startTime = null;
let timerInterval = null;
let isPointerLocked = false;
let controls = null;

// Player state
let playerPosition = new THREE.Vector3(0, 1.67, 12); // 5.5 ft eye height, starting at front
let playerRotation = { yaw: 0, pitch: 0 };
let playerVelocity = new THREE.Vector3();

// Input state
const keys = { w: false, a: false, s: false, d: false, shift: false };
const moveSpeed = 5.0; // feet per second
const sprintMultiplier = 1.8;
const mouseSensitivity = 0.002;

// Raycasting for interaction
const raycaster = new THREE.Raycaster();
raycaster.far = 3; // Only detect things within 3 feet
let lookingAtDrawer = null;

// Room dimensions (matching designer)
const ROOM_WIDTH = 30;  // feet
const ROOM_DEPTH = 25;  // feet
const ROOM_HEIGHT = 10; // feet

// Configuration data
let CONFIG = null;
let currentCameraView = null; // Current active camera view
let isFirstPersonMode = true; // Toggle between first-person and camera views

// ============================================================================
// SOUND EFFECTS SYSTEM
// ============================================================================

// Sound manager (users can add their own audio files)
const SOUNDS = {
    drawerOpen: null,     // new Audio('sounds/drawer-open.mp3')
    drawerClose: null,    // new Audio('sounds/drawer-close.mp3')
    itemFound: null,      // new Audio('sounds/item-found.mp3')
    scenarioComplete: null, // new Audio('sounds/success.mp3')
    footstep: null,       // new Audio('sounds/footstep.mp3')
    ambient: null         // new Audio('sounds/ambient-hospital.mp3')
};

let soundEnabled = true;

// Initialize sounds (load audio files if they exist)
function initSounds() {
    // Try to load sounds, fail silently if files don't exist
    Object.keys(SOUNDS).forEach(soundName => {
        try {
            const audio = new Audio(`sounds/${soundName}.mp3`);
            audio.volume = 0.5; // Default volume
            audio.addEventListener('error', () => {
                // Sound file doesn't exist, that's ok
                console.log(`Sound file not found: ${soundName}.mp3 (optional)`);
            });
            SOUNDS[soundName] = audio;
        } catch (error) {
            // Silently fail - sounds are optional
        }
    });

    // Load sound preference
    const savedPreference = localStorage.getItem('traumaTrainerSound');
    soundEnabled = savedPreference !== 'false'; // Default true

    console.log(`✓ Sound system initialized (${soundEnabled ? 'enabled' : 'muted'})`);
}

// Play a sound effect
function playSound(soundName) {
    if (!soundEnabled) return;

    const sound = SOUNDS[soundName];
    if (sound && sound.readyState >= 2) { // HAVE_CURRENT_DATA
        sound.currentTime = 0; // Reset to start
        sound.play().catch(err => {
            // Autoplay might be blocked by browser, that's ok
            console.log(`Could not play sound: ${soundName}`);
        });
    }
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('traumaTrainerSound', soundEnabled.toString());

    // Stop ambient sound if disabling
    if (!soundEnabled && SOUNDS.ambient) {
        SOUNDS.ambient.pause();
    }

    console.log(`Sound ${soundEnabled ? 'enabled' : 'disabled'}`);
    return soundEnabled;
}

// Set sound volume (0-1)
function setSoundVolume(volume) {
    Object.values(SOUNDS).forEach(sound => {
        if (sound) sound.volume = Math.max(0, Math.min(1, volume));
    });
}

// ============================================================================
// PERFORMANCE & OPTIMIZATION
// ============================================================================

// Quality presets
const QUALITY_PRESETS = {
    low: {
        name: 'Low Quality',
        shadows: false,
        antialias: false,
        pixelRatio: 1,
        shadowMapSize: 512,
        maxLights: 2,
        fog: false,
        description: 'Best for older devices'
    },
    medium: {
        name: 'Medium Quality',
        shadows: true,
        antialias: false,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        shadowMapSize: 1024,
        maxLights: 3,
        fog: true,
        description: 'Balanced performance'
    },
    high: {
        name: 'High Quality',
        shadows: true,
        antialias: true,
        pixelRatio: window.devicePixelRatio,
        shadowMapSize: 2048,
        maxLights: 3,
        fog: true,
        description: 'Best visual quality'
    }
};

// Current quality setting
let currentQuality = 'medium';

// Performance monitoring
let performanceStats = {
    fps: 0,
    frameTime: 0,
    lastFrameTime: 0,
    frames: 0,
    lastFpsUpdate: 0
};

// Auto-detect optimal quality based on device
function detectOptimalQuality() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasHighDPI = window.devicePixelRatio > 1.5;
    const gpuTier = detectGPUTier();

    if (isMobile) {
        return 'low';
    } else if (gpuTier === 'high' && hasHighDPI) {
        return 'high';
    } else {
        return 'medium';
    }
}

// Simple GPU tier detection
function detectGPUTier() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return 'low';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'medium';

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    // Simple heuristic based on common GPU names
    if (/NVIDIA|GeForce GTX|RTX|AMD Radeon RX/i.test(renderer)) {
        return 'high';
    } else if (/Intel HD|Intel UHD|Integrated/i.test(renderer)) {
        return 'low';
    }

    return 'medium';
}

// Apply quality settings
function applyQualitySettings(quality) {
    console.log(`Applying quality settings: ${quality}`);

    const settings = QUALITY_PRESETS[quality];
    currentQuality = quality;

    if (renderer) {
        renderer.setPixelRatio(settings.pixelRatio);
        renderer.shadowMap.enabled = settings.shadows;

        if (settings.shadows) {
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
    }

    if (scene) {
        // Update fog
        if (settings.fog) {
            scene.fog = new THREE.Fog(0x87CEEB, 20, 50);
        } else {
            scene.fog = null;
        }

        // Update lights
        scene.traverse((object) => {
            if (object.isLight && object.type === 'PointLight') {
                object.castShadow = settings.shadows;
                if (object.shadow) {
                    object.shadow.mapSize.width = settings.shadowMapSize;
                    object.shadow.mapSize.height = settings.shadowMapSize;
                }
            }
        });
    }

    // Save to localStorage
    localStorage.setItem('traumaTrainerQuality', quality);

    console.log(`✓ Quality set to ${settings.name}`);
}

// Load saved quality preference
function loadQualityPreference() {
    const saved = localStorage.getItem('traumaTrainerQuality');
    if (saved && QUALITY_PRESETS[saved]) {
        return saved;
    }
    return detectOptimalQuality();
}

// Update performance stats
function updatePerformanceStats(currentTime) {
    performanceStats.frames++;

    const deltaTime = currentTime - performanceStats.lastFrameTime;
    performanceStats.frameTime = deltaTime;
    performanceStats.lastFrameTime = currentTime;

    // Update FPS every second
    if (currentTime - performanceStats.lastFpsUpdate >= 1000) {
        performanceStats.fps = Math.round(performanceStats.frames);
        performanceStats.frames = 0;
        performanceStats.lastFpsUpdate = currentTime;

        // Update FPS display if visible
        const fpsValue = document.getElementById('fps-value');
        if (fpsValue) {
            fpsValue.textContent = performanceStats.fps;

            // Color code based on performance
            const fpsCounter = document.getElementById('fps-counter');
            if (fpsCounter) {
                if (performanceStats.fps >= 55) {
                    fpsCounter.style.color = '#4CAF50'; // Green
                } else if (performanceStats.fps >= 30) {
                    fpsCounter.style.color = '#FF9800'; // Orange
                } else {
                    fpsCounter.style.color = '#F44336'; // Red
                }
            }
        }

        // Auto-adjust quality if performance is poor
        if (performanceStats.fps < 30 && currentQuality !== 'low') {
            console.warn(`Low FPS detected (${performanceStats.fps}), consider lowering quality`);
            // Could auto-switch to lower quality here
        }
    }
}

// Toggle FPS counter visibility
function toggleFPSCounter() {
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) {
        const isVisible = fpsCounter.style.display !== 'none';
        fpsCounter.style.display = isVisible ? 'none' : 'block';
        console.log(`FPS counter ${isVisible ? 'hidden' : 'shown'}`);
    }
}

// ============================================================================
// CAMERA VIEW SYSTEM
// ============================================================================

function switchCameraView(viewId) {
    if (!CONFIG || !CONFIG.cameraViews) return;

    const view = CONFIG.cameraViews.find(v => v.id === viewId);
    if (!view) return;

    currentCameraView = view;
    isFirstPersonMode = false;

    // Apply camera view
    playerPosition.set(view.position.x, view.position.y, view.position.z);
    camera.fov = view.fov;
    camera.updateProjectionMatrix();

    // Look at target
    const lookAt = new THREE.Vector3(view.lookAt.x, view.lookAt.y, view.lookAt.z);
    const direction = lookAt.sub(playerPosition).normalize();

    playerRotation.yaw = Math.atan2(direction.x, direction.z);
    playerRotation.pitch = Math.asin(-direction.y);

    console.log(`Switched to camera view: ${view.name}`);
    showNotification(`Camera View: ${view.name}`);
}

function toggleFirstPersonMode() {
    isFirstPersonMode = !isFirstPersonMode;

    if (isFirstPersonMode) {
        // Reset to first-person mode
        currentCameraView = null;
        camera.fov = 75;
        camera.updateProjectionMatrix();
        showNotification('First Person Mode');
    } else if (CONFIG && CONFIG.cameraViews && CONFIG.cameraViews.length > 0) {
        // Switch to first available camera view
        switchCameraView(CONFIG.cameraViews[0].id);
    }
}

function cycleCameraViews(direction = 1) {
    if (!CONFIG || !CONFIG.cameraViews || CONFIG.cameraViews.length === 0) return;

    if (isFirstPersonMode) {
        // Switch from first-person to first camera view
        switchCameraView(CONFIG.cameraViews[0].id);
        return;
    }

    const currentIndex = CONFIG.cameraViews.findIndex(v => v.id === currentCameraView?.id);
    let nextIndex = (currentIndex + direction + CONFIG.cameraViews.length) % CONFIG.cameraViews.length;

    // If cycling back to start, go to first-person mode
    if (direction > 0 && nextIndex === 0 && currentIndex === CONFIG.cameraViews.length - 1) {
        toggleFirstPersonMode();
        return;
    }

    switchCameraView(CONFIG.cameraViews[nextIndex].id);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.position = 'absolute';

    // Adjust position for mobile vs desktop
    const isMobile = window.innerWidth <= 768;
    notification.style.top = isMobile ? '80px' : '100px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.background = 'rgba(0, 0, 0, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = isMobile ? '12px 24px' : '10px 20px';
    notification.style.borderRadius = '8px';
    notification.style.fontSize = isMobile ? '16px' : '14px';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '1000';
    notification.style.border = '2px solid #0e639c';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
    notification.style.maxWidth = isMobile ? '80%' : 'auto';
    notification.style.textAlign = 'center';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// ============================================================================
// MOBILE CAMERA CONTROLS
// ============================================================================

function mobileCycleCameraView() {
    cycleCameraViews(1);
}

function buildMobileCameraMenu() {
    const menuItems = document.getElementById('mobile-camera-menu-items');
    if (!menuItems) return;

    menuItems.innerHTML = '';

    // First-person mode option
    const firstPersonItem = document.createElement('div');
    firstPersonItem.className = 'mobile-camera-menu-item';
    if (isFirstPersonMode) firstPersonItem.classList.add('active');
    firstPersonItem.textContent = '🎮 First Person';
    firstPersonItem.onclick = () => {
        if (!isFirstPersonMode) toggleFirstPersonMode();
        closeMobileCameraMenu();
    };
    menuItems.appendChild(firstPersonItem);

    // Camera view options
    if (CONFIG && CONFIG.cameraViews) {
        CONFIG.cameraViews.forEach(view => {
            const item = document.createElement('div');
            item.className = 'mobile-camera-menu-item';
            if (!isFirstPersonMode && currentCameraView?.id === view.id) {
                item.classList.add('active');
            }
            item.textContent = `📷 ${view.name}`;
            item.onclick = () => {
                switchCameraView(view.id);
                closeMobileCameraMenu();
                updateMobileCameraMenu();
            };
            menuItems.appendChild(item);
        });
    }
}

function toggleMobileCameraMenu() {
    const menu = document.getElementById('mobile-camera-menu');
    if (menu) {
        menu.classList.toggle('visible');
        if (menu.classList.contains('visible')) {
            buildMobileCameraMenu();
        }
    }
}

function closeMobileCameraMenu() {
    const menu = document.getElementById('mobile-camera-menu');
    if (menu) {
        menu.classList.remove('visible');
    }
}

function updateMobileCameraMenu() {
    const menu = document.getElementById('mobile-camera-menu');
    if (menu && menu.classList.contains('visible')) {
        buildMobileCameraMenu();
    }
}

// Long press to open camera menu, quick tap to cycle
let cameraBtnPressTimer = null;
let cameraBtnPressStartTime = 0;

function setupMobileCameraButton() {
    const btn = document.getElementById('mobile-camera-cycle');
    if (!btn) return;

    // Touch events
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        cameraBtnPressStartTime = Date.now();
        cameraBtnPressTimer = setTimeout(() => {
            toggleMobileCameraMenu();
        }, 500); // Long press = 500ms
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        const pressDuration = Date.now() - cameraBtnPressStartTime;
        clearTimeout(cameraBtnPressTimer);

        if (pressDuration < 500) {
            // Quick tap - cycle camera
            closeMobileCameraMenu();
            mobileCycleCameraView();
        }
    });

    btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        clearTimeout(cameraBtnPressTimer);
    });
}

// Close menu when tapping outside
function setupMobileCameraMenuClose() {
    document.addEventListener('touchstart', (e) => {
        const menu = document.getElementById('mobile-camera-menu');
        const btn = document.getElementById('mobile-camera-cycle');

        if (menu && menu.classList.contains('visible')) {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                closeMobileCameraMenu();
            }
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load configuration from localStorage or use defaults
function loadConfiguration() {
    try {
        const saved = localStorage.getItem('traumaRoomConfig');
        if (saved) {
            CONFIG = JSON.parse(saved);
            console.log('✓ Configuration loaded from localStorage');
        } else {
            console.warn('No saved configuration found, using defaults');
            CONFIG = getDefaultConfig();
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
        CONFIG = getDefaultConfig();
    }
}

function getDefaultConfig() {
    return {
        carts: [
            { id: 'cart1', name: 'Airway Cart', color: '#4CAF50', x: 0.2, y: 0.3, type: 'airway', rotation: 0 },
            { id: 'cart2', name: 'Medication Cart', color: '#2196F3', x: 0.5, y: 0.3, type: 'medication', rotation: 0 },
            { id: 'cart3', name: 'Code Cart', color: '#F44336', x: 0.8, y: 0.3, type: 'crash', rotation: 0 }
        ],
        drawers: [
            { id: 'drawer1', name: 'Airway Drawer 1', cart: 'cart1', number: 1 },
            { id: 'drawer2', name: 'Airway Drawer 2', cart: 'cart1', number: 2 },
            { id: 'drawer3', name: 'Airway Drawer 3', cart: 'cart1', number: 3 },
            { id: 'drawer4', name: 'Med Drawer 1', cart: 'cart2', number: 1 },
            { id: 'drawer5', name: 'Med Drawer 2', cart: 'cart2', number: 2 },
            { id: 'drawer6', name: 'Med Drawer 3', cart: 'cart2', number: 3 }
        ],
        items: []
    };
}

// Initialize Three.js scene
function initThreeJS() {
    console.log('Initializing 3D scene for training mode...');

    const canvas = document.getElementById('three-canvas');

    // Load quality preference
    const preferredQuality = loadQualityPreference();
    const qualitySettings = QUALITY_PRESETS[preferredQuality];
    console.log(`Using quality preset: ${qualitySettings.name}`);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue

    // Fog (quality-dependent)
    if (qualitySettings.fog) {
        scene.fog = new THREE.Fog(0x87CEEB, 20, 50);
    }

    // Camera (first-person perspective)
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    camera.position.copy(playerPosition);
    camera.rotation.order = 'YXZ'; // Important for FPS controls

    // Renderer (quality-dependent)
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: qualitySettings.antialias
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(qualitySettings.pixelRatio);
    renderer.shadowMap.enabled = qualitySettings.shadows;

    if (qualitySettings.shadows) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Lighting (hospital environment)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Ceiling lights
    const ceilingLight1 = new THREE.PointLight(0xffffff, 0.5, 30);
    ceilingLight1.position.set(-10, ROOM_HEIGHT - 1, 0);
    ceilingLight1.castShadow = true;
    scene.add(ceilingLight1);

    const ceilingLight2 = new THREE.PointLight(0xffffff, 0.5, 30);
    ceilingLight2.position.set(10, ROOM_HEIGHT - 1, 0);
    ceilingLight2.castShadow = true;
    scene.add(ceilingLight2);

    const ceilingLight3 = new THREE.PointLight(0xffffff, 0.5, 30);
    ceilingLight3.position.set(0, ROOM_HEIGHT - 1, -8);
    ceilingLight3.castShadow = true;
    scene.add(ceilingLight3);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f0,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid helper (optional, for spatial awareness)
    const gridHelper = new THREE.GridHelper(ROOM_WIDTH, 30, 0x888888, 0xcccccc);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Walls
    createWalls();

    console.log('✓ 3D scene initialized');
}

function createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        roughness: 0.9,
        metalness: 0.1
    });

    const wallThickness = 0.5;

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_WIDTH, ROOM_HEIGHT, wallThickness),
        wallMaterial
    );
    backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, ROOM_HEIGHT, ROOM_DEPTH),
        wallMaterial
    );
    leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, ROOM_HEIGHT, ROOM_DEPTH),
        wallMaterial
    );
    rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);
}

// Cart type definitions (matching teacher.js)
const CART_TYPES = {
    crash: { name: 'Crash Cart', width: 2.42, height: 3.5, depth: 2.04, drawers: 5, drawerHeight: 0.5 },
    airway: { name: 'Airway Cart', width: 2.42, height: 3.5, depth: 2.04, drawers: 4, drawerHeight: 0.65 },
    medication: { name: 'Medication Cart', width: 2.42, height: 3.0, depth: 2.04, drawers: 3, drawerHeight: 0.75 },
    trauma: { name: 'Trauma Cart', width: 2.42, height: 3.5, depth: 2.04, drawers: 4, drawerHeight: 0.65 },
    iv: { name: 'IV Cart', width: 1.5, height: 5.0, depth: 1.5, drawers: 1, drawerHeight: 0.5, hasIVPole: true },
    procedure: { name: 'Procedure Table', width: 4.0, height: 3.0, depth: 2.5, drawers: 0 },
    supply: { name: 'Supply Cart', width: 2.0, height: 3.5, depth: 1.75, drawers: 5, drawerHeight: 0.5 }
};

// Create 3D cart from configuration data
function create3DCart(cartData) {
    const cartGroup = new THREE.Group();
    cartGroup.userData.cartId = cartData.id;
    cartGroup.userData.type = 'cart';

    const cartType = cartData.type ? CART_TYPES[cartData.type] : null;
    const width = cartType ? cartType.width : 2.42;
    const height = cartType ? cartType.height : 3.5;
    const depth = cartType ? cartType.depth : 2.04;
    const color = cartData.color || '#999999';

    // Cart body
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    cartGroup.add(body);

    // Handle
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, width * 0.8, 12);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.3,
        metalness: 0.8
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.y = height * 0.75;
    handle.position.z = depth / 2 + 0.05;
    cartGroup.add(handle);

    // IV Pole (if applicable)
    if (cartType && cartType.hasIVPole) {
        const poleHeight = height * 0.7;
        const poleGeometry = new THREE.CylinderGeometry(0.04, 0.04, poleHeight, 12);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.2,
            metalness: 0.9
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = height - (poleHeight / 2) + 0.5;
        cartGroup.add(pole);

        // Hooks at top
        for (let i = 0; i < 4; i++) {
            const hookGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8);
            const hook = new THREE.Mesh(hookGeometry, poleMaterial);
            const angle = (i / 4) * Math.PI * 2;
            hook.position.x = Math.cos(angle) * 0.1;
            hook.position.z = Math.sin(angle) * 0.1;
            hook.position.y = height + poleHeight - 0.5;
            hook.rotation.z = Math.PI / 2;
            cartGroup.add(hook);
        }
    }

    // Drawers (if applicable)
    if (cartType && cartType.drawers > 0) {
        const numDrawers = cartType.drawers;
        const drawerHeight = cartType.drawerHeight;
        const drawerSpacing = (height - (numDrawers * drawerHeight)) / (numDrawers + 1);

        for (let i = 0; i < numDrawers; i++) {
            const drawerGroup = createDrawer(cartData, i + 1, width, drawerHeight, depth);
            const yPos = drawerSpacing + (i * (drawerHeight + drawerSpacing)) + (drawerHeight / 2);
            drawerGroup.position.y = yPos;
            drawerGroup.userData.closedZ = 0;
            drawerGroup.userData.openZ = depth * 0.4;
            cartGroup.add(drawerGroup);
        }
    }

    // Position cart in room
    cartGroup.position.x = (cartData.x - 0.5) * ROOM_WIDTH;
    cartGroup.position.z = (cartData.y - 0.5) * ROOM_DEPTH;

    // Rotation
    if (cartData.rotation !== undefined) {
        cartGroup.rotation.y = (cartData.rotation * Math.PI) / 180;
    }

    return cartGroup;
}

function createDrawer(cartData, drawerNumber, width, height, depth) {
    const drawerGroup = new THREE.Group();
    drawerGroup.userData.type = 'drawer';
    drawerGroup.userData.cartId = cartData.id;
    drawerGroup.userData.drawerNumber = drawerNumber;
    drawerGroup.userData.isOpen = false;

    // Find drawer data from config
    const drawerData = CONFIG.drawers.find(d =>
        d.cart === cartData.id && d.number === drawerNumber
    );

    if (drawerData) {
        drawerGroup.userData.drawerId = drawerData.id;
        drawerGroup.userData.drawerName = drawerData.name;
    }

    // Drawer color (based on cart type)
    let drawerColor = '#999999';
    if (cartData.type === 'crash') drawerColor = '#F44336';
    else if (cartData.type === 'airway') drawerColor = '#4CAF50';
    else if (cartData.type === 'medication') drawerColor = '#2196F3';
    else if (cartData.type === 'trauma') drawerColor = '#FF9800';
    else if (cartData.type === 'iv') drawerColor = '#9C27B0';

    // Drawer front face
    const drawerGeometry = new THREE.BoxGeometry(width * 0.95, height, 0.08);
    const drawerMaterial = new THREE.MeshStandardMaterial({
        color: drawerColor,
        roughness: 0.7,
        metalness: 0.2
    });
    const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
    drawer.position.z = depth / 2 - 0.04;
    drawer.castShadow = true;
    drawer.userData.interactable = true;
    drawerGroup.add(drawer);

    // Drawer handle
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, width * 0.4, 12);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.8
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.z = depth / 2 + 0.02;
    drawerGroup.add(handle);

    return drawerGroup;
}

// Build all carts from configuration
function buildScene() {
    console.log('Building scene from configuration...');

    // Clear existing carts
    cartMeshes.forEach(cartGroup => {
        scene.remove(cartGroup);
    });
    cartMeshes.clear();

    // Create carts
    CONFIG.carts.forEach(cartData => {
        if (!cartData.isInventory) {
            const cartGroup = create3DCart(cartData);
            scene.add(cartGroup);
            cartMeshes.set(cartData.id, cartGroup);
        }
    });

    console.log(`✓ Created ${cartMeshes.size} carts`);
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

function setupInputHandlers() {
    // Keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Mouse
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);

    // Pointer lock
    const canvas = document.getElementById('three-canvas');
    canvas.addEventListener('click', () => {
        if (!isPointerLocked) {
            canvas.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === canvas;
        if (!isPointerLocked) {
            // Show ESC menu hint
            console.log('Pointer unlocked - press ESC for menu');
        }
    });

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onKeyDown(event) {
    const key = event.key.toLowerCase();

    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;
    if (key === 'shift') keys.shift = true;

    // Interaction
    if (key === 'e' && lookingAtDrawer) {
        interactWithDrawer(lookingAtDrawer);
    }

    // Camera view switching
    if (key === 'c') {
        event.preventDefault();
        cycleCameraViews(1);
    }

    // Toggle first-person / camera view mode
    if (key === 'v') {
        event.preventDefault();
        toggleFirstPersonMode();
    }

    // Debug - FPS counter toggle
    if (key === 'f3') {
        event.preventDefault();
        toggleFPSCounter();
    }

    // Menu
    if (key === 'escape') {
        document.exitPointerLock();
        showMenu();
    }
}

function onKeyUp(event) {
    const key = event.key.toLowerCase();

    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;
    if (key === 'shift') keys.shift = false;
}

function onMouseMove(event) {
    if (!isPointerLocked) return;

    // Only allow mouse look in first-person mode
    if (!isFirstPersonMode) return;

    // Update player rotation based on mouse movement
    playerRotation.yaw -= event.movementX * mouseSensitivity;
    playerRotation.pitch -= event.movementY * mouseSensitivity;

    // Clamp pitch to prevent flipping
    playerRotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, playerRotation.pitch));
}

function onMouseClick(event) {
    // Alternative to E key - click to interact
    if (lookingAtDrawer && isPointerLocked) {
        interactWithDrawer(lookingAtDrawer);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================================
// GAME LOOP
// ============================================================================

let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update performance stats
    updatePerformanceStats(currentTime);

    // Update player movement
    updatePlayerMovement(deltaTime);

    // Update camera position/rotation
    updateCamera();

    // Check what player is looking at
    updateLookingAt();

    // Render
    renderer.render(scene, camera);
}

function updatePlayerMovement(deltaTime) {
    // Only allow movement in first-person mode
    if (!isFirstPersonMode) return;

    // Calculate movement direction based on camera facing
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; // Keep on horizontal plane
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    // Calculate velocity
    const moveVec = new THREE.Vector3();
    if (keys.w) moveVec.add(forward);
    if (keys.s) moveVec.sub(forward);
    if (keys.d) moveVec.add(right);
    if (keys.a) moveVec.sub(right);

    if (moveVec.length() > 0) {
        moveVec.normalize();
        const speed = keys.shift ? moveSpeed * sprintMultiplier : moveSpeed;
        playerPosition.add(moveVec.multiplyScalar(speed * deltaTime));
    }

    // Collision detection (simple bounds check)
    playerPosition.x = Math.max(-ROOM_WIDTH / 2 + 0.5, Math.min(ROOM_WIDTH / 2 - 0.5, playerPosition.x));
    playerPosition.z = Math.max(-ROOM_DEPTH / 2 + 0.5, Math.min(ROOM_DEPTH / 2 - 0.5, playerPosition.z));

    // Keep at eye height
    playerPosition.y = 1.67; // 5.5 feet
}

function updateCamera() {
    // Apply position
    camera.position.copy(playerPosition);

    // Apply rotation
    camera.rotation.y = playerRotation.yaw;
    camera.rotation.x = playerRotation.pitch;
}

function updateLookingAt() {
    // Raycast from camera center to see what we're looking at
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Get all drawer meshes
    const interactableMeshes = [];
    cartMeshes.forEach(cartGroup => {
        cartGroup.children.forEach(child => {
            if (child.userData.type === 'drawer') {
                child.children.forEach(mesh => {
                    if (mesh.userData.interactable) {
                        interactableMeshes.push(mesh);
                    }
                });
            }
        });
    });

    const intersects = raycaster.intersectObjects(interactableMeshes, false);

    // Clear previous highlight
    if (lookingAtDrawer) {
        const prevDrawer = lookingAtDrawer.parent;
        prevDrawer.children[0].material.emissive = new THREE.Color(0x000000);
    }

    if (intersects.length > 0) {
        const drawerMesh = intersects[0].object;
        const drawerGroup = drawerMesh.parent;

        lookingAtDrawer = drawerMesh;

        // Highlight
        drawerMesh.material.emissive = new THREE.Color(0x0e639c);
        drawerMesh.material.emissiveIntensity = 0.3;

        // Show interaction prompt
        const drawerName = drawerGroup.userData.drawerName || 'Drawer';
        showInteractPrompt(`Press E to open ${drawerName}`);
    } else {
        lookingAtDrawer = null;
        hideInteractPrompt();
    }
}

// ============================================================================
// INTERACTION
// ============================================================================

function interactWithDrawer(drawerMesh) {
    const drawerGroup = drawerMesh.parent;
    const drawerId = drawerGroup.userData.drawerId;
    const drawerName = drawerGroup.userData.drawerName;

    // Toggle open/close
    if (!drawerGroup.userData.isOpen) {
        openDrawer(drawerGroup);

        // Check if this drawer contains needed items
        if (currentScenario) {
            checkForItems(drawerId, drawerName);
        }
    } else {
        closeDrawer(drawerGroup);
    }
}

function openDrawer(drawerGroup) {
    if (drawerGroup.userData.isOpen) return;

    drawerGroup.userData.isOpen = true;
    animateDrawer(drawerGroup, drawerGroup.userData.openZ);

    // Play sound effect
    playSound('drawerOpen');
}

function closeDrawer(drawerGroup) {
    if (!drawerGroup.userData.isOpen) return;

    drawerGroup.userData.isOpen = false;
    animateDrawer(drawerGroup, drawerGroup.userData.closedZ);

    // Play sound effect
    playSound('drawerClose');
}

function animateDrawer(drawerGroup, targetZ) {
    const animate = () => {
        const current = drawerGroup.position.z;
        const diff = targetZ - current;

        if (Math.abs(diff) < 0.01) {
            drawerGroup.position.z = targetZ;
            return;
        }

        drawerGroup.position.z += diff * 0.15;
        requestAnimationFrame(animate);
    };
    animate();
}

function checkForItems(drawerId, drawerName) {
    if (!currentScenario) return;

    // Find items in this drawer
    const itemsInDrawer = currentScenario.items.filter(item => {
        const itemData = CONFIG.items.find(i => i.id === item.itemId);
        return itemData && itemData.drawer === drawerId;
    });

    if (itemsInDrawer.length > 0) {
        itemsInDrawer.forEach(scenarioItem => {
            if (!foundItems.has(scenarioItem.itemId)) {
                foundItems.add(scenarioItem.itemId);
                console.log(`✓ Found item: ${scenarioItem.name}`);
                updateProgress();

                // Sound effect
                playSound('itemFound');

                // Visual feedback
                showItemFoundNotification(scenarioItem.name);
            }
        });
    }
}

// ============================================================================
// TRAINING SCENARIO SYSTEM
// ============================================================================

function loadScenarios() {
    // Load scenarios from the designer's configuration
    if (CONFIG && CONFIG.scenarios && CONFIG.scenarios.length > 0) {
        // Convert designer scenarios to trainer format
        return CONFIG.scenarios.map(scenario => {
            // Build items list from essential and optional items
            const items = [];

            if (scenario.essential) {
                scenario.essential.forEach(itemId => {
                    const itemData = CONFIG.items.find(i => i.id === itemId);
                    if (itemData) {
                        items.push({
                            itemId: itemId,
                            name: itemData.name,
                            essential: true
                        });
                    }
                });
            }

            if (scenario.optional) {
                scenario.optional.forEach(itemId => {
                    const itemData = CONFIG.items.find(i => i.id === itemId);
                    if (itemData) {
                        items.push({
                            itemId: itemId,
                            name: itemData.name,
                            essential: false
                        });
                    }
                });
            }

            return {
                id: scenario.id,
                name: scenario.name,
                description: scenario.description,
                items: items,
                timeLimit: 300, // Default 5 minutes
                difficulty: 'intermediate'
            };
        });
    }

    // Fallback: Default scenario if no scenarios configured
    console.warn('No scenarios found in configuration, using default');
    return [
        {
            id: 'scenario1',
            name: 'Practice Mode',
            description: 'Explore the room and practice opening drawers',
            items: [],
            timeLimit: 300,
            difficulty: 'beginner'
        }
    ];
}

function showScenarioMenu() {
    const scenarios = loadScenarios();
    const scenarioList = document.getElementById('scenario-list');
    scenarioList.innerHTML = '';

    scenarios.forEach(scenario => {
        const scenarioItem = document.createElement('div');
        scenarioItem.className = 'scenario-item';
        scenarioItem.innerHTML = `
            <div class="scenario-item-title">${scenario.name}</div>
            <div class="scenario-item-desc">${scenario.description}</div>
        `;
        scenarioItem.onclick = () => startScenario(scenario);
        scenarioList.appendChild(scenarioItem);
    });

    // Update quality buttons to show current selection
    updateQualityUI();

    document.getElementById('menu-screen').classList.remove('hidden');
}

// Update quality UI to show current selection
function updateQualityUI() {
    ['low', 'medium', 'high'].forEach(quality => {
        const button = document.getElementById(`quality-${quality}`);
        if (button) {
            if (quality === currentQuality) {
                button.style.backgroundColor = '#1177bb';
                button.style.border = '2px solid #fff';
            } else {
                button.style.backgroundColor = '#0e639c';
                button.style.border = '2px solid transparent';
            }
        }
    });

    // Update quality info text
    const qualityInfo = document.getElementById('quality-info');
    if (qualityInfo) {
        const settings = QUALITY_PRESETS[currentQuality];
        qualityInfo.textContent = settings.description;
    }
}

// Change quality setting
function changeQuality(quality) {
    console.log(`Changing quality to: ${quality}`);
    applyQualitySettings(quality);
    updateQualityUI();
}

function startScenario(scenario) {
    console.log(`Starting scenario: ${scenario.name}`);

    currentScenario = scenario;
    foundItems.clear();

    // Hide menu
    document.getElementById('menu-screen').classList.add('hidden');

    // Update UI
    document.getElementById('scenario-title').textContent = scenario.name;
    document.getElementById('scenario-description').textContent = scenario.description;

    // Update items list
    const itemsNeeded = document.getElementById('items-needed');
    itemsNeeded.innerHTML = '';
    scenario.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-needed';
        itemDiv.id = `item-${item.itemId}`;
        itemDiv.textContent = item.name;
        itemsNeeded.appendChild(itemDiv);
    });

    // Reset player position
    playerPosition.set(0, 1.67, 12);
    playerRotation.yaw = Math.PI;
    playerRotation.pitch = 0;

    // Start timer
    startTime = Date.now();
    startTimer();

    // Update progress
    updateProgress();

    // Request pointer lock
    const canvas = document.getElementById('three-canvas');
    canvas.requestPointerLock();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('timer').textContent = timeString;
    }, 1000);
}

function updateProgress() {
    if (!currentScenario) return;

    const total = currentScenario.items.length;
    const found = foundItems.size;
    const percentage = (found / total) * 100;

    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${found} / ${total} items found`;

    // Update item checkboxes
    currentScenario.items.forEach(item => {
        const itemDiv = document.getElementById(`item-${item.itemId}`);
        if (itemDiv && foundItems.has(item.itemId)) {
            itemDiv.classList.add('item-found');
        }
    });

    // Check completion
    if (found === total) {
        completeScenario();
    }
}

function completeScenario() {
    console.log('Scenario complete!');

    // Play success sound
    playSound('scenarioComplete');

    // Stop timer
    if (timerInterval) clearInterval(timerInterval);

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Calculate score (based on time)
    let score = 1000;
    if (elapsed < 60) score += 500; // Speed bonus
    else if (elapsed < 120) score += 300;
    else if (elapsed < 180) score += 100;

    // Unlock pointer
    document.exitPointerLock();

    // Show completion screen
    document.getElementById('final-time').textContent = timeString;
    document.getElementById('final-items').textContent = `${foundItems.size}/${currentScenario.items.length}`;
    document.getElementById('final-score').textContent = score;

    let achievementText = '';
    if (elapsed < 60) achievementText = '⚡ Lightning Fast!';
    else if (elapsed < 120) achievementText = '🌟 Excellent Time!';
    else if (elapsed < 180) achievementText = '👍 Good Job!';
    else achievementText = '✓ Completed!';
    document.getElementById('achievement-text').textContent = achievementText;

    document.getElementById('completion-screen').classList.add('visible');
}

// ============================================================================
// UI HELPERS
// ============================================================================

function showInteractPrompt(text) {
    const prompt = document.getElementById('interact-prompt');
    prompt.textContent = text;
    prompt.classList.add('visible');
}

function hideInteractPrompt() {
    const prompt = document.getElementById('interact-prompt');
    prompt.classList.remove('visible');
}

function showItemFoundNotification(itemName) {
    // TODO: Add visual/audio feedback for finding items
    console.log(`✓ Found: ${itemName}`);
}

function showMenu() {
    currentScenario = null;
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('completion-screen').classList.remove('visible');
    showScenarioMenu();
}

function restartScenario() {
    document.getElementById('completion-screen').classList.remove('visible');
    if (currentScenario) {
        startScenario(currentScenario);
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    console.log('Initializing Trauma Room Trainer...');

    // Show loading progress
    updateLoadingProgress('Loading configuration...', 0);

    // Load configuration
    loadConfiguration();
    updateLoadingProgress('Building 3D scene...', 30);

    // Initialize 3D
    initThreeJS();
    updateLoadingProgress('Creating medical carts...', 60);

    buildScene();
    updateLoadingProgress('Applying quality settings...', 80);

    // Apply quality settings
    currentQuality = loadQualityPreference();
    console.log(`✓ Quality: ${QUALITY_PRESETS[currentQuality].name} (${performanceStats.fps} FPS target)`);

    // Initialize sound system
    initSounds();

    // Setup input
    setupInputHandlers();

    // Setup mobile camera controls
    setupMobileCameraButton();
    setupMobileCameraMenuClose();

    updateLoadingProgress('Ready!', 100);

    // Fade out loading screen smoothly
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');

        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 800);
    }, 500);

    // Show scenario menu
    showScenarioMenu();

    // Start animation loop
    animate();

    console.log('✓ Trainer ready!');
}

// Update loading screen with progress
function updateLoadingProgress(message, percent) {
    const loadingText = document.getElementById('loading-text');
    const loadingProgress = document.getElementById('loading-progress');

    if (loadingText) {
        loadingText.textContent = message;
    }

    if (loadingProgress && percent !== undefined) {
        loadingProgress.textContent = `${percent}%`;
    }
}

// Start when page loads
window.addEventListener('DOMContentLoaded', init);
