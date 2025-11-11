/**
 * @fileoverview Cart Inspector Panel Module
 *
 * This module builds and manages the cart property panel in the inspector.
 * When a cart is selected in the hierarchy, this panel displays editable properties
 * including cart type, color, position, rotation, and dimensions.
 *
 * Features:
 * - Cart identification (ID, Name)
 * - Cart type selection (Crash Cart, Airway Cart, Medication Cart, etc.)
 * - Color picker for cart customization
 * - Position controls (X/Y coordinates in feet from room center)
 * - Rotation controls with quick-set buttons (0°, 90°, 180°, 270°)
 * - Read-only dimension display (width, depth, height based on cart type)
 * - Inventory cart flag
 * - Delete action
 *
 * The panel uses feet-based measurements for user-friendly positioning relative
 * to the room center, which are converted to normalized 0-1 coordinates internally.
 *
 * @module ui/inspector/cartInspector
 * @requires globals - CONFIG, STATE, CART_TYPES
 *
 * @author CabinetQuest Teacher
 * @version 1.0.0
 */

/**
 * Builds and displays the cart property panel in the inspector.
 *
 * This function generates a comprehensive property panel for cart entities, including:
 * - Basic properties (ID, name, type, color)
 * - Position controls with min/max bounds based on room dimensions
 * - Rotation controls with preset angle buttons
 * - Dimension display (read-only, based on cart type)
 * - Configuration options (inventory cart flag)
 * - Delete action button
 *
 * The panel displays position in feet from the room center, making it more intuitive
 * for users than normalized 0-1 coordinates. Dimensions are automatically set based
 * on the selected cart type from CART_TYPES.
 *
 * Position Coordinate System:
 * - X axis: Negative values = left of center, Positive = right of center
 * - Y axis: Negative values = toward entry, Positive = away from entry
 * - Both axes measured in feet from room center
 *
 * @function buildCartInspector
 * @param {Object} cart - The cart entity to display properties for
 * @param {string} cart.id - Unique identifier for the cart
 * @param {string} cart.name - Display name of the cart
 * @param {string} [cart.type] - Cart type key from CART_TYPES (e.g., 'crash', 'airway')
 * @param {string} cart.color - Hex color code for the cart (e.g., '#FF0000')
 * @param {number} cart.x - Normalized X position (0-1, where 0.5 is center)
 * @param {number} cart.y - Normalized Y position (0-1, where 0.5 is center)
 * @param {number} [cart.rotation=0] - Rotation in degrees (0-360)
 * @param {boolean} [cart.isInventory=false] - Whether this is the inventory cart
 * @param {HTMLElement} container - The DOM element to render the panel into
 * @returns {void}
 *
 * @example
 * // Build inspector for a crash cart
 * const cart = {
 *   id: 'cart-001',
 *   name: 'Main Crash Cart',
 *   type: 'crash',
 *   color: '#FF0000',
 *   x: 0.5,
 *   y: 0.3,
 *   rotation: 90,
 *   isInventory: false
 * };
 * const container = document.getElementById('inspector-content');
 * buildCartInspector(cart, container);
 *
 * @example
 * // Build inspector for inventory cart (disabled ID field)
 * const inventoryCart = {
 *   id: 'inventory',
 *   name: 'Inventory',
 *   type: 'supply',
 *   color: '#808080',
 *   x: 0.1,
 *   y: 0.1,
 *   rotation: 0,
 *   isInventory: true
 * };
 * buildCartInspector(inventoryCart, container);
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color|HTML Color Input}
 */
export function buildCartInspector(cart, container) {
    // Get cart dimensions from CART_TYPES (measurements in feet)
    // Falls back to 'crash' type if cart type is undefined or not found
    const cartType = CART_TYPES[cart.type] || CART_TYPES.crash;
    const widthFeet = cartType.width;
    const depthFeet = cartType.depth;
    const heightFeet = cartType.height;

    // Calculate position in feet from room center
    // Room center is (0.5, 0.5) in normalized coordinates
    // Room dimensions are in feet, so we convert to feet-based position
    const roomWidth = CONFIG.roomSettings.width;
    const roomDepth = CONFIG.roomSettings.depth;
    const posXFeet = ((cart.x - 0.5) * roomWidth).toFixed(2);
    const posYFeet = ((cart.y - 0.5) * roomDepth).toFixed(2);

    // Calculate min/max position bounds in feet to prevent cart from leaving room
    const minX = (-roomWidth / 2).toFixed(2);
    const maxX = (roomWidth / 2).toFixed(2);
    const minY = (-roomDepth / 2).toFixed(2);
    const maxY = (roomDepth / 2).toFixed(2);

    // Build the inspector panel HTML with inline event handlers
    // Note: Event handlers call global functions defined in teacher.js
    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Cart Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${cart.id}" onchange="updateCartProperty('id', this.value)" ${cart.id === 'inventory' ? 'disabled' : ''}>
            </div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${cart.name}" onchange="updateCartProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Cart Type</label>
                <select onchange="updateCartProperty('type', this.value)">
                    <option value="">Default/Custom</option>
                    <option value="crash" ${cart.type === 'crash' ? 'selected' : ''}>Crash Cart (Code Cart)</option>
                    <option value="airway" ${cart.type === 'airway' ? 'selected' : ''}>Airway Cart</option>
                    <option value="medication" ${cart.type === 'medication' ? 'selected' : ''}>Medication Cart</option>
                    <option value="iv" ${cart.type === 'iv' ? 'selected' : ''}>IV Cart</option>
                    <option value="procedure" ${cart.type === 'procedure' ? 'selected' : ''}>Procedure Table</option>
                    <option value="trauma" ${cart.type === 'trauma' ? 'selected' : ''}>Trauma Cart</option>
                    <option value="supply" ${cart.type === 'supply' ? 'selected' : ''}>Supply Cart</option>
                </select>
            </div>

            <div class="form-field">
                <label>Color</label>
                <div class="color-picker-field">
                    <input type="color" value="${cart.color}" onchange="updateCartProperty('color', this.value)">
                    <input type="text" value="${cart.color}" readonly>
                </div>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Position (feet from center)</div>

            <div class="form-field-row">
                <div class="form-field">
                    <label>X Position (ft)</label>
                    <input type="number" step="0.1" min="${minX}" max="${maxX}" value="${posXFeet}" onchange="updateCartPositionFeet('x', parseFloat(this.value))">
                </div>
                <div class="form-field">
                    <label>Y Position (ft)</label>
                    <input type="number" step="0.1" min="${minY}" max="${maxY}" value="${posYFeet}" onchange="updateCartPositionFeet('y', parseFloat(this.value))">
                </div>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Rotation (3D)</div>

            <div class="form-field">
                <label>Rotation (degrees)</label>
                <input type="number" step="1" min="0" max="360" value="${cart.rotation || 0}" onchange="updateCartProperty('rotation', parseFloat(this.value))">
            </div>

            <div class="form-field" style="display: flex; gap: 5px; margin-top: 8px;">
                <button class="btn btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="updateCartProperty('rotation', 0)">0°</button>
                <button class="btn btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="updateCartProperty('rotation', 90)">90°</button>
                <button class="btn btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="updateCartProperty('rotation', 180)">180°</button>
                <button class="btn btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="updateCartProperty('rotation', 270)">270°</button>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Dimensions (feet)</div>

            <div class="form-field-row">
                <div class="form-field">
                    <label>Width (ft)</label>
                    <input type="number" value="${widthFeet}" readonly style="background-color: #f5f5f5; cursor: not-allowed;">
                </div>
                <div class="form-field">
                    <label>Depth (ft)</label>
                    <input type="number" value="${depthFeet}" readonly style="background-color: #f5f5f5; cursor: not-allowed;">
                </div>
            </div>

            <div class="form-field">
                <label>Height (ft)</label>
                <input type="number" value="${heightFeet}" readonly style="background-color: #f5f5f5; cursor: not-allowed;">
            </div>

            <div style="font-size: 11px; color: #666; margin-top: 5px; font-style: italic;">
                * Dimensions are based on cart type
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Options</div>

            <div class="checkbox-field">
                <input type="checkbox" id="cart-is-inventory" ${cart.isInventory ? 'checked' : ''} onchange="updateCartProperty('isInventory', this.checked)">
                <label for="cart-is-inventory">Is Inventory Cart</label>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Cart</button>
        </div>
    `;
}
