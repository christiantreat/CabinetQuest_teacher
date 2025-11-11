/**
 * Configuration Module
 *
 * This module contains the core configuration data and application state
 * for the Trauma Room Trainer game designer tool.
 *
 * CONFIG: Contains all persistent configuration data including carts, drawers,
 *         items, scenarios, achievements, camera views, room settings, scoring
 *         rules, and general application settings.
 *
 * STATE: Contains the runtime application state including current selections,
 *        canvas mode, drag state, mouse position, and editor settings.
 */

// ===== CONFIGURATION DATA =====

/**
 * Main configuration object containing all game data and settings.
 * This data structure is persisted and loaded from JSON files.
 *
 * @type {Object}
 * @property {Array} carts - Array of cart objects defining medical carts in the room
 * @property {Array} drawers - Array of drawer objects belonging to carts
 * @property {Array} items - Array of medical item objects that can be placed in drawers
 * @property {Array} scenarios - Array of training scenario definitions
 * @property {Array} achievements - Array of achievement definitions for gamification
 * @property {Array} cameraViews - Array of predefined camera perspectives for the 3D view
 * @property {Object} roomSettings - Physical room dimensions and rendering settings
 * @property {Object} scoringRules - Point values and thresholds for scenario scoring
 * @property {Object} generalSettings - Application-wide settings and preferences
 */
export let CONFIG = {
    carts: [],
    drawers: [],
    items: [],
    scenarios: [],
    achievements: [],
    cameraViews: [], // Camera views for different room perspectives
    roomSettings: {
        backgroundColor: '#fafafa',
        width: 30,  // feet
        depth: 25,  // feet
        height: 12, // feet
        pixelsPerFoot: 20 // Scale factor for canvas rendering
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

/**
 * Application runtime state object.
 * Contains transient state that changes during editor interaction
 * but is not persisted to disk.
 *
 * @type {Object}
 * @property {string|null} selectedType - Currently selected entity type ('cart', 'scenario', 'drawer', 'item', 'achievement')
 * @property {string|null} selectedId - ID of the currently selected entity
 * @property {string} canvasMode - Current canvas view mode ('room' or 'overview')
 * @property {Object|null} draggedCart - Reference to cart being dragged, if any
 * @property {Object} mousePos - Current mouse position {x, y} in canvas coordinates
 * @property {boolean} unsavedChanges - Flag indicating if there are unsaved modifications
 * @property {boolean} snapToGrid - Whether cart positioning should snap to grid
 * @property {number} gridSize - Grid size in feet for snapping (default 1.0 foot)
 */
export let STATE = {
    selectedType: null, // 'cart', 'scenario', 'drawer', 'item', 'achievement'
    selectedId: null,
    canvasMode: 'room', // 'room' or 'overview'
    draggedCart: null,
    mousePos: {x: 0, y: 0},
    unsavedChanges: false,
    snapToGrid: true, // Default to snap to grid enabled
    gridSize: 1.0 // feet (1 foot grid by default)
};
