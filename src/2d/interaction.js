/**
 * @fileoverview 2D Canvas Mouse Interaction Module
 *
 * This module handles all mouse interactions with the 2D canvas including:
 * - Cart selection via mouse clicks
 * - Cart dragging and repositioning
 * - Grid snapping during drag operations
 * - Boundary constraints to keep carts within room bounds
 *
 * The interaction system uses a simple state machine:
 * 1. Mouse Down: Check for cart hit, initiate drag if found
 * 2. Mouse Move: Update dragged cart position if dragging
 * 3. Mouse Up: Complete drag operation
 *
 * All position calculations work with normalized coordinates (0-1)
 * where (0.5, 0.5) represents the room center.
 *
 * @module src/2d/interaction
 * @requires teacher.js (globals: CONFIG, STATE, CART_TYPES, canvas)
 */

/**
 * Handle mouse down event on canvas
 *
 * Processes mouse clicks on the canvas to:
 * - Detect if a cart was clicked (hit testing)
 * - Initiate drag operation if cart was clicked
 * - Select the clicked cart
 * - Deselect if clicking on empty space
 *
 * Hit testing:
 * - Converts mouse position to normalized coordinates
 * - Checks each cart's bounding box
 * - Accounts for cart dimensions from CART_TYPES
 * - Selects first cart found under cursor
 *
 * Only active in 'room' canvas mode - no interaction in 'overview' mode.
 *
 * @function handleCanvasMouseDown
 * @param {MouseEvent} e - Mouse event object
 * @requires STATE.canvasMode - Current canvas mode
 * @requires CONFIG.carts - Array of cart objects
 * @requires CART_TYPES - Cart dimension definitions
 * @requires selectEntity - Function to select a cart (from teacher.js)
 * @requires deselectEntity - Function to deselect current selection (from teacher.js)
 *
 * @example
 * // Attach to canvas element
 * canvas.addEventListener('mousedown', handleCanvasMouseDown);
 *
 * @see {@link handleCanvasMouseMove} for drag handling
 * @see {@link handleCanvasMouseUp} for drag completion
 */
export function handleCanvasMouseDown(e) {
    const canvasMode = window.STATE?.canvasMode;

    // Only handle interactions in room mode
    if (canvasMode !== 'room') return;

    const canvas = document.getElementById('room-canvas');
    if (!canvas) return;

    // Calculate click position in normalized coordinates (0-1)
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / canvas.width;
    const clickY = (e.clientY - rect.top) / canvas.height;

    // Check if clicking on a cart (iterate in reverse for top-to-bottom hit testing)
    const carts = window.CONFIG?.carts || [];
    const cartTypes = window.CART_TYPES || {};
    const pixelsPerFoot = window.CONFIG?.roomSettings?.pixelsPerFoot || 10;

    for (let i = carts.length - 1; i >= 0; i--) {
        const cart = carts[i];

        // Get cart dimensions
        const cartType = cartTypes[cart.type] || cartTypes.crash || { width: 2, depth: 1.5 };

        // Calculate cart's bounding box in normalized coordinates
        const sizeX = (cartType.width * pixelsPerFoot) / canvas.width;
        const sizeY = (cartType.depth * pixelsPerFoot) / canvas.height;

        // Check if click is within cart bounds
        if (
            Math.abs(clickX - cart.x) < sizeX / 2 &&
            Math.abs(clickY - cart.y) < sizeY / 2
        ) {
            // Cart was clicked - start dragging
            if (window.STATE) {
                window.STATE.draggedCart = cart;
            }

            // Select this cart
            if (window.selectEntity) {
                window.selectEntity('cart', cart.id);
            }

            return;
        }
    }

    // Clicking on empty space - deselect current selection
    if (window.deselectEntity) {
        window.deselectEntity();
    }
}

/**
 * Handle mouse move event on canvas
 *
 * Updates the position of a cart being dragged by the user.
 * Features:
 * - Updates cart position in real-time during drag
 * - Applies grid snapping if enabled
 * - Constrains cart to canvas boundaries
 * - Marks document as having unsaved changes
 * - Triggers canvas redraw to show updated position
 * - Updates inspector panel with new coordinates
 *
 * Grid Snapping:
 * - If STATE.snapToGrid is true, position snaps to grid
 * - Grid size is defined by STATE.gridSize (in feet)
 * - Snapping is applied in normalized coordinate space
 *
 * Boundary Constraints:
 * - Cart position is clamped between 0.1 and 0.9
 * - Prevents cart from going off-canvas
 * - Leaves margin at edges for visibility
 *
 * @function handleCanvasMouseMove
 * @param {MouseEvent} e - Mouse event object
 * @requires STATE.draggedCart - Currently dragged cart object (null if not dragging)
 * @requires STATE.snapToGrid - Whether grid snapping is enabled
 * @requires STATE.gridSize - Grid spacing in feet
 * @requires CONFIG.roomSettings.pixelsPerFoot - Scale factor
 * @requires drawCanvas - Function to redraw canvas (from drawing.js)
 * @requires updateInspector - Function to update inspector panel (from teacher.js)
 *
 * @example
 * // Attach to canvas element
 * canvas.addEventListener('mousemove', handleCanvasMouseMove);
 *
 * @see {@link handleCanvasMouseDown} for drag initiation
 * @see {@link handleCanvasMouseUp} for drag completion
 */
export function handleCanvasMouseMove(e) {
    const draggedCart = window.STATE?.draggedCart;

    // Only process if actively dragging a cart
    if (!draggedCart) return;

    const canvas = document.getElementById('room-canvas');
    if (!canvas) return;

    // Calculate new position in normalized coordinates
    const rect = canvas.getBoundingClientRect();
    let newX = (e.clientX - rect.left) / canvas.width;
    let newY = (e.clientY - rect.top) / canvas.height;

    // Apply grid snapping if enabled
    if (window.STATE?.snapToGrid) {
        const gridSize = window.STATE.gridSize || 1;
        const pixelsPerFoot = window.CONFIG?.roomSettings?.pixelsPerFoot || 10;

        // Calculate grid size in normalized coordinates
        const gridSizeX = (gridSize * pixelsPerFoot) / canvas.width;
        const gridSizeY = (gridSize * pixelsPerFoot) / canvas.height;

        // Snap to nearest grid intersection
        newX = Math.round(newX / gridSizeX) * gridSizeX;
        newY = Math.round(newY / gridSizeY) * gridSizeY;
    }

    // Clamp to canvas bounds (with margin)
    // Using 0.1-0.9 range keeps cart away from edges
    draggedCart.x = Math.max(0.1, Math.min(0.9, newX));
    draggedCart.y = Math.max(0.1, Math.min(0.9, newY));

    // Mark as having unsaved changes
    if (window.STATE) {
        window.STATE.unsavedChanges = true;
    }

    // Redraw canvas to show new position
    if (window.drawCanvas) {
        window.drawCanvas();
    }

    // Update inspector panel with new coordinates
    if (window.updateInspector) {
        window.updateInspector();
    }
}

/**
 * Handle mouse up event on canvas
 *
 * Completes a cart drag operation by:
 * - Clearing the draggedCart reference
 * - Ending the drag state
 *
 * This function is called both on mouseup (normal completion)
 * and mouseleave (cursor leaving canvas area) to ensure the
 * drag state is always properly cleaned up.
 *
 * Note: The cart position has already been updated during mousemove,
 * so this function only needs to clear the drag state.
 *
 * @function handleCanvasMouseUp
 * @requires STATE.draggedCart - Currently dragged cart object
 *
 * @example
 * // Attach to canvas element
 * canvas.addEventListener('mouseup', handleCanvasMouseUp);
 * canvas.addEventListener('mouseleave', handleCanvasMouseUp);
 *
 * @see {@link handleCanvasMouseDown} for drag initiation
 * @see {@link handleCanvasMouseMove} for position updates
 */
export function handleCanvasMouseUp() {
    // Clear drag state
    if (window.STATE) {
        window.STATE.draggedCart = null;
    }
}

/**
 * Check if a point intersects with a cart
 *
 * Utility function to perform hit testing on a cart.
 * Checks if a point (in normalized coordinates) is within
 * the cart's bounding box.
 *
 * @function isPointInCart
 * @param {number} x - Point X coordinate (normalized 0-1)
 * @param {number} y - Point Y coordinate (normalized 0-1)
 * @param {Object} cart - Cart object to test
 * @param {number} cart.x - Cart X position (normalized)
 * @param {number} cart.y - Cart Y position (normalized)
 * @param {string} cart.type - Cart type for dimension lookup
 * @returns {boolean} True if point is within cart bounds
 *
 * @example
 * const isHit = isPointInCart(0.5, 0.5, myCart);
 * if (isHit) {
 *   console.log('Cart was clicked!');
 * }
 */
export function isPointInCart(x, y, cart) {
    const canvas = document.getElementById('room-canvas');
    if (!canvas) return false;

    const cartTypes = window.CART_TYPES || {};
    const cartType = cartTypes[cart.type] || cartTypes.crash || { width: 2, depth: 1.5 };
    const pixelsPerFoot = window.CONFIG?.roomSettings?.pixelsPerFoot || 10;

    // Calculate cart bounding box in normalized coordinates
    const sizeX = (cartType.width * pixelsPerFoot) / canvas.width;
    const sizeY = (cartType.depth * pixelsPerFoot) / canvas.height;

    // Check if point is within bounds
    return (
        Math.abs(x - cart.x) < sizeX / 2 &&
        Math.abs(y - cart.y) < sizeY / 2
    );
}

/**
 * Get cart at mouse position
 *
 * Finds which cart (if any) is under the cursor at the given position.
 * Returns the top-most cart if multiple carts overlap.
 *
 * @function getCartAtPosition
 * @param {number} x - Mouse X coordinate (normalized 0-1)
 * @param {number} y - Mouse Y coordinate (normalized 0-1)
 * @returns {Object|null} Cart object at position, or null if none found
 *
 * @example
 * const cart = getCartAtPosition(0.5, 0.5);
 * if (cart) {
 *   console.log('Found cart:', cart.name);
 * }
 */
export function getCartAtPosition(x, y) {
    const carts = window.CONFIG?.carts || [];

    // Iterate in reverse for top-to-bottom hit testing
    for (let i = carts.length - 1; i >= 0; i--) {
        const cart = carts[i];
        if (isPointInCart(x, y, cart)) {
            return cart;
        }
    }

    return null;
}

/**
 * Convert mouse event to normalized coordinates
 *
 * Utility function to convert a mouse event's pixel coordinates
 * to normalized canvas coordinates (0-1).
 *
 * @function mouseEventToNormalized
 * @param {MouseEvent} e - Mouse event object
 * @returns {{x: number, y: number}} Normalized coordinates
 *
 * @example
 * canvas.addEventListener('click', (e) => {
 *   const {x, y} = mouseEventToNormalized(e);
 *   console.log(`Clicked at ${x}, ${y}`);
 * });
 */
export function mouseEventToNormalized(e) {
    const canvas = document.getElementById('room-canvas');
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / canvas.width,
        y: (e.clientY - rect.top) / canvas.height
    };
}

/**
 * Convert normalized coordinates to feet
 *
 * Converts normalized canvas coordinates (0-1) to feet
 * relative to the room center.
 *
 * @function normalizedToFeet
 * @param {number} normX - Normalized X coordinate (0-1)
 * @param {number} normY - Normalized Y coordinate (0-1)
 * @returns {{x: number, y: number}} Coordinates in feet from room center
 *
 * @example
 * const feet = normalizedToFeet(0.75, 0.5);
 * console.log(`Position: ${feet.x}ft, ${feet.y}ft`);
 */
export function normalizedToFeet(normX, normY) {
    const roomWidth = window.CONFIG?.roomSettings?.width || 20;
    const roomDepth = window.CONFIG?.roomSettings?.depth || 15;

    return {
        x: (normX - 0.5) * roomWidth,
        y: (normY - 0.5) * roomDepth
    };
}

/**
 * Convert feet coordinates to normalized
 *
 * Converts feet coordinates (relative to room center) back to
 * normalized canvas coordinates (0-1).
 *
 * @function feetToNormalized
 * @param {number} feetX - X coordinate in feet from room center
 * @param {number} feetY - Y coordinate in feet from room center
 * @returns {{x: number, y: number}} Normalized coordinates (0-1)
 *
 * @example
 * const norm = feetToNormalized(5, -2.5);
 * console.log(`Normalized: ${norm.x}, ${norm.y}`);
 */
export function feetToNormalized(feetX, feetY) {
    const roomWidth = window.CONFIG?.roomSettings?.width || 20;
    const roomDepth = window.CONFIG?.roomSettings?.depth || 15;

    return {
        x: feetX / roomWidth + 0.5,
        y: feetY / roomDepth + 0.5
    };
}
