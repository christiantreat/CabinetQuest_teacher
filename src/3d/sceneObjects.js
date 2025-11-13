/**
 * ==============================================================================
 * THREE.JS SCENE OBJECTS MODULE
 * ==============================================================================
 *
 * This module handles the creation and management of scene objects:
 * - Floor mesh with hospital-style material
 * - Grid helper for spatial reference (1-foot grid)
 * - Lighting setup (ambient + point lights)
 * - Orbit controls for camera movement
 * - Enhanced animation loop with controls update
 *
 * Dependencies:
 * - Three.js library (THREE global object)
 * - Three.js OrbitControls (THREE.OrbitControls or window.OrbitControls)
 * - CONFIG object with roomSettings (width, depth)
 * - scene, camera, renderer from scene.js module
 *
 * Exports:
 * - createFloor(): Create the floor mesh
 * - createGrid(): Create the grid helper
 * - createLighting(): Add ambient and point lights
 * - createOrbitControls(): Initialize camera controls
 * - animateThreeScene(): Animation loop with controls update
 *
 * @module 3d/sceneObjects
 */

import {
    scene,
    camera,
    renderer,
    setControls,
    setFloor,
    setFloorGrid
} from './scene.js';

// ===== FLOOR CREATION =====

/**
 * Create the 3D floor mesh
 *
 * Creates a horizontal plane representing the hospital floor:
 * - Size matches the room dimensions from CONFIG
 * - Beige/hospital floor color (#f5f5f0)
 * - Positioned at y=0 (ground level)
 * - Receives shadows for realistic lighting
 * - Rotated 90° on X-axis to be horizontal
 *
 * The floor uses a PlaneGeometry with StandardMaterial for
 * realistic lighting interactions.
 *
 * @returns {void}
 * @requires CONFIG.roomSettings.width - Room width in feet
 * @requires CONFIG.roomSettings.depth - Room depth in feet
 */
export function createFloor() {
    // Get room dimensions from config (in feet)
    const roomWidth = window.CONFIG.roomSettings.width;
    const roomDepth = window.CONFIG.roomSettings.depth;

    // Create floor geometry (large plane)
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);

    // Create floor material with hospital-like appearance
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f0, // Beige/hospital floor color
        roughness: 0.8, // Slightly rough surface
        metalness: 0.2  // Minimal metallic reflection
    });

    // Create the floor mesh
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);

    // Rotate floor to be horizontal (PlaneGeometry starts vertical)
    floor.rotation.x = -Math.PI / 2; // -90 degrees around X-axis

    // Position at ground level
    floor.position.y = 0;

    // Enable shadow receiving for realistic lighting
    floor.receiveShadow = true;

    // Add to scene
    scene.add(floor);

    // Store reference using setter
    setFloor(floor);

    console.log('✓ Floor created:', roomWidth, 'ft x', roomDepth, 'ft');
}

// ===== GRID CREATION =====

/**
 * Create the grid helper overlay
 *
 * Creates a visual grid on the floor:
 * - 1-foot grid spacing for spatial reference
 * - Size matches the larger room dimension (square grid)
 * - Positioned slightly above floor (y=0.01) to prevent z-fighting
 * - Uses gray colors for visibility without distraction
 *
 * The grid helps users understand scale and align objects.
 *
 * @returns {void}
 * @requires CONFIG.roomSettings.width - Room width in feet
 * @requires CONFIG.roomSettings.depth - Room depth in feet
 */
export function createGrid() {
    const roomWidth = window.CONFIG.roomSettings.width; // feet
    const roomDepth = window.CONFIG.roomSettings.depth; // feet
    const gridSize = 1; // 1 foot grid

    // Create grid helper (extends to largest dimension)
    const maxDimension = Math.max(roomWidth, roomDepth);
    const floorGrid = new THREE.GridHelper(
        maxDimension, // size (total size of grid)
        maxDimension / gridSize, // divisions (number of grid lines)
        0x666666, // center line color (darker gray)
        0x888888  // grid color (lighter gray)
    );

    // Position slightly above floor to prevent z-fighting
    // (visual artifact when two surfaces overlap)
    floorGrid.position.y = 0.01;

    // Add to scene
    scene.add(floorGrid);

    // Store reference using setter
    setFloorGrid(floorGrid);

    console.log('✓ Grid created:', maxDimension, 'ft');
}

// ===== LIGHTING SETUP =====

/**
 * Create and configure scene lighting
 *
 * Sets up a three-point lighting system:
 * - Ambient light: Soft fill light (0.6 intensity) for overall illumination
 * - Point light 1: Positioned at (10, 10, 10) - front right
 * - Point light 2: Positioned at (-10, 10, 10) - front left
 * - Point light 3: Positioned at (0, 10, -10) - back center
 *
 * This creates even, hospital-like lighting that illuminates
 * objects from multiple angles without harsh shadows.
 *
 * @returns {void}
 */
export function createLighting() {
    // Ambient light (fills everything with soft light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Point light 1 (front right ceiling)
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    // Point light 2 (front left ceiling)
    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight2.position.set(-10, 10, 10);
    scene.add(pointLight2);

    // Point light 3 (back center ceiling)
    const pointLight3 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight3.position.set(0, 10, -10);
    scene.add(pointLight3);

    console.log('✓ Lighting added');
}

// ===== ORBIT CONTROLS =====

/**
 * Create and configure orbit controls for camera movement
 *
 * Initializes OrbitControls to allow:
 * - Camera rotation around the room center
 * - Zoom in/out with mouse wheel
 * - Smooth damped movement
 * - Constrained angles (can't go below floor)
 *
 * Configuration:
 * - Target: Room center (0, 0, 0)
 * - Damping: Enabled with 0.05 factor for smooth movement
 * - Min distance: 5 units (prevents clipping)
 * - Max distance: 50 units (prevents too far zoom)
 * - Max polar angle: 89° (can't go below horizontal)
 *
 * Falls back to dummy controls if OrbitControls not available.
 *
 * @returns {void}
 * @requires THREE.OrbitControls or window.OrbitControls
 */
export function createOrbitControls() {
    // Try different ways OrbitControls might be loaded
    const OrbitControlsConstructor = THREE.OrbitControls || window.OrbitControls;

    if (!OrbitControlsConstructor) {
        console.error('OrbitControls not found! Trying to continue without it...');
        console.log('THREE object:', THREE);

        // Create a dummy controls object to prevent crashes
        const dummyControls = {
            enabled: true,
            update: function() {},
            target: { set: function() {} }
        };

        setControls(dummyControls);
        return;
    }

    // Create OrbitControls instance
    const controls = new OrbitControlsConstructor(camera, renderer.domElement);

    // Configure controls
    controls.target.set(0, 0, 0); // Look at room center
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05; // Damping inertia (lower = more smoothing)

    // Set zoom limits
    controls.minDistance = 5; // Minimum zoom (prevent clipping)
    controls.maxDistance = 50; // Maximum zoom (prevent too far)

    // Prevent camera from going below ground
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // 89 degrees (0.1 rad = ~5.7°)

    // Touch-optimized settings for mobile/tablet
    controls.enablePan = true; // Enable two-finger pan on touch devices
    controls.panSpeed = 1.0; // Standard pan speed
    controls.rotateSpeed = 1.0; // Standard rotation speed
    controls.zoomSpeed = 1.2; // Slightly faster zoom for touch (pinch-to-zoom)

    // Touch-specific behavior
    // OrbitControls automatically handles:
    // - Single finger drag: Rotate camera
    // - Two finger drag: Pan camera
    // - Pinch: Zoom in/out
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,   // Single touch rotates
        TWO: THREE.TOUCH.DOLLY_PAN // Two fingers zoom + pan
    };

    // Initial update
    controls.update();

    // Store reference using setter
    setControls(controls);

    console.log('✓ Orbit controls enabled (touch-optimized)');
}

// ===== ENHANCED ANIMATION LOOP =====

/**
 * Enhanced animation loop with controls update
 *
 * This is an alternative to animateThree() that includes
 * controls.update() for damped camera movement.
 *
 * Use this instead of animateThree() if you want smooth
 * damped controls. Call once to start the loop.
 *
 * The loop:
 * 1. Requests next animation frame
 * 2. Updates orbit controls (if available)
 * 3. Renders the scene
 *
 * @returns {void}
 */
export function animateThreeScene() {
    requestAnimationFrame(animateThreeScene);

    // Update controls if available (required for damping)
    if (controls && controls.update) {
        controls.update();
    }

    // Render the scene
    renderer.render(scene, camera);
}

/**
 * Access to the controls instance (read-only)
 * Import this if you need to access controls properties
 *
 * Note: For setting controls, modules should use setControls()
 * from scene.js. This import is for reading controls properties.
 */
import { controls } from './scene.js';
export { controls };
