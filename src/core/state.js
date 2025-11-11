/**
 * State Management Module
 *
 * This module handles entity selection and state retrieval for the game designer tool.
 * It manages the current selection state and provides functions to query entities
 * from the configuration data.
 *
 * The module provides three core functions:
 * - selectEntity(): Select an entity and update all UI components
 * - deselectEntity(): Clear current selection and reset UI
 * - getEntity(): Retrieve an entity by type and ID from configuration
 *
 * When an entity is selected, the module:
 * 1. Updates STATE.selectedType and STATE.selectedId
 * 2. Updates the canvas info display
 * 3. Rebuilds the hierarchy tree to show selection
 * 4. Updates the inspector panel with entity properties
 * 5. Redraws the canvas to highlight the selection
 *
 * Entity Types:
 * - 'cart': Medical carts positioned in the room
 * - 'drawer': Drawers belonging to carts
 * - 'cameraview': Predefined camera perspectives
 * - 'scenario': Training scenarios
 * - 'item': Medical items that can be placed in drawers
 * - 'achievement': Gamification achievements
 *
 * @module core/state
 * @requires config/config - CONFIG and STATE objects
 * @requires ui/hierarchy - buildHierarchy function (circular dependency)
 *
 * External Dependencies (still in teacher.js, to be refactored):
 * - updateInspector() - Updates the inspector panel with selected entity properties
 * - drawCanvas() - Redraws the 2D canvas view
 *
 * These dependencies will be injected when the full modular system is integrated.
 *
 * @author CabinetQuest Team
 * @version 1.0.0
 */

import { CONFIG, STATE } from '../config/config.js';
import { buildHierarchy } from '../ui/hierarchy.js';

// ===== ENTITY SELECTION =====

/**
 * Selects an entity and updates all UI components to reflect the selection.
 *
 * This function is the central point for entity selection in the editor.
 * It updates the application state, refreshes all UI panels that show
 * selection state, and ensures the selected entity is highlighted in
 * both the hierarchy tree and canvas view.
 *
 * The function performs the following steps:
 * 1. Updates STATE.selectedType and STATE.selectedId
 * 2. Clears existing selection highlights in the hierarchy
 * 3. Updates the canvas info bar with selected entity details
 * 4. Refreshes the inspector panel to show entity properties
 * 5. Rebuilds the hierarchy tree to show the new selection
 * 6. Redraws the canvas to highlight the selected entity
 *
 * Selection is used for:
 * - Editing entity properties in the inspector panel
 * - Moving carts on the canvas (for cart entities)
 * - Deleting entities
 * - Viewing entity details and relationships
 *
 * @function selectEntity
 * @param {string} type - The type of entity to select ('cart', 'drawer', 'cameraview', 'scenario', 'item', 'achievement')
 * @param {string} id - The unique ID of the entity to select
 * @returns {void}
 *
 * @example
 * // Select a cart for editing
 * selectEntity('cart', 'trauma-cart-1');
 * // STATE.selectedType is now 'cart'
 * // STATE.selectedId is now 'trauma-cart-1'
 * // Hierarchy shows cart highlighted
 * // Inspector shows cart properties
 *
 * @example
 * // Select a drawer nested under a cart
 * selectEntity('drawer', 'top-drawer-1');
 * // Drawer is highlighted in the nested hierarchy
 *
 * @example
 * // Select a scenario to view its configuration
 * selectEntity('scenario', 'basic-trauma-response');
 *
 * @see deselectEntity - Clears the current selection
 * @see getEntity - Retrieves an entity without selecting it
 */
export function selectEntity(type, id) {
    // Step 1: Update the application state
    STATE.selectedType = type;
    STATE.selectedId = id;

    // Step 2: Clear all existing selection highlights in the hierarchy tree
    document.querySelectorAll('.tree-item').forEach(item => item.classList.remove('selected'));

    // Step 3: Update the canvas info bar to show the selected entity
    const entity = getEntity(type, id);
    document.getElementById('canvas-info-selected').textContent =
        `Selected: ${type} - ${entity?.name || id}`;

    // Step 4: Update the inspector panel to show entity properties
    // Note: updateInspector is currently in teacher.js and will be
    // extracted to a separate module in future refactoring
    if (typeof updateInspector === 'function') {
        updateInspector();
    }

    // Step 5: Rebuild the hierarchy tree to highlight the selection
    buildHierarchy();

    // Step 6: Redraw the canvas to highlight the selected entity visually
    // Note: drawCanvas is currently in teacher.js and will be
    // extracted to a separate module in future refactoring
    if (typeof drawCanvas === 'function') {
        drawCanvas();
    }
}

/**
 * Clears the current entity selection and resets all UI components.
 *
 * This function deselects any currently selected entity and updates
 * the UI to reflect that nothing is selected. It's typically called when:
 * - User clicks on empty space in the canvas
 * - User presses Escape key
 * - An entity is deleted
 * - User wants to clear selection before starting a new action
 *
 * The function performs the following steps:
 * 1. Clears STATE.selectedType and STATE.selectedId
 * 2. Updates the canvas info bar to show "None"
 * 3. Clears the inspector panel (shows empty state message)
 * 4. Rebuilds the hierarchy to remove selection highlights
 * 5. Redraws the canvas to remove selection highlights
 *
 * After calling this function, the inspector panel will display
 * a message prompting the user to select an item from the hierarchy.
 *
 * @function deselectEntity
 * @returns {void}
 *
 * @example
 * // User clicks on empty canvas area
 * canvas.addEventListener('click', (e) => {
 *   if (e.target === canvas) {
 *     deselectEntity();
 *   }
 * });
 *
 * @example
 * // Clear selection after deleting an entity
 * function deleteCurrentEntity() {
 *   if (STATE.selectedType && STATE.selectedId) {
 *     // ... delete the entity ...
 *     deselectEntity(); // Clear the selection
 *   }
 * }
 *
 * @example
 * // Handle Escape key to clear selection
 * document.addEventListener('keydown', (e) => {
 *   if (e.key === 'Escape') {
 *     deselectEntity();
 *   }
 * });
 *
 * @see selectEntity - Selects a specific entity
 */
export function deselectEntity() {
    // Step 1: Clear the selection state
    STATE.selectedType = null;
    STATE.selectedId = null;

    // Step 2: Update the canvas info bar
    document.getElementById('canvas-info-selected').textContent = 'Selected: None';

    // Step 3: Update the inspector panel to show empty state
    // Note: updateInspector is currently in teacher.js
    if (typeof updateInspector === 'function') {
        updateInspector();
    }

    // Step 4: Rebuild the hierarchy to remove selection highlights
    buildHierarchy();

    // Step 5: Redraw the canvas to remove selection highlights
    // Note: drawCanvas is currently in teacher.js
    if (typeof drawCanvas === 'function') {
        drawCanvas();
    }
}

/**
 * Retrieves an entity from the configuration by type and ID.
 *
 * This is a utility function that provides type-safe access to entities
 * stored in the CONFIG object. It maps entity type strings to their
 * corresponding arrays in CONFIG and finds the entity with the matching ID.
 *
 * The function uses a lookup table to map types to collections:
 * - 'cart' → CONFIG.carts
 * - 'drawer' → CONFIG.drawers
 * - 'cameraview' → CONFIG.cameraViews
 * - 'scenario' → CONFIG.scenarios
 * - 'item' → CONFIG.items
 * - 'achievement' → CONFIG.achievements
 *
 * The function is safe to call with invalid types or IDs - it will
 * return undefined rather than throwing an error.
 *
 * This function does NOT change selection state - it's a pure
 * data retrieval function. Use selectEntity() to both retrieve
 * and select an entity.
 *
 * @function getEntity
 * @param {string} type - The type of entity ('cart', 'drawer', 'cameraview', 'scenario', 'item', 'achievement')
 * @param {string} id - The unique ID of the entity to retrieve
 * @returns {Object|undefined} The entity object if found, undefined if not found or invalid type
 *
 * @example
 * // Retrieve a cart by ID
 * const cart = getEntity('cart', 'trauma-cart-1');
 * if (cart) {
 *   console.log(cart.name); // "Main Trauma Cart"
 *   console.log(cart.position); // { x: 10, y: 5, rotation: 0 }
 * }
 *
 * @example
 * // Retrieve a scenario
 * const scenario = getEntity('scenario', 'basic-trauma');
 * if (scenario) {
 *   console.log(scenario.description);
 *   console.log(scenario.requiredItems);
 * }
 *
 * @example
 * // Handle missing entity
 * const drawer = getEntity('drawer', 'non-existent-id');
 * if (!drawer) {
 *   console.log('Drawer not found');
 * }
 *
 * @example
 * // Invalid type returns undefined
 * const invalid = getEntity('invalid-type', 'some-id');
 * // invalid is undefined
 *
 * @example
 * // Common pattern: get entity name for display
 * function getEntityDisplayName(type, id) {
 *   const entity = getEntity(type, id);
 *   return entity?.name || id; // Fallback to ID if no name
 * }
 *
 * @see selectEntity - Retrieves and selects an entity
 */
export function getEntity(type, id) {
    // Map of entity types to their corresponding CONFIG arrays
    // This provides O(1) lookup instead of multiple if statements
    const collections = {
        'cart': CONFIG.carts,
        'cameraview': CONFIG.cameraViews,
        'scenario': CONFIG.scenarios,
        'drawer': CONFIG.drawers,
        'item': CONFIG.items,
        'achievement': CONFIG.achievements
    };

    // Use optional chaining to safely access the collection and find the entity
    // Returns undefined if:
    // - The type doesn't exist in collections
    // - The collection is empty
    // - No entity with the given ID is found
    return collections[type]?.find(e => e.id === id);
}
