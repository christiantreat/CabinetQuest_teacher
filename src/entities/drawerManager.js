/**
 * @fileoverview Drawer Manager Module
 * @description Manages drawer entities including creation, updates, and cart association.
 * Drawers are components that belong to carts and contain items. This module handles
 * drawer property updates and ensures 3D visualization stays synchronized.
 *
 * @module entities/drawerManager
 * @requires globals (CONFIG, STATE)
 * @requires helpers (getEntity, recordAction, buildHierarchy, drawCanvas,
 *                    buildAll3DCarts, selectEntity, showAlert)
 */

// ========================================
// DRAWER PROPERTY UPDATES
// ========================================

/**
 * Updates a property on the currently selected drawer entity
 *
 * @description
 * This function updates any property on a drawer and handles side effects:
 * - Records the change for undo/redo functionality
 * - Updates the visual hierarchy in the UI
 * - Refreshes the 2D room layout view
 * - Rebuilds 3D cart visualization if cart assignment, drawer number, or name changed
 *
 * Drawer Properties:
 * - id: Unique identifier for the drawer
 * - name: Display name of the drawer
 * - cart: ID of the parent cart this drawer belongs to
 * - number: Drawer number (position in cart, starting from 1)
 *
 * @param {string} prop - The property name to update (e.g., 'name', 'cart', 'number')
 * @param {*} value - The new value for the property
 *
 * @example
 * // Update drawer name
 * updateDrawerProperty('name', 'Top Drawer');
 *
 * @example
 * // Move drawer to a different cart
 * updateDrawerProperty('cart', 'cart_1234567890');
 *
 * @example
 * // Change drawer position in cart
 * updateDrawerProperty('number', 2);
 */
export function updateDrawerProperty(prop, value) {
    const drawer = getEntity('drawer', STATE.selectedId);
    if (drawer) {
        const oldValue = drawer[prop];
        drawer[prop] = value;
        STATE.unsavedChanges = true;

        // Record action for undo/redo
        recordAction('UPDATE_DRAWER_PROPERTY', {
            drawerId: drawer.id,
            property: prop,
            oldValue: oldValue,
            newValue: value
        });

        buildHierarchy();
        drawCanvas(); // Update 2D room layout view

        // If cart, number, or name changed, rebuild 3D carts to show updated drawer
        if (prop === 'cart' || prop === 'number' || prop === 'name') {
            buildAll3DCarts();
        }
    }
}

// ========================================
// DRAWER CREATION
// ========================================

/**
 * Creates a new drawer entity with default properties
 *
 * @description
 * Generates a new drawer with a unique timestamp-based ID and default properties:
 * - Default name: 'New Drawer'
 * - No cart assignment initially (empty string)
 * - Default drawer number: 1
 *
 * The function:
 * 1. Creates the drawer object
 * 2. Adds it to CONFIG.drawers
 * 3. Records the action for undo/redo
 * 4. Updates all UI elements
 * 5. Selects the new drawer
 * 6. Updates the 2D view
 * 7. Rebuilds the 3D scene (will show the drawer when assigned to a cart)
 *
 * @returns {void}
 *
 * @example
 * // Create a new drawer
 * createNewDrawer();
 * // Result: A new drawer is created and selected. Assign it to a cart to see it in 3D view
 */
export function createNewDrawer() {
    const id = `drawer_${Date.now()}`;
    const newDrawer = {
        id: id,
        name: 'New Drawer',
        cart: '',
        number: 1
    };

    CONFIG.drawers.push(newDrawer);

    // Record for undo/redo
    recordAction('CREATE_DRAWER', { drawer: newDrawer });

    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('drawer', id);
    drawCanvas(); // Update 2D room layout view
    buildAll3DCarts(); // Rebuild 3D scene to show new drawer
    showAlert('New drawer created', 'success');
}
