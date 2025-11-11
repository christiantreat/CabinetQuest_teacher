/**
 * ==============================================================================
 * MATH UTILITY FUNCTIONS MODULE
 * ==============================================================================
 *
 * This module provides mathematical utility functions used throughout
 * the application, particularly for animations and positioning.
 *
 * Functions:
 * - easeInOutCubic(): Cubic easing function for smooth animations
 * - clamp(): Constrain a value between min and max bounds
 * - lerp(): Linear interpolation between two values
 * - snapToGrid(): Snap a value to the nearest grid position
 * - degreesToRadians(): Convert degrees to radians
 * - radiansToDegrees(): Convert radians to degrees
 *
 * @module utils/math
 */

// ===== EASING FUNCTIONS =====

/**
 * Cubic ease-in-out function for smooth animations
 *
 * This easing function provides smooth acceleration and deceleration:
 * - Starts slow (ease in)
 * - Speeds up in the middle
 * - Slows down at the end (ease out)
 *
 * The function uses a cubic curve (t³) which creates a more natural
 * feeling motion compared to linear interpolation.
 *
 * Common use cases:
 * - Camera movements
 * - Object animations
 * - Drawer opening/closing
 * - Smooth transitions
 *
 * @param {number} t - Progress value between 0 and 1
 *                     0 = start of animation
 *                     0.5 = middle of animation
 *                     1 = end of animation
 * @returns {number} Eased value between 0 and 1
 *
 * @example
 * // Animate over 1 second
 * const startTime = Date.now();
 * function animate() {
 *     const elapsed = Date.now() - startTime;
 *     const progress = Math.min(elapsed / 1000, 1); // 0 to 1
 *     const eased = easeInOutCubic(progress);
 *     object.position.x = startX + (endX - startX) * eased;
 *     if (progress < 1) requestAnimationFrame(animate);
 * }
 */
export function easeInOutCubic(t) {
    // For first half (t < 0.5): accelerate using 4t³
    // For second half (t >= 0.5): decelerate using reflected curve
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ===== VALUE CONSTRAINTS =====

/**
 * Clamp a value between minimum and maximum bounds
 *
 * Ensures a value stays within specified limits:
 * - If value < min, returns min
 * - If value > max, returns max
 * - Otherwise, returns value unchanged
 *
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 *
 * @example
 * clamp(5, 0, 10)   // Returns 5
 * clamp(-5, 0, 10)  // Returns 0
 * clamp(15, 0, 10)  // Returns 10
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ===== INTERPOLATION =====

/**
 * Linear interpolation between two values
 *
 * Calculates a value between start and end based on a progress value:
 * - t = 0 returns start
 * - t = 1 returns end
 * - t = 0.5 returns midpoint
 *
 * Common use cases:
 * - Smooth transitions
 * - Blending colors
 * - Animating positions
 *
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} t - Progress value (typically 0 to 1, but not required)
 * @returns {number} Interpolated value
 *
 * @example
 * lerp(0, 100, 0.5)   // Returns 50
 * lerp(10, 20, 0.25)  // Returns 12.5
 * lerp(5, 15, 1)      // Returns 15
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

// ===== GRID SNAPPING =====

/**
 * Snap a value to the nearest grid position
 *
 * Rounds a value to the nearest multiple of gridSize.
 * Useful for aligning objects to a grid system.
 *
 * @param {number} value - The value to snap
 * @param {number} gridSize - Size of each grid cell
 * @returns {number} Snapped value (nearest multiple of gridSize)
 *
 * @example
 * snapToGrid(7.3, 1)    // Returns 7
 * snapToGrid(7.8, 1)    // Returns 8
 * snapToGrid(23, 5)     // Returns 25
 * snapToGrid(22, 5)     // Returns 20
 */
export function snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
}

// ===== ANGLE CONVERSION =====

/**
 * Convert degrees to radians
 *
 * Three.js uses radians for rotation, but degrees are more
 * intuitive for users and configuration.
 *
 * Formula: radians = degrees × π / 180
 *
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 *
 * @example
 * degreesToRadians(0)    // Returns 0
 * degreesToRadians(90)   // Returns ~1.571 (π/2)
 * degreesToRadians(180)  // Returns ~3.142 (π)
 * degreesToRadians(360)  // Returns ~6.283 (2π)
 */
export function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 *
 * Converts Three.js rotation values (radians) to degrees
 * for display or configuration.
 *
 * Formula: degrees = radians × 180 / π
 *
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 *
 * @example
 * radiansToDegrees(0)            // Returns 0
 * radiansToDegrees(Math.PI / 2)  // Returns 90
 * radiansToDegrees(Math.PI)      // Returns 180
 * radiansToDegrees(2 * Math.PI)  // Returns 360
 */
export function radiansToDegrees(radians) {
    return (radians * 180) / Math.PI;
}

// ===== DISTANCE CALCULATIONS =====

/**
 * Calculate 2D distance between two points
 *
 * Uses the Pythagorean theorem: √(Δx² + Δy²)
 *
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {number} Distance between points
 *
 * @example
 * distance2D(0, 0, 3, 4)  // Returns 5
 * distance2D(0, 0, 0, 0)  // Returns 0
 */
export function distance2D(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate 3D distance between two points
 *
 * Uses the 3D Pythagorean theorem: √(Δx² + Δy² + Δz²)
 *
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} z1 - First point Z coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @param {number} z2 - Second point Z coordinate
 * @returns {number} Distance between points
 *
 * @example
 * distance3D(0, 0, 0, 1, 1, 1)  // Returns ~1.732
 * distance3D(0, 0, 0, 0, 0, 0)  // Returns 0
 */
export function distance3D(x1, y1, z1, x2, y2, z2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ===== RANGE MAPPING =====

/**
 * Map a value from one range to another
 *
 * Takes a value in the input range [inMin, inMax] and
 * maps it proportionally to the output range [outMin, outMax].
 *
 * Common use cases:
 * - Converting percentages to pixels
 * - Scaling sensor readings
 * - Normalizing values
 *
 * @param {number} value - Value to map
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 *
 * @example
 * mapRange(5, 0, 10, 0, 100)    // Returns 50
 * mapRange(0.5, 0, 1, 0, 360)   // Returns 180
 * mapRange(75, 0, 100, 0, 1)    // Returns 0.75
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    // Calculate where value sits in input range (0 to 1)
    const t = (value - inMin) / (inMax - inMin);
    // Map to output range
    return outMin + t * (outMax - outMin);
}
