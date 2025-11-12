/**
 * Hierarchy Tree UI Module
 *
 * This module manages the hierarchical tree view that displays all game entities
 * in an organized, collapsible structure. The hierarchy panel allows users to
 * browse, select, and create entities across different categories.
 *
 * The hierarchy tree has a special structure:
 * - Carts category contains nested drawers (parent-child relationship)
 * - Other categories (Camera Views, Scenarios, Items, Achievements) are flat lists
 * - Each category shows a count of items
 * - Each category can be collapsed/expanded
 * - Selected items are visually highlighted
 * - Each category has a "Create New" button
 *
 * Tree Structure:
 * ```
 * Hierarchy Tree
 * ├── Carts (5)
 * │   ├── + Create New Cart
 * │   ├── Trauma Cart 1
 * │   │   ├── + Add Drawer
 * │   │   ├── Top Drawer
 * │   │   ├── Middle Drawer
 * │   │   └── Bottom Drawer
 * │   └── Trauma Cart 2
 * ├── Camera Views (3)
 * │   ├── + Create New
 * │   ├── Overview
 * │   └── Detail View
 * ├── Scenarios (2)
 * │   ├── + Create New
 * │   └── Basic Trauma
 * ├── Items (12)
 * │   ├── + Create New
 * │   └── ...
 * └── Achievements (5)
 *     ├── + Create New
 *     └── ...
 * ```
 *
 * Functions:
 * - buildHierarchy(): Main function that rebuilds the entire tree from CONFIG data
 * - createCartsWithDrawersNode(): Creates the special Carts category with nested drawers
 * - createCategoryNode(): Creates a standard category node for other entity types
 * - refreshHierarchy(): Rebuilds the tree and shows a success message
 * - filterHierarchy(): Filters tree items based on search input
 *
 * @module ui/hierarchy
 * @requires config/config - CONFIG and STATE objects
 * @requires ui/alerts - showAlert function
 * @requires core/state - selectEntity function (circular dependency)
 *
 * External Dependencies (still in teacher.js, to be refactored):
 * - createNewCart() - Creates a new cart entity
 * - createNewDrawer() - Creates a new drawer entity
 * - createNewCameraView() - Creates a new camera view
 * - createNewScenario() - Creates a new scenario
 * - createNewItem() - Creates a new item
 * - createNewAchievement() - Creates a new achievement
 * - updateInspector() - Updates the inspector panel
 * - drawCanvas() - Redraws the 2D canvas
 *
 * These dependencies will be injected when the full modular system is integrated.
 *
 * CSS Classes Used:
 * - .tree-category: Container for each category
 * - .tree-category-header: Clickable header showing category name and count
 * - .tree-category-icon: Collapse/expand arrow icon (▼/►)
 * - .tree-category-items: Container for items within a category
 * - .tree-item: Individual item in the tree
 * - .tree-item-container: Container for cart+drawers grouping
 * - .tree-nested-items: Container for nested drawer items
 * - .tree-nested-item: Individual nested drawer item
 * - .tree-item-icon: Icon for each item (🛒, 🗄️, 📷, 📋, 📦, 🏆)
 * - .tree-item-name: Text name of the item
 * - .tree-item-count: Count badge for categories or drawers
 * - .collapsed: State class to hide items when category is collapsed
 * - .selected: Highlights the currently selected item
 *
 * @author CabinetQuest Team
 * @version 1.0.0
 */

import { CONFIG, STATE } from '../config/config.js';
import { showAlert } from './alerts.js';
import { selectEntity } from '../core/state.js';

// ===== HIERARCHY TREE BUILDING =====

/**
 * Builds and renders the complete hierarchy tree in the UI.
 *
 * This is the main entry point for rendering the hierarchy panel.
 * It clears the existing tree and rebuilds it from scratch using
 * the current CONFIG data. This function is called whenever:
 * - The application first loads
 * - An entity is created or deleted
 * - An entity is selected (to update highlights)
 * - Configuration is loaded or imported
 * - User clicks the refresh button
 *
 * The tree is built in a specific order:
 * 1. Carts category (special handling for nested drawers)
 * 2. Camera Views category
 * 3. Scenarios category
 * 4. Items category
 * 5. Achievements category
 *
 * Each category displays:
 * - Category icon and name
 * - Count of items
 * - Collapse/expand control
 * - "Create New" button
 * - List of items with selection highlighting
 *
 * The Carts category is special because it shows drawers nested
 * under their parent cart, creating a two-level hierarchy.
 *
 * Performance Note:
 * This function does a full DOM rebuild each time. For large
 * configurations (100+ entities), consider optimizing to only
 * update changed portions of the tree.
 *
 * @function buildHierarchy
 * @returns {void}
 *
 * @example
 * // Initial load
 * loadConfiguration();
 * buildHierarchy(); // Render the tree with loaded data
 *
 * @example
 * // After creating a new cart
 * function createNewCart() {
 *   const cart = { id: 'cart-' + Date.now(), name: 'New Cart', ... };
 *   CONFIG.carts.push(cart);
 *   buildHierarchy(); // Refresh tree to show new cart
 * }
 *
 * @example
 * // After selection change
 * function selectEntity(type, id) {
 *   STATE.selectedType = type;
 *   STATE.selectedId = id;
 *   buildHierarchy(); // Refresh tree to highlight selection
 * }
 *
 * @see createCartsWithDrawersNode - Creates the Carts category
 * @see createCategoryNode - Creates other categories
 * @see refreshHierarchy - User-triggered refresh with feedback
 */
export function buildHierarchy() {
    // Step 1: Get the hierarchy tree container element
    const tree = document.getElementById('hierarchy-tree');

    // Step 2: Clear all existing content
    tree.innerHTML = '';

    // Step 3: Build the special Carts category with nested drawers
    // This must be first to maintain consistent ordering
    const cartsCategory = createCartsWithDrawersNode();
    tree.appendChild(cartsCategory);

    // Step 4: Build standard categories for other entity types
    // Note: Drawers are excluded here because they're nested under Carts
    const categories = [
        {
            id: 'cameraviews',        // ID used for selection type (minus the 's')
            name: 'Camera Views',      // Display name
            icon: '📷',                // Icon shown in tree
            items: CONFIG.cameraViews, // Data array from CONFIG
            createNew: typeof window.createNewCameraView === 'function' ? window.createNewCameraView : null
        },
        {
            id: 'scenarios',
            name: 'Scenarios',
            icon: '📋',
            items: CONFIG.scenarios,
            createNew: typeof window.createNewScenario === 'function' ? window.createNewScenario : null
        },
        {
            id: 'items',
            name: 'Items',
            icon: '📦',
            items: CONFIG.items,
            createNew: typeof window.createNewItem === 'function' ? window.createNewItem : null
        },
        {
            id: 'achievements',
            name: 'Achievements',
            icon: '🏆',
            items: CONFIG.achievements,
            createNew: typeof window.createNewAchievement === 'function' ? window.createNewAchievement : null
        }
    ];

    // Step 5: Create and append each category node
    categories.forEach(category => {
        const categoryDiv = createCategoryNode(category);
        tree.appendChild(categoryDiv);
    });
}

/**
 * Creates the special Carts category node with nested drawer hierarchy.
 *
 * This function creates a unique tree structure where drawers are nested
 * under their parent carts. This is the only two-level hierarchy in the tree.
 *
 * Structure created:
 * ```
 * Carts (3)                    ← Category header
 *   + Create New Cart          ← Create button
 *   🛒 Cart A (2)              ← Cart with drawer count
 *     + Add Drawer             ← Add drawer to this cart
 *     🗄️ Drawer 1             ← Nested drawer
 *     🗄️ Drawer 2             ← Nested drawer
 *   🛒 Cart B (0)              ← Cart with no drawers
 * ```
 *
 * Each cart shows:
 * - Collapse/expand icon (if it has drawers)
 * - Cart icon (🛒)
 * - Cart name
 * - Drawer count badge
 * - Nested drawer list (collapsible)
 *
 * Interaction:
 * - Clicking the expand icon toggles drawer visibility
 * - Clicking the cart name selects the cart
 * - Clicking "Add Drawer" creates a drawer and auto-assigns it to that cart
 * - Clicking a drawer selects the drawer
 *
 * The function uses drawer.cart property to determine which cart
 * each drawer belongs to, then groups them accordingly.
 *
 * @function createCartsWithDrawersNode
 * @returns {HTMLDivElement} The complete Carts category DOM node
 *
 * @example
 * // Building just the Carts category
 * const cartsNode = createCartsWithDrawersNode();
 * document.getElementById('hierarchy-tree').appendChild(cartsNode);
 *
 * @example
 * // Finding drawers for a specific cart
 * const cart = CONFIG.carts.find(c => c.id === 'trauma-cart-1');
 * const cartDrawers = CONFIG.drawers.filter(d => d.cart === cart.id);
 * console.log(`Cart has ${cartDrawers.length} drawers`);
 *
 * @see buildHierarchy - Main function that calls this
 * @see createCategoryNode - Creates standard category nodes
 */
export function createCartsWithDrawersNode() {
    // Step 1: Create the main category container
    const div = document.createElement('div');
    div.className = 'tree-category';

    // Step 2: Get the carts array (ensure it exists)
    const carts = CONFIG.carts || [];

    // Step 3: Create the category header with icon, name, and count
    const header = document.createElement('div');
    header.className = 'tree-category-header';
    header.innerHTML = `
        <span class="tree-category-icon">▼</span>
        <span class="tree-item-icon">🛒</span>
        <span class="tree-item-name">Carts</span>
        <span class="tree-item-count">${carts.length}</span>
    `;

    // Step 4: Make header clickable to collapse/expand category
    header.onclick = () => {
        div.classList.toggle('collapsed');
    };

    // Step 5: Create container for category items
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'tree-category-items';

    // Step 6: Add "Create New Cart" button at the top
    const createBtn = document.createElement('div');
    createBtn.className = 'tree-item';
    createBtn.style.fontStyle = 'italic';
    createBtn.style.color = '#0e639c';
    createBtn.innerHTML = `<span class="tree-item-icon">+</span><span class="tree-item-name">Create New Cart</span>`;

    // Attach the create function if it exists (still in teacher.js)
    if (typeof window.createNewCart === 'function') {
        createBtn.onclick = window.createNewCart;
    }
    itemsDiv.appendChild(createBtn);

    // Step 7: Add each cart with its nested drawers
    carts.forEach(cart => {
        // Create a container for the cart and its drawers
        const cartContainer = document.createElement('div');
        cartContainer.className = 'tree-item-container';

        // Create the cart item element
        const cartItem = document.createElement('div');
        cartItem.className = 'tree-item';

        // Highlight the cart if it's currently selected
        if (STATE.selectedType === 'cart' && STATE.selectedId === cart.id) {
            cartItem.classList.add('selected');
        }

        // Find all drawers that belong to this cart
        const cartDrawers = CONFIG.drawers.filter(d => d.cart === cart.id);
        const hasDrawers = cartDrawers.length > 0;

        // Build the cart item HTML with conditional expand icon and drawer count
        cartItem.innerHTML = `
            <span class="tree-category-icon" style="font-size: 10px; margin-right: 2px;">${hasDrawers ? '▼' : ''}</span>
            <span class="tree-item-icon">🛒</span>
            <span class="tree-item-name">${cart.name || cart.id}</span>
            ${hasDrawers ? `<span class="tree-item-count" style="font-size: 9px;">${cartDrawers.length}</span>` : ''}
        `;

        // Handle cart item clicks
        cartItem.onclick = (e) => {
            // If clicking the expand/collapse icon, toggle drawer visibility
            if (e.target.classList.contains('tree-category-icon')) {
                cartContainer.classList.toggle('collapsed');
                e.stopPropagation(); // Don't trigger cart selection
            } else {
                // Otherwise, select the cart
                selectEntity('cart', cart.id);
            }
        };

        // Add the cart item to its container
        cartContainer.appendChild(cartItem);

        // Step 8: Add nested drawers if this cart has any
        if (hasDrawers) {
            // Create container for nested drawer items
            const drawersDiv = document.createElement('div');
            drawersDiv.className = 'tree-nested-items';
            drawersDiv.style.marginLeft = '20px'; // Indent drawers under cart

            // Add "Add Drawer" button for this specific cart
            const createDrawerBtn = document.createElement('div');
            createDrawerBtn.className = 'tree-item tree-nested-item';
            createDrawerBtn.style.fontStyle = 'italic';
            createDrawerBtn.style.color = '#0e639c';
            createDrawerBtn.style.fontSize = '11px';
            createDrawerBtn.innerHTML = `<span class="tree-item-icon">+</span><span class="tree-item-name">Add Drawer</span>`;

            // Handle "Add Drawer" click - creates drawer and auto-assigns to this cart
            createDrawerBtn.onclick = (e) => {
                e.stopPropagation(); // Don't trigger cart selection

                // Call the create function if it exists (still in teacher.js)
                if (typeof window.createNewDrawer === 'function') {
                    window.createNewDrawer();

                    // Auto-assign the new drawer to this cart
                    // We do this in a timeout to allow the drawer to be created first
                    setTimeout(() => {
                        const newDrawer = CONFIG.drawers[CONFIG.drawers.length - 1];
                        if (newDrawer && !newDrawer.cart) {
                            newDrawer.cart = cart.id;
                            buildHierarchy(); // Refresh to show the drawer under this cart

                            // Update inspector if available
                            if (typeof window.updateInspector === 'function') {
                                window.updateInspector();
                            }
                        }
                    }, 100);
                }
            };
            drawersDiv.appendChild(createDrawerBtn);

            // Add each drawer belonging to this cart
            cartDrawers.forEach(drawer => {
                const drawerItem = document.createElement('div');
                drawerItem.className = 'tree-item tree-nested-item';
                drawerItem.style.fontSize = '11px'; // Slightly smaller for nested items

                // Highlight drawer if it's currently selected
                if (STATE.selectedType === 'drawer' && STATE.selectedId === drawer.id) {
                    drawerItem.classList.add('selected');
                }

                drawerItem.innerHTML = `
                    <span class="tree-item-icon">🗄️</span>
                    <span class="tree-item-name">${drawer.name || drawer.id}</span>
                `;

                // Handle drawer click - select the drawer
                drawerItem.onclick = (e) => {
                    e.stopPropagation(); // Don't trigger cart selection
                    selectEntity('drawer', drawer.id);
                };

                drawersDiv.appendChild(drawerItem);
            });

            // Add the drawers container to the cart container
            cartContainer.appendChild(drawersDiv);
        }

        // Add the complete cart+drawers structure to the items container
        itemsDiv.appendChild(cartContainer);
    });

    // Step 9: Assemble the complete category node
    div.appendChild(header);
    div.appendChild(itemsDiv);

    return div;
}

/**
 * Creates a standard category node for non-cart entity types.
 *
 * This function creates a simple, flat list category for entity types
 * that don't have nested hierarchies. Used for Camera Views, Scenarios,
 * Items, and Achievements.
 *
 * Structure created:
 * ```
 * Camera Views (3)             ← Category header
 *   + Create New               ← Create button
 *   📷 Overview                ← Item
 *   📷 Detail View             ← Item
 *   📷 Side View               ← Item
 * ```
 *
 * Each category shows:
 * - Category icon and name
 * - Count of items in the category
 * - Collapse/expand control
 * - "Create New" button
 * - List of items with click-to-select
 *
 * The category configuration object should have:
 * - id: Category identifier (pluralized, e.g., 'scenarios')
 * - name: Display name (e.g., 'Scenarios')
 * - icon: Emoji or icon character (e.g., '📋')
 * - items: Array of entity objects from CONFIG
 * - createNew: Function to create a new entity of this type
 *
 * The entity type for selection is derived by removing the 's' from
 * the category id (e.g., 'scenarios' → 'scenario').
 *
 * @function createCategoryNode
 * @param {Object} category - Category configuration object
 * @param {string} category.id - Category ID (pluralized, used to derive entity type)
 * @param {string} category.name - Display name for the category
 * @param {string} category.icon - Icon/emoji to display (e.g., '📷', '📋', '📦')
 * @param {Array} category.items - Array of entity objects to display
 * @param {Function} category.createNew - Function to call when "Create New" is clicked
 * @returns {HTMLDivElement} The complete category DOM node
 *
 * @example
 * // Create a Camera Views category
 * const cameraViewsCategory = createCategoryNode({
 *   id: 'cameraviews',
 *   name: 'Camera Views',
 *   icon: '📷',
 *   items: CONFIG.cameraViews,
 *   createNew: createNewCameraView
 * });
 *
 * @example
 * // Create a Scenarios category
 * const scenariosCategory = createCategoryNode({
 *   id: 'scenarios',
 *   name: 'Scenarios',
 *   icon: '📋',
 *   items: CONFIG.scenarios,
 *   createNew: createNewScenario
 * });
 *
 * @example
 * // Entity type derivation
 * // category.id = 'scenarios' → entity type = 'scenario'
 * // category.id = 'items' → entity type = 'item'
 * // This is done by: category.id.slice(0, -1)
 *
 * @see buildHierarchy - Main function that calls this
 * @see createCartsWithDrawersNode - Creates the special Carts category
 */
export function createCategoryNode(category) {
    // Step 1: Create the main category container
    const div = document.createElement('div');
    div.className = 'tree-category';

    // Step 2: Ensure items array exists (defensive programming)
    const items = category.items || [];

    // Step 3: Create the category header with icon, name, and count
    const header = document.createElement('div');
    header.className = 'tree-category-header';
    header.innerHTML = `
        <span class="tree-category-icon">▼</span>
        <span class="tree-item-icon">${category.icon}</span>
        <span class="tree-item-name">${category.name}</span>
        <span class="tree-item-count">${items.length}</span>
    `;

    // Step 4: Make header clickable to collapse/expand
    header.onclick = () => {
        div.classList.toggle('collapsed');
    };

    // Step 5: Create container for category items
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'tree-category-items';

    // Step 6: Add "Create New" button at the top
    const createBtn = document.createElement('div');
    createBtn.className = 'tree-item';
    createBtn.style.fontStyle = 'italic';
    createBtn.style.color = '#0e639c'; // Blue color for create actions
    createBtn.innerHTML = `<span class="tree-item-icon">+</span><span class="tree-item-name">Create New</span>`;

    // Attach the create function if provided
    if (category.createNew) {
        createBtn.onclick = category.createNew;
    }
    itemsDiv.appendChild(createBtn);

    // Step 7: Add each item in the category
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tree-item';

        // Derive the entity type by removing the trailing 's' from category id
        // e.g., 'scenarios' → 'scenario', 'items' → 'item'
        const entityType = category.id.slice(0, -1);

        // Highlight the item if it's currently selected
        if (STATE.selectedType === entityType && STATE.selectedId === item.id) {
            itemDiv.classList.add('selected');
        }

        // Build the item HTML
        itemDiv.innerHTML = `
            <span class="tree-item-icon">${category.icon}</span>
            <span class="tree-item-name">${item.name || item.id}</span>
        `;

        // Handle item click - select the entity
        itemDiv.onclick = () => selectEntity(entityType, item.id);

        itemsDiv.appendChild(itemDiv);
    });

    // Step 8: Assemble the complete category node
    div.appendChild(header);
    div.appendChild(itemsDiv);

    return div;
}

// ===== HIERARCHY ACTIONS =====

/**
 * Refreshes the hierarchy tree and shows a success notification.
 *
 * This function is typically triggered by a user clicking the "Refresh"
 * button in the UI. It rebuilds the entire hierarchy tree and displays
 * a toast notification to confirm the action.
 *
 * Use cases:
 * - User wants to ensure the tree is up-to-date
 * - After batch operations on entities
 * - As a manual sync action when something seems out of sync
 *
 * The function is essentially a wrapper around buildHierarchy() that
 * adds user feedback via a success toast.
 *
 * @function refreshHierarchy
 * @returns {void}
 *
 * @example
 * // Wire up to a refresh button
 * document.getElementById('refresh-hierarchy-btn').onclick = refreshHierarchy;
 *
 * @example
 * // After a batch delete operation
 * function deleteAllEmptyDrawers() {
 *   CONFIG.drawers = CONFIG.drawers.filter(d => d.items && d.items.length > 0);
 *   refreshHierarchy(); // Rebuild and show confirmation
 * }
 *
 * @see buildHierarchy - The actual tree building function
 * @see showAlert - Displays the success toast
 */
export function refreshHierarchy() {
    // Step 1: Rebuild the hierarchy tree from current CONFIG data
    buildHierarchy();

    // Step 2: Show a success toast to confirm the refresh
    showAlert('Hierarchy refreshed', 'success');
}

/**
 * Filters the hierarchy tree based on search input.
 *
 * This function implements search/filter functionality for the hierarchy tree.
 * It reads the search term from the search input field and hides any tree items
 * that don't match the search term.
 *
 * The filter:
 * - Is case-insensitive
 * - Searches the entire text content of each item (including icons)
 * - Uses simple substring matching (indexOf)
 * - Hides non-matching items with display: none
 * - Shows all items when search is empty
 *
 * Limitations:
 * - Does NOT hide/show parent categories based on child matches
 * - Does NOT highlight matching text within items
 * - Does NOT support advanced search (regex, multiple terms, etc.)
 *
 * The function expects a search input field with id="hierarchy-search".
 *
 * Performance Note:
 * This function runs on every keypress in the search box (via oninput).
 * For very large trees (1000+ items), consider debouncing the search.
 *
 * @function filterHierarchy
 * @returns {void}
 *
 * @example
 * // Wire up to a search input
 * document.getElementById('hierarchy-search').oninput = filterHierarchy;
 *
 * @example
 * // Search behavior examples
 * // User types "trauma" → Shows: "Trauma Cart 1", "Trauma Cart 2", "Basic Trauma Scenario"
 * // User types "drawer" → Shows: "Top Drawer", "Middle Drawer", etc.
 * // User clears search → Shows: All items
 *
 * @example
 * // Manual trigger
 * filterHierarchy(); // Apply filter based on current search input value
 *
 * @todo Consider implementing:
 *   - Smart category hiding (hide category if no children match)
 *   - Match highlighting with <mark> tags
 *   - Fuzzy search or regex support
 *   - Search result count display
 */
export function filterHierarchy() {
    // Step 1: Get the search term from the input field and normalize to lowercase
    const searchTerm = document.getElementById('hierarchy-search').value.toLowerCase();

    // Step 2: Get all tree items (excluding category headers)
    const items = document.querySelectorAll('.tree-item');

    // Step 3: Loop through each item and show/hide based on match
    items.forEach(item => {
        // Get the full text content of the item (including icon text)
        const text = item.textContent.toLowerCase();

        // Show item if search term is found, hide if not
        // When searchTerm is empty, includes() returns true (show all)
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}
