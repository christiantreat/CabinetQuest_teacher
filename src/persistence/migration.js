/**
 * Migration Module
 *
 * Handles configuration validation, migration, and reset operations.
 * This module ensures that configurations from older versions are properly
 * upgraded to work with the current version, and provides functionality
 * to reset configurations to defaults.
 *
 * @module persistence/migration
 * @requires None - Pure JavaScript
 *
 * Dependencies:
 * - Global CONFIG object (must be in scope when imported)
 * - showAlert() from ui/alerts.js (for user feedback)
 * - loadDefaultConfiguration() from teacher.js (for reset)
 * - saveConfiguration() from persistence/storage.js (for reset)
 * - deselectEntity() from teacher.js (for reset)
 * - buildHierarchy() from teacher.js (for reset)
 * - updateStatusBar() from ui/statusBar.js (for reset)
 * - drawCanvas() from teacher.js (for reset)
 * - buildAll3DCarts() from teacher.js (for reset)
 *
 * Version History:
 * - v1.0: Initial 2D configuration format
 * - v2.0: Added 3D support with rotation and cart types
 *
 * @author CabinetQuest Team
 * @version 2.0.0
 */

/**
 * Validates and migrates a configuration to the current version format.
 *
 * This function performs comprehensive validation and migration of configuration
 * objects to ensure compatibility with the current application version. It:
 *
 * 1. Validates required properties (carts array must exist)
 * 2. Migrates 2D configurations to 3D by adding:
 *    - rotation property (defaults to 0)
 *    - type property (inferred from cart name or defaults to 'supply')
 * 3. Ensures all optional arrays exist with empty defaults
 * 4. Ensures all settings objects exist with sensible defaults
 * 5. Logs migration status and shows user feedback if migration occurred
 *
 * The function is designed to be non-destructive - it adds missing properties
 * but doesn't remove or alter existing valid properties.
 *
 * @function validateAndMigrateConfig
 * @param {Object} config - The configuration object to validate and migrate
 * @param {Array<Object>} config.carts - Required. Array of cart definitions
 * @param {Array<Object>} [config.drawers] - Optional. Array of drawer definitions
 * @param {Array<Object>} [config.items] - Optional. Array of item definitions
 * @param {Array<Object>} [config.scenarios] - Optional. Array of scenarios
 * @param {Array<Object>} [config.achievements] - Optional. Array of achievements
 * @param {Array<Object>} [config.cameraViews] - Optional. Array of camera views
 * @param {Object} [config.roomSettings] - Optional. Room appearance settings
 * @param {Object} [config.scoringRules] - Optional. Scoring configuration
 * @param {Object} [config.generalSettings] - Optional. General settings
 * @returns {Object} The validated and migrated configuration object
 * @throws {Error} If required properties are missing or invalid
 *
 * @example
 * // Migrating an old 2D configuration
 * const oldConfig = {
 *   carts: [
 *     { id: 'cart1', name: 'Airway Cart', x: 0.2, y: 0.3, width: 80, height: 80 }
 *   ]
 * };
 * const newConfig = validateAndMigrateConfig(oldConfig);
 * // Result: Adds rotation: 0 and type: 'airway' to the cart
 *
 * @example
 * // Handling invalid configuration
 * try {
 *   const config = validateAndMigrateConfig({ drawers: [] }); // Missing carts
 * } catch (error) {
 *   console.error(error.message); // "Missing or invalid carts array"
 * }
 *
 * @requires showAlert from ui/alerts.js
 */
export function validateAndMigrateConfig(config) {
    console.log('Validating configuration...');

    // ===== VALIDATION =====
    // Check for required properties
    if (!config.carts || !Array.isArray(config.carts)) {
        throw new Error('Missing or invalid carts array');
    }

    // ===== MIGRATION: 2D to 3D Format =====
    let migrated = false;

    config.carts.forEach(cart => {
        // Migration 1: Add rotation property if missing
        // Rotation is required for 3D cart positioning (0-360 degrees)
        if (cart.rotation === undefined) {
            cart.rotation = 0;
            migrated = true;
        }

        // Migration 2: Add type property if missing
        // Cart type determines the 3D model and functionality
        if (!cart.type) {
            // Try to infer type from cart name
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
                // Default type if no match found
                cart.type = 'supply';
            }
            migrated = true;
        }
    });

    // ===== ENSURE OPTIONAL ARRAYS EXIST =====
    // Create empty arrays for any missing collection properties
    // This prevents "undefined" errors when iterating over these collections
    config.drawers = config.drawers || [];
    config.items = config.items || [];
    config.scenarios = config.scenarios || [];
    config.achievements = config.achievements || [];

    // ===== ENSURE SETTINGS OBJECTS EXIST =====
    // Room Settings: Visual appearance of the training room
    config.roomSettings = config.roomSettings || {
        backgroundColor: '#fafafa',  // Light gray background
        width: 800,                   // Canvas width in pixels
        height: 600                   // Canvas height in pixels
    };

    // Scoring Rules: Point values and bonuses
    config.scoringRules = config.scoringRules || {
        essentialPoints: 60,     // Points per essential item
        optionalPoints: 20,      // Points per optional item
        penaltyPoints: 5,        // Points deducted per wrong item
        perfectBonus: 500,       // Bonus for perfect completion
        speedThreshold: 60,      // Time in seconds for speed bonus
        speedBonus: 300          // Points awarded for fast completion
    };

    // General Settings: Application-wide preferences
    config.generalSettings = config.generalSettings || {
        appTitle: 'Trauma Room Trainer',  // Application title
        enableTutorial: true,              // Show tutorial on first run
        enableSound: true,                 // Enable sound effects
        enableHaptics: true                // Enable haptic feedback (mobile)
    };

    // ===== MIGRATION FEEDBACK =====
    if (migrated) {
        console.log('✓ Configuration migrated from 2D to 3D format');
        showAlert('Old configuration migrated to 3D format', 'success');
    }

    console.log('✓ Configuration validated successfully');
    return config;
}

/**
 * Resets all configuration to factory defaults.
 *
 * This function performs a complete reset of the application:
 * 1. Prompts user for confirmation (cancellable)
 * 2. Removes saved configuration from localStorage
 * 3. Loads default configuration
 * 4. Clears any selected entities
 * 5. Rebuilds all UI components
 * 6. Shows success feedback
 *
 * This is a destructive operation that cannot be undone (unless the user
 * has previously exported their configuration).
 *
 * @function resetToDefaults
 * @returns {void} Returns early if user cancels the confirmation dialog
 *
 * @example
 * // Typically called from a "Reset to Defaults" button
 * document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
 *
 * @requires loadDefaultConfiguration from teacher.js
 * @requires deselectEntity from teacher.js
 * @requires buildHierarchy from teacher.js
 * @requires updateStatusBar from ui/statusBar.js
 * @requires drawCanvas from teacher.js
 * @requires buildAll3DCarts from teacher.js
 * @requires showAlert from ui/alerts.js
 *
 * @see {@link loadDefaultConfiguration} for the default configuration structure
 */
export function resetToDefaults() {
    // Step 1: Confirm with user (this is a destructive operation)
    if (!confirm('This will reset all configurations to defaults. Continue?')) {
        return; // User cancelled - abort reset
    }

    // Step 2: Remove saved configuration from localStorage
    // This ensures a clean slate for the reset
    localStorage.removeItem('traumaRoomConfig');

    // Step 3: Load the default configuration
    // This populates CONFIG with factory defaults
    loadDefaultConfiguration();

    // Step 4: Clear any selected entities in the UI
    deselectEntity();

    // Step 5: Rebuild all UI components to reflect the reset
    buildHierarchy();        // Rebuild hierarchy tree view
    updateStatusBar();       // Update status bar counts
    drawCanvas();            // Redraw 2D canvas view
    buildAll3DCarts();       // Rebuild 3D scene

    // Step 6: Provide user feedback
    showAlert('Reset to defaults complete', 'success');
}

/**
 * Cart Type Inference Rules
 * --------------------------
 * When migrating old configurations that lack the 'type' property,
 * types are inferred from cart names using the following rules:
 *
 * Name Contains      | Inferred Type | Description
 * -------------------|---------------|-----------------------------------
 * "crash" or "code"  | crash         | Crash/Code cart for cardiac arrest
 * "airway"           | airway        | Airway management cart
 * "medication"/"med" | medication    | Medication dispensing cart
 * "iv"               | iv            | IV supplies cart
 * "procedure"/"table"| procedure     | Procedure table/cart
 * "trauma"           | trauma        | Trauma supplies cart
 * (no match)         | supply        | Generic supply cart (default)
 *
 * @example
 * // Cart name inference examples:
 * "Airway Management Cart" → type: "airway"
 * "Emergency Med Cart"      → type: "medication"
 * "Code Blue Cart"          → type: "crash"
 * "Supply Storage"          → type: "supply" (default)
 */

/**
 * Default Configuration Values
 * -----------------------------
 * When properties are missing, these defaults are used:
 *
 * @typedef {Object} DefaultSettings
 * @property {Object} roomSettings
 * @property {string} roomSettings.backgroundColor - "#fafafa"
 * @property {number} roomSettings.width - 800
 * @property {number} roomSettings.height - 600
 * @property {Object} scoringRules
 * @property {number} scoringRules.essentialPoints - 60
 * @property {number} scoringRules.optionalPoints - 20
 * @property {number} scoringRules.penaltyPoints - 5
 * @property {number} scoringRules.perfectBonus - 500
 * @property {number} scoringRules.speedThreshold - 60
 * @property {number} scoringRules.speedBonus - 300
 * @property {Object} generalSettings
 * @property {string} generalSettings.appTitle - "Trauma Room Trainer"
 * @property {boolean} generalSettings.enableTutorial - true
 * @property {boolean} generalSettings.enableSound - true
 * @property {boolean} generalSettings.enableHaptics - true
 */
