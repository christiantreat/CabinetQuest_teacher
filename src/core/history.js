/**
 * History Management Module
 *
 * This module implements a comprehensive undo/redo system for the game designer tool.
 * It tracks all user actions and allows reverting or reapplying changes.
 *
 * The system uses two stacks:
 * - undoStack: Stores actions that can be undone
 * - redoStack: Stores actions that have been undone and can be redone
 *
 * Supported action types:
 * - CREATE/DELETE operations for carts, drawers, and items
 * - MOVE operations for cart positioning and rotation
 * - UPDATE operations for properties of any entity type
 *
 * Each action stores both the new state and old state to enable bidirectional navigation.
 */

// Note: This module depends on external functions from other modules:
// - buildHierarchy() - Rebuilds the UI hierarchy after data changes
// - drawCanvas() - Redraws the 2D canvas after visual changes
// - buildAll3DCarts() - Rebuilds the 3D scene after cart/drawer changes
// These dependencies will be injected when integrating into the modular system.

import { CONFIG, STATE } from '../config/config.js';

// ===== UNDO/REDO SYSTEM =====

/**
 * History state object containing undo/redo stacks and metadata.
 *
 * @type {Object}
 * @property {Array} undoStack - Stack of actions that can be undone
 * @property {Array} redoStack - Stack of actions that can be redone
 * @property {number} maxHistorySize - Maximum number of actions to keep in history
 * @property {boolean} isPerformingAction - Flag to prevent recording during undo/redo operations
 */
export const HISTORY = {
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50,
    isPerformingAction: false // Flag to prevent recording during undo/redo
};

/**
 * Records a user action for undo/redo functionality.
 * Creates a deep clone of the action data and adds it to the undo stack.
 * Clears the redo stack since new actions invalidate previously undone actions.
 *
 * @param {string} actionType - Type of action (e.g., 'CREATE_CART', 'MOVE_CART', 'UPDATE_CART_PROPERTY')
 * @param {Object} data - Action data containing necessary information to undo/redo the action
 * @param {string} [data.cartId] - Cart ID for cart-related actions
 * @param {string} [data.drawerId] - Drawer ID for drawer-related actions
 * @param {string} [data.itemId] - Item ID for item-related actions
 * @param {Object} [data.cart] - Complete cart object for CREATE/DELETE operations
 * @param {Object} [data.drawer] - Complete drawer object for CREATE/DELETE operations
 * @param {Object} [data.item] - Complete item object for CREATE/DELETE operations
 * @param {Object} [data.oldPosition] - Previous position for MOVE operations
 * @param {Object} [data.newPosition] - New position for MOVE operations
 * @param {string} [data.property] - Property name for UPDATE operations
 * @param {*} [data.oldValue] - Previous value for UPDATE operations
 * @param {*} [data.newValue] - New value for UPDATE operations
 *
 * @example
 * // Record a cart creation
 * recordAction('CREATE_CART', { cart: newCart });
 *
 * @example
 * // Record a property update
 * recordAction('UPDATE_CART_PROPERTY', {
 *   cartId: 'cart-123',
 *   property: 'name',
 *   oldValue: 'Old Name',
 *   newValue: 'New Name'
 * });
 */
export function recordAction(actionType, data) {
    // Don't record if we're performing an undo/redo
    if (HISTORY.isPerformingAction) return;

    const action = {
        type: actionType,
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(data)) // Deep clone to prevent reference issues
    };

    HISTORY.undoStack.push(action);

    // Limit history size to prevent memory issues
    if (HISTORY.undoStack.length > HISTORY.maxHistorySize) {
        HISTORY.undoStack.shift();
    }

    // Clear redo stack when new action is performed
    // New actions create a new timeline branch
    HISTORY.redoStack = [];

    updateUndoRedoButtons();
    STATE.unsavedChanges = true;
}

/**
 * Checks if there are actions available to undo.
 *
 * @returns {boolean} True if there are actions in the undo stack
 *
 * @example
 * // Check if undo is available
 * if (canUndo()) {
 *   undo();
 * }
 */
export function canUndo() {
    return HISTORY.undoStack.length > 0;
}

/**
 * Checks if there are actions available to redo.
 *
 * @returns {boolean} True if there are actions in the redo stack
 *
 * @example
 * // Check if redo is available
 * if (canRedo()) {
 *   redo();
 * }
 */
export function canRedo() {
    return HISTORY.redoStack.length > 0;
}

/**
 * Undoes the last action on the undo stack.
 * Moves the action to the redo stack and applies its reverse.
 * Sets the isPerformingAction flag to prevent recursive recording.
 *
 * @example
 * // Undo the last action
 * undo();
 */
export function undo() {
    if (HISTORY.undoStack.length === 0) return;

    HISTORY.isPerformingAction = true;

    const action = HISTORY.undoStack.pop();
    HISTORY.redoStack.push(action);

    applyReverseAction(action);

    HISTORY.isPerformingAction = false;
    updateUndoRedoButtons();
    STATE.unsavedChanges = true;
}

/**
 * Redoes the last undone action from the redo stack.
 * Moves the action back to the undo stack and reapplies it.
 * Sets the isPerformingAction flag to prevent recursive recording.
 *
 * @example
 * // Redo the last undone action
 * redo();
 */
export function redo() {
    if (HISTORY.redoStack.length === 0) return;

    HISTORY.isPerformingAction = true;

    const action = HISTORY.redoStack.pop();
    HISTORY.undoStack.push(action);

    applyAction(action);

    HISTORY.isPerformingAction = false;
    updateUndoRedoButtons();
    STATE.unsavedChanges = true;
}

/**
 * Applies an action forward (used for redo operations).
 * Modifies the CONFIG state to reapply the action and updates all relevant views.
 *
 * @param {Object} action - The action object to apply
 * @param {string} action.type - Type of action to apply
 * @param {Object} action.data - Action-specific data
 *
 * @private
 */
export function applyAction(action) {
    switch (action.type) {
        case 'CREATE_CART':
            CONFIG.carts.push(action.data.cart);
            buildHierarchy();
            drawCanvas();
            buildAll3DCarts();
            break;

        case 'DELETE_CART':
            const cartIndex = CONFIG.carts.findIndex(c => c.id === action.data.cartId);
            if (cartIndex !== -1) {
                CONFIG.carts.splice(cartIndex, 1);
                // Also delete related drawers
                CONFIG.drawers = CONFIG.drawers.filter(d => d.cart !== action.data.cartId);
                buildHierarchy();
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'MOVE_CART':
            const movedCart = CONFIG.carts.find(c => c.id === action.data.cartId);
            if (movedCart) {
                movedCart.x = action.data.newPosition.x;
                movedCart.y = action.data.newPosition.y;
                if (action.data.newPosition.rotation !== undefined) {
                    movedCart.rotation = action.data.newPosition.rotation;
                }
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'UPDATE_CART_PROPERTY':
            const updatedCart = CONFIG.carts.find(c => c.id === action.data.cartId);
            if (updatedCart) {
                updatedCart[action.data.property] = action.data.newValue;
                buildHierarchy();
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'CREATE_DRAWER':
            CONFIG.drawers.push(action.data.drawer);
            buildHierarchy();
            buildAll3DCarts();
            break;

        case 'DELETE_DRAWER':
            const drawerIndex = CONFIG.drawers.findIndex(d => d.id === action.data.drawerId);
            if (drawerIndex !== -1) {
                CONFIG.drawers.splice(drawerIndex, 1);
                buildHierarchy();
                buildAll3DCarts();
            }
            break;

        case 'CREATE_ITEM':
            CONFIG.items.push(action.data.item);
            buildHierarchy();
            break;

        case 'DELETE_ITEM':
            const itemIndex = CONFIG.items.findIndex(i => i.id === action.data.itemId);
            if (itemIndex !== -1) {
                CONFIG.items.splice(itemIndex, 1);
                buildHierarchy();
            }
            break;

        case 'UPDATE_DRAWER_PROPERTY':
            const updatedDrawer = CONFIG.drawers.find(d => d.id === action.data.drawerId);
            if (updatedDrawer) {
                updatedDrawer[action.data.property] = action.data.newValue;
                buildHierarchy();
            }
            break;

        case 'UPDATE_ITEM_PROPERTY':
            const updatedItem = CONFIG.items.find(i => i.id === action.data.itemId);
            if (updatedItem) {
                updatedItem[action.data.property] = action.data.newValue;
                buildHierarchy();
            }
            break;

        case 'UPDATE_SCENARIO_PROPERTY':
            const updatedScenario = CONFIG.scenarios.find(s => s.id === action.data.scenarioId);
            if (updatedScenario) {
                updatedScenario[action.data.property] = action.data.newValue;
                buildHierarchy();
            }
            break;

        case 'UPDATE_ACHIEVEMENT_PROPERTY':
            const updatedAchievement = CONFIG.achievements.find(a => a.id === action.data.achievementId);
            if (updatedAchievement) {
                updatedAchievement[action.data.property] = action.data.newValue;
                buildHierarchy();
            }
            break;

        case 'UPDATE_CAMERAVIEW_PROPERTY':
            const updatedView = CONFIG.cameraViews.find(v => v.id === action.data.viewId);
            if (updatedView) {
                updatedView[action.data.property] = action.data.newValue;
                buildHierarchy();
            }
            break;
    }
}

/**
 * Applies the reverse of an action (used for undo operations).
 * Modifies the CONFIG state to revert the action and updates all relevant views.
 *
 * @param {Object} action - The action object to reverse
 * @param {string} action.type - Type of action to reverse
 * @param {Object} action.data - Action-specific data containing old values
 *
 * @private
 */
export function applyReverseAction(action) {
    switch (action.type) {
        case 'CREATE_CART':
            // Reverse of create is delete
            const cartIndex = CONFIG.carts.findIndex(c => c.id === action.data.cart.id);
            if (cartIndex !== -1) {
                CONFIG.carts.splice(cartIndex, 1);
                // Also delete related drawers
                CONFIG.drawers = CONFIG.drawers.filter(d => d.cart !== action.data.cart.id);
                buildHierarchy();
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'DELETE_CART':
            // Reverse of delete is create - restore the cart and its drawers
            CONFIG.carts.push(action.data.cart);
            // Restore drawers
            if (action.data.drawers) {
                CONFIG.drawers.push(...action.data.drawers);
            }
            buildHierarchy();
            drawCanvas();
            buildAll3DCarts();
            break;

        case 'MOVE_CART':
            // Restore the old position
            const movedCart = CONFIG.carts.find(c => c.id === action.data.cartId);
            if (movedCart) {
                movedCart.x = action.data.oldPosition.x;
                movedCart.y = action.data.oldPosition.y;
                if (action.data.oldPosition.rotation !== undefined) {
                    movedCart.rotation = action.data.oldPosition.rotation;
                }
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'UPDATE_CART_PROPERTY':
            // Restore the old property value
            const updatedCart = CONFIG.carts.find(c => c.id === action.data.cartId);
            if (updatedCart) {
                updatedCart[action.data.property] = action.data.oldValue;
                buildHierarchy();
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'CREATE_DRAWER':
            // Reverse of create is delete
            const drawerIndex = CONFIG.drawers.findIndex(d => d.id === action.data.drawer.id);
            if (drawerIndex !== -1) {
                CONFIG.drawers.splice(drawerIndex, 1);
                buildHierarchy();
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'DELETE_DRAWER':
            // Reverse of delete is create - restore the drawer
            CONFIG.drawers.push(action.data.drawer);
            buildHierarchy();
            drawCanvas();
            buildAll3DCarts();
            break;

        case 'CREATE_ITEM':
            // Reverse of create is delete
            const itemIndex = CONFIG.items.findIndex(i => i.id === action.data.item.id);
            if (itemIndex !== -1) {
                CONFIG.items.splice(itemIndex, 1);
                buildHierarchy();
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'DELETE_ITEM':
            // Reverse of delete is create - restore the item
            CONFIG.items.push(action.data.item);
            buildHierarchy();
            drawCanvas();
            buildAll3DCarts();
            break;

        case 'UPDATE_DRAWER_PROPERTY':
            // Restore the old property value
            const updatedDrawer = CONFIG.drawers.find(d => d.id === action.data.drawerId);
            if (updatedDrawer) {
                updatedDrawer[action.data.property] = action.data.oldValue;
                buildHierarchy();
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'UPDATE_ITEM_PROPERTY':
            // Restore the old property value
            const updatedItem = CONFIG.items.find(i => i.id === action.data.itemId);
            if (updatedItem) {
                updatedItem[action.data.property] = action.data.oldValue;
                buildHierarchy();
                drawCanvas();
                buildAll3DCarts();
            }
            break;

        case 'UPDATE_SCENARIO_PROPERTY':
            // Restore the old property value
            const updatedScenario = CONFIG.scenarios.find(s => s.id === action.data.scenarioId);
            if (updatedScenario) {
                updatedScenario[action.data.property] = action.data.oldValue;
                buildHierarchy();
            }
            break;

        case 'UPDATE_ACHIEVEMENT_PROPERTY':
            // Restore the old property value
            const updatedAchievement = CONFIG.achievements.find(a => a.id === action.data.achievementId);
            if (updatedAchievement) {
                updatedAchievement[action.data.property] = action.data.oldValue;
                buildHierarchy();
            }
            break;

        case 'UPDATE_CAMERAVIEW_PROPERTY':
            // Restore the old property value
            const updatedView = CONFIG.cameraViews.find(v => v.id === action.data.viewId);
            if (updatedView) {
                updatedView[action.data.property] = action.data.oldValue;
                buildHierarchy();
            }
            break;
    }
}

/**
 * Updates the enabled/disabled state and tooltips of undo/redo buttons.
 * Buttons are disabled when their respective stacks are empty.
 * Tooltips show the number of available actions.
 *
 * @example
 * // After recording an action
 * recordAction('CREATE_CART', data);
 * updateUndoRedoButtons(); // Undo button becomes enabled
 */
export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');

    if (undoBtn) {
        undoBtn.disabled = HISTORY.undoStack.length === 0;
        undoBtn.title = HISTORY.undoStack.length > 0
            ? `Undo (${HISTORY.undoStack.length} actions)`
            : 'Nothing to undo';
    }

    if (redoBtn) {
        redoBtn.disabled = HISTORY.redoStack.length === 0;
        redoBtn.title = HISTORY.redoStack.length > 0
            ? `Redo (${HISTORY.redoStack.length} actions)`
            : 'Nothing to redo';
    }
}

/**
 * Sets up keyboard shortcuts for undo/redo operations.
 * Registers global keydown listener for:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 *
 * Should be called during application initialization.
 *
 * @example
 * // During app initialization
 * setupUndoRedoKeyboard();
 */
export function setupUndoRedoKeyboard() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z or Cmd+Z for undo (without Shift)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z for redo
        else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        }
    });

    console.log('✓ Undo/Redo keyboard shortcuts enabled (Ctrl+Z, Ctrl+Y)');
}
