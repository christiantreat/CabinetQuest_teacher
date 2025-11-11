/**
 * Main Module Index
 *
 * Central entry point for all source modules. This file re-exports all
 * functions from the persistence and UI modules, allowing for simplified
 * imports throughout the application.
 *
 * @module src/index
 * @author CabinetQuest Team
 * @version 1.0.0
 *
 * @example
 * // Instead of multiple import statements:
 * import { saveConfiguration } from './src/persistence/storage.js';
 * import { showAlert } from './src/ui/alerts.js';
 * import { updateStatusBar } from './src/ui/statusBar.js';
 *
 * // You can import everything from one place:
 * import {
 *   saveConfiguration,
 *   showAlert,
 *   updateStatusBar
 * } from './src/index.js';
 *
 * @example
 * // Or import all functions under a namespace:
 * import * as App from './src/index.js';
 *
 * App.saveConfiguration();
 * App.showAlert('Saved!', 'success');
 * App.updateStatusBar();
 */

// ===== PERSISTENCE MODULES =====

/**
 * Storage functions for localStorage operations
 * @see {@link module:persistence/storage}
 */
export {
    saveConfiguration,
    loadConfiguration,
    saveAll
} from './persistence/storage.js';

/**
 * Export functionality for configuration backup
 * @see {@link module:persistence/export}
 */
export {
    exportConfiguration
} from './persistence/export.js';

/**
 * Import functionality for configuration restoration
 * @see {@link module:persistence/import}
 */
export {
    importConfiguration,
    processImport
} from './persistence/import.js';

/**
 * Migration and validation functions
 * @see {@link module:persistence/migration}
 */
export {
    validateAndMigrateConfig,
    resetToDefaults
} from './persistence/migration.js';

// ===== CORE MODULES =====

/**
 * State management functions for entity selection
 * @see {@link module:core/state}
 */
export {
    selectEntity,
    deselectEntity,
    getEntity
} from './core/state.js';

/**
 * History management for undo/redo functionality
 * @see {@link module:core/history}
 */
export {
    HISTORY,
    recordAction,
    undo,
    redo,
    canUndo,
    canRedo
} from './core/history.js';

// ===== UI MODULES =====

/**
 * Alert and modal management functions
 * @see {@link module:ui/alerts}
 */
export {
    showAlert,
    closeModal
} from './ui/alerts.js';

/**
 * Status bar update functions
 * @see {@link module:ui/statusBar}
 */
export {
    updateStatusBar
} from './ui/statusBar.js';

/**
 * Hierarchy tree building and management
 * @see {@link module:ui/hierarchy}
 */
export {
    buildHierarchy,
    createCartsWithDrawersNode,
    createCategoryNode,
    refreshHierarchy,
    filterHierarchy
} from './ui/hierarchy.js';

/**
 * Module Organization
 * ===================
 *
 * This index provides a flat namespace for all exported functions.
 * Functions are organized into three main categories:
 *
 * Core Functions (core/*)
 * ------------------------
 * Handle core application state and business logic.
 *
 * State Management (core/state):
 * - selectEntity() - Select an entity and update UI
 * - deselectEntity() - Clear current selection
 * - getEntity() - Retrieve an entity by type and ID
 *
 * History Management (core/history):
 * - HISTORY - Undo/redo state object
 * - recordAction() - Record an action for undo
 * - undo() - Undo the last action
 * - redo() - Redo the last undone action
 * - canUndo() - Check if undo is available
 * - canRedo() - Check if redo is available
 *
 * Persistence Functions (persistence/*)
 * --------------------------------------
 * Handle all data operations including saving, loading, importing,
 * exporting, and migrating configurations.
 *
 * - saveConfiguration() - Save to localStorage
 * - loadConfiguration() - Load from localStorage
 * - saveAll() - Save with UI feedback
 * - exportConfiguration() - Export to JSON file
 * - importConfiguration() - Open import dialog
 * - processImport() - Process imported file
 * - validateAndMigrateConfig() - Validate and migrate config
 * - resetToDefaults() - Reset to factory defaults
 *
 * UI Functions (ui/*)
 * -------------------
 * Handle user interface updates and notifications.
 *
 * Alerts (ui/alerts):
 * - showAlert() - Display toast notification
 * - closeModal() - Close modal dialog
 *
 * Status Bar (ui/statusBar):
 * - updateStatusBar() - Update status counters
 *
 * Hierarchy Tree (ui/hierarchy):
 * - buildHierarchy() - Build complete hierarchy tree
 * - createCartsWithDrawersNode() - Create carts category with nested drawers
 * - createCategoryNode() - Create standard category node
 * - refreshHierarchy() - Refresh tree and show feedback
 * - filterHierarchy() - Filter tree based on search
 *
 * Usage Patterns
 * ==============
 *
 * Pattern 1: Named Imports (Recommended)
 * ----------------------------------------
 * @example
 * import {
 *   saveConfiguration,
 *   loadConfiguration,
 *   showAlert
 * } from './src/index.js';
 *
 * loadConfiguration();
 * CONFIG.carts.push(newCart);
 * saveConfiguration();
 * showAlert('Cart added', 'success');
 *
 * Pattern 2: Namespace Import
 * ----------------------------
 * @example
 * import * as App from './src/index.js';
 *
 * App.loadConfiguration();
 * CONFIG.carts.push(newCart);
 * App.saveConfiguration();
 * App.showAlert('Cart added', 'success');
 *
 * Pattern 3: Individual Module Imports
 * -------------------------------------
 * For when you only need specific modules:
 *
 * @example
 * import * as Storage from './src/persistence/storage.js';
 * import * as Alerts from './src/ui/alerts.js';
 *
 * Storage.saveConfiguration();
 * Alerts.showAlert('Saved', 'success');
 *
 * Benefits of Using index.js
 * ==========================
 *
 * 1. Simplified Imports
 *    - Single import statement for multiple functions
 *    - No need to remember individual module paths
 *
 * 2. Easier Refactoring
 *    - Move functions between modules without updating all imports
 *    - Maintain stable public API
 *
 * 3. Better Tree Shaking
 *    - Modern bundlers can remove unused exports
 *    - Only ship code that's actually used
 *
 * 4. Cleaner Code
 *    - Less import clutter at top of files
 *    - More readable and maintainable
 *
 * Migration from teacher.js
 * ==========================
 *
 * Old pattern in teacher.js:
 * @example
 * // Functions defined directly in teacher.js
 * function saveConfiguration() { ... }
 * function showAlert() { ... }
 * function updateStatusBar() { ... }
 *
 * // Used directly
 * saveConfiguration();
 * showAlert('Done', 'success');
 *
 * New pattern with modules:
 * @example
 * // At top of teacher.js
 * import {
 *   saveConfiguration,
 *   showAlert,
 *   updateStatusBar
 * } from './src/index.js';
 *
 * // Used the same way (no changes to call sites)
 * saveConfiguration();
 * showAlert('Done', 'success');
 */
