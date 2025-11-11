/**
 * ==============================================================================
 * 3D SELECTION MODULE
 * ==============================================================================
 *
 * This module handles visual selection feedback in the 3D view:
 * - Cart selection highlighting with emissive glow
 * - Drawer selection highlighting and animation
 * - Visual selection helpers (bounding box, facing arrow)
 * - Selection state management
 *
 * The selection system provides clear visual feedback when users click
 * on carts or drawers. Carts get a glowing outline, bounding box, and
 * directional arrow. Drawers get highlighted and animate open.
 *
 * Dependencies:
 * - Three.js library (THREE global)
 * - scene, cartMeshes from scene module
 * - SELECTION_COLOR, SELECTION_INTENSITY from constants module
 * - openDrawer, closeDrawer from animation module
 *
 * Exports:
 * - selectCart3D(): Select and highlight a cart
 * - deselectCart3D(): Remove cart selection
 * - selectDrawer3D(): Select and open a drawer
 * - deselectDrawer3D(): Close and deselect drawer
 * - createSelectionHelpers(): Add visual helpers to selected cart
 * - removeSelectionHelpers(): Remove visual helpers
 *
 * @module 3d/selection
 */

import { scene, cartMeshes } from './scene.js';
import {
    SELECTION_COLOR,
    SELECTION_INTENSITY,
    DRAWER_SELECTION_INTENSITY
} from '../config/constants.js';
import { openDrawer, closeDrawer } from './animation.js';

// ===== SELECTION STATE =====

/**
 * Currently selected drawer in 3D view
 * @type {THREE.Group|null}
 */
let selectedDrawer3D = null;

/**
 * Visual selection helper objects
 * @type {Object}
 * @property {THREE.LineSegments|null} boundingBox - Bounding box edges
 * @property {THREE.ArrowHelper|null} facingArrow - Direction indicator
 */
let selectionHelpers = {
    boundingBox: null,
    facingArrow: null
};

// ===== CART SELECTION =====

/**
 * Select and highlight a cart in 3D view
 *
 * This function:
 * - Deselects any previously selected cart
 * - Applies emissive glow to cart body
 * - Creates visual selection helpers (bounding box and arrow)
 * - Logs selection for debugging
 *
 * The emissive glow makes the cart appear to emit light, providing
 * clear visual feedback that it is selected. The bounding box and
 * facing arrow help users understand cart orientation and size.
 *
 * @param {string} cartId - ID of the cart to select
 * @returns {void}
 *
 * @example
 * selectCart3D('cart_001');
 * // Cart now has blue glow and bounding box
 */
export function selectCart3D(cartId) {
    // Remove previous selection highlight
    deselectCart3D();

    // Get cart group from map
    const cartGroup = cartMeshes.get(cartId);
    if (!cartGroup) return;

    // Add selection indicator (glowing outline)
    const body = cartGroup.userData.clickable;
    if (body) {
        // Clone material to avoid affecting other objects
        body.material = body.material.clone();

        // Add emissive glow effect
        body.material.emissive = new THREE.Color(SELECTION_COLOR);
        body.material.emissiveIntensity = SELECTION_INTENSITY;
    }

    // Add visual helpers (bounding box and facing arrow)
    createSelectionHelpers(cartGroup);

    console.log('Selected cart:', cartId);
}

/**
 * Remove cart selection and visual feedback
 *
 * This function:
 * - Removes all visual selection helpers
 * - Clears emissive glow from all carts
 * - Resets selection state
 *
 * Called when:
 * - User clicks empty space
 * - User selects a different cart
 * - Selection is programmatically cleared
 *
 * @returns {void}
 *
 * @example
 * deselectCart3D();
 * // All carts return to normal appearance
 */
export function deselectCart3D() {
    // Remove visual helpers
    removeSelectionHelpers();

    // Reset emissive glow on all carts
    cartMeshes.forEach((cartGroup) => {
        const body = cartGroup.userData.clickable;
        if (body && body.material.emissive) {
            // Remove glow effect
            body.material.emissive = new THREE.Color(0x000000); // Black = no emission
            body.material.emissiveIntensity = 0;
        }
    });
}

// ===== SELECTION HELPERS =====

/**
 * Create visual selection helpers for a cart
 *
 * This function creates two helper objects:
 * 1. Bounding box: Blue wireframe box around cart showing its extents
 * 2. Facing arrow: Blue arrow showing which direction cart faces
 *
 * The bounding box is slightly larger than the cart (0.2 feet padding)
 * to create a clear outline. The facing arrow starts at cart center
 * and points forward, with length based on cart size.
 *
 * Helpers are stored in selectionHelpers object and added to scene.
 * They are automatically removed when selection changes.
 *
 * @param {THREE.Group} cartGroup - The selected cart group
 * @returns {void}
 *
 * @example
 * const cart = cartMeshes.get('cart_001');
 * createSelectionHelpers(cart);
 * // Blue bounding box and arrow appear
 */
export function createSelectionHelpers(cartGroup) {
    // Remove old helpers first
    removeSelectionHelpers();

    // Calculate cart bounding box
    const box = new THREE.Box3().setFromObject(cartGroup);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // ===== BOUNDING BOX =====

    // Create box geometry slightly larger than cart
    const boxGeometry = new THREE.BoxGeometry(
        size.x + 0.2, // Add padding
        size.y + 0.2,
        size.z + 0.2
    );

    // Extract edges from box for wireframe
    const boxEdges = new THREE.EdgesGeometry(boxGeometry);

    // Create line segments for edges
    const boxLine = new THREE.LineSegments(
        boxEdges,
        new THREE.LineBasicMaterial({
            color: SELECTION_COLOR,
            linewidth: 2
        })
    );

    // Position at cart center
    boxLine.position.copy(center);

    // Add to scene
    scene.add(boxLine);
    selectionHelpers.boundingBox = boxLine;

    // ===== FACING ARROW =====

    // Calculate arrow length based on cart size
    const arrowLength = Math.max(size.x, size.z) * 0.8;

    // Arrow points in +Z direction (forward)
    const arrowDir = new THREE.Vector3(0, 0, 1);

    // Apply cart rotation to arrow direction
    arrowDir.applyQuaternion(cartGroup.quaternion);

    // Position arrow at cart center, just above floor
    const arrowOrigin = cartGroup.position.clone();
    arrowOrigin.y = 0.1; // Slightly above floor to be visible

    // Create arrow helper
    const arrow = new THREE.ArrowHelper(
        arrowDir,           // Direction vector
        arrowOrigin,        // Origin point
        arrowLength,        // Arrow length
        SELECTION_COLOR,    // Arrow color
        arrowLength * 0.3,  // Head length (30% of total)
        arrowLength * 0.2   // Head width (20% of total)
    );

    // Add to scene
    scene.add(arrow);
    selectionHelpers.facingArrow = arrow;
}

/**
 * Remove all selection helper objects
 *
 * This function removes the bounding box and facing arrow from the
 * scene and clears their references. Called automatically when
 * selection changes.
 *
 * Memory management:
 * Helper objects are removed from scene but not explicitly disposed.
 * Three.js will handle geometry/material disposal when objects are
 * garbage collected.
 *
 * @returns {void}
 *
 * @example
 * removeSelectionHelpers();
 * // Bounding box and arrow disappear
 */
export function removeSelectionHelpers() {
    // Remove bounding box
    if (selectionHelpers.boundingBox) {
        scene.remove(selectionHelpers.boundingBox);
        selectionHelpers.boundingBox = null;
    }

    // Remove facing arrow
    if (selectionHelpers.facingArrow) {
        scene.remove(selectionHelpers.facingArrow);
        selectionHelpers.facingArrow = null;
    }
}

// ===== DRAWER SELECTION =====

/**
 * Select and highlight a drawer in 3D view
 *
 * This function:
 * - Deselects any previous drawer or cart selection
 * - Finds the drawer mesh in cart hierarchy
 * - Applies emissive glow to drawer front
 * - Opens the drawer with animation
 * - Logs selection for debugging
 *
 * Drawer selection is mutually exclusive with cart selection.
 * Opening the drawer provides visual feedback and allows users
 * to see drawer contents in their imagination.
 *
 * @param {string} drawerId - ID of the drawer to select
 * @returns {void}
 *
 * @example
 * selectDrawer3D('drawer_001');
 * // Drawer glows blue and slides open
 */
export function selectDrawer3D(drawerId) {
    // Remove previous selection
    deselectDrawer3D();
    deselectCart3D();

    // Find the drawer in cart hierarchy
    let drawerGroup = null;
    cartMeshes.forEach((cartGroup) => {
        cartGroup.children.forEach((child) => {
            if (child.userData && child.userData.drawerId === drawerId) {
                drawerGroup = child;
            }
        });
    });

    // Drawer not found
    if (!drawerGroup) return;

    // Store selection
    selectedDrawer3D = drawerGroup;

    // Add selection highlight to drawer front
    const drawerFront = drawerGroup.userData.clickable;
    if (drawerFront) {
        // Clone material to avoid affecting other drawers
        drawerFront.material = drawerFront.material.clone();

        // Add emissive glow (stronger than cart glow)
        drawerFront.material.emissive = new THREE.Color(SELECTION_COLOR);
        drawerFront.material.emissiveIntensity = DRAWER_SELECTION_INTENSITY;
    }

    // Open the drawer (animate)
    openDrawer(drawerGroup);

    console.log('Selected drawer:', drawerId);
}

/**
 * Deselect and close the currently selected drawer
 *
 * This function:
 * - Closes drawer with animation
 * - Removes emissive glow from drawer front
 * - Clears selection state
 *
 * Called when:
 * - User clicks empty space
 * - User selects a different drawer or cart
 * - Selection is programmatically cleared
 *
 * @returns {void}
 *
 * @example
 * deselectDrawer3D();
 * // Drawer slides closed and glow disappears
 */
export function deselectDrawer3D() {
    if (selectedDrawer3D) {
        // Close the drawer (animate)
        closeDrawer(selectedDrawer3D);

        // Remove selection highlight
        const drawerFront = selectedDrawer3D.userData.clickable;
        if (drawerFront && drawerFront.material.emissive) {
            // Remove glow effect
            drawerFront.material.emissive = new THREE.Color(0x000000);
            drawerFront.material.emissiveIntensity = 0;
        }

        // Clear selection
        selectedDrawer3D = null;
    }
}

// ===== EXPORTS FOR EXTERNAL ACCESS =====

/**
 * Get currently selected drawer (read-only)
 * @returns {THREE.Group|null}
 */
export function getSelectedDrawer3D() {
    return selectedDrawer3D;
}

/**
 * Get selection helpers (read-only)
 * @returns {Object}
 */
export function getSelectionHelpers() {
    return { ...selectionHelpers };
}
