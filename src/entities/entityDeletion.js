/**
 * @fileoverview Entity Deletion Module
 * @description Manages entity deletion with confirmation, cascade handling, and undo support.
 * Provides a unified deletion interface for all entity types in the system.
 *
 * @module entities/entityDeletion
 * @requires globals (CONFIG, STATE)
 * @requires helpers (getEntity, recordAction, deselectEntity, buildHierarchy,
 *                    updateStatusBar, drawCanvas, buildAll3DCarts, showAlert)
 */

// ========================================
// ENTITY DELETION
// ========================================

/**
 * Deletes the currently selected entity with confirmation and cascade handling
 *
 * @description
 * This function provides a safe, unified way to delete any entity type:
 * - carts
 * - camera views
 * - scenarios
 * - drawers
 * - items
 * - achievements
 *
 * Deletion Process:
 * 1. Validates that an entity is selected
 * 2. Prompts user for confirmation (shows entity name if available)
 * 3. Handles special cases for cascade deletions:
 *    - When deleting a cart, associated drawers are also recorded for undo
 * 4. Records the action for undo/redo functionality
 * 5. Removes the entity from its collection
 * 6. Updates all affected UI elements
 * 7. Rebuilds 3D scene if necessary (for cart deletions)
 *
 * Special Handling by Entity Type:
 *
 * **Carts:**
 * - Records all drawers that belong to the cart (for proper undo)
 * - Rebuilds 3D scene after deletion
 * - Note: Drawer entities themselves are not automatically deleted,
 *   but they become orphaned (cart property still references deleted cart)
 *
 * **Drawers:**
 * - Records drawer data for undo
 * - Items in the drawer are not automatically updated
 *   (their drawer property still references deleted drawer)
 *
 * **Items:**
 * - Records item data for undo
 * - Removes item from any scenarios that reference it
 *   (essential/optional lists are not automatically cleaned)
 *
 * **Camera Views, Scenarios, Achievements:**
 * - Simple deletion with undo support
 * - No cascade effects
 *
 * @returns {void}
 *
 * @example
 * // Delete the currently selected entity
 * // (User must confirm via browser prompt)
 * deleteCurrentEntity();
 *
 * @example
 * // Typical usage flow:
 * selectEntity('cart', 'cart_1234567890');
 * deleteCurrentEntity();
 * // User sees: "Are you sure you want to delete Crash Cart?"
 * // If confirmed: Cart is deleted, drawers are recorded, 3D scene rebuilds
 *
 * @example
 * // Deleting with undo/redo:
 * deleteCurrentEntity(); // Delete cart
 * undo();                 // Restore cart and its drawers
 * redo();                 // Delete again
 */
export function deleteCurrentEntity() {
    // Validate that an entity is selected
    if (!window.STATE.selectedType || !window.STATE.selectedId) return;

    // Get the entity to show its name in confirmation
    const entity = getEntity(window.STATE.selectedType, window.STATE.selectedId);
    if (!confirm(`Are you sure you want to delete ${entity?.name || window.STATE.selectedId}?`)) {
        return;
    }

    // Map entity types to their collections
    const collections = {
        'cart': window.CONFIG.carts,
        'cameraview': window.CONFIG.cameraViews,
        'scenario': window.CONFIG.scenarios,
        'drawer': window.CONFIG.drawers,
        'item': window.CONFIG.items,
        'achievement': window.CONFIG.achievements
    };

    // Get the collection for this entity type
    const collection = collections[window.STATE.selectedType];
    const index = collection.findIndex(e => e.id === window.STATE.selectedId);

    if (index > -1) {
        const deletedEntity = collection[index];

        // Record for undo/redo with special handling for specific entity types
        if (window.STATE.selectedType === 'cart') {
            // For carts, also save drawers that belong to this cart
            // This enables proper undo functionality (restoring cart with its drawers)
            const cartDrawers = window.CONFIG.drawers.filter(d => d.cart === window.STATE.selectedId);
            recordAction('DELETE_CART', {
                cartId: window.STATE.selectedId,
                cart: deletedEntity,
                drawers: cartDrawers
            });
        } else if (window.STATE.selectedType === 'drawer') {
            recordAction('DELETE_DRAWER', {
                drawerId: window.STATE.selectedId,
                drawer: deletedEntity
            });
        } else if (window.STATE.selectedType === 'item') {
            recordAction('DELETE_ITEM', {
                itemId: window.STATE.selectedId,
                item: deletedEntity
            });
        }
        // Note: Camera views, scenarios, and achievements don't have special undo logic yet

        // Remove the entity from its collection
        collection.splice(index, 1);

        // Update application state
        window.STATE.unsavedChanges = true;
        deselectEntity();
        buildHierarchy();
        updateStatusBar();
        drawCanvas();

        // If cart was deleted, rebuild 3D scene to remove its visualization
        if (window.STATE.selectedType === 'cart') {
            buildAll3DCarts();
        }

        // Show success message
        showAlert(`${window.STATE.selectedType} deleted`, 'success');
    }
}
