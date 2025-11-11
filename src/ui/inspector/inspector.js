/**
 * @fileoverview Main Inspector Panel Module
 *
 * This module manages the inspector panel that displays property panels when an entity
 * is selected in the hierarchy tree. It acts as a dispatcher, routing selected entities
 * to the appropriate specialized inspector panel based on entity type.
 *
 * The inspector panel allows users to view and edit properties of:
 * - Carts (position, rotation, type, color)
 * - Drawers (name, cart assignment, number)
 * - Items (name, cart/drawer assignment, image)
 * - Scenarios (essential/optional items, feedback messages)
 * - Camera Views (position, look-at target, FOV)
 * - Achievements (title, description, trigger conditions)
 *
 * @module ui/inspector/inspector
 * @requires ui/inspector/cartInspector
 * @requires ui/inspector/drawerInspector
 * @requires ui/inspector/itemInspector
 * @requires ui/inspector/scenarioInspector
 * @requires ui/inspector/cameraViewInspector
 * @requires ui/inspector/achievementInspector
 *
 * @author CabinetQuest Teacher
 * @version 1.0.0
 */

import { buildCartInspector } from './cartInspector.js';
import { buildDrawerInspector } from './drawerInspector.js';
import { buildItemInspector } from './itemInspector.js';
import { buildScenarioInspector } from './scenarioInspector.js';
import { buildCameraViewInspector } from './cameraViewInspector.js';
import { buildAchievementInspector } from './achievementInspector.js';

/**
 * Retrieves an entity from the appropriate collection based on type and ID.
 *
 * This helper function provides a unified way to access entities across different
 * collections in the CONFIG object. It's used by inspector panels to retrieve
 * entity data before displaying it.
 *
 * @function getEntity
 * @param {string} type - The entity type ('cart', 'cameraview', 'scenario', 'drawer', 'item', 'achievement')
 * @param {string} id - The unique identifier of the entity to retrieve
 * @returns {Object|undefined} The entity object if found, undefined otherwise
 *
 * @example
 * // Get a cart entity
 * const cart = getEntity('cart', 'cart-001');
 * console.log(cart.name); // "Main Crash Cart"
 *
 * @example
 * // Get a drawer entity
 * const drawer = getEntity('drawer', 'drawer-top');
 * console.log(drawer.number); // 1
 *
 * @example
 * // Handle non-existent entity
 * const item = getEntity('item', 'non-existent-id');
 * if (!item) {
 *   console.log('Entity not found');
 * }
 */
export function getEntity(type, id) {
    // Map entity types to their corresponding CONFIG collections
    const collections = {
        'cart': CONFIG.carts,
        'cameraview': CONFIG.cameraViews,
        'scenario': CONFIG.scenarios,
        'drawer': CONFIG.drawers,
        'item': CONFIG.items,
        'achievement': CONFIG.achievements
    };

    // Find and return the entity from the appropriate collection
    return collections[type]?.find(e => e.id === id);
}

/**
 * Updates the inspector panel based on the currently selected entity.
 *
 * This is the main dispatcher function that:
 * 1. Checks if an entity is selected
 * 2. Retrieves the selected entity data
 * 3. Routes to the appropriate inspector panel builder
 * 4. Displays an empty state if nothing is selected
 *
 * The function reads from STATE.selectedType and STATE.selectedId to determine
 * what to display. It updates the #inspector-content DOM element with the
 * appropriate property panel HTML.
 *
 * @function updateInspector
 * @returns {void}
 *
 * @example
 * // Called when user selects a cart in the hierarchy
 * STATE.selectedType = 'cart';
 * STATE.selectedId = 'cart-001';
 * updateInspector(); // Displays cart property panel
 *
 * @example
 * // Called when user deselects all entities
 * STATE.selectedType = null;
 * STATE.selectedId = null;
 * updateInspector(); // Displays "Select an item..." message
 *
 * @example
 * // Routing to different inspector types
 * STATE.selectedType = 'item';
 * STATE.selectedId = 'item-123';
 * updateInspector(); // Displays item property panel with image upload
 *
 * @see {@link module:ui/inspector/cartInspector~buildCartInspector}
 * @see {@link module:ui/inspector/drawerInspector~buildDrawerInspector}
 * @see {@link module:ui/inspector/itemInspector~buildItemInspector}
 */
export function updateInspector() {
    // Get the inspector panel container element
    const container = document.getElementById('inspector-content');

    // Handle case where no entity is selected - show empty state
    if (!STATE.selectedType || !STATE.selectedId) {
        container.innerHTML = '<div class="inspector-empty">Select an item from the hierarchy<br>to view its properties</div>';
        return;
    }

    // Retrieve the selected entity from the appropriate collection
    const entity = getEntity(STATE.selectedType, STATE.selectedId);

    // Handle case where entity was deleted or not found
    if (!entity) {
        container.innerHTML = '<div class="inspector-empty">Entity not found</div>';
        return;
    }

    // Route to the appropriate inspector builder based on entity type
    switch (STATE.selectedType) {
        case 'cart':
            buildCartInspector(entity, container);
            break;
        case 'cameraview':
            buildCameraViewInspector(entity, container);
            break;
        case 'scenario':
            buildScenarioInspector(entity, container);
            break;
        case 'drawer':
            buildDrawerInspector(entity, container);
            break;
        case 'item':
            buildItemInspector(entity, container);
            break;
        case 'achievement':
            buildAchievementInspector(entity, container);
            break;
        default:
            // Handle unknown entity type
            container.innerHTML = '<div class="inspector-empty">Unknown entity type</div>';
    }
}
