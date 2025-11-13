/**
 * Status Bar Module
 *
 * Manages the status bar display that shows real-time counts of various
 * configuration elements. This provides users with at-a-glance information
 * about their current configuration state.
 *
 * @module ui/statusBar
 * @requires None - Pure JavaScript DOM manipulation
 *
 * Dependencies:
 * - Global CONFIG object (must be in scope when imported)
 * - DOM elements (see HTML Structure Requirements below)
 *
 * The status bar displays counts for:
 * - Carts (excluding inventory/procedure tables)
 * - Camera views
 * - Scenarios
 * - Drawers
 * - Items
 * - Achievements
 *
 * @author CabinetQuest Team
 * @version 1.0.0
 */

/**
 * Updates all status bar counters with current configuration counts.
 *
 * This function reads the CONFIG object and updates all status bar elements
 * to reflect the current state of the configuration. It should be called
 * whenever the configuration changes to keep the status bar synchronized.
 *
 * The function performs these updates:
 * 1. Counts non-inventory carts and updates the carts counter
 * 2. Counts camera views and updates the cameras counter
 * 3. Counts scenarios and updates the scenarios counter
 * 4. Counts drawers and updates the drawers counter
 * 5. Counts items and updates the items counter
 * 6. Counts achievements and updates the achievements counter
 *
 * Note: Carts with isInventory flag set to true are excluded from the
 * cart count, as they represent procedure tables rather than equipment carts.
 *
 * @function updateStatusBar
 * @returns {void}
 *
 * @example
 * // Called after adding a new cart
 * CONFIG.carts.push(newCart);
 * updateStatusBar(); // Status bar now shows updated cart count
 *
 * @example
 * // Called after importing configuration
 * CONFIG = importedConfig;
 * updateStatusBar(); // All counters updated
 *
 * @example
 * // Called during initialization
 * window.onload = function() {
 *   loadConfiguration();
 *   updateStatusBar(); // Display initial counts
 * };
 *
 * @example
 * // Called after deleting items
 * CONFIG.items = CONFIG.items.filter(item => item.id !== deletedId);
 * updateStatusBar(); // Item count decreases
 */
export function updateStatusBar() {
    // Update carts counter
    // Filter out inventory carts (procedure tables) from the count
    // Only equipment carts are counted for the status display
    document.getElementById('status-carts').textContent =
        window.CONFIG.carts.filter(c => !c.isInventory).length;

    // Update cameras counter
    // Counts all defined camera view presets
    document.getElementById('status-cameras').textContent =
        window.CONFIG.cameraViews.length;

    // Update scenarios counter
    // Counts all training scenarios
    document.getElementById('status-scenarios').textContent =
        window.CONFIG.scenarios.length;

    // Update drawers counter
    // Counts all drawers across all carts
    document.getElementById('status-drawers').textContent =
        window.CONFIG.drawers.length;

    // Update items counter
    // Counts all items in the inventory
    document.getElementById('status-items').textContent =
        window.CONFIG.items.length;

    // Update achievements counter
    // Counts all unlockable achievements
    document.getElementById('status-achievements').textContent =
        window.CONFIG.achievements.length;
}

/**
 * HTML Structure Requirements
 * ----------------------------
 * The status bar requires these DOM elements to exist:
 *
 * @example
 * <div class="status-bar">
 *   <div class="status-item">
 *     <span class="status-label">Carts:</span>
 *     <span id="status-carts">0</span>
 *   </div>
 *   <div class="status-item">
 *     <span class="status-label">Cameras:</span>
 *     <span id="status-cameras">0</span>
 *   </div>
 *   <div class="status-item">
 *     <span class="status-label">Scenarios:</span>
 *     <span id="status-scenarios">0</span>
 *   </div>
 *   <div class="status-item">
 *     <span class="status-label">Drawers:</span>
 *     <span id="status-drawers">0</span>
 *   </div>
 *   <div class="status-item">
 *     <span class="status-label">Items:</span>
 *     <span id="status-items">0</span>
 *   </div>
 *   <div class="status-item">
 *     <span class="status-label">Achievements:</span>
 *     <span id="status-achievements">0</span>
 *   </div>
 * </div>
 */

/**
 * Required DOM Element IDs
 * -------------------------
 * The following element IDs must exist in the HTML:
 *
 * @typedef {Object} StatusBarElements
 * @property {HTMLElement} status-carts - Displays count of equipment carts
 * @property {HTMLElement} status-cameras - Displays count of camera views
 * @property {HTMLElement} status-scenarios - Displays count of scenarios
 * @property {HTMLElement} status-drawers - Displays count of drawers
 * @property {HTMLElement} status-items - Displays count of items
 * @property {HTMLElement} status-achievements - Displays count of achievements
 */

/**
 * Cart Counting Logic
 * -------------------
 * The cart counter specifically filters out inventory carts using the
 * isInventory flag. This distinction is important because:
 *
 * - Equipment carts: Mobile carts with drawers containing medical supplies
 * - Inventory carts: Fixed procedure tables that don't move
 *
 * @example
 * // Equipment cart (counted)
 * {
 *   id: 'airway',
 *   name: 'Airway Cart',
 *   type: 'airway',
 *   isInventory: false  // or undefined
 * }
 *
 * @example
 * // Inventory cart (NOT counted)
 * {
 *   id: 'procedure-table',
 *   name: 'Procedure Table',
 *   type: 'procedure',
 *   isInventory: true  // Excluded from count
 * }
 */

/**
 * Usage in Application Flow
 * --------------------------
 * updateStatusBar() should be called after any operation that modifies CONFIG:
 *
 * @example
 * // After loading configuration
 * function init() {
 *   loadConfiguration();
 *   updateStatusBar();  // Show loaded counts
 * }
 *
 * @example
 * // After adding entities
 * function addCart(cart) {
 *   CONFIG.carts.push(cart);
 *   updateStatusBar();  // Increment cart count
 * }
 *
 * @example
 * // After deleting entities
 * function deleteDrawer(drawerId) {
 *   CONFIG.drawers = CONFIG.drawers.filter(d => d.id !== drawerId);
 *   updateStatusBar();  // Decrement drawer count
 * }
 *
 * @example
 * // After importing configuration
 * function processImport() {
 *   CONFIG = importedConfig;
 *   saveConfiguration();
 *   updateStatusBar();  // Update all counts
 * }
 *
 * @example
 * // After resetting to defaults
 * function resetToDefaults() {
 *   loadDefaultConfiguration();
 *   updateStatusBar();  // Show default counts
 * }
 */

/**
 * Performance Considerations
 * ---------------------------
 * The function uses Array.filter() for cart counting, which iterates through
 * all carts. For large configurations (hundreds of carts), consider:
 *
 * @example
 * // Optimized version with pre-calculated count
 * let nonInventoryCartCount = 0;
 * CONFIG.carts.forEach(cart => {
 *   if (!cart.isInventory) nonInventoryCartCount++;
 * });
 * document.getElementById('status-carts').textContent = nonInventoryCartCount;
 *
 * However, for typical use cases (10-50 carts), the current implementation
 * is perfectly adequate and more readable.
 */

/**
 * Error Handling
 * --------------
 * The function assumes all CONFIG arrays exist. If using this module
 * independently, add defensive checks:
 *
 * @example
 * // Defensive version
 * export function updateStatusBarSafe() {
 *   const cartCount = CONFIG.carts ?
 *     CONFIG.carts.filter(c => !c.isInventory).length : 0;
 *
 *   const elem = document.getElementById('status-carts');
 *   if (elem) elem.textContent = cartCount;
 *
 *   // Repeat for other counters...
 * }
 */

/**
 * Related Functions
 * -----------------
 * This module works in conjunction with:
 * - loadConfiguration() - Loads CONFIG from storage
 * - saveConfiguration() - Saves CONFIG to storage
 * - buildHierarchy() - Rebuilds entity tree view
 * - drawCanvas() - Redraws 2D canvas
 * - buildAll3DCarts() - Rebuilds 3D scene
 *
 * All of these should call updateStatusBar() after modifying CONFIG.
 */
