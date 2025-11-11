/**
 * @fileoverview Item Inspector Panel Module
 *
 * This module builds and manages the item property panel in the inspector.
 * When an item is selected in the hierarchy, this panel displays editable properties
 * including item identification, cart/drawer assignment, description, and image.
 *
 * Features:
 * - Item identification (ID, Name)
 * - Cart and drawer assignment with cascading dropdowns
 * - Item description text area
 * - Image upload with drag-and-drop support
 * - Image preview display
 * - Delete action
 *
 * The module also provides a multiselect component used by scenario inspectors
 * to select essential and optional items for scenarios.
 *
 * @module ui/inspector/itemInspector
 * @requires globals - CONFIG
 *
 * @author CabinetQuest Teacher
 * @version 1.0.0
 */

/**
 * Builds and displays the item property panel in the inspector.
 *
 * This function generates a comprehensive property panel for item entities with:
 * - Basic properties (ID, name, description)
 * - Cascading cart/drawer selection (drawer options update based on cart)
 * - Image upload interface with preview
 * - Delete action button
 *
 * The cart dropdown is filtered to exclude the inventory cart. When a cart is
 * selected, the drawer dropdown updates to show only drawers belonging to that cart.
 * This provides a cascading selection interface for proper item organization.
 *
 * Image Upload:
 * - Supports click to upload
 * - Can be extended to support drag-and-drop
 * - Displays preview of uploaded image
 * - Shows placeholder when no image is uploaded
 *
 * @function buildItemInspector
 * @param {Object} item - The item entity to display properties for
 * @param {string} item.id - Unique identifier for the item
 * @param {string} item.name - Display name of the item (e.g., "Epinephrine 1mg/mL")
 * @param {string} item.cart - ID of the cart this item belongs to
 * @param {string} item.drawer - ID of the drawer this item is stored in
 * @param {string} [item.description=''] - Optional description of the item
 * @param {string} [item.image] - Optional data URL or path to item image
 * @param {HTMLElement} container - The DOM element to render the panel into
 * @returns {void}
 *
 * @example
 * // Build inspector for an item with image
 * const item = {
 *   id: 'item-epi',
 *   name: 'Epinephrine 1mg/mL',
 *   cart: 'crash-cart',
 *   drawer: 'drawer-meds',
 *   description: 'Emergency medication for cardiac arrest',
 *   image: 'data:image/png;base64,iVBORw0KG...'
 * };
 * const container = document.getElementById('inspector-content');
 * buildItemInspector(item, container);
 *
 * @example
 * // Build inspector for an item without image
 * const item = {
 *   id: 'item-bandage',
 *   name: 'Sterile Bandage',
 *   cart: 'supply-cart',
 *   drawer: 'drawer-top',
 *   description: 'Standard sterile bandage',
 *   image: null
 * };
 * buildItemInspector(item, container); // Shows upload placeholder
 *
 * @example
 * // Build inspector for unassigned item
 * const item = {
 *   id: 'item-new',
 *   name: 'New Item',
 *   cart: '',
 *   drawer: '',
 *   description: ''
 * };
 * buildItemInspector(item, container); // Shows "Select cart..." and empty drawer list
 */
export function buildItemInspector(item, container) {
    // Build cart selection dropdown
    // Filter out inventory cart as items in game drawers shouldn't be in inventory
    // Generate option elements with selection state
    const cartOptions = CONFIG.carts.filter(c => !c.isInventory).map(c =>
        `<option value="${c.id}" ${item.cart === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    // Build drawer selection dropdown
    // Only show drawers that belong to the currently selected cart
    // This creates a cascading selection: pick cart first, then drawer
    const drawerOptions = CONFIG.drawers.filter(d => d.cart === item.cart).map(d =>
        `<option value="${d.id}" ${item.drawer === d.id ? 'selected' : ''}>${d.name}</option>`
    ).join('');

    // Prepare image HTML for preview
    // Show actual image if available, otherwise show upload placeholder
    const imageHTML = item.image ? `<img src="${item.image}" alt="${item.name}">` :
        '<div class="image-upload-placeholder">Click to upload image<br>or drag & drop</div>';

    // Build the inspector panel HTML with inline event handlers
    // Note: Event handlers call global functions defined in teacher.js
    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Item Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${item.id}" onchange="updateItemProperty('id', this.value)">
            </div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${item.name}" onchange="updateItemProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Cart</label>
                <select id="item-cart-select" onchange="updateItemCart(this.value)">
                    <option value="">Select cart...</option>
                    ${cartOptions}
                </select>
            </div>

            <div class="form-field">
                <label>Drawer</label>
                <select id="item-drawer-select" onchange="updateItemProperty('drawer', this.value)">
                    <option value="">Select drawer...</option>
                    ${drawerOptions}
                </select>
            </div>

            <div class="form-field">
                <label>Description</label>
                <textarea onchange="updateItemProperty('description', this.value)">${item.description || ''}</textarea>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Item Image</div>
            <div class="image-upload-field">
                <input type="file" id="item-image-upload" accept="image/*" style="display:none" onchange="handleItemImageUpload(event)">
                <div class="image-upload-preview ${item.image ? 'has-image' : ''}" onclick="document.getElementById('item-image-upload').click()">
                    ${imageHTML}
                </div>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Item</button>
        </div>
    `;
}

/**
 * Builds a multiselect component for selecting items in a scenario.
 *
 * This function generates a visual grid of clickable item chips that allow
 * users to select multiple items for a scenario's essential or optional lists.
 * Each item is displayed as a button that toggles between selected and unselected
 * states when clicked.
 *
 * The component is used in the scenario inspector to build the essential and
 * optional item lists. Selected items are highlighted visually, and clicking
 * toggles their selection state.
 *
 * Visual States:
 * - Unselected: Gray background, normal appearance
 * - Selected: Blue background, highlighted appearance
 * - Empty: Shows "No items available" message
 *
 * @function buildItemMultiselect
 * @param {string[]} selectedIds - Array of item IDs that are currently selected
 * @param {string} type - The selection type ('essential' or 'optional')
 * @returns {string} HTML string for the multiselect component
 *
 * @example
 * // Build multiselect for essential items with some preselected
 * const essentialHTML = buildItemMultiselect(['item-epi', 'item-atropine'], 'essential');
 * document.getElementById('essential-items').innerHTML = essentialHTML;
 *
 * @example
 * // Build multiselect for optional items with none selected
 * const optionalHTML = buildItemMultiselect([], 'optional');
 * document.getElementById('optional-items').innerHTML = optionalHTML;
 *
 * @example
 * // Handle empty item list
 * CONFIG.items = [];
 * const html = buildItemMultiselect([], 'essential');
 * // Returns: '<div class="item-multiselect-empty">No items available. Create items first!</div>'
 *
 * @example
 * // Typical usage in scenario inspector
 * const scenario = {
 *   id: 'scenario-001',
 *   essential: ['item-epi', 'item-atropine'],
 *   optional: ['item-amiodarone']
 * };
 * const essentialHTML = buildItemMultiselect(scenario.essential, 'essential');
 * const optionalHTML = buildItemMultiselect(scenario.optional, 'optional');
 */
export function buildItemMultiselect(selectedIds, type) {
    // Check if there are any items available to select
    if (CONFIG.items.length === 0) {
        return '<div class="item-multiselect-empty">No items available. Create items first!</div>';
    }

    // Map each item to a clickable chip element
    // Apply 'selected' class if item is in selectedIds array
    // Each chip calls toggleScenarioItem when clicked to toggle selection
    return CONFIG.items.map(item => {
        const isSelected = selectedIds.includes(item.id);
        return `<div class="item-multiselect-item ${isSelected ? 'selected' : ''}"
                     onclick="toggleScenarioItem('${type}', '${item.id}')">
                    ${item.name}
                </div>`;
    }).join('');
}
