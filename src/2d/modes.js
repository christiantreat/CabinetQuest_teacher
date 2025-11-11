/**
 * @fileoverview 2D Canvas Mode Management Module
 *
 * This module manages the canvas display mode switching between:
 * - Room Mode: Top-down layout view for positioning carts
 * - Overview Mode: Statistics dashboard showing project metrics
 *
 * The mode system controls:
 * - Visual rendering (room layout vs statistics)
 * - Interaction capabilities (dragging enabled only in room mode)
 * - UI button states (active mode indicator)
 * - Info display updates
 *
 * Mode switching is immediate and updates the canvas display without
 * affecting the underlying data or 3D view.
 *
 * @module src/2d/modes
 * @requires teacher.js (globals: STATE)
 */

/**
 * Canvas display modes
 * @readonly
 * @enum {string}
 */
export const CanvasMode = {
    /** Room layout view with cart positioning */
    ROOM: 'room',
    /** Statistics overview dashboard */
    OVERVIEW: 'overview'
};

/**
 * Set the canvas display mode
 *
 * Switches between room layout mode and overview statistics mode.
 * This function:
 * - Updates the global STATE.canvasMode
 * - Updates button active states in the UI
 * - Updates the mode info display
 * - Triggers a canvas redraw with the new mode
 *
 * In Room Mode:
 * - Shows top-down view of room with carts
 * - Enables cart dragging and positioning
 * - Displays grid if enabled
 * - Shows cart selection and details
 *
 * In Overview Mode:
 * - Shows statistics dashboard
 * - Displays counts of all entity types
 * - Disables cart interaction
 * - Provides project-level metrics
 *
 * @function setCanvasMode
 * @param {string} mode - The mode to switch to ('room' or 'overview')
 * @requires STATE.canvasMode - Global state property for current mode
 * @requires drawCanvas - Function to redraw canvas (from drawing.js)
 *
 * @example
 * // Switch to room layout view
 * setCanvasMode('room');
 *
 * @example
 * // Switch to overview statistics view
 * setCanvasMode('overview');
 *
 * @example
 * // Use enum for type safety
 * import { CanvasMode } from './modes.js';
 * setCanvasMode(CanvasMode.ROOM);
 *
 * @see {@link CanvasMode} for available mode values
 * @see {@link getCanvasMode} to retrieve current mode
 */
export function setCanvasMode(mode) {
    // Validate mode parameter
    if (mode !== 'room' && mode !== 'overview') {
        console.warn(`Invalid canvas mode: ${mode}. Defaulting to 'room'.`);
        mode = 'room';
    }

    // Update global state
    if (window.STATE) {
        window.STATE.canvasMode = mode;
    }

    // Update button active states
    const roomButton = document.getElementById('mode-room');
    const overviewButton = document.getElementById('mode-overview');

    if (roomButton) {
        roomButton.classList.toggle('active', mode === 'room');
    }
    if (overviewButton) {
        overviewButton.classList.toggle('active', mode === 'overview');
    }

    // Update mode info display
    const infoElement = document.getElementById('canvas-info-mode');
    if (infoElement) {
        const modeText = mode === 'room' ? 'Room Layout' : 'Overview';
        infoElement.textContent = `Mode: ${modeText}`;
    }

    // Redraw canvas with new mode
    if (window.drawCanvas) {
        window.drawCanvas();
    }
}

/**
 * Get the current canvas mode
 *
 * Returns the current canvas display mode from global state.
 *
 * @function getCanvasMode
 * @returns {string} Current mode ('room' or 'overview')
 *
 * @example
 * const currentMode = getCanvasMode();
 * if (currentMode === 'room') {
 *   console.log('Currently in room layout mode');
 * }
 */
export function getCanvasMode() {
    return window.STATE?.canvasMode || 'room';
}

/**
 * Toggle between canvas modes
 *
 * Switches from current mode to the other mode.
 * Convenience function for toggle buttons.
 *
 * @function toggleCanvasMode
 *
 * @example
 * // Toggle between modes
 * toggleCanvasMode(); // room -> overview
 * toggleCanvasMode(); // overview -> room
 */
export function toggleCanvasMode() {
    const currentMode = getCanvasMode();
    const newMode = currentMode === 'room' ? 'overview' : 'room';
    setCanvasMode(newMode);
}

/**
 * Check if canvas is in room mode
 *
 * Utility function to check if the canvas is currently displaying
 * the room layout view.
 *
 * @function isRoomMode
 * @returns {boolean} True if in room mode, false otherwise
 *
 * @example
 * if (isRoomMode()) {
 *   // Enable cart dragging
 *   enableCartInteraction();
 * }
 */
export function isRoomMode() {
    return getCanvasMode() === 'room';
}

/**
 * Check if canvas is in overview mode
 *
 * Utility function to check if the canvas is currently displaying
 * the overview statistics view.
 *
 * @function isOverviewMode
 * @returns {boolean} True if in overview mode, false otherwise
 *
 * @example
 * if (isOverviewMode()) {
 *   // Disable cart dragging
 *   disableCartInteraction();
 * }
 */
export function isOverviewMode() {
    return getCanvasMode() === 'overview';
}

/**
 * Initialize canvas mode system
 *
 * Sets up the canvas mode system including:
 * - Setting default mode
 * - Attaching event listeners to mode buttons
 * - Initializing UI state
 *
 * This should be called during application initialization.
 *
 * @function initCanvasMode
 * @param {string} [defaultMode='room'] - Initial mode to set
 *
 * @example
 * // Initialize with default room mode
 * initCanvasMode();
 *
 * @example
 * // Initialize with overview mode
 * initCanvasMode('overview');
 */
export function initCanvasMode(defaultMode = 'room') {
    // Set initial mode
    setCanvasMode(defaultMode);

    // Attach event listeners to mode buttons
    const roomButton = document.getElementById('mode-room');
    const overviewButton = document.getElementById('mode-overview');

    if (roomButton) {
        roomButton.addEventListener('click', () => {
            setCanvasMode('room');
        });
    }

    if (overviewButton) {
        overviewButton.addEventListener('click', () => {
            setCanvasMode('overview');
        });
    }
}

/**
 * Get mode display name
 *
 * Returns a human-readable display name for a canvas mode.
 *
 * @function getModeName
 * @param {string} mode - Mode identifier
 * @returns {string} Human-readable mode name
 *
 * @example
 * const name = getModeName('room');
 * console.log(name); // "Room Layout"
 */
export function getModeName(mode) {
    switch (mode) {
        case 'room':
            return 'Room Layout';
        case 'overview':
            return 'Overview';
        default:
            return 'Unknown';
    }
}

/**
 * Get mode description
 *
 * Returns a description of what each mode displays.
 *
 * @function getModeDescription
 * @param {string} mode - Mode identifier
 * @returns {string} Mode description
 *
 * @example
 * const desc = getModeDescription('overview');
 * console.log(desc); // "Project statistics dashboard"
 */
export function getModeDescription(mode) {
    switch (mode) {
        case 'room':
            return 'Top-down room layout with cart positioning';
        case 'overview':
            return 'Project statistics dashboard';
        default:
            return 'Unknown mode';
    }
}

/**
 * Check if mode allows cart interaction
 *
 * Returns whether the given mode allows cart dragging and selection.
 * Only room mode supports cart interaction.
 *
 * @function modeAllowsInteraction
 * @param {string} [mode] - Mode to check (defaults to current mode)
 * @returns {boolean} True if mode allows interaction
 *
 * @example
 * if (modeAllowsInteraction()) {
 *   // Enable drag handlers
 *   setupDragHandlers();
 * }
 */
export function modeAllowsInteraction(mode) {
    const checkMode = mode || getCanvasMode();
    return checkMode === 'room';
}

/**
 * Refresh canvas mode display
 *
 * Forces an update of all mode-related UI elements and redraws the canvas.
 * Useful after external state changes.
 *
 * @function refreshModeDisplay
 *
 * @example
 * // After loading saved data
 * loadConfig();
 * refreshModeDisplay();
 */
export function refreshModeDisplay() {
    const currentMode = getCanvasMode();
    setCanvasMode(currentMode);
}
