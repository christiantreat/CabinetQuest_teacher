/**
 * ==============================================================================
 * 3D CART MODEL MODULE
 * ==============================================================================
 *
 * This module handles the creation and management of 3D cart models in the
 * trauma room visualization. It provides functions to construct detailed
 * cart geometries with drawers, wheels, and special features.
 *
 * Key responsibilities:
 * - Creating 3D cart models from cart data
 * - Building drawer geometries with handles
 * - Adding cart-specific features (IV poles, procedure surfaces)
 * - Managing cart mesh lifecycle (creation, disposal)
 * - Converting between 2D canvas coordinates and 3D space
 *
 * Dependencies:
 * - Three.js library (THREE global)
 * - CONFIG object from config module
 * - CART_TYPES and constants from constants module
 * - scene, cartMeshes from scene module
 *
 * Exports:
 * - getDrawerColor(): Determine drawer color based on contents
 * - createDrawer(): Create a single drawer mesh with handle
 * - create3DCart(): Create complete 3D cart model
 * - buildAll3DCarts(): Build all carts from CONFIG and add to scene
 *
 * @module 3d/cartModel
 */

import { CONFIG } from '../config/config.js';
import {
    CART_TYPES,
    DRAWER_COLOR_MAP,
    DEFAULT_DRAWER_COLOR,
    WHEEL_DIMENSIONS,
    DRAWER_PROPERTIES,
    HANDLE_DIMENSIONS,
    IV_POLE_DIMENSIONS,
    PROCEDURE_SURFACE,
    CART_MATERIAL,
    DRAWER_MATERIAL,
    HANDLE_MATERIAL,
    WHEEL_MATERIAL
} from '../config/constants.js';
import { scene, cartMeshes } from './scene.js';

// ===== DRAWER COLOR LOGIC =====

/**
 * Determine drawer color based on its contents
 *
 * This function examines the items contained in a drawer and returns
 * an appropriate color based on the item categories. Color coding helps
 * users quickly identify drawer purposes.
 *
 * Color logic:
 * - Empty drawers: Gray (DEFAULT_DRAWER_COLOR)
 * - Drawers with items: Color based on cart type/category
 *
 * @param {Object} drawer - The drawer object from CONFIG
 * @param {string} drawer.id - Unique drawer identifier
 * @param {string} drawer.cart - Parent cart ID
 * @returns {number} Hex color value for the drawer (e.g., 0x4CAF50)
 *
 * @example
 * const color = getDrawerColor(drawerObject);
 * // Returns 0x4CAF50 for airway items, 0x999999 for empty
 */
export function getDrawerColor(drawer) {
    // Check if drawer has any items
    const drawerItems = CONFIG.items.filter(item => item.drawer === drawer.id);

    if (drawerItems.length === 0) {
        return DEFAULT_DRAWER_COLOR; // Gray for empty drawers
    }

    // Use the cart type as category for color mapping
    // This provides consistent coloring based on cart purpose
    return DRAWER_COLOR_MAP[drawer.cart] || DEFAULT_DRAWER_COLOR;
}

// ===== DRAWER CREATION =====

/**
 * Create a 3D drawer mesh with handle
 *
 * Constructs a complete drawer group including:
 * - Drawer front face (colored based on contents)
 * - Cylindrical handle (horizontal bar)
 * - Proper positioning within cart
 * - User data for interaction
 *
 * The drawer is positioned vertically based on its index,
 * with appropriate gaps between drawers.
 *
 * @param {Object} drawer - Drawer data object from CONFIG
 * @param {string} drawer.id - Unique drawer identifier
 * @param {number} drawer.number - Drawer number (top to bottom)
 * @param {number} cartWidth - Parent cart width in feet
 * @param {number} drawerHeight - Height of this drawer in feet
 * @param {number} cartDepth - Parent cart depth in feet
 * @param {number} index - Zero-based index for vertical positioning
 * @param {number} startY - Y-coordinate to start drawer stack
 * @returns {THREE.Group} Group containing drawer meshes
 *
 * @example
 * const drawer = createDrawer(
 *   drawerData,
 *   2.0,  // cart width
 *   0.5,  // drawer height
 *   1.5,  // cart depth
 *   0,    // first drawer (index 0)
 *   0.5   // start position
 * );
 * cartGroup.add(drawer);
 */
export function createDrawer(drawer, cartWidth, drawerHeight, cartDepth, index, startY) {
    // Create group to hold all drawer parts
    const drawerGroup = new THREE.Group();
    drawerGroup.userData = {
        drawerId: drawer.id,
        drawerData: drawer,
        isOpen: false // Track open/closed state
    };

    // Calculate drawer dimensions (slightly smaller than cart to fit inside)
    const drawerWidth = cartWidth * DRAWER_PROPERTIES.widthRatio;
    const drawerDepth = cartDepth * DRAWER_PROPERTIES.depthRatio;

    // Create drawer front face (the visible part)
    const frontGeometry = new THREE.BoxGeometry(
        drawerWidth,
        drawerHeight,
        DRAWER_PROPERTIES.frontThickness
    );

    // Get color based on drawer contents
    const drawerColor = getDrawerColor(drawer);

    // Create material with appropriate lighting properties
    const frontMaterial = new THREE.MeshStandardMaterial({
        color: drawerColor,
        roughness: DRAWER_MATERIAL.roughness,
        metalness: DRAWER_MATERIAL.metalness
    });

    const front = new THREE.Mesh(frontGeometry, frontMaterial);

    // Position drawer vertically with gaps between drawers
    const yPosition = startY + index * (drawerHeight + DRAWER_PROPERTIES.gap) + drawerHeight / 2;
    front.position.y = yPosition;
    front.position.z = (cartDepth / 2) - 0.05; // Just inside the cart front

    // Enable shadow casting and receiving for realistic lighting
    front.castShadow = true;
    front.receiveShadow = true;
    drawerGroup.add(front);

    // Create drawer handle (small horizontal cylinder)
    const handleWidth = drawerWidth * HANDLE_DIMENSIONS.widthRatio;
    const handleGeometry = new THREE.CylinderGeometry(
        HANDLE_DIMENSIONS.radius,
        HANDLE_DIMENSIONS.radius,
        handleWidth,
        8 // segments for smooth cylinder
    );

    const handleMaterial = new THREE.MeshStandardMaterial({
        color: HANDLE_DIMENSIONS.color,
        roughness: HANDLE_MATERIAL.roughness,
        metalness: HANDLE_MATERIAL.metalness
    });

    const handle = new THREE.Mesh(handleGeometry, handleMaterial);

    // Rotate handle to be horizontal (cylinder starts vertical)
    handle.rotation.z = Math.PI / 2;

    // Position handle on drawer front
    handle.position.copy(front.position);
    handle.position.z = front.position.z + HANDLE_DIMENSIONS.offset;

    drawerGroup.add(handle);

    // Store reference to clickable mesh for raycasting
    front.userData = {
        drawerId: drawer.id,
        type: 'drawer'
    };
    drawerGroup.userData.clickable = front;

    return drawerGroup;
}

// ===== CART CREATION =====

/**
 * Create a complete 3D cart model
 *
 * This is the main cart construction function. It creates a detailed
 * 3D representation including:
 * - Main cart body with material and lighting
 * - Edge wireframe for definition
 * - Four wheels at corners for mobility
 * - All drawers with handles
 * - Special features (IV pole, procedure surface) if applicable
 *
 * The cart is positioned in 3D space based on its 2D coordinates,
 * converting from normalized canvas coordinates to feet-based 3D coords.
 *
 * @param {Object} cartData - Cart data object from CONFIG
 * @param {string} cartData.id - Unique cart identifier
 * @param {string} cartData.type - Cart type key (matches CART_TYPES)
 * @param {number} cartData.x - Normalized X position (0-1)
 * @param {number} cartData.y - Normalized Y position (0-1)
 * @param {number} [cartData.rotation=0] - Rotation in degrees
 * @param {string} [cartData.color] - Override cart color
 * @returns {THREE.Group} Complete cart group ready to add to scene
 *
 * @example
 * const cart = create3DCart({
 *   id: 'cart_001',
 *   type: 'crash',
 *   x: 0.5,
 *   y: 0.5,
 *   rotation: 45,
 *   color: '#FF0000'
 * });
 * scene.add(cart);
 */
export function create3DCart(cartData) {
    // Create a group to hold all cart parts
    const cartGroup = new THREE.Group();
    cartGroup.userData = {
        cartId: cartData.id,
        cartData: cartData
    };

    // Get cart type definition or use defaults
    const cartType = cartData.type ? CART_TYPES[cartData.type] : null;
    const width = cartType ? cartType.width : (cartData.width3D || 2.0);
    const height = cartType ? cartType.height : (cartData.height3D || 4.0);
    const depth = cartType ? cartType.depth : (cartData.depth3D || 1.5);

    // ===== CART BODY =====

    // Create main cart body geometry
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);

    // Create material with cart color
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: cartData.color || (cartType ? cartType.color : '#4CAF50'),
        roughness: CART_MATERIAL.roughness,
        metalness: CART_MATERIAL.metalness
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // Position cart body - lift to sit on floor
    body.position.y = height / 2;

    // Enable shadows for realistic lighting
    body.castShadow = true;
    body.receiveShadow = true;
    cartGroup.add(body);

    // ===== CART EDGES =====

    // Add edge wireframe for better visual definition
    const edges = new THREE.EdgesGeometry(bodyGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x333333, // Dark gray
        linewidth: 2
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    wireframe.position.copy(body.position);
    cartGroup.add(wireframe);

    // ===== WHEELS =====

    // Create wheel geometry (shared by all 4 wheels)
    const wheelGeometry = new THREE.CylinderGeometry(
        WHEEL_DIMENSIONS.radius,
        WHEEL_DIMENSIONS.radius,
        WHEEL_DIMENSIONS.width,
        16 // segments for smooth cylinder
    );

    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: WHEEL_DIMENSIONS.color,
        roughness: WHEEL_MATERIAL.roughness,
        metalness: WHEEL_MATERIAL.metalness
    });

    // Position wheels at four corners (slightly inset from edges)
    const wheelInset = WHEEL_DIMENSIONS.inset;
    const wheelPositions = [
        { x: -(width/2 - wheelInset), z: -(depth/2 - wheelInset) }, // Back left
        { x: (width/2 - wheelInset), z: -(depth/2 - wheelInset) },  // Back right
        { x: -(width/2 - wheelInset), z: (depth/2 - wheelInset) },  // Front left
        { x: (width/2 - wheelInset), z: (depth/2 - wheelInset) }    // Front right
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.x = Math.PI / 2; // Rotate to be horizontal (rolling orientation)
        wheel.position.x = pos.x;
        wheel.position.y = WHEEL_DIMENSIONS.radius; // At ground level
        wheel.position.z = pos.z;
        wheel.castShadow = true;
        cartGroup.add(wheel);
    });

    // ===== SPECIAL FEATURES =====

    // Add IV pole for IV cart type
    if (cartType && cartType.hasIVPole) {
        // Main pole (tall cylinder at back)
        const poleHeight = height * IV_POLE_DIMENSIONS.heightRatio;
        const poleGeometry = new THREE.CylinderGeometry(
            IV_POLE_DIMENSIONS.radius,
            IV_POLE_DIMENSIONS.radius,
            poleHeight,
            12 // segments
        );

        const poleMaterial = new THREE.MeshStandardMaterial({
            color: IV_POLE_DIMENSIONS.poleColor,
            roughness: 0.3,
            metalness: 0.7
        });

        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = height - (poleHeight / 2);
        pole.position.z = -depth / 3;
        cartGroup.add(pole);

        // IV hooks at top (ring-shaped hooks for hanging IV bags)
        const hookGeometry = new THREE.TorusGeometry(
            IV_POLE_DIMENSIONS.hookRadius,
            IV_POLE_DIMENSIONS.hookTubeRadius,
            8,  // radial segments
            16  // tubular segments
        );

        const hookMaterial = new THREE.MeshStandardMaterial({
            color: IV_POLE_DIMENSIONS.hookColor,
            roughness: 0.2,
            metalness: 0.8
        });

        // Create multiple hooks along the top
        for (let i = 0; i < IV_POLE_DIMENSIONS.hookCount; i++) {
            const hook = new THREE.Mesh(hookGeometry, hookMaterial);
            hook.position.y = height - 0.3;
            hook.position.x = (i - (IV_POLE_DIMENSIONS.hookCount - 1) / 2) * IV_POLE_DIMENSIONS.hookSpacing;
            hook.position.z = -depth / 3;
            hook.rotation.x = Math.PI / 2; // Horizontal ring
            cartGroup.add(hook);
        }
    }

    // Add enhanced top surface for procedure table
    if (cartType && cartType.hasTopSurface) {
        const topGeometry = new THREE.BoxGeometry(
            width,
            PROCEDURE_SURFACE.thickness,
            depth
        );

        const topMaterial = new THREE.MeshStandardMaterial({
            color: PROCEDURE_SURFACE.color,
            roughness: 0.4,
            metalness: 0.5
        });

        const topSurface = new THREE.Mesh(topGeometry, topMaterial);
        topSurface.position.y = height / 2 + PROCEDURE_SURFACE.offset;
        topSurface.castShadow = true;
        cartGroup.add(topSurface);
    }

    // ===== DRAWERS =====

    // Get drawers belonging to this cart
    const cartDrawers = CONFIG.drawers.filter(d => d.cart === cartData.id);

    if (cartDrawers.length > 0) {
        // Sort drawers by number (top to bottom)
        cartDrawers.sort((a, b) => a.number - b.number);

        // Calculate drawer layout
        const drawerHeight = cartType ? cartType.drawerHeight : 0.5;
        const totalDrawerHeight = cartDrawers.length * (drawerHeight + DRAWER_PROPERTIES.gap);
        const startY = (height / 2) - (totalDrawerHeight / 2); // Start from top

        // Create each drawer
        cartDrawers.forEach((drawer, index) => {
            const drawerGroup = createDrawer(
                drawer,
                width,
                drawerHeight,
                depth,
                index,
                startY
            );
            cartGroup.add(drawerGroup);
        });
    }

    // ===== POSITIONING =====

    // Convert normalized 0-1 coords to feet-based 3D coords
    const roomWidth = CONFIG.roomSettings.width;
    const roomDepth = CONFIG.roomSettings.depth;

    // Center the coordinate system (0.5, 0.5) = room center
    cartGroup.position.x = (cartData.x - 0.5) * roomWidth;
    cartGroup.position.z = (cartData.y - 0.5) * roomDepth;
    cartGroup.position.y = 0; // On floor

    // Apply rotation (convert degrees to radians)
    if (cartData.rotation !== undefined) {
        cartGroup.rotation.y = (cartData.rotation * Math.PI) / 180;
    }

    // ===== INTERACTION SETUP =====

    // Store cart ID in body mesh for raycasting
    body.userData = { cartId: cartData.id };

    // Store reference to clickable mesh
    cartGroup.userData.clickable = body;

    return cartGroup;
}

// ===== CART MANAGEMENT =====

/**
 * Build all 3D carts from CONFIG and add to scene
 *
 * This function:
 * 1. Clears existing carts from scene and memory
 * 2. Properly disposes of all geometries and materials
 * 3. Creates new 3D cart models from CONFIG.carts
 * 4. Adds them to the scene
 * 5. Updates the cartMeshes map
 *
 * Call this function whenever:
 * - Scene is initialized for the first time
 * - Carts are added/removed from CONFIG
 * - Cart properties change significantly
 * - Reloading configuration data
 *
 * Memory management:
 * The function properly disposes of Three.js resources to prevent
 * memory leaks. All geometries and materials are explicitly disposed
 * before removing meshes from the scene.
 *
 * @returns {void}
 *
 * @example
 * // After loading new configuration
 * buildAll3DCarts();
 * console.log(`Scene now has ${cartMeshes.size} carts`);
 */
export function buildAll3DCarts() {
    // Clear existing carts with proper disposal
    cartMeshes.forEach((mesh) => {
        // Recursively dispose of all children geometries and materials
        mesh.traverse((child) => {
            // Dispose geometry
            if (child.geometry) {
                child.geometry.dispose();
            }

            // Dispose material(s)
            if (child.material) {
                if (Array.isArray(child.material)) {
                    // Some meshes have multiple materials
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        // Remove from scene
        scene.remove(mesh);
    });

    // Clear the map
    cartMeshes.clear();

    // Create 3D version of each cart
    CONFIG.carts.forEach(cart => {
        const cart3D = create3DCart(cart);
        scene.add(cart3D);
        cartMeshes.set(cart.id, cart3D);
    });

    console.log(`✓ Built ${cartMeshes.size} 3D carts`);
}
