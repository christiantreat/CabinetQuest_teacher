/**
 * ==============================================================================
 * CONSTANTS MODULE
 * ==============================================================================
 *
 * This module contains constant definitions for cart types, color mappings,
 * and room specifications used throughout the 3D visualization system.
 *
 * These constants define the physical properties and visual characteristics
 * of different medical cart types that can be placed in the trauma room.
 *
 * Exports:
 * - CART_TYPES: Object defining all available cart types and their properties
 * - DRAWER_COLOR_MAP: Color mapping for different item categories
 * - DEFAULT_DRAWER_COLOR: Fallback color for empty or unknown drawers
 * - SELECTION_COLOR: Color used for selection highlights
 * - GRID_SIZE: Default grid snap size in feet
 *
 * @module config/constants
 */

// ===== CART TYPE DEFINITIONS =====

/**
 * Cart type definitions
 *
 * Each cart type defines physical dimensions, visual appearance, and special
 * features for a specific category of medical cart.
 *
 * @typedef {Object} CartType
 * @property {string} name - Display name for the cart type
 * @property {number} width - Cart width in feet
 * @property {number} height - Cart height in feet
 * @property {number} depth - Cart depth in feet
 * @property {string} color - Hex color code for cart body
 * @property {number} drawers - Number of drawers in the cart
 * @property {number} drawerHeight - Height of each drawer in feet
 * @property {boolean} [hasIVPole] - Whether cart has an IV pole attachment
 * @property {boolean} [hasTopSurface] - Whether cart has a procedure surface
 */

/**
 * Available cart types with their physical and visual properties
 *
 * Standard dimensions:
 * - Most carts: 2ft wide × 4ft tall × 1.5ft deep
 * - Drawer heights vary based on cart type and number of drawers
 *
 * Special features:
 * - IV Cart: Includes tall pole with hooks for IV bags
 * - Procedure Table: Wide surface with no drawers for procedures
 *
 * @type {Object.<string, CartType>}
 */
export const CART_TYPES = {
    crash: {
        name: 'Crash Cart (Code Cart)',
        width: 2.0,   // 2 feet
        height: 4.0,  // 4 feet
        depth: 1.5,   // 1.5 feet
        color: '#F44336', // Red - emergency/critical
        drawers: 5,
        drawerHeight: 0.75 // 9 inches per drawer
    },
    airway: {
        name: 'Airway Cart',
        width: 2.0,
        height: 4.0,
        depth: 1.5,
        color: '#4CAF50', // Green - airway management
        drawers: 4,
        drawerHeight: 0.9 // ~11 inches per drawer
    },
    medication: {
        name: 'Medication Cart',
        width: 2.0,
        height: 4.0,
        depth: 1.5,
        color: '#FF9800', // Orange - medications
        drawers: 3,
        drawerHeight: 1.2 // ~14 inches per drawer
    },
    iv: {
        name: 'IV Cart',
        width: 1.5,   // Narrow base for stability
        height: 5.0,  // Tall for IV pole
        depth: 1.5,
        color: '#9C27B0', // Purple - IV/fluids
        drawers: 1,   // Small base drawer
        drawerHeight: 0.5, // 6 inches
        hasIVPole: true // Special feature: IV pole with hooks
    },
    procedure: {
        name: 'Procedure Table',
        width: 4.0,   // Wide surface for procedures
        height: 3.0,
        depth: 2.5,
        color: '#757575', // Gray - neutral procedure surface
        drawers: 0,   // Flat surface, no drawers
        hasTopSurface: true // Special feature: enhanced top surface
    },
    trauma: {
        name: 'Trauma Cart',
        width: 2.0,
        height: 4.0,
        depth: 1.5,
        color: '#E91E63', // Pink/magenta - trauma supplies
        drawers: 4,
        drawerHeight: 0.9 // ~11 inches per drawer
    },
    supply: {
        name: 'Supply Cart',
        width: 2.0,
        height: 4.0,
        depth: 1.5,
        color: '#2196F3', // Blue - general supplies
        drawers: 3,
        drawerHeight: 1.2 // ~14 inches per drawer
    }
};

// ===== COLOR MAPPINGS =====

/**
 * Color mapping for drawer contents based on item category
 *
 * These hex colors are used to visually distinguish drawers by their
 * contents, making it easier for users to identify drawer purposes.
 *
 * @type {Object.<string, number>}
 */
export const DRAWER_COLOR_MAP = {
    'airway': 0x4CAF50,    // Green - airway management items
    'med': 0x2196F3,       // Blue - medications
    'code': 0xF44336,      // Red - code/emergency items
    'trauma': 0xFF9800     // Orange - trauma supplies
};

/**
 * Default color for empty or uncategorized drawers
 * @type {number}
 */
export const DEFAULT_DRAWER_COLOR = 0x999999; // Gray

// ===== SELECTION AND INTERACTION =====

/**
 * Color used for selection highlights (emissive glow)
 * @type {number}
 */
export const SELECTION_COLOR = 0x0e639c; // Blue highlight

/**
 * Selection highlight intensity (0.0 to 1.0)
 * @type {number}
 */
export const SELECTION_INTENSITY = 0.3;

/**
 * Drawer selection highlight intensity (0.0 to 1.0)
 * Higher than cart selection for better visibility
 * @type {number}
 */
export const DRAWER_SELECTION_INTENSITY = 0.4;

// ===== GRID AND SNAPPING =====

/**
 * Default grid size for snapping in feet
 * Carts will snap to this grid when snap-to-grid is enabled
 * @type {number}
 */
export const DEFAULT_GRID_SIZE = 1.0; // 1 foot

/**
 * Fine grid size for precise positioning in feet
 * Used when fine positioning mode is enabled
 * @type {number}
 */
export const FINE_GRID_SIZE = 0.25; // 3 inches

// ===== PHYSICAL CONSTANTS =====

/**
 * Wheel dimensions for cart mobility visualization
 * @type {Object}
 */
export const WHEEL_DIMENSIONS = {
    radius: 0.12,  // 1.5 inches radius (~3 inch diameter)
    width: 0.08,   // Wheel thickness
    inset: 0.2,    // Distance from cart edge
    color: 0x222222 // Dark gray/black
};

/**
 * Drawer physical properties
 * @type {Object}
 */
export const DRAWER_PROPERTIES = {
    widthRatio: 0.9,    // Drawer width as ratio of cart width
    depthRatio: 0.85,   // Drawer depth as ratio of cart depth
    gap: 0.05,          // Gap between drawers in feet
    frontThickness: 0.08, // Thickness of drawer front in feet
    openDistance: 0.5   // How far drawer opens in feet (6 inches)
};

/**
 * Handle dimensions for drawer pulls
 * @type {Object}
 */
export const HANDLE_DIMENSIONS = {
    radius: 0.03,      // Handle bar radius
    widthRatio: 0.3,   // Handle width as ratio of drawer width
    color: 0x444444,   // Dark gray
    offset: 0.05       // Distance from drawer front
};

/**
 * IV pole dimensions (for IV cart type)
 * @type {Object}
 */
export const IV_POLE_DIMENSIONS = {
    radius: 0.04,      // Pole diameter
    heightRatio: 0.7,  // Pole height as ratio of cart height
    hookRadius: 0.15,  // IV hook ring radius
    hookTubeRadius: 0.02, // Hook tube thickness
    hookCount: 4,      // Number of hooks
    hookSpacing: 0.15, // Spacing between hooks
    poleColor: 0xcccccc, // Light gray
    hookColor: 0xaaaaaa  // Medium gray
};

/**
 * Procedure table surface properties
 * @type {Object}
 */
export const PROCEDURE_SURFACE = {
    thickness: 0.1,     // Table top thickness in feet
    color: 0xf0f0f0,    // Light gray/white
    offset: 0.05        // Vertical offset from cart body
};

// ===== ANIMATION =====

/**
 * Animation settings for drawer open/close
 * @type {Object}
 */
export const DRAWER_ANIMATION = {
    lerpFactor: 0.15,   // Interpolation speed (0-1, higher = faster)
    threshold: 0.01     // Distance threshold to consider animation complete
};

// ===== MATERIAL PROPERTIES =====

/**
 * Default material properties for cart body
 * @type {Object}
 */
export const CART_MATERIAL = {
    roughness: 0.7,  // Surface roughness (0 = mirror, 1 = matte)
    metalness: 0.3   // Metallic property (0 = dielectric, 1 = metal)
};

/**
 * Material properties for drawer fronts
 * @type {Object}
 */
export const DRAWER_MATERIAL = {
    roughness: 0.6,
    metalness: 0.4
};

/**
 * Material properties for handles
 * @type {Object}
 */
export const HANDLE_MATERIAL = {
    roughness: 0.2,  // Shiny metal handle
    metalness: 0.8
};

/**
 * Material properties for wheels
 * @type {Object}
 */
export const WHEEL_MATERIAL = {
    roughness: 0.8,  // Rubber-like texture
    metalness: 0.2
};
