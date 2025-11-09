// Trauma Room Trainer - Game Designer Tool
// Desktop-first professional game design interface

// ===== CONFIGURATION DATA =====
let CONFIG = {
    carts: [],
    drawers: [],
    items: [],
    scenarios: [],
    achievements: [],
    cameraViews: [], // Camera views for different room perspectives
    roomSettings: {
        backgroundColor: '#fafafa',
        width: 800,
        height: 600
    },
    scoringRules: {
        essentialPoints: 60,
        optionalPoints: 20,
        penaltyPoints: 5,
        perfectBonus: 500,
        speedThreshold: 60,
        speedBonus: 300
    },
    generalSettings: {
        appTitle: 'Trauma Room Trainer',
        enableTutorial: true,
        enableSound: true,
        enableHaptics: true
    }
};

// ===== STATE MANAGEMENT =====
let STATE = {
    selectedType: null, // 'cart', 'scenario', 'drawer', 'item', 'achievement'
    selectedId: null,
    canvasMode: 'room', // 'room' or 'overview'
    draggedCart: null,
    mousePos: {x: 0, y: 0},
    unsavedChanges: false,
    snapToGrid: false,
    gridSize: 50
};

// ===== CANVAS SETUP =====
const canvas = document.getElementById('room-canvas');
const ctx = canvas.getContext('2d');

// ===== THREE.JS 3D SCENE SETUP =====
let scene, camera, renderer, controls;
let floor, floorGrid;
let cartMeshes = new Map(); // Map cart ID to Three.js mesh/group
let raycaster, mouse;
let selectedCart3D = null;
let dragPlane;
const threeContainer = document.getElementById('three-container');

function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa); // Match room background

    // Create camera (perspective for 3D)
    const aspect = threeContainer.clientWidth / threeContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

    // Position camera for orbital view
    camera.position.set(15, 15, 15); // Above and angled
    camera.lookAt(0, 0, 0); // Look at room center

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true // Transparent background initially
    });
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    threeContainer.appendChild(renderer.domElement);

    // Enable pointer events on the 3D container
    threeContainer.style.pointerEvents = 'auto';

    // Handle window resize
    window.addEventListener('resize', onThreeResize);

    console.log('✓ Three.js scene initialized');
}

function onThreeResize() {
    const width = threeContainer.clientWidth;
    const height = threeContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animateThree() {
    requestAnimationFrame(animateThree);
    renderer.render(scene, camera);
}

// ===== THREE.JS SCENE OBJECTS =====
function createFloor() {
    // Get room dimensions from config (will convert to feet later)
    const roomWidth = 30; // feet
    const roomDepth = 25; // feet

    // Create floor geometry (large plane)
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f0, // Beige/hospital floor color
        roughness: 0.8,
        metalness: 0.2
    });

    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.y = 0; // At ground level
    floor.receiveShadow = true;
    scene.add(floor);

    console.log('✓ Floor created:', roomWidth, 'ft x', roomDepth, 'ft');
}

function createGrid() {
    const roomWidth = 30; // feet
    const roomDepth = 25; // feet
    const gridSize = 1; // 1 foot grid

    floorGrid = new THREE.GridHelper(
        Math.max(roomWidth, roomDepth), // size
        Math.max(roomWidth, roomDepth) / gridSize, // divisions
        0x666666, // center line color
        0x888888  // grid color
    );
    floorGrid.position.y = 0.01; // Slightly above floor to prevent z-fighting
    scene.add(floorGrid);

    console.log('✓ Grid created');
}

function createLighting() {
    // Ambient light (fills everything with soft light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Point lights (ceiling lights)
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight2.position.set(-10, 10, 10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight3.position.set(0, 10, -10);
    scene.add(pointLight3);

    console.log('✓ Lighting added');
}

function createOrbitControls() {
    // Try different ways OrbitControls might be loaded
    const OrbitControlsConstructor = THREE.OrbitControls || window.OrbitControls;

    if (!OrbitControlsConstructor) {
        console.error('OrbitControls not found! Trying to continue without it...');
        console.log('THREE object:', THREE);
        // Create a dummy controls object to prevent crashes
        controls = {
            enabled: true,
            update: function() {},
            target: { set: function() {} }
        };
        return;
    }

    controls = new OrbitControlsConstructor(camera, renderer.domElement);

    // Configure controls
    controls.target.set(0, 0, 0); // Look at room center
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.minDistance = 5; // Minimum zoom
    controls.maxDistance = 50; // Maximum zoom
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Don't allow going below ground

    controls.update();

    console.log('✓ Orbit controls enabled');
}

// Update animation loop to include controls
function animateThreeScene() {
    requestAnimationFrame(animateThreeScene);

    if (controls && controls.update) {
        controls.update(); // Required for damping
    }

    renderer.render(scene, camera);
}

// ===== 3D CART CREATION =====

// Cart type definitions with specific dimensions and characteristics
const CART_TYPES = {
    crash: {
        name: 'Crash Cart (Code Cart)',
        width: 2.42,   // 29 inches
        height: 3.5,   // 42 inches
        depth: 2.04,   // 24.5 inches
        color: '#F44336',
        drawers: 5,
        drawerHeight: 0.5
    },
    airway: {
        name: 'Airway Cart',
        width: 2.42,
        height: 3.5,
        depth: 2.04,
        color: '#4CAF50',
        drawers: 4,
        drawerHeight: 0.5
    },
    medication: {
        name: 'Medication Cart',
        width: 2.42,
        height: 3.0,   // 36 inches (shorter)
        depth: 2.04,
        color: '#FF9800',
        drawers: 3,
        drawerHeight: 0.5
    },
    iv: {
        name: 'IV Cart',
        width: 1.5,    // 18 inches (narrow base)
        height: 5.0,   // 60 inches (tall pole)
        depth: 1.5,
        color: '#9C27B0',
        drawers: 1,    // Small base drawer
        drawerHeight: 0.5,
        hasIVPole: true
    },
    procedure: {
        name: 'Procedure Table',
        width: 4.0,    // 48 inches (wide surface)
        height: 3.0,   // 36 inches
        depth: 2.5,    // 30 inches
        color: '#757575',
        drawers: 0,    // Flat surface, no drawers
        hasTopSurface: true
    },
    trauma: {
        name: 'Trauma Cart',
        width: 2.42,
        height: 3.5,
        depth: 2.04,
        color: '#E91E63',
        drawers: 4,
        drawerHeight: 0.5
    },
    supply: {
        name: 'Supply Cart',
        width: 2.0,
        height: 3.0,
        depth: 1.75,
        color: '#2196F3',
        drawers: 3,
        drawerHeight: 0.5
    }
};

// Helper function to determine drawer color based on items
function getDrawerColor(drawer) {
    // Check if drawer has any items
    const drawerItems = CONFIG.items.filter(item => item.drawer === drawer.id);

    if (drawerItems.length === 0) {
        return 0x999999; // Gray for empty drawers
    }

    // Color mapping (you can customize this based on item categories)
    const colorMap = {
        'airway': 0x4CAF50,    // Green
        'med': 0x2196F3,       // Blue
        'code': 0xF44336,      // Red
        'trauma': 0xFF9800     // Orange
    };

    // Use the cart color as base
    return colorMap[drawer.cart] || 0x999999;
}

function createDrawer(drawer, cartWidth, drawerHeight, cartDepth, index, startY) {
    const drawerGroup = new THREE.Group();
    drawerGroup.userData = { drawerId: drawer.id, drawerData: drawer, isOpen: false };

    // Drawer dimensions (slightly smaller than cart to fit inside)
    const drawerWidth = cartWidth * 0.9;
    const drawerDepth = cartDepth * 0.85;

    // Drawer front face (the visible part)
    const frontGeometry = new THREE.BoxGeometry(drawerWidth, drawerHeight, 0.08);
    const drawerColor = getDrawerColor(drawer);
    const frontMaterial = new THREE.MeshStandardMaterial({
        color: drawerColor,
        roughness: 0.6,
        metalness: 0.4
    });
    const front = new THREE.Mesh(frontGeometry, frontMaterial);

    // Position drawer
    const drawerGap = 0.05;
    const yPosition = startY + index * (drawerHeight + drawerGap) + drawerHeight / 2;
    front.position.y = yPosition;
    front.position.z = (cartDepth / 2) - 0.05; // Just inside the cart front

    front.castShadow = true;
    front.receiveShadow = true;
    drawerGroup.add(front);

    // Drawer handle (small horizontal cylinder)
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, drawerWidth * 0.3, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.2,
        metalness: 0.8
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2; // Horizontal
    handle.position.copy(front.position);
    handle.position.z = front.position.z + 0.05; // In front of drawer face
    drawerGroup.add(handle);

    // Add label (drawer name as text sprite - simplified for now)
    // We'll skip text sprites for now as they're complex; the color coding helps identify drawers

    // Make clickable
    front.userData = { drawerId: drawer.id, type: 'drawer' };
    drawerGroup.userData.clickable = front;

    return drawerGroup;
}

function create3DCart(cartData) {
    // Create a group to hold all cart parts
    const cartGroup = new THREE.Group();
    cartGroup.userData = { cartId: cartData.id, cartData: cartData };

    // Get cart type definition or use defaults
    const cartType = cartData.type ? CART_TYPES[cartData.type] : null;
    const width = cartType ? cartType.width : (cartData.width3D || 2.42);
    const height = cartType ? cartType.height : (cartData.height3D || 3.5);
    const depth = cartType ? cartType.depth : (cartData.depth3D || 2.04);

    // Cart body (main box)
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: cartData.color || '#4CAF50',
        roughness: 0.7,
        metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height / 2; // Lift to sit on floor
    body.castShadow = true;
    body.receiveShadow = true;
    cartGroup.add(body);

    // Cart border/frame (darker outline)
    const edges = new THREE.EdgesGeometry(bodyGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    wireframe.position.copy(body.position);
    cartGroup.add(wireframe);

    // Add special features based on cart type
    if (cartType && cartType.hasIVPole) {
        // IV pole (tall cylinder at back)
        const poleGeometry = new THREE.CylinderGeometry(0.04, 0.04, height * 0.7, 12);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.3,
            metalness: 0.7
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = height - (height * 0.35);
        pole.position.z = -depth / 3;
        cartGroup.add(pole);

        // IV hooks at top
        const hookGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16);
        const hookMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.2,
            metalness: 0.8
        });
        for (let i = 0; i < 4; i++) {
            const hook = new THREE.Mesh(hookGeometry, hookMaterial);
            hook.position.y = height - 0.3;
            hook.position.x = (i - 1.5) * 0.15;
            hook.position.z = -depth / 3;
            hook.rotation.x = Math.PI / 2;
            cartGroup.add(hook);
        }
    }

    if (cartType && cartType.hasTopSurface) {
        // Procedure table - add thicker top surface
        const topGeometry = new THREE.BoxGeometry(width, 0.1, depth);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            roughness: 0.4,
            metalness: 0.5
        });
        const topSurface = new THREE.Mesh(topGeometry, topMaterial);
        topSurface.position.y = height / 2 + 0.05;
        topSurface.castShadow = true;
        cartGroup.add(topSurface);
    }

    // Add drawers (get from CONFIG)
    const cartDrawers = CONFIG.drawers.filter(d => d.cart === cartData.id);
    if (cartDrawers.length > 0) {
        // Sort drawers by number (top to bottom)
        cartDrawers.sort((a, b) => a.number - b.number);

        const drawerHeight = 0.5; // 6 inches in feet
        const drawerGap = 0.05; // Small gap between drawers
        const totalDrawerHeight = cartDrawers.length * (drawerHeight + drawerGap);
        const startY = (height / 2) - (totalDrawerHeight / 2); // Start from top

        cartDrawers.forEach((drawer, index) => {
            const drawerGroup = createDrawer(drawer, width, drawerHeight, depth, index, startY);
            cartGroup.add(drawerGroup);
        });
    }

    // Position cart based on data
    // Convert normalized 0-1 coords to feet-based 3D coords
    // Assuming room is 30ft x 25ft centered at origin
    const roomWidth = 30;
    const roomDepth = 25;
    cartGroup.position.x = (cartData.x - 0.5) * roomWidth;
    cartGroup.position.z = (cartData.y - 0.5) * roomDepth;
    cartGroup.position.y = 0; // On floor

    // Apply rotation (if exists)
    if (cartData.rotation !== undefined) {
        cartGroup.rotation.y = (cartData.rotation * Math.PI) / 180; // Convert degrees to radians
    }

    // Make clickable
    body.userData = { cartId: cartData.id };
    cartGroup.userData.clickable = body; // Reference to clickable mesh

    return cartGroup;
}

function buildAll3DCarts() {
    // Clear existing carts
    cartMeshes.forEach((mesh) => {
        scene.remove(mesh);
    });
    cartMeshes.clear();

    // Create 3D version of each cart
    CONFIG.carts.forEach(cart => {
        const cart3D = create3DCart(cart);
        scene.add(cart3D);
        cartMeshes.set(cart.id, cart3D);
    });

    console.log(`✓ Built ${cartMeshes.size} 3D carts`);
}

// ===== 3D INTERACTION - RAYCASTING =====
function init3DInteraction() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Create invisible drag plane at floor level
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.MeshBasicMaterial({
        visible: false,
        side: THREE.DoubleSide
    });
    dragPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    dragPlane.rotation.x = -Math.PI / 2;
    dragPlane.position.y = 0;
    scene.add(dragPlane);

    // Mouse event listeners on 3D renderer
    renderer.domElement.addEventListener('mousedown', onThreeMouseDown);
    renderer.domElement.addEventListener('mousemove', onThreeMouseMove);
    renderer.domElement.addEventListener('mouseup', onThreeMouseUp);

    console.log('✓ 3D interaction enabled');
}

function onThreeMouseDown(event) {
    if (STATE.canvasMode !== 'room') return;

    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find intersections
    raycaster.setFromCamera(mouse, camera);

    // Get all clickable meshes (carts and drawers)
    const clickableMeshes = [];
    cartMeshes.forEach((cartGroup) => {
        // Add cart body
        if (cartGroup.userData.clickable) {
            clickableMeshes.push(cartGroup.userData.clickable);
        }

        // Add drawers
        cartGroup.children.forEach((child) => {
            if (child.userData && child.userData.drawerId && child.userData.clickable) {
                clickableMeshes.push(child.userData.clickable);
            }
        });
    });

    const intersects = raycaster.intersectObjects(clickableMeshes, false);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Check if drawer or cart was clicked
        if (clickedObject.userData.type === 'drawer') {
            // Drawer was clicked
            const drawerId = clickedObject.userData.drawerId;
            selectDrawer3D(drawerId);

            // Select in 2D system
            selectEntity('drawer', drawerId);

            // Don't allow dragging drawers, but allow clicking
        } else if (clickedObject.userData.cartId) {
            // Cart was clicked
            const cartId = clickedObject.userData.cartId;
            selectCart3D(cartId);
            selectedCart3D = cartMeshes.get(cartId);

            // Also select in 2D system
            selectEntity('cart', cartId);

            // Disable orbit controls during drag
            if (controls && controls.enabled !== undefined) {
                controls.enabled = false;
            }
        }
    } else {
        // Clicked empty space
        deselectCart3D();
        deselectDrawer3D();
        deselectEntity();
    }
}

function onThreeMouseMove(event) {
    if (!selectedCart3D) return;

    // Calculate mouse position
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to drag plane
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(dragPlane);

    if (intersects.length > 0) {
        const point = intersects[0].point;

        // Update 3D position
        selectedCart3D.position.x = point.x;
        selectedCart3D.position.z = point.z;

        // Snap to grid if enabled
        if (STATE.snapToGrid) {
            const gridSize = 0.25; // feet
            selectedCart3D.position.x = Math.round(point.x / gridSize) * gridSize;
            selectedCart3D.position.z = Math.round(point.z / gridSize) * gridSize;
        }

        // Update 2D data
        const cart = getEntity('cart', selectedCart3D.userData.cartId);
        if (cart) {
            const roomWidth = 30;
            const roomDepth = 25;
            cart.x = (selectedCart3D.position.x / roomWidth) + 0.5;
            cart.y = (selectedCart3D.position.z / roomDepth) + 0.5;

            STATE.unsavedChanges = true;
            drawCanvas(); // Update 2D view
            updateInspector(); // Update inspector
        }
    }
}

function onThreeMouseUp(event) {
    if (selectedCart3D) {
        selectedCart3D = null;
        // Re-enable orbit controls
        if (controls && controls.enabled !== undefined) {
            controls.enabled = true;
        }
    }
}

function selectCart3D(cartId) {
    // Remove previous selection highlight
    deselectCart3D();

    const cartGroup = cartMeshes.get(cartId);
    if (!cartGroup) return;

    // Add selection indicator (glowing outline)
    const body = cartGroup.userData.clickable;
    if (body) {
        body.material = body.material.clone();
        body.material.emissive = new THREE.Color(0x0e639c);
        body.material.emissiveIntensity = 0.3;
    }

    // Add visual helpers (bounding box and facing arrow)
    createSelectionHelpers(cartGroup);

    console.log('Selected cart:', cartId);
}

function deselectCart3D() {
    // Remove visual helpers
    removeSelectionHelpers();

    cartMeshes.forEach((cartGroup) => {
        const body = cartGroup.userData.clickable;
        if (body && body.material.emissive) {
            body.material.emissive = new THREE.Color(0x000000);
            body.material.emissiveIntensity = 0;
        }
    });
}

let selectedDrawer3D = null;
let selectionHelpers = {
    boundingBox: null,
    facingArrow: null
};

function createSelectionHelpers(cartGroup) {
    // Remove old helpers
    removeSelectionHelpers();

    // Get cart bounds
    const box = new THREE.Box3().setFromObject(cartGroup);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Bounding box
    const boxGeometry = new THREE.BoxGeometry(size.x + 0.2, size.y + 0.2, size.z + 0.2);
    const boxEdges = new THREE.EdgesGeometry(boxGeometry);
    const boxLine = new THREE.LineSegments(
        boxEdges,
        new THREE.LineBasicMaterial({ color: 0x0e639c, linewidth: 2 })
    );
    boxLine.position.copy(center);
    scene.add(boxLine);
    selectionHelpers.boundingBox = boxLine;

    // Facing arrow (points in direction cart faces)
    const arrowLength = Math.max(size.x, size.z) * 0.8;
    const arrowDir = new THREE.Vector3(0, 0, 1); // Forward direction
    arrowDir.applyQuaternion(cartGroup.quaternion); // Apply cart rotation
    const arrowOrigin = cartGroup.position.clone();
    arrowOrigin.y = 0.1; // Just above floor

    const arrow = new THREE.ArrowHelper(
        arrowDir,
        arrowOrigin,
        arrowLength,
        0x0e639c,
        arrowLength * 0.3,
        arrowLength * 0.2
    );
    scene.add(arrow);
    selectionHelpers.facingArrow = arrow;
}

function removeSelectionHelpers() {
    if (selectionHelpers.boundingBox) {
        scene.remove(selectionHelpers.boundingBox);
        selectionHelpers.boundingBox = null;
    }
    if (selectionHelpers.facingArrow) {
        scene.remove(selectionHelpers.facingArrow);
        selectionHelpers.facingArrow = null;
    }
}

function selectDrawer3D(drawerId) {
    // Remove previous selection
    deselectDrawer3D();
    deselectCart3D();

    // Find the drawer
    let drawerGroup = null;
    cartMeshes.forEach((cartGroup) => {
        cartGroup.children.forEach((child) => {
            if (child.userData && child.userData.drawerId === drawerId) {
                drawerGroup = child;
            }
        });
    });

    if (!drawerGroup) return;

    selectedDrawer3D = drawerGroup;

    // Add selection highlight
    const drawerFront = drawerGroup.userData.clickable;
    if (drawerFront) {
        drawerFront.material = drawerFront.material.clone();
        drawerFront.material.emissive = new THREE.Color(0x0e639c);
        drawerFront.material.emissiveIntensity = 0.4;
    }

    // Open the drawer (animate)
    openDrawer(drawerGroup);

    console.log('Selected drawer:', drawerId);
}

function deselectDrawer3D() {
    if (selectedDrawer3D) {
        // Close the drawer
        closeDrawer(selectedDrawer3D);

        // Remove selection highlight
        const drawerFront = selectedDrawer3D.userData.clickable;
        if (drawerFront && drawerFront.material.emissive) {
            drawerFront.material.emissive = new THREE.Color(0x000000);
            drawerFront.material.emissiveIntensity = 0;
        }

        selectedDrawer3D = null;
    }
}

// Drawer animation functions
function openDrawer(drawerGroup) {
    if (drawerGroup.userData.isOpen) return;

    drawerGroup.userData.isOpen = true;
    drawerGroup.userData.targetZ = drawerGroup.position.z + 0.5; // Pull out 6 inches

    // Animate using lerp in animation loop
    animateDrawer(drawerGroup);
}

function closeDrawer(drawerGroup) {
    if (!drawerGroup.userData.isOpen) return;

    drawerGroup.userData.isOpen = false;
    drawerGroup.userData.targetZ = 0; // Push back to original position

    animateDrawer(drawerGroup);
}

function animateDrawer(drawerGroup) {
    const animate = () => {
        if (!drawerGroup.userData.targetZ && drawerGroup.userData.targetZ !== 0) return;

        const current = drawerGroup.position.z;
        const target = drawerGroup.userData.targetZ;
        const diff = target - current;

        if (Math.abs(diff) < 0.01) {
            // Done animating
            drawerGroup.position.z = target;
            drawerGroup.userData.targetZ = null;
            return;
        }

        // Lerp toward target
        drawerGroup.position.z += diff * 0.15;

        // Continue animating
        requestAnimationFrame(animate);
    };

    animate();
}

// ===== INITIALIZATION =====
function init() {
    loadConfiguration();
    setupCanvas();
    buildHierarchy();
    updateStatusBar();

    // Sync UI controls with loaded config
    document.getElementById('room-bg-color').value = CONFIG.roomSettings.backgroundColor;
    document.getElementById('room-width').value = CONFIG.roomSettings.width;
    document.getElementById('room-height').value = CONFIG.roomSettings.height;
    document.getElementById('grid-size').value = STATE.gridSize;

    // Set canvas size from config
    canvas.width = CONFIG.roomSettings.width;
    canvas.height = CONFIG.roomSettings.height;

    drawCanvas();

    // Initialize Three.js 3D scene
    console.log('🚀 Initializing 3D scene...');
    initThreeJS();
    createFloor();
    createGrid();
    createLighting();
    createOrbitControls();
    init3DInteraction();
    buildAll3DCarts();
    animateThreeScene();
    console.log('✅ 3D scene ready!');

    // Setup autosave
    setInterval(() => {
        if (STATE.unsavedChanges) {
            saveConfiguration();
            STATE.unsavedChanges = false;
        }
    }, 5000);

    // Setup grid size listener
    document.getElementById('grid-size').addEventListener('input', (e) => {
        STATE.gridSize = parseInt(e.target.value);
        drawCanvas();
    });
}

// ===== CANVAS MANAGEMENT =====
function setupCanvas() {
    // Mouse events for drag and drop
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', handleCanvasMouseUp);

    // Track mouse position
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        STATE.mousePos.x = ((e.clientX - rect.left) / canvas.width).toFixed(2);
        STATE.mousePos.y = ((e.clientY - rect.top) / canvas.height).toFixed(2);
        document.getElementById('canvas-info-mouse').textContent =
            `X: ${STATE.mousePos.x}, Y: ${STATE.mousePos.y}`;
    });
}

function drawCanvas() {
    if (STATE.canvasMode === 'room') {
        drawRoomCanvas();
    } else {
        drawOverviewCanvas();
    }
}

function drawRoomCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = CONFIG.roomSettings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    if (document.getElementById('show-grid').checked) {
        drawGrid();
    }

    // Draw all carts
    CONFIG.carts.forEach(cart => {
        drawCart(cart, STATE.selectedType === 'cart' && STATE.selectedId === cart.id);
    });
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.lineWidth = 1;

    const gridSize = STATE.gridSize;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawCart(cart, isSelected) {
    const x = cart.x * canvas.width;
    const y = cart.y * canvas.height;
    const width = (cart.width || 80);
    const height = (cart.height || 80);

    // Selection highlight
    if (isSelected) {
        ctx.fillStyle = 'rgba(14, 99, 156, 0.2)';
        ctx.fillRect(x - width/2 - 5, y - height/2 - 5, width + 10, height + 10);
        ctx.strokeStyle = '#0e639c';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - width/2 - 5, y - height/2 - 5, width + 10, height + 10);
    }

    // Cart body
    ctx.fillStyle = cart.color;
    ctx.fillRect(x - width/2, y - height/2, width, height);

    // Cart border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width/2, y - height/2, width, height);

    // Cart label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cart.name, x, y);

    // Cart ID (small text)
    ctx.font = '9px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(cart.id, x, y + 15);

    // Dimensions indicator
    if (isSelected) {
        ctx.font = '8px monospace';
        ctx.fillStyle = '#0e639c';
        ctx.fillText(`${width}×${height}px`, x, y - height/2 - 10);
        ctx.fillText(`(${cart.x.toFixed(2)}, ${cart.y.toFixed(2)})`, x, y + height/2 + 18);
    }
}

function drawOverviewCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw statistics overview
    const stats = [
        {label: 'Carts', value: CONFIG.carts.length, icon: '🛒', color: '#0e639c'},
        {label: 'Scenarios', value: CONFIG.scenarios.length, icon: '📋', color: '#0e7a0d'},
        {label: 'Drawers', value: CONFIG.drawers.length, icon: '🗄️', color: '#a1260d'},
        {label: 'Items', value: CONFIG.items.length, icon: '📦', color: '#b7950b'},
        {label: 'Achievements', value: CONFIG.achievements.length, icon: '🏆', color: '#7d3c98'}
    ];

    const startX = 50;
    const startY = 100;
    const boxWidth = 140;
    const boxHeight = 100;
    const gap = 20;

    stats.forEach((stat, index) => {
        const x = startX + (index % 3) * (boxWidth + gap);
        const y = startY + Math.floor(index / 3) * (boxHeight + gap);

        // Box background
        ctx.fillStyle = '#252526';
        ctx.fillRect(x, y, boxWidth, boxHeight);

        // Box border
        ctx.strokeStyle = stat.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Icon
        ctx.font = '32px Arial';
        ctx.fillStyle = stat.color;
        ctx.textAlign = 'center';
        ctx.fillText(stat.icon, x + boxWidth/2, y + 35);

        // Value
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stat.value, x + boxWidth/2, y + 60);

        // Label
        ctx.font = '11px Arial';
        ctx.fillStyle = '#999';
        ctx.fillText(stat.label, x + boxWidth/2, y + 80);
    });

    // Title
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('Project Overview', 50, 50);
}

// ===== CANVAS INTERACTION =====
function handleCanvasMouseDown(e) {
    if (STATE.canvasMode !== 'room') return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / canvas.width;
    const clickY = (e.clientY - rect.top) / canvas.height;

    // Check if clicking on a cart
    for (let cart of CONFIG.carts) {
        const size = 80 / canvas.width;
        if (Math.abs(clickX - cart.x) < size/2 && Math.abs(clickY - cart.y) < size/2) {
            STATE.draggedCart = cart;
            selectEntity('cart', cart.id);
            return;
        }
    }

    // Clicking on empty space - deselect
    deselectEntity();
}

function handleCanvasMouseMove(e) {
    if (!STATE.draggedCart) return;

    const rect = canvas.getBoundingClientRect();
    let newX = (e.clientX - rect.left) / canvas.width;
    let newY = (e.clientY - rect.top) / canvas.height;

    // Snap to grid if enabled
    if (STATE.snapToGrid) {
        const gridSizeX = STATE.gridSize / canvas.width;
        const gridSizeY = STATE.gridSize / canvas.height;
        newX = Math.round(newX / gridSizeX) * gridSizeX;
        newY = Math.round(newY / gridSizeY) * gridSizeY;
    }

    // Clamp to canvas bounds
    STATE.draggedCart.x = Math.max(0.1, Math.min(0.9, newX));
    STATE.draggedCart.y = Math.max(0.1, Math.min(0.9, newY));

    STATE.unsavedChanges = true;
    drawCanvas();
    updateInspector();
}

function handleCanvasMouseUp() {
    STATE.draggedCart = null;
}

function setCanvasMode(mode) {
    STATE.canvasMode = mode;

    // Update button states
    document.getElementById('mode-room').classList.toggle('active', mode === 'room');
    document.getElementById('mode-overview').classList.toggle('active', mode === 'overview');

    // Update info
    document.getElementById('canvas-info-mode').textContent =
        `Mode: ${mode === 'room' ? 'Room Layout' : 'Overview'}`;

    drawCanvas();
}

function updateRoomBackground() {
    CONFIG.roomSettings.backgroundColor = document.getElementById('room-bg-color').value;
    STATE.unsavedChanges = true;
    drawCanvas();
}

function updateRoomSize() {
    const width = parseInt(document.getElementById('room-width').value);
    const height = parseInt(document.getElementById('room-height').value);

    CONFIG.roomSettings.width = width;
    CONFIG.roomSettings.height = height;

    canvas.width = width;
    canvas.height = height;

    STATE.unsavedChanges = true;
    drawCanvas();
    showAlert('Room size updated', 'success');
}

function updateSnapToGrid() {
    STATE.snapToGrid = document.getElementById('snap-to-grid').checked;
    showAlert(`Snap to grid ${STATE.snapToGrid ? 'enabled' : 'disabled'}`, 'success');
}

// ===== CAMERA VIEW TOGGLE =====
let cameraViewMode = 'orbital'; // 'orbital' or 'topDown'
let savedCameraPosition = null;
let savedCameraRotation = null;

function toggleCameraView() {
    if (!controls) {
        showAlert('Camera controls not available', 'error');
        return;
    }

    if (cameraViewMode === 'orbital') {
        // Switch to top-down view
        // Save current camera state
        savedCameraPosition = camera.position.clone();
        savedCameraRotation = camera.rotation.clone();

        // Animate to top-down position
        const targetPosition = new THREE.Vector3(0, 30, 0); // Directly above center
        const targetLookAt = new THREE.Vector3(0, 0, 0);

        animateCameraTo(targetPosition, targetLookAt, () => {
            cameraViewMode = 'topDown';
            if (controls.enabled !== undefined) {
                controls.enabled = false; // Disable orbit controls in top-down
            }
            document.getElementById('toggle-camera-view').textContent = '📷 3D View';
            showAlert('Top-down view activated', 'success');
        });
    } else {
        // Switch back to orbital view
        if (controls.enabled !== undefined) {
            controls.enabled = true;
        }

        if (savedCameraPosition) {
            const targetLookAt = new THREE.Vector3(0, 0, 0);
            animateCameraTo(savedCameraPosition, targetLookAt, () => {
                camera.rotation.copy(savedCameraRotation);
                cameraViewMode = 'orbital';
                document.getElementById('toggle-camera-view').textContent = '📷 Top View';
                showAlert('3D orbital view activated', 'success');
            });
        }
    }
}

function animateCameraTo(targetPosition, targetLookAt, onComplete) {
    const startPosition = camera.position.clone();
    const duration = 800; // ms
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        camera.position.lerpVectors(startPosition, targetPosition, eased);
        camera.lookAt(targetLookAt);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }

    animate();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ===== HIERARCHY TREE =====
function buildHierarchy() {
    const tree = document.getElementById('hierarchy-tree');
    tree.innerHTML = '';

    // Build categories
    const categories = [
        {
            id: 'carts',
            name: 'Carts',
            icon: '🛒',
            items: CONFIG.carts,
            createNew: createNewCart
        },
        {
            id: 'cameraviews',
            name: 'Camera Views',
            icon: '📷',
            items: CONFIG.cameraViews,
            createNew: createNewCameraView
        },
        {
            id: 'scenarios',
            name: 'Scenarios',
            icon: '📋',
            items: CONFIG.scenarios,
            createNew: createNewScenario
        },
        {
            id: 'drawers',
            name: 'Drawers',
            icon: '🗄️',
            items: CONFIG.drawers,
            createNew: createNewDrawer
        },
        {
            id: 'items',
            name: 'Items',
            icon: '📦',
            items: CONFIG.items,
            createNew: createNewItem
        },
        {
            id: 'achievements',
            name: 'Achievements',
            icon: '🏆',
            items: CONFIG.achievements,
            createNew: createNewAchievement
        }
    ];

    categories.forEach(category => {
        const categoryDiv = createCategoryNode(category);
        tree.appendChild(categoryDiv);
    });
}

function createCategoryNode(category) {
    const div = document.createElement('div');
    div.className = 'tree-category';

    const header = document.createElement('div');
    header.className = 'tree-category-header';
    header.innerHTML = `
        <span class="tree-category-icon">▼</span>
        <span class="tree-item-icon">${category.icon}</span>
        <span class="tree-item-name">${category.name}</span>
        <span class="tree-item-count">${category.items.length}</span>
    `;
    header.onclick = () => {
        div.classList.toggle('collapsed');
    };

    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'tree-category-items';

    // Add "Create New" button
    const createBtn = document.createElement('div');
    createBtn.className = 'tree-item';
    createBtn.style.fontStyle = 'italic';
    createBtn.style.color = '#0e639c';
    createBtn.innerHTML = `<span class="tree-item-icon">+</span><span class="tree-item-name">Create New</span>`;
    createBtn.onclick = category.createNew;
    itemsDiv.appendChild(createBtn);

    // Add items
    category.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tree-item';
        if (STATE.selectedType === category.id.slice(0, -1) && STATE.selectedId === item.id) {
            itemDiv.classList.add('selected');
        }
        itemDiv.innerHTML = `
            <span class="tree-item-icon">${category.icon}</span>
            <span class="tree-item-name">${item.name || item.id}</span>
        `;
        itemDiv.onclick = () => selectEntity(category.id.slice(0, -1), item.id);
        itemsDiv.appendChild(itemDiv);
    });

    div.appendChild(header);
    div.appendChild(itemsDiv);

    return div;
}

function refreshHierarchy() {
    buildHierarchy();
    showAlert('Hierarchy refreshed', 'success');
}

function filterHierarchy() {
    const searchTerm = document.getElementById('hierarchy-search').value.toLowerCase();
    const items = document.querySelectorAll('.tree-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ===== ENTITY SELECTION =====
function selectEntity(type, id) {
    STATE.selectedType = type;
    STATE.selectedId = id;

    // Update hierarchy selection
    document.querySelectorAll('.tree-item').forEach(item => item.classList.remove('selected'));

    // Update canvas info
    const entity = getEntity(type, id);
    document.getElementById('canvas-info-selected').textContent =
        `Selected: ${type} - ${entity?.name || id}`;

    // Update inspector
    updateInspector();

    // Refresh hierarchy to show selection
    buildHierarchy();

    // Redraw canvas
    drawCanvas();
}

function deselectEntity() {
    STATE.selectedType = null;
    STATE.selectedId = null;
    document.getElementById('canvas-info-selected').textContent = 'Selected: None';
    updateInspector();
    buildHierarchy();
    drawCanvas();
}

function getEntity(type, id) {
    const collections = {
        'cart': CONFIG.carts,
        'cameraview': CONFIG.cameraViews,
        'scenario': CONFIG.scenarios,
        'drawer': CONFIG.drawers,
        'item': CONFIG.items,
        'achievement': CONFIG.achievements
    };

    return collections[type]?.find(e => e.id === id);
}

// ===== INSPECTOR PANEL =====
function updateInspector() {
    const container = document.getElementById('inspector-content');

    if (!STATE.selectedType || !STATE.selectedId) {
        container.innerHTML = '<div class="inspector-empty">Select an item from the hierarchy<br>to view its properties</div>';
        return;
    }

    const entity = getEntity(STATE.selectedType, STATE.selectedId);
    if (!entity) {
        container.innerHTML = '<div class="inspector-empty">Entity not found</div>';
        return;
    }

    // Build inspector based on entity type
    switch (STATE.selectedType) {
        case 'cart':
            buildCartInspector(entity, container);
            break;
        case 'cameraview':
            buildCameraViewInspector(entity, container);
            break;
        case 'scenario':
            buildScenarioInspector(entity, container);
            break;
        case 'drawer':
            buildDrawerInspector(entity, container);
            break;
        case 'item':
            buildItemInspector(entity, container);
            break;
        case 'achievement':
            buildAchievementInspector(entity, container);
            break;
    }
}

function buildCartInspector(cart, container) {
    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Cart Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${cart.id}" onchange="updateCartProperty('id', this.value)" ${cart.id === 'inventory' ? 'disabled' : ''}>
            </div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${cart.name}" onchange="updateCartProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Cart Type</label>
                <select onchange="updateCartProperty('type', this.value)">
                    <option value="">Default/Custom</option>
                    <option value="crash" ${cart.type === 'crash' ? 'selected' : ''}>Crash Cart (Code Cart)</option>
                    <option value="airway" ${cart.type === 'airway' ? 'selected' : ''}>Airway Cart</option>
                    <option value="medication" ${cart.type === 'medication' ? 'selected' : ''}>Medication Cart</option>
                    <option value="iv" ${cart.type === 'iv' ? 'selected' : ''}>IV Cart</option>
                    <option value="procedure" ${cart.type === 'procedure' ? 'selected' : ''}>Procedure Table</option>
                    <option value="trauma" ${cart.type === 'trauma' ? 'selected' : ''}>Trauma Cart</option>
                    <option value="supply" ${cart.type === 'supply' ? 'selected' : ''}>Supply Cart</option>
                </select>
            </div>

            <div class="form-field">
                <label>Color</label>
                <div class="color-picker-field">
                    <input type="color" value="${cart.color}" onchange="updateCartProperty('color', this.value)">
                    <input type="text" value="${cart.color}" readonly>
                </div>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Position</div>

            <div class="form-field-row">
                <div class="form-field">
                    <label>X Position</label>
                    <input type="number" step="0.01" min="0" max="1" value="${cart.x}" onchange="updateCartProperty('x', parseFloat(this.value))">
                </div>
                <div class="form-field">
                    <label>Y Position</label>
                    <input type="number" step="0.01" min="0" max="1" value="${cart.y}" onchange="updateCartProperty('y', parseFloat(this.value))">
                </div>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Rotation (3D)</div>

            <div class="form-field">
                <label>Rotation (degrees)</label>
                <input type="number" step="1" min="0" max="360" value="${cart.rotation || 0}" onchange="updateCartProperty('rotation', parseFloat(this.value))">
            </div>

            <div class="form-field" style="display: flex; gap: 5px; margin-top: 8px;">
                <button class="btn btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="updateCartProperty('rotation', 0)">0°</button>
                <button class="btn btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="updateCartProperty('rotation', 90)">90°</button>
                <button class="btn btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="updateCartProperty('rotation', 180)">180°</button>
                <button class="btn btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="updateCartProperty('rotation', 270)">270°</button>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Dimensions</div>

            <div class="form-field-row">
                <div class="form-field">
                    <label>Width (px)</label>
                    <input type="number" min="40" max="200" value="${cart.width || 80}" onchange="updateCartProperty('width', parseInt(this.value))">
                </div>
                <div class="form-field">
                    <label>Height (px)</label>
                    <input type="number" min="40" max="200" value="${cart.height || 80}" onchange="updateCartProperty('height', parseInt(this.value))">
                </div>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Options</div>

            <div class="checkbox-field">
                <input type="checkbox" id="cart-is-inventory" ${cart.isInventory ? 'checked' : ''} onchange="updateCartProperty('isInventory', this.checked)">
                <label for="cart-is-inventory">Is Inventory Cart</label>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Cart</button>
        </div>
    `;
}

function buildCameraViewInspector(view, container) {
    const cartOptions = CONFIG.carts.filter(c => !c.isInventory).map(c =>
        `<option value="${c.id}" ${view.targetCart === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const drawerOptions = CONFIG.drawers.map(d =>
        `<option value="${d.id}" ${view.targetDrawer === d.id ? 'selected' : ''}>${d.name}</option>`
    ).join('');

    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Camera View Properties</div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${view.name}" onchange="updateCameraViewProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Description</label>
                <textarea onchange="updateCameraViewProperty('description', this.value)">${view.description}</textarea>
            </div>

            <div class="form-field">
                <label>View Type</label>
                <select onchange="updateCameraViewProperty('type', this.value)">
                    <option value="overview" ${view.type === 'overview' ? 'selected' : ''}>Room Overview</option>
                    <option value="closeup" ${view.type === 'closeup' ? 'selected' : ''}>Close-up</option>
                    <option value="custom" ${view.type === 'custom' ? 'selected' : ''}>Custom</option>
                </select>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Camera Position (feet)</div>

            <div class="form-field">
                <label>X Position</label>
                <input type="number" step="0.5" value="${view.position.x}" onchange="updateCameraViewPosition('x', parseFloat(this.value))">
            </div>

            <div class="form-field">
                <label>Y Position (height)</label>
                <input type="number" step="0.5" value="${view.position.y}" onchange="updateCameraViewPosition('y', parseFloat(this.value))">
            </div>

            <div class="form-field">
                <label>Z Position</label>
                <input type="number" step="0.5" value="${view.position.z}" onchange="updateCameraViewPosition('z', parseFloat(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Look At Target (feet)</div>

            <div class="form-field">
                <label>X Target</label>
                <input type="number" step="0.5" value="${view.lookAt.x}" onchange="updateCameraViewLookAt('x', parseFloat(this.value))">
            </div>

            <div class="form-field">
                <label>Y Target</label>
                <input type="number" step="0.5" value="${view.lookAt.y}" onchange="updateCameraViewLookAt('y', parseFloat(this.value))">
            </div>

            <div class="form-field">
                <label>Z Target</label>
                <input type="number" step="0.5" value="${view.lookAt.z}" onchange="updateCameraViewLookAt('z', parseFloat(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Camera Settings</div>

            <div class="form-field">
                <label>Field of View (FOV)</label>
                <input type="number" min="30" max="120" value="${view.fov}" onchange="updateCameraViewProperty('fov', parseFloat(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Presets</div>

            <button class="btn btn-secondary btn-block" onclick="setCameraViewPreset('entry')">📍 Entry View</button>
            <button class="btn btn-secondary btn-block" onclick="setCameraViewPreset('overhead')">🔝 Overhead View</button>
            <button class="btn btn-secondary btn-block" onclick="setCameraViewPreset('current')">📷 Use Current 3D View</button>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Target (Optional)</div>

            <div class="form-field">
                <label>Target Cart</label>
                <select onchange="updateCameraViewProperty('targetCart', this.value || null)">
                    <option value="">None</option>
                    ${cartOptions}
                </select>
            </div>

            <div class="form-field">
                <label>Target Drawer</label>
                <select onchange="updateCameraViewProperty('targetDrawer', this.value || null)">
                    <option value="">None</option>
                    ${drawerOptions}
                </select>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-primary btn-block" onclick="previewCameraView()">👁️ Preview in 3D</button>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Camera View</button>
        </div>
    `;
}

function buildScenarioInspector(scenario, container) {
    const essentialHTML = buildItemMultiselect(scenario.essential || [], 'essential');
    const optionalHTML = buildItemMultiselect(scenario.optional || [], 'optional');

    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Scenario Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${scenario.id}" onchange="updateScenarioProperty('id', this.value)">
            </div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${scenario.name}" onchange="updateScenarioProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Description</label>
                <textarea onchange="updateScenarioProperty('description', this.value)">${scenario.description}</textarea>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Essential Items</div>
            <div class="item-multiselect" id="essential-items">
                ${essentialHTML}
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Optional Items</div>
            <div class="item-multiselect" id="optional-items">
                ${optionalHTML}
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Feedback Messages</div>

            <div class="form-field">
                <label>Success Message</label>
                <textarea onchange="updateScenarioProperty('successFeedback', this.value)">${scenario.successFeedback || 'Perfect!'}</textarea>
            </div>

            <div class="form-field">
                <label>Partial Success Message</label>
                <textarea onchange="updateScenarioProperty('partialFeedback', this.value)">${scenario.partialFeedback || 'Good, but incomplete.'}</textarea>
            </div>

            <div class="form-field">
                <label>Failure Message</label>
                <textarea onchange="updateScenarioProperty('failureFeedback', this.value)">${scenario.failureFeedback || 'Missing critical items.'}</textarea>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Scenario</button>
        </div>
    `;
}

function buildDrawerInspector(drawer, container) {
    const cartOptions = CONFIG.carts.filter(c => !c.isInventory).map(c =>
        `<option value="${c.id}" ${drawer.cart === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Drawer Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${drawer.id}" onchange="updateDrawerProperty('id', this.value)">
            </div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${drawer.name}" onchange="updateDrawerProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Cart</label>
                <select onchange="updateDrawerProperty('cart', this.value)">
                    <option value="">Select cart...</option>
                    ${cartOptions}
                </select>
            </div>

            <div class="form-field">
                <label>Number</label>
                <input type="number" min="1" value="${drawer.number || 1}" onchange="updateDrawerProperty('number', parseInt(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Drawer</button>
        </div>
    `;
}

function buildItemInspector(item, container) {
    const cartOptions = CONFIG.carts.filter(c => !c.isInventory).map(c =>
        `<option value="${c.id}" ${item.cart === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const drawerOptions = CONFIG.drawers.filter(d => d.cart === item.cart).map(d =>
        `<option value="${d.id}" ${item.drawer === d.id ? 'selected' : ''}>${d.name}</option>`
    ).join('');

    const imageHTML = item.image ? `<img src="${item.image}" alt="${item.name}">` :
        '<div class="image-upload-placeholder">Click to upload image<br>or drag & drop</div>';

    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Item Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${item.id}" onchange="updateItemProperty('id', this.value)">
            </div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${item.name}" onchange="updateItemProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Cart</label>
                <select id="item-cart-select" onchange="updateItemCart(this.value)">
                    <option value="">Select cart...</option>
                    ${cartOptions}
                </select>
            </div>

            <div class="form-field">
                <label>Drawer</label>
                <select id="item-drawer-select" onchange="updateItemProperty('drawer', this.value)">
                    <option value="">Select drawer...</option>
                    ${drawerOptions}
                </select>
            </div>

            <div class="form-field">
                <label>Description</label>
                <textarea onchange="updateItemProperty('description', this.value)">${item.description || ''}</textarea>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Item Image</div>
            <div class="image-upload-field">
                <input type="file" id="item-image-upload" accept="image/*" style="display:none" onchange="handleItemImageUpload(event)">
                <div class="image-upload-preview ${item.image ? 'has-image' : ''}" onclick="document.getElementById('item-image-upload').click()">
                    ${imageHTML}
                </div>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Item</button>
        </div>
    `;
}

function buildAchievementInspector(achievement, container) {
    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Achievement Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${achievement.id}" onchange="updateAchievementProperty('id', this.value)">
            </div>

            <div class="form-field">
                <label>Title</label>
                <input type="text" value="${achievement.title}" onchange="updateAchievementProperty('title', this.value)">
            </div>

            <div class="form-field">
                <label>Description</label>
                <textarea onchange="updateAchievementProperty('description', this.value)">${achievement.description}</textarea>
            </div>

            <div class="form-field">
                <label>Icon</label>
                <input type="text" value="${achievement.icon || '🏆'}" maxlength="2" onchange="updateAchievementProperty('icon', this.value)">
            </div>

            <div class="form-field">
                <label>Trigger Type</label>
                <select onchange="updateAchievementProperty('trigger', this.value)">
                    <option value="first-scenario" ${achievement.trigger === 'first-scenario' ? 'selected' : ''}>First Scenario</option>
                    <option value="perfect-score" ${achievement.trigger === 'perfect-score' ? 'selected' : ''}>Perfect Score</option>
                    <option value="speed" ${achievement.trigger === 'speed' ? 'selected' : ''}>Speed Challenge</option>
                    <option value="efficient" ${achievement.trigger === 'efficient' ? 'selected' : ''}>Efficient (No Extras)</option>
                    <option value="count" ${achievement.trigger === 'count' ? 'selected' : ''}>Complete N Scenarios</option>
                    <option value="all" ${achievement.trigger === 'all' ? 'selected' : ''}>All Scenarios</option>
                </select>
            </div>

            <div class="form-field">
                <label>Trigger Value</label>
                <input type="number" min="0" value="${achievement.value || 0}" onchange="updateAchievementProperty('value', parseInt(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Achievement</button>
        </div>
    `;
}

function buildItemMultiselect(selectedIds, type) {
    if (CONFIG.items.length === 0) {
        return '<div class="item-multiselect-empty">No items available. Create items first!</div>';
    }

    return CONFIG.items.map(item => {
        const isSelected = selectedIds.includes(item.id);
        return `<div class="item-multiselect-item ${isSelected ? 'selected' : ''}"
                     onclick="toggleScenarioItem('${type}', '${item.id}')">
                    ${item.name}
                </div>`;
    }).join('');
}

// ===== UPDATE FUNCTIONS =====
function updateCartProperty(prop, value) {
    const cart = getEntity('cart', STATE.selectedId);
    if (cart) {
        cart[prop] = value;
        STATE.unsavedChanges = true;
        buildHierarchy();
        drawCanvas();

        // If type, color, or name changed, rebuild 3D cart
        if (prop === 'type' || prop === 'color' || prop === 'name') {
            // If type changed, update color to match type default
            if (prop === 'type' && value && CART_TYPES[value]) {
                cart.color = CART_TYPES[value].color;
                cart.name = CART_TYPES[value].name;
            }
            buildAll3DCarts();
            updateInspector(); // Refresh inspector to show updated values
        }

        // If position changed from inspector, update 3D position
        if (prop === 'x' || prop === 'y') {
            const cart3D = cartMeshes.get(cart.id);
            if (cart3D) {
                const roomWidth = 30;
                const roomDepth = 25;
                cart3D.position.x = (cart.x - 0.5) * roomWidth;
                cart3D.position.z = (cart.y - 0.5) * roomDepth;
            }
        }

        // If rotation changed, update 3D rotation
        if (prop === 'rotation') {
            const cart3D = cartMeshes.get(cart.id);
            if (cart3D) {
                cart3D.rotation.y = (value * Math.PI) / 180; // Convert degrees to radians
            }
            updateInspector(); // Refresh to show new value
        }
    }
}

function updateScenarioProperty(prop, value) {
    const scenario = getEntity('scenario', STATE.selectedId);
    if (scenario) {
        scenario[prop] = value;
        STATE.unsavedChanges = true;
        buildHierarchy();
    }
}

function updateCameraViewProperty(prop, value) {
    const view = getEntity('cameraview', STATE.selectedId);
    if (view) {
        view[prop] = value;
        STATE.unsavedChanges = true;
        buildHierarchy();
    }
}

function updateCameraViewPosition(axis, value) {
    const view = getEntity('cameraview', STATE.selectedId);
    if (view) {
        view.position[axis] = value;
        STATE.unsavedChanges = true;
    }
}

function updateCameraViewLookAt(axis, value) {
    const view = getEntity('cameraview', STATE.selectedId);
    if (view) {
        view.lookAt[axis] = value;
        STATE.unsavedChanges = true;
    }
}

function setCameraViewPreset(preset) {
    const view = getEntity('cameraview', STATE.selectedId);
    if (!view) return;

    switch (preset) {
        case 'entry':
            // Entry view - as if entering from the front
            view.position = { x: 0, y: 1.67, z: 12 };
            view.lookAt = { x: 0, y: 0, z: 0 };
            view.fov = 75;
            break;
        case 'overhead':
            // Overhead view - bird's eye view of the room
            view.position = { x: 0, y: 15, z: 0 };
            view.lookAt = { x: 0, y: 0, z: 0 };
            view.fov = 60;
            break;
        case 'current':
            // Use current 3D camera view
            if (camera) {
                view.position = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
                view.lookAt = { x: controls.target.x, y: controls.target.y, z: controls.target.z };
                view.fov = camera.fov;
            }
            break;
    }

    STATE.unsavedChanges = true;
    updateInspector();
    showAlert(`Camera preset "${preset}" applied`, 'success');
}

function previewCameraView() {
    const view = getEntity('cameraview', STATE.selectedId);
    if (!view || !camera) return;

    // Animate camera to the view position
    camera.position.set(view.position.x, view.position.y, view.position.z);
    camera.fov = view.fov;
    camera.updateProjectionMatrix();

    if (controls) {
        controls.target.set(view.lookAt.x, view.lookAt.y, view.lookAt.z);
        controls.update();
    }

    showAlert(`Previewing camera view: ${view.name}`, 'success');
}

function updateDrawerProperty(prop, value) {
    const drawer = getEntity('drawer', STATE.selectedId);
    if (drawer) {
        drawer[prop] = value;
        STATE.unsavedChanges = true;
        buildHierarchy();
    }
}

function updateItemProperty(prop, value) {
    const item = getEntity('item', STATE.selectedId);
    if (item) {
        item[prop] = value;
        STATE.unsavedChanges = true;
        buildHierarchy();
    }
}

function updateAchievementProperty(prop, value) {
    const achievement = getEntity('achievement', STATE.selectedId);
    if (achievement) {
        achievement[prop] = value;
        STATE.unsavedChanges = true;
        buildHierarchy();
    }
}

function updateItemCart(cartId) {
    const item = getEntity('item', STATE.selectedId);
    if (item) {
        item.cart = cartId;
        item.drawer = ''; // Reset drawer when cart changes
        STATE.unsavedChanges = true;

        // Update drawer dropdown
        const drawerSelect = document.getElementById('item-drawer-select');
        const drawerOptions = CONFIG.drawers.filter(d => d.cart === cartId).map(d =>
            `<option value="${d.id}">${d.name}</option>`
        ).join('');
        drawerSelect.innerHTML = '<option value="">Select drawer...</option>' + drawerOptions;
    }
}

function toggleScenarioItem(type, itemId) {
    const scenario = getEntity('scenario', STATE.selectedId);
    if (!scenario) return;

    const listName = type === 'essential' ? 'essential' : 'optional';
    if (!scenario[listName]) scenario[listName] = [];

    const index = scenario[listName].indexOf(itemId);
    if (index > -1) {
        scenario[listName].splice(index, 1);
    } else {
        scenario[listName].push(itemId);
    }

    STATE.unsavedChanges = true;
    updateInspector();
}

function handleItemImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const item = getEntity('item', STATE.selectedId);
        if (item) {
            item.image = e.target.result;
            STATE.unsavedChanges = true;
            updateInspector();
        }
    };
    reader.readAsDataURL(file);
}

// ===== CREATE NEW ENTITIES =====
function createNewCart() {
    const id = `cart_${Date.now()}`;
    const newCart = {
        id: id,
        name: 'New Cart',
        color: '#4CAF50',
        x: 0.5,
        y: 0.5,
        width: 80,
        height: 80,
        rotation: 0, // Default rotation
        isInventory: false
    };

    CONFIG.carts.push(newCart);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('cart', id);
    drawCanvas();
    buildAll3DCarts(); // Rebuild 3D scene
    showAlert('New cart created', 'success');
}

function createNewCameraView() {
    const id = `camera_${Date.now()}`;
    const newCameraView = {
        id: id,
        name: 'New Camera View',
        description: 'Camera view description',
        position: { x: 0, y: 5, z: 15 }, // Camera position (feet)
        lookAt: { x: 0, y: 0, z: 0 },    // Where camera looks
        fov: 75,                          // Field of view
        type: 'custom',                   // 'overview', 'closeup', 'custom'
        targetCart: null,                 // For cart-specific views
        targetDrawer: null                // For drawer close-ups
    };

    CONFIG.cameraViews.push(newCameraView);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('cameraview', id);
    showAlert('New camera view created', 'success');
}

function createNewScenario() {
    const id = `scenario_${Date.now()}`;
    const newScenario = {
        id: id,
        name: 'New Scenario',
        description: 'Describe the medical emergency here...',
        essential: [],
        optional: [],
        successFeedback: 'Perfect!',
        partialFeedback: 'Good, but incomplete.',
        failureFeedback: 'Missing critical items.'
    };

    CONFIG.scenarios.push(newScenario);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('scenario', id);
    showAlert('New scenario created', 'success');
}

function createNewDrawer() {
    const id = `drawer_${Date.now()}`;
    const newDrawer = {
        id: id,
        name: 'New Drawer',
        cart: '',
        number: 1
    };

    CONFIG.drawers.push(newDrawer);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('drawer', id);
    showAlert('New drawer created', 'success');
}

function createNewItem() {
    const id = `item_${Date.now()}`;
    const newItem = {
        id: id,
        name: 'New Item',
        cart: '',
        drawer: '',
        description: ''
    };

    CONFIG.items.push(newItem);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('item', id);
    showAlert('New item created', 'success');
}

function createNewAchievement() {
    const id = `achievement_${Date.now()}`;
    const newAchievement = {
        id: id,
        title: 'New Achievement',
        description: 'Describe how to earn this achievement...',
        icon: '🏆',
        trigger: 'first-scenario',
        value: 0
    };

    CONFIG.achievements.push(newAchievement);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('achievement', id);
    showAlert('New achievement created', 'success');
}

// ===== DELETE ENTITY =====
function deleteCurrentEntity() {
    if (!STATE.selectedType || !STATE.selectedId) return;

    const entity = getEntity(STATE.selectedType, STATE.selectedId);
    if (!confirm(`Are you sure you want to delete ${entity?.name || STATE.selectedId}?`)) {
        return;
    }

    const collections = {
        'cart': CONFIG.carts,
        'cameraview': CONFIG.cameraViews,
        'scenario': CONFIG.scenarios,
        'drawer': CONFIG.drawers,
        'item': CONFIG.items,
        'achievement': CONFIG.achievements
    };

    const collection = collections[STATE.selectedType];
    const index = collection.findIndex(e => e.id === STATE.selectedId);
    if (index > -1) {
        collection.splice(index, 1);
        STATE.unsavedChanges = true;
        deselectEntity();
        buildHierarchy();
        updateStatusBar();
        drawCanvas();

        // If cart was deleted, rebuild 3D scene
        if (STATE.selectedType === 'cart') {
            buildAll3DCarts();
        }

        showAlert(`${STATE.selectedType} deleted`, 'success');
    }
}

// ===== STATUS BAR =====
function updateStatusBar() {
    document.getElementById('status-carts').textContent = CONFIG.carts.filter(c => !c.isInventory).length;
    document.getElementById('status-cameras').textContent = CONFIG.cameraViews.length;
    document.getElementById('status-scenarios').textContent = CONFIG.scenarios.length;
    document.getElementById('status-drawers').textContent = CONFIG.drawers.length;
    document.getElementById('status-items').textContent = CONFIG.items.length;
    document.getElementById('status-achievements').textContent = CONFIG.achievements.length;
}

// ===== PERSISTENCE =====
function saveConfiguration() {
    localStorage.setItem('traumaRoomConfig', JSON.stringify(CONFIG));
}

function saveAll() {
    saveConfiguration();
    STATE.unsavedChanges = false;
    document.getElementById('status-message').textContent = 'Saved at ' + new Date().toLocaleTimeString();
    showAlert('All changes saved', 'success');
}

function loadConfiguration() {
    const saved = localStorage.getItem('traumaRoomConfig');
    if (saved) {
        CONFIG = JSON.parse(saved);
    } else {
        loadDefaultConfiguration();
    }

    document.getElementById('room-bg-color').value = CONFIG.roomSettings.backgroundColor;
}

function loadDefaultConfiguration() {
    CONFIG.carts = [
        { id: 'airway', name: 'Airway Cart', type: 'airway', x: 0.2, y: 0.3, width: 80, height: 80, rotation: 0, color: '#4CAF50' },
        { id: 'med', name: 'Medication Cart', type: 'medication', x: 0.8, y: 0.3, width: 80, height: 80, rotation: 90, color: '#FF9800' },
        { id: 'code', name: 'Crash Cart (Code Cart)', type: 'crash', x: 0.2, y: 0.7, width: 80, height: 80, rotation: 180, color: '#F44336' },
        { id: 'trauma', name: 'Trauma Cart', type: 'trauma', x: 0.8, y: 0.7, width: 80, height: 80, rotation: 270, color: '#E91E63' },
        { id: 'inventory', name: 'Procedure Table', type: 'procedure', x: 0.5, y: 0.5, width: 80, height: 80, rotation: 0, color: '#757575', isInventory: true }
    ];

    CONFIG.drawers = [
        { id: 'd1', cart: 'airway', name: 'Top Drawer', number: 1 },
        { id: 'd2', cart: 'airway', name: 'Middle Drawer', number: 2 },
        { id: 'd3', cart: 'airway', name: 'Bottom Drawer', number: 3 },
        { id: 'd4', cart: 'med', name: 'Top Drawer', number: 1 },
        { id: 'd5', cart: 'med', name: 'Middle Drawer', number: 2 },
        { id: 'd6', cart: 'med', name: 'Bottom Drawer', number: 3 },
        { id: 'd7', cart: 'code', name: 'Top Drawer', number: 1 },
        { id: 'd8', cart: 'code', name: 'Middle Drawer', number: 2 },
        { id: 'd9', cart: 'code', name: 'Bottom Drawer', number: 3 },
        { id: 'd10', cart: 'trauma', name: 'Top Drawer', number: 1 },
        { id: 'd11', cart: 'trauma', name: 'Middle Drawer', number: 2 },
        { id: 'd12', cart: 'trauma', name: 'Bottom Drawer', number: 3 }
    ];

    CONFIG.items = [
        { id: 'ett', name: 'Endotracheal Tube', cart: 'airway', drawer: 'd1' },
        { id: 'laryngoscope', name: 'Laryngoscope', cart: 'airway', drawer: 'd1' },
        { id: 'bvm', name: 'Bag-Valve-Mask', cart: 'airway', drawer: 'd2' },
        { id: 'oropharyngeal', name: 'Oropharyngeal Airway', cart: 'airway', drawer: 'd2' },
        { id: 'suction', name: 'Suction Catheter', cart: 'airway', drawer: 'd3' },
        { id: 'oxygen', name: 'Oxygen Mask', cart: 'airway', drawer: 'd3' },
        { id: 'epinephrine', name: 'Epinephrine', cart: 'med', drawer: 'd4' },
        { id: 'atropine', name: 'Atropine', cart: 'med', drawer: 'd4' },
        { id: 'amiodarone', name: 'Amiodarone', cart: 'med', drawer: 'd5' },
        { id: 'lidocaine', name: 'Lidocaine', cart: 'med', drawer: 'd5' },
        { id: 'morphine', name: 'Morphine', cart: 'med', drawer: 'd6' },
        { id: 'naloxone', name: 'Naloxone', cart: 'med', drawer: 'd6' },
        { id: 'defibrillator', name: 'Defibrillator Pads', cart: 'code', drawer: 'd7' },
        { id: 'ecg', name: 'ECG Leads', cart: 'code', drawer: 'd7' },
        { id: 'iv-start', name: 'IV Start Kit', cart: 'code', drawer: 'd8' },
        { id: 'saline', name: 'Saline Flush', cart: 'code', drawer: 'd8' },
        { id: 'cpr-board', name: 'CPR Board', cart: 'code', drawer: 'd9' },
        { id: 'aed', name: 'AED', cart: 'code', drawer: 'd9' },
        { id: 'chest-tube', name: 'Chest Tube Kit', cart: 'trauma', drawer: 'd10' },
        { id: 'scalpel', name: 'Scalpel', cart: 'trauma', drawer: 'd10' },
        { id: 'gauze', name: 'Gauze Pads', cart: 'trauma', drawer: 'd11' },
        { id: 'tourniquet', name: 'Tourniquet', cart: 'trauma', drawer: 'd11' },
        { id: 'splint', name: 'Splint', cart: 'trauma', drawer: 'd12' },
        { id: 'cervical-collar', name: 'Cervical Collar', cart: 'trauma', drawer: 'd12' }
    ];

    CONFIG.scenarios = [
        {
            id: 's1',
            name: 'Cardiac Arrest',
            description: 'Patient in cardiac arrest. Prepare for immediate resuscitation.',
            essential: ['defibrillator', 'ecg', 'epinephrine', 'amiodarone'],
            optional: ['cpr-board', 'iv-start', 'saline']
        },
        {
            id: 's2',
            name: 'Airway Obstruction',
            description: 'Patient with complete airway obstruction requiring immediate intervention.',
            essential: ['laryngoscope', 'ett', 'bvm', 'suction'],
            optional: ['oropharyngeal', 'oxygen']
        },
        {
            id: 's3',
            name: 'Severe Trauma',
            description: 'Multiple trauma patient with suspected internal bleeding.',
            essential: ['gauze', 'tourniquet', 'chest-tube', 'iv-start'],
            optional: ['cervical-collar', 'splint', 'scalpel']
        }
    ];

    CONFIG.achievements = [
        { id: 'first-scenario', title: 'First Steps', description: 'Complete your first scenario', icon: '🎯', trigger: 'first-scenario' },
        { id: 'perfect-score', title: 'Perfectionist', description: 'Get a perfect score', icon: '💯', trigger: 'perfect-score' },
        { id: 'speed-demon', title: 'Speed Demon', description: 'Complete in under 30 seconds', icon: '⚡', trigger: 'speed', value: 30 }
    ];

    CONFIG.cameraViews = [
        {
            id: 'entry-view',
            name: 'Entry View',
            description: 'Room view as you first enter',
            position: { x: 0, y: 1.67, z: 12 },
            lookAt: { x: 0, y: 0, z: 0 },
            fov: 75,
            type: 'overview',
            targetCart: null,
            targetDrawer: null
        },
        {
            id: 'overhead-view',
            name: 'Overhead View',
            description: 'Bird\'s eye view of the entire room',
            position: { x: 0, y: 15, z: 0 },
            lookAt: { x: 0, y: 0, z: 0 },
            fov: 60,
            type: 'overview',
            targetCart: null,
            targetDrawer: null
        },
        {
            id: 'airway-closeup',
            name: 'Airway Cart Close-up',
            description: 'Close-up view of the Airway Cart',
            position: { x: -6, y: 2, z: -5 },
            lookAt: { x: -6, y: 1.5, z: -7 },
            fov: 65,
            type: 'closeup',
            targetCart: 'airway',
            targetDrawer: null
        },
        {
            id: 'med-closeup',
            name: 'Medication Cart Close-up',
            description: 'Close-up view of the Medication Cart',
            position: { x: 6, y: 2, z: -5 },
            lookAt: { x: 6, y: 1.5, z: -7 },
            fov: 65,
            type: 'closeup',
            targetCart: 'med',
            targetDrawer: null
        },
        {
            id: 'code-closeup',
            name: 'Code Cart Close-up',
            description: 'Close-up view of the Crash Cart',
            position: { x: -6, y: 2, z: 3 },
            lookAt: { x: -6, y: 1.5, z: 5 },
            fov: 65,
            type: 'closeup',
            targetCart: 'code',
            targetDrawer: null
        }
    ];

    saveConfiguration();
}

// ===== EXPORT/IMPORT =====
function exportConfiguration() {
    const dataStr = JSON.stringify(CONFIG, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trauma-room-config-${Date.now()}.json`;
    link.click();
    showAlert('Configuration exported', 'success');
}

function importConfiguration() {
    document.getElementById('import-modal').classList.add('active');
}

function processImport() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select a file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            let importedConfig = JSON.parse(e.target.result);

            // Validate and migrate configuration
            importedConfig = validateAndMigrateConfig(importedConfig);

            CONFIG = importedConfig;
            saveConfiguration();
            buildHierarchy();
            updateStatusBar();
            drawCanvas();
            buildAll3DCarts(); // Rebuild 3D scene
            closeModal('import-modal');
            showAlert('Configuration imported successfully', 'success');
        } catch (error) {
            console.error('Import error:', error);
            showAlert('Invalid configuration file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function validateAndMigrateConfig(config) {
    console.log('Validating configuration...');

    // Check for required properties
    if (!config.carts || !Array.isArray(config.carts)) {
        throw new Error('Missing or invalid carts array');
    }

    // Migrate old 2D configurations to 3D
    let migrated = false;
    config.carts.forEach(cart => {
        // Add rotation if missing
        if (cart.rotation === undefined) {
            cart.rotation = 0;
            migrated = true;
        }

        // Add type if missing (infer from name or set default)
        if (!cart.type) {
            // Try to infer type from name
            const name = cart.name.toLowerCase();
            if (name.includes('crash') || name.includes('code')) {
                cart.type = 'crash';
            } else if (name.includes('airway')) {
                cart.type = 'airway';
            } else if (name.includes('medication') || name.includes('med')) {
                cart.type = 'medication';
            } else if (name.includes('iv')) {
                cart.type = 'iv';
            } else if (name.includes('procedure') || name.includes('table')) {
                cart.type = 'procedure';
            } else if (name.includes('trauma')) {
                cart.type = 'trauma';
            } else {
                cart.type = 'supply'; // Default
            }
            migrated = true;
        }
    });

    // Ensure other arrays exist
    config.drawers = config.drawers || [];
    config.items = config.items || [];
    config.scenarios = config.scenarios || [];
    config.achievements = config.achievements || [];

    // Ensure settings exist
    config.roomSettings = config.roomSettings || {
        backgroundColor: '#fafafa',
        width: 800,
        height: 600
    };

    config.scoringRules = config.scoringRules || {
        essentialPoints: 60,
        optionalPoints: 20,
        penaltyPoints: 5,
        perfectBonus: 500,
        speedThreshold: 60,
        speedBonus: 300
    };

    config.generalSettings = config.generalSettings || {
        appTitle: 'Trauma Room Trainer',
        enableTutorial: true,
        enableSound: true,
        enableHaptics: true
    };

    if (migrated) {
        console.log('✓ Configuration migrated from 2D to 3D format');
        showAlert('Old configuration migrated to 3D format', 'success');
    }

    console.log('✓ Configuration validated successfully');
    return config;
}

function resetToDefaults() {
    if (!confirm('This will reset all configurations to defaults. Continue?')) {
        return;
    }

    localStorage.removeItem('traumaRoomConfig');
    loadDefaultConfiguration();
    deselectEntity();
    buildHierarchy();
    updateStatusBar();
    drawCanvas();
    buildAll3DCarts(); // Rebuild 3D scene
    showAlert('Reset to defaults complete', 'success');
}

function previewGame() {
    // Save current config to localStorage so trainer can use it
    saveConfiguration();

    // Open the trainer page (the actual game)
    const previewUrl = 'trainer.html';
    const previewWindow = window.open(previewUrl, '_blank');

    if (previewWindow) {
        showAlert('Preview opened in new tab', 'success');
    } else {
        showAlert('Please allow popups to preview the game', 'error');
    }
}

// ===== UTILITIES =====
function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert-toast');
    alert.textContent = message;
    alert.className = `alert-toast show ${type}`;

    setTimeout(() => {
        alert.classList.remove('show');
    }, 3000);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ===== INITIALIZE =====
window.onload = init;
