/**
 * ==============================================================================
 * THREE.JS SCENE INITIALIZATION MODULE
 * ==============================================================================
 *
 * This module handles the core Three.js scene setup including:
 * - Scene creation and configuration
 * - Camera setup with perspective projection
 * - WebGL renderer initialization
 * - Window resize handling
 * - Animation loop
 *
 * Dependencies:
 * - Three.js library (THREE global object)
 * - DOM: #three-container element must exist
 *
 * Exports:
 * - scene: THREE.Scene instance
 * - camera: THREE.PerspectiveCamera instance
 * - renderer: THREE.WebGLRenderer instance
 * - controls: OrbitControls instance (initialized by sceneObjects module)
 * - initThreeJS(): Initialize the 3D scene
 * - onThreeResize(): Handle window resize events
 * - animateThree(): Main animation loop
 *
 * @module 3d/scene
 */

// ===== THREE.JS SCENE VARIABLES =====
// These are exported and shared across the 3D rendering system

/**
 * The main Three.js scene object - container for all 3D objects
 * @type {THREE.Scene}
 */
export let scene;

/**
 * Perspective camera for 3D view
 * @type {THREE.PerspectiveCamera}
 */
export let camera;

/**
 * WebGL renderer that draws the scene
 * @type {THREE.WebGLRenderer}
 */
export let renderer;

/**
 * Orbit controls for camera movement (initialized by sceneObjects module)
 * @type {THREE.OrbitControls|Object}
 */
export let controls;

/**
 * Floor mesh object
 * @type {THREE.Mesh}
 */
export let floor;

/**
 * Grid helper object
 * @type {THREE.GridHelper}
 */
export let floorGrid;

/**
 * Map of cart IDs to their Three.js mesh/group objects
 * @type {Map<string, THREE.Group>}
 */
export let cartMeshes = new Map();

/**
 * Raycaster for mouse picking in 3D space
 * @type {THREE.Raycaster}
 */
export let raycaster;

/**
 * Mouse position in normalized device coordinates (-1 to +1)
 * @type {THREE.Vector2}
 */
export let mouse;

/**
 * Currently selected cart in 3D view
 * @type {THREE.Group|null}
 */
export let selectedCart3D = null;

/**
 * Invisible plane used for dragging objects in 3D space
 * @type {THREE.Mesh}
 */
export let dragPlane;

/**
 * Reference to the DOM container for the Three.js canvas
 * @type {HTMLElement}
 */
const threeContainer = document.getElementById('three-container');

// ===== SETTER FUNCTIONS =====
// Allow other modules to update exported variables

/**
 * Set the controls reference (called by sceneObjects module)
 * @param {THREE.OrbitControls|Object} newControls - The controls instance
 */
export function setControls(newControls) {
    controls = newControls;
}

/**
 * Set the floor reference (called by sceneObjects module)
 * @param {THREE.Mesh} newFloor - The floor mesh
 */
export function setFloor(newFloor) {
    floor = newFloor;
}

/**
 * Set the floor grid reference (called by sceneObjects module)
 * @param {THREE.GridHelper} newGrid - The grid helper
 */
export function setFloorGrid(newGrid) {
    floorGrid = newGrid;
}

/**
 * Set the selected cart in 3D view
 * @param {THREE.Group|null} cart - The cart group or null
 */
export function setSelectedCart3D(cart) {
    selectedCart3D = cart;
}

/**
 * Set the drag plane reference
 * @param {THREE.Mesh} plane - The drag plane mesh
 */
export function setDragPlane(plane) {
    dragPlane = plane;
}

/**
 * Set the raycaster reference
 * @param {THREE.Raycaster} newRaycaster - The raycaster instance
 */
export function setRaycaster(newRaycaster) {
    raycaster = newRaycaster;
}

/**
 * Set the mouse vector reference
 * @param {THREE.Vector2} newMouse - The mouse vector instance
 */
export function setMouse(newMouse) {
    mouse = newMouse;
}

// ===== SCENE INITIALIZATION =====

/**
 * Initialize the Three.js 3D scene
 *
 * This function creates and configures:
 * - Scene with background color
 * - Perspective camera with isometric-style positioning
 * - WebGL renderer with antialiasing
 * - Window resize event listener
 *
 * The camera is positioned at (15, 15, 15) for an angled orbital view
 * looking at the center of the room (0, 0, 0).
 *
 * @returns {void}
 * @throws {Error} If three-container element is not found
 */
export function initThreeJS() {
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
        antialias: true, // Smooth edges
        alpha: true // Transparent background initially
    });
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Handle high-DPI displays

    // Append the renderer's canvas to the DOM
    threeContainer.appendChild(renderer.domElement);

    // Enable pointer events on the 3D container
    threeContainer.style.pointerEvents = 'auto';

    // Handle window resize
    window.addEventListener('resize', onThreeResize);

    console.log('✓ Three.js scene initialized');
}

/**
 * Handle window resize events
 *
 * Updates the camera aspect ratio and projection matrix,
 * and resizes the renderer to match the new container dimensions.
 * This ensures the 3D view always fills its container properly.
 *
 * @returns {void}
 */
export function onThreeResize() {
    const width = threeContainer.clientWidth;
    const height = threeContainer.clientHeight;

    // Update camera aspect ratio
    camera.aspect = width / height;
    camera.updateProjectionMatrix(); // Required after changing aspect

    // Resize renderer
    renderer.setSize(width, height);
}

/**
 * Main animation loop for Three.js rendering
 *
 * This function:
 * - Requests the next animation frame (60 FPS target)
 * - Renders the scene with the camera
 *
 * Note: Controls are NOT updated here. Use animateThreeScene() from
 * sceneObjects module if you need controls updates.
 *
 * @returns {void}
 */
export function animateThree() {
    requestAnimationFrame(animateThree);
    renderer.render(scene, camera);
}
