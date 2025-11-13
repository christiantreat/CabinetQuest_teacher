/**
 * @fileoverview Drawer Inspector Panel Module
 *
 * This module builds and manages the drawer property panel in the inspector.
 * When a drawer is selected in the hierarchy, this panel displays editable properties
 * including drawer identification, cart assignment, and drawer number.
 *
 * Features:
 * - Drawer identification (ID, Name)
 * - Cart assignment dropdown (excludes inventory cart)
 * - Drawer number (position within the cart, counting from top or left)
 * - Delete action
 *
 * Drawers are container entities that organize items within carts. Each drawer
 * belongs to exactly one cart and has a number indicating its position. The drawer
 * number is used for 3D rendering and interaction in the game view.
 *
 * @module ui/inspector/drawerInspector
 * @requires globals - CONFIG
 *
 * @author CabinetQuest Teacher
 * @version 1.0.0
 */

/**
 * Builds and displays the drawer property panel in the inspector.
 *
 * This function generates a property panel for drawer entities with:
 * - Basic properties (ID, name)
 * - Cart assignment dropdown (populated with non-inventory carts)
 * - Drawer number input (min value: 1)
 * - Delete action button
 *
 * The cart dropdown is filtered to exclude the inventory cart, as inventory
 * items are not organized into drawers. The drawer number determines the
 * vertical or horizontal position within the cart's drawer stack.
 *
 * Drawer Numbering Convention:
 * - Drawer 1 is typically the top drawer
 * - Numbers increase going down
 * - Used for 3D positioning and animation
 *
 * @function buildDrawerInspector
 * @param {Object} drawer - The drawer entity to display properties for
 * @param {string} drawer.id - Unique identifier for the drawer
 * @param {string} drawer.name - Display name of the drawer (e.g., "Top Drawer", "Airway Supplies")
 * @param {string} drawer.cart - ID of the cart this drawer belongs to
 * @param {number} [drawer.number=1] - Position number within the cart (1-based index)
 * @param {HTMLElement} container - The DOM element to render the panel into
 * @returns {void}
 *
 * @example
 * // Build inspector for a top drawer
 * const drawer = {
 *   id: 'drawer-001',
 *   name: 'Top Drawer',
 *   cart: 'cart-001',
 *   number: 1
 * };
 * const container = document.getElementById('inspector-content');
 * buildDrawerInspector(drawer, container);
 *
 * @example
 * // Build inspector for a middle drawer
 * const drawer = {
 *   id: 'drawer-medications',
 *   name: 'Emergency Medications',
 *   cart: 'crash-cart',
 *   number: 2
 * };
 * buildDrawerInspector(drawer, container);
 *
 * @example
 * // Build inspector for a new drawer (minimal data)
 * const drawer = {
 *   id: 'drawer-new',
 *   name: 'New Drawer',
 *   cart: '',
 *   number: 1
 * };
 * buildDrawerInspector(drawer, container); // Shows "Select cart..." prompt
 */
export function buildDrawerInspector(drawer, container) {
    // Build cart selection dropdown
    // Filter out inventory cart as it doesn't use drawers
    // Generate option elements with selection state
    const cartOptions = window.CONFIG.carts.filter(c => !c.isInventory).map(c =>
        `<option value="${c.id}" ${drawer.cart === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    // Build the inspector panel HTML with inline event handlers
    // Note: Event handlers call global functions defined in teacher.js
    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Drawer Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${drawer.id}" onchange="updateDrawerProperty('id', this.value)">
            </div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${drawer.name}" onchange="updateDrawerProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Cart</label>
                <select onchange="updateDrawerProperty('cart', this.value)">
                    <option value="">Select cart...</option>
                    ${cartOptions}
                </select>
            </div>

            <div class="form-field">
                <label>Number</label>
                <input type="number" min="1" value="${drawer.number || 1}" onchange="updateDrawerProperty('number', parseInt(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Drawer</button>
        </div>
    `;
}
