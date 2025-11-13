/**
 * @fileoverview Cart Manager Module
 * @description Manages cart entities including creation, updates, and property management.
 * Handles cart positioning (both normalized and feet-based coordinates), rotation,
 * type/color configuration, and 3D visualization updates.
 *
 * @module entities/cartManager
 * @requires globals (CONFIG, STATE, CART_TYPES)
 * @requires helpers (getEntity, recordAction, buildHierarchy, drawCanvas,
 *                    buildAll3DCarts, updateInspector, selectEntity, showAlert)
 * @requires 3d (cartMeshes)
 */

// Import required globals and helper functions
// Note: These are accessed via window to avoid undefined values during module load
// when window properties haven't been set yet

// ========================================
// CART PROPERTY UPDATES
// ========================================

/**
 * Updates a property on the currently selected cart entity
 *
 * @description
 * This function updates any property on a cart and handles side effects:
 * - Records the change for undo/redo functionality
 * - Updates the visual hierarchy in the UI
 * - Rebuilds 3D cart if type, color, or name changed
 * - Updates 3D position if x or y coordinates changed
 * - Updates 3D rotation if rotation property changed
 * - Automatically applies default color/name when type changes
 *
 * @param {string} prop - The property name to update (e.g., 'name', 'color', 'x', 'y', 'rotation', 'type')
 * @param {*} value - The new value for the property
 *
 * @example
 * // Update cart name
 * updateCartProperty('name', 'Crash Cart 1');
 *
 * @example
 * // Update cart type (automatically updates color and name)
 * updateCartProperty('type', 'crash');
 *
 * @example
 * // Update cart position (normalized 0-1)
 * updateCartProperty('x', 0.75);
 * updateCartProperty('y', 0.5);
 *
 * @example
 * // Update cart rotation in degrees
 * updateCartProperty('rotation', 90);
 */
export function updateCartProperty(prop, value) {
    const cart = window.getEntity('cart', window.STATE.selectedId);
    if (cart) {
        const oldValue = cart[prop];
        cart[prop] = value;
        window.STATE.unsavedChanges = true;

        // Record action for undo/redo
        window.recordAction('UPDATE_CART_PROPERTY', {
            cartId: cart.id,
            property: prop,
            oldValue: oldValue,
            newValue: value
        });

        window.buildHierarchy();
        window.drawCanvas();

        // If type, color, or name changed, rebuild 3D cart
        if (prop === 'type' || prop === 'color' || prop === 'name') {
            // If type changed, update color to match type default
            if (prop === 'type' && value && window.CART_TYPES[value]) {
                cart.color = window.CART_TYPES[value].color;
                cart.name = window.CART_TYPES[value].name;
            }
            window.buildAll3DCarts();
            window.updateInspector(); // Refresh inspector to show updated values
        }

        // If position changed from inspector, update 3D position
        if (prop === 'x' || prop === 'y') {
            const meshes = window.cartMeshes;
            const cart3D = meshes.get ? meshes.get(cart.id) : meshes[cart.id];
            if (cart3D) {
                const roomWidth = window.CONFIG.roomSettings.width;
                const roomDepth = window.CONFIG.roomSettings.depth;
                cart3D.position.x = (cart.x - 0.5) * roomWidth;
                cart3D.position.z = (cart.y - 0.5) * roomDepth;
            }
        }

        // If rotation changed, update 3D rotation
        if (prop === 'rotation') {
            const meshes = window.cartMeshes;
            const cart3D = meshes.get ? meshes.get(cart.id) : meshes[cart.id];
            if (cart3D) {
                cart3D.rotation.y = (value * Math.PI) / 180; // Convert degrees to radians
            }
            window.updateInspector(); // Refresh to show new value
        }
    }
}

/**
 * Updates cart position using feet-based coordinates from room center
 *
 * @description
 * Converts feet-based positioning (measured from room center) to normalized
 * 0-1 coordinates used internally by the system. This provides a more
 * intuitive interface for positioning carts using real-world measurements.
 *
 * Coordinate System:
 * - Origin (0,0) is at the room center
 * - Positive X is right, negative X is left
 * - Positive Y is back (away from entrance), negative Y is front
 * - Values are automatically clamped to valid room boundaries
 *
 * @param {string} axis - The axis to update ('x' or 'y')
 * @param {number} valueFeet - The position in feet from room center
 *
 * @example
 * // Position cart 5 feet to the right of center
 * updateCartPositionFeet('x', 5);
 *
 * @example
 * // Position cart 3 feet toward entrance from center
 * updateCartPositionFeet('y', -3);
 */
export function updateCartPositionFeet(axis, valueFeet) {
    const cart = window.getEntity('cart', window.STATE.selectedId);
    if (cart) {
        const roomWidth = window.CONFIG.roomSettings.width;
        const roomDepth = window.CONFIG.roomSettings.depth;

        // Convert feet-based position (from center) to normalized 0-1 coordinates
        let normalizedValue;
        if (axis === 'x') {
            normalizedValue = (valueFeet / roomWidth) + 0.5;
        } else if (axis === 'y') {
            normalizedValue = (valueFeet / roomDepth) + 0.5;
        }

        // Clamp to valid range
        normalizedValue = Math.max(0, Math.min(1, normalizedValue));

        // Update using existing function
        updateCartProperty(axis, normalizedValue);
    }
}

// ========================================
// CART CREATION
// ========================================

/**
 * Creates a new cart entity with default properties
 *
 * @description
 * Generates a new cart with a unique timestamp-based ID and default properties:
 * - Default name: 'New Cart'
 * - Default color: green (#4CAF50)
 * - Default position: center of room (0.5, 0.5)
 * - Default size: 80x80
 * - Default rotation: 0 degrees
 * - Not an inventory cart by default
 *
 * The function:
 * 1. Creates the cart object
 * 2. Adds it to CONFIG.carts
 * 3. Records the action for undo/redo
 * 4. Updates all UI elements
 * 5. Selects the new cart
 * 6. Rebuilds the 3D scene to show the new cart
 *
 * @returns {void}
 *
 * @example
 * // Create a new cart
 * createNewCart();
 * // Result: A new cart is created, selected, and visible in both 2D and 3D views
 */
export function createNewCart() {
    const id = `cart_${Date.now()}`;
    const newCart = {
        id: id,
        name: 'New Cart',
        color: '#4CAF50',
        x: 0.5,
        y: 0.5,
        width: 80,
        height: 80,
        rotation: 0, // Default rotation
        isInventory: false
    };

    window.CONFIG.carts.push(newCart);

    // Record for undo/redo
    window.recordAction('CREATE_CART', { cart: newCart });

    window.STATE.unsavedChanges = true;
    window.buildHierarchy();
    window.updateStatusBar();
    window.selectEntity('cart', id);
    window.drawCanvas();
    window.buildAll3DCarts(); // Rebuild 3D scene
    window.showAlert('New cart created', 'success');
}
