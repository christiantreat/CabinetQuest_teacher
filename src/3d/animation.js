/**
 * ==============================================================================
 * 3D ANIMATION MODULE
 * ==============================================================================
 *
 * This module handles 3D animations for interactive elements:
 * - Drawer open/close animations
 * - Smooth lerp-based movement
 * - Animation state tracking
 *
 * The animation system uses requestAnimationFrame and linear interpolation
 * (lerp) to create smooth, performant animations. Drawers slide open when
 * selected and close when deselected.
 *
 * Animation approach:
 * Rather than using a global animation loop, each animation manages its
 * own requestAnimationFrame loop. This is more efficient as animations
 * only run when needed.
 *
 * Dependencies:
 * - Three.js library (THREE global)
 * - DRAWER_PROPERTIES, DRAWER_ANIMATION from constants module
 *
 * Exports:
 * - openDrawer(): Animate drawer opening
 * - closeDrawer(): Animate drawer closing
 * - animateDrawer(): Core animation loop (used internally)
 *
 * @module 3d/animation
 */

import { DRAWER_PROPERTIES, DRAWER_ANIMATION } from '../config/constants.js';

// ===== DRAWER ANIMATION =====

/**
 * Open a drawer with smooth animation
 *
 * This function initiates a drawer opening animation:
 * - Sets target position for drawer (pulled out)
 * - Marks drawer as open in userData
 * - Starts animation loop
 *
 * The drawer slides forward (positive Z direction) by the openDistance
 * amount (default 0.5 feet / 6 inches). Animation uses lerp for smooth
 * easing that automatically slows as it approaches the target.
 *
 * If drawer is already open, no action is taken.
 *
 * @param {THREE.Group} drawerGroup - The drawer group to animate
 * @returns {void}
 *
 * @example
 * const drawer = findDrawerById('drawer_001');
 * openDrawer(drawer);
 * // Drawer smoothly slides open over ~0.5 seconds
 */
export function openDrawer(drawerGroup) {
    // Check if already open
    if (drawerGroup.userData.isOpen) return;

    // Mark as open
    drawerGroup.userData.isOpen = true;

    // Set target position (pull out 6 inches)
    drawerGroup.userData.targetZ = drawerGroup.position.z + DRAWER_PROPERTIES.openDistance;

    // Start animation loop
    animateDrawer(drawerGroup);
}

/**
 * Close a drawer with smooth animation
 *
 * This function initiates a drawer closing animation:
 * - Sets target position back to original (closed)
 * - Marks drawer as closed in userData
 * - Starts animation loop
 *
 * The drawer slides backward to its original position (z=0 in local space).
 * Animation uses the same smooth lerp as opening.
 *
 * If drawer is already closed, no action is taken.
 *
 * @param {THREE.Group} drawerGroup - The drawer group to animate
 * @returns {void}
 *
 * @example
 * const drawer = findDrawerById('drawer_001');
 * closeDrawer(drawer);
 * // Drawer smoothly slides closed
 */
export function closeDrawer(drawerGroup) {
    // Check if already closed
    if (!drawerGroup.userData.isOpen) return;

    // Mark as closed
    drawerGroup.userData.isOpen = false;

    // Set target position (push back to original)
    drawerGroup.userData.targetZ = 0;

    // Start animation loop
    animateDrawer(drawerGroup);
}

/**
 * Core drawer animation loop
 *
 * This function implements the animation logic using requestAnimationFrame
 * and linear interpolation (lerp). The animation:
 * 1. Calculates difference between current and target position
 * 2. Checks if animation is complete (within threshold)
 * 3. Moves drawer toward target by lerp factor
 * 4. Requests next frame if not complete
 *
 * Lerp behavior:
 * The lerp factor (0.15) means the drawer moves 15% of remaining distance
 * each frame. This creates natural easing: fast at first, slowing as it
 * approaches the target.
 *
 * At 60 FPS, a lerp factor of 0.15 results in:
 * - ~50% distance covered in 5 frames (~83ms)
 * - ~90% distance covered in 15 frames (~250ms)
 * - Complete in ~30 frames (~500ms)
 *
 * The animation automatically stops when within threshold (0.01 feet = 0.12 inches)
 * of the target, snapping to exact position.
 *
 * @param {THREE.Group} drawerGroup - The drawer group to animate
 * @returns {void}
 * @private
 *
 * @example
 * // This function is called internally by openDrawer() and closeDrawer()
 * // It manages its own animation loop via requestAnimationFrame
 */
export function animateDrawer(drawerGroup) {
    /**
     * Animation frame callback
     * This inner function is called each frame by requestAnimationFrame
     */
    const animate = () => {
        // Check if target is set
        if (!drawerGroup.userData.targetZ && drawerGroup.userData.targetZ !== 0) return;

        // Get current and target positions
        const current = drawerGroup.position.z;
        const target = drawerGroup.userData.targetZ;
        const diff = target - current;

        // Check if animation is complete
        if (Math.abs(diff) < DRAWER_ANIMATION.threshold) {
            // Snap to exact target position
            drawerGroup.position.z = target;

            // Clear target to mark animation complete
            drawerGroup.userData.targetZ = null;

            // Animation done - stop loop
            return;
        }

        // Lerp toward target
        // New position = current + (distance * lerp factor)
        drawerGroup.position.z += diff * DRAWER_ANIMATION.lerpFactor;

        // Continue animating - request next frame
        requestAnimationFrame(animate);
    };

    // Start animation loop
    animate();
}

// ===== FUTURE ANIMATION FUNCTIONS =====

/**
 * Animate cart rotation (future enhancement)
 *
 * Could implement smooth cart rotation animations similar to drawer sliding.
 * Useful for:
 * - Rotating carts to face different directions
 * - Animated placement of new carts
 * - Spinning animation for special effects
 *
 * @param {THREE.Group} cartGroup - Cart to rotate
 * @param {number} targetRotation - Target rotation in radians
 * @returns {void}
 * @future
 */
export function rotateCart(cartGroup, targetRotation) {
    // Implementation would be similar to animateDrawer
    // but interpolating rotation.y instead of position.z
    console.warn('rotateCart() not yet implemented');
}

/**
 * Animate cart sliding into position (future enhancement)
 *
 * Could implement smooth cart movement animations for:
 * - Animated placement when creating new carts
 * - Smooth transitions when loading configurations
 * - Visual feedback for programmatic positioning
 *
 * @param {THREE.Group} cartGroup - Cart to move
 * @param {THREE.Vector3} targetPosition - Target position
 * @returns {void}
 * @future
 */
export function slideCart(cartGroup, targetPosition) {
    // Implementation would interpolate position.x and position.z
    console.warn('slideCart() not yet implemented');
}

/**
 * Pulse animation for highlighting (future enhancement)
 *
 * Could implement pulsing emissive glow for:
 * - Drawing attention to specific carts/drawers
 * - Error states or validation feedback
 * - Tutorial highlights
 *
 * @param {THREE.Mesh} mesh - Mesh to pulse
 * @param {number} duration - Pulse duration in milliseconds
 * @returns {void}
 * @future
 */
export function pulseHighlight(mesh, duration) {
    // Implementation would oscillate emissiveIntensity using sin wave
    console.warn('pulseHighlight() not yet implemented');
}

// ===== ANIMATION UTILITIES =====

/**
 * Linear interpolation helper
 *
 * Utility function for smooth value transitions. Returns a value
 * between start and end based on t parameter.
 *
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 *
 * @example
 * lerp(0, 10, 0.5)   // Returns 5
 * lerp(0, 10, 0.25)  // Returns 2.5
 * lerp(0, 10, 1.0)   // Returns 10
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Ease-in-out interpolation helper
 *
 * Applies smoothstep easing to an interpolation factor.
 * Creates smoother motion than linear interpolation, with
 * slow start and slow end.
 *
 * @param {number} t - Input value (0-1)
 * @returns {number} Eased value (0-1)
 *
 * @example
 * smoothstep(0)    // Returns 0
 * smoothstep(0.5)  // Returns 0.5
 * smoothstep(0.25) // Returns 0.15625 (slower start)
 * smoothstep(0.75) // Returns 0.84375 (slower end)
 */
export function smoothstep(t) {
    // Clamp to 0-1 range
    t = Math.max(0, Math.min(1, t));

    // Apply smoothstep formula: 3t² - 2t³
    return t * t * (3 - 2 * t);
}

/**
 * Check if animation is complete
 *
 * Utility to check if a value is within threshold of target.
 * Useful for determining when to stop animation loops.
 *
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} [threshold=0.01] - Acceptable difference
 * @returns {boolean} True if within threshold
 *
 * @example
 * isAnimationComplete(5.001, 5.0)     // true (within default 0.01)
 * isAnimationComplete(5.1, 5.0)       // false (exceeds threshold)
 * isAnimationComplete(5.05, 5.0, 0.1) // true (within custom threshold)
 */
export function isAnimationComplete(current, target, threshold = DRAWER_ANIMATION.threshold) {
    return Math.abs(target - current) < threshold;
}
