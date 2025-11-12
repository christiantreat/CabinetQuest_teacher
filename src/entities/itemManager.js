/**
 * @fileoverview Item Manager Module
 * @description Manages item entities including creation, updates, cart/drawer assignment,
 * scenario associations, and image uploads. Items are the core game objects that
 * players interact with during training scenarios.
 *
 * @module entities/itemManager
 * @requires globals (CONFIG, STATE)
 * @requires helpers (getEntity, recordAction, buildHierarchy, drawCanvas,
 *                    buildAll3DCarts, updateInspector, selectEntity, showAlert)
 */

import { recordAction } from '../core/history.js';
import { buildHierarchy } from '../ui/hierarchy.js';

// ========================================
// ITEM PROPERTY UPDATES
// ========================================

/**
 * Updates a property on the currently selected item entity
 *
 * @description
 * This function updates any property on an item and handles side effects:
 * - Records the change for undo/redo functionality
 * - Updates the visual hierarchy in the UI
 * - Refreshes both 2D room layout and 3D visualization
 *
 * Item Properties:
 * - id: Unique identifier for the item
 * - name: Display name of the item
 * - cart: ID of the cart containing this item
 * - drawer: ID of the drawer containing this item
 * - description: Detailed description of the item
 * - image: Base64-encoded image data (optional)
 *
 * @param {string} prop - The property name to update (e.g., 'name', 'cart', 'drawer', 'description')
 * @param {*} value - The new value for the property
 *
 * @example
 * // Update item name
 * updateItemProperty('name', 'Epinephrine 1mg');
 *
 * @example
 * // Update item description
 * updateItemProperty('description', 'Emergency medication for cardiac arrest');
 *
 * @example
 * // Move item to different drawer
 * updateItemProperty('drawer', 'drawer_1234567890');
 */
export function updateItemProperty(prop, value) {
    const item = getEntity('item', STATE.selectedId);
    if (item) {
        const oldValue = item[prop];
        item[prop] = value;
        STATE.unsavedChanges = true;

        // Record action for undo/redo
        recordAction('UPDATE_ITEM_PROPERTY', {
            itemId: item.id,
            property: prop,
            oldValue: oldValue,
            newValue: value
        });

        buildHierarchy();
        drawCanvas(); // Update 2D room layout view
        buildAll3DCarts(); // Update 3D view
    }
}

/**
 * Updates the cart assignment for the currently selected item
 *
 * @description
 * Changes which cart contains the selected item. When the cart changes:
 * - The drawer assignment is automatically reset (since drawers belong to specific carts)
 * - The drawer dropdown in the UI is updated to show only drawers from the new cart
 *
 * This ensures data consistency between items, drawers, and carts.
 *
 * @param {string} cartId - The ID of the cart to assign the item to
 *
 * @example
 * // Move item to crash cart
 * updateItemCart('cart_1234567890');
 * // Result: Item is moved to the cart, drawer is reset, drawer dropdown updates
 */
export function updateItemCart(cartId) {
    const item = getEntity('item', STATE.selectedId);
    if (item) {
        item.cart = cartId;
        item.drawer = ''; // Reset drawer when cart changes
        STATE.unsavedChanges = true;

        // Update drawer dropdown to show only drawers from the selected cart
        const drawerSelect = document.getElementById('item-drawer-select');
        const drawerOptions = CONFIG.drawers.filter(d => d.cart === cartId).map(d =>
            `<option value="${d.id}">${d.name}</option>`
        ).join('');
        drawerSelect.innerHTML = '<option value="">Select drawer...</option>' + drawerOptions;
    }
}

// ========================================
// SCENARIO ITEM MANAGEMENT
// ========================================

/**
 * Toggles an item's inclusion in a scenario's essential or optional item list
 *
 * @description
 * Adds or removes an item from a scenario's required or optional items list.
 * This determines which items the player must/should collect during the scenario.
 *
 * - Essential items: Required for scenario success
 * - Optional items: Provide bonus points but not required
 *
 * The function toggles the item's presence:
 * - If item is in the list, it's removed
 * - If item is not in the list, it's added
 *
 * @param {string} type - The list type ('essential' or 'optional')
 * @param {string} itemId - The ID of the item to toggle
 *
 * @example
 * // Add item to essential list
 * toggleScenarioItem('essential', 'item_1234567890');
 * // Call again to remove it
 * toggleScenarioItem('essential', 'item_1234567890');
 *
 * @example
 * // Add item to optional list
 * toggleScenarioItem('optional', 'item_9876543210');
 */
export function toggleScenarioItem(type, itemId) {
    const scenario = getEntity('scenario', STATE.selectedId);
    if (!scenario) return;

    const listName = type === 'essential' ? 'essential' : 'optional';
    if (!scenario[listName]) scenario[listName] = [];

    const index = scenario[listName].indexOf(itemId);
    if (index > -1) {
        // Item exists, remove it
        scenario[listName].splice(index, 1);
    } else {
        // Item doesn't exist, add it
        scenario[listName].push(itemId);
    }

    STATE.unsavedChanges = true;
    updateInspector();
}

// ========================================
// ITEM IMAGE MANAGEMENT
// ========================================

/**
 * Handles image file upload for the currently selected item
 *
 * @description
 * Processes an image file selected by the user and converts it to a base64
 * data URL for storage. The image is then assigned to the item's image property.
 *
 * Process:
 * 1. Extracts the file from the upload event
 * 2. Uses FileReader to convert file to base64 data URL
 * 3. Stores the data URL in the item's image property
 * 4. Marks configuration as having unsaved changes
 * 5. Updates the inspector to show the new image
 *
 * @param {Event} event - The file input change event
 *
 * @example
 * // In HTML:
 * // <input type="file" onchange="handleItemImageUpload(event)" accept="image/*">
 * //
 * // When user selects an image:
 * handleItemImageUpload(event);
 * // Result: Image is loaded, converted to base64, and stored with the item
 */
export function handleItemImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const item = getEntity('item', STATE.selectedId);
        if (item) {
            item.image = e.target.result;
            STATE.unsavedChanges = true;
            updateInspector();
        }
    };
    reader.readAsDataURL(file);
}

// ========================================
// ITEM CREATION
// ========================================

/**
 * Creates a new item entity with default properties
 *
 * @description
 * Generates a new item with a unique timestamp-based ID and default properties:
 * - Default name: 'New Item'
 * - No cart assignment initially (empty string)
 * - No drawer assignment initially (empty string)
 * - Empty description
 *
 * The function:
 * 1. Creates the item object
 * 2. Adds it to CONFIG.items
 * 3. Records the action for undo/redo
 * 4. Updates all UI elements
 * 5. Selects the new item
 * 6. Updates both 2D and 3D views
 *
 * @returns {void}
 *
 * @example
 * // Create a new item
 * createNewItem();
 * // Result: A new item is created and selected. Assign it to a cart/drawer to place it
 */
export function createNewItem() {
    const id = `item_${Date.now()}`;
    const newItem = {
        id: id,
        name: 'New Item',
        cart: '',
        drawer: '',
        description: ''
    };

    CONFIG.items.push(newItem);

    // Record for undo/redo
    recordAction('CREATE_ITEM', { item: newItem });

    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('item', id);
    drawCanvas(); // Update 2D room layout view
    buildAll3DCarts(); // Update 3D view
    showAlert('New item created', 'success');
}
