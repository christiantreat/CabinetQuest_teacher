/**
 * @fileoverview 2D Canvas Drawing and Rendering Module
 *
 * This module contains all the rendering functions for the 2D canvas view,
 * including the main draw loop, room layout rendering, grid visualization,
 * cart drawing, and overview statistics display.
 *
 * The module supports two main rendering modes:
 * 1. Room Mode: Top-down view of the room layout with carts and grid
 * 2. Overview Mode: Statistics dashboard showing project metrics
 *
 * All drawing operations use a coordinate system where:
 * - Canvas coordinates are in pixels
 * - Normalized coordinates are 0-1 (where 0.5, 0.5 is center)
 * - Feet coordinates are relative to room center (0, 0)
 *
 * @module src/2d/drawing
 * @requires teacher.js (globals: CONFIG, STATE, canvas, ctx, CART_TYPES)
 */

/**
 * Main canvas drawing coordinator
 *
 * This is the primary entry point for rendering the 2D canvas. It delegates
 * to the appropriate rendering function based on the current canvas mode.
 *
 * @function drawCanvas
 * @requires window.STATE.canvasMode - Current canvas display mode ('room' or 'overview')
 *
 * @example
 * // Render the canvas based on current mode
 * drawCanvas();
 *
 * @see {@link drawRoomCanvas} for room layout rendering
 * @see {@link drawOverviewCanvas} for overview statistics rendering
 */
export function drawCanvas() {
    const canvasMode = window.STATE?.canvasMode || 'room';

    if (canvasMode === 'room') {
        drawRoomCanvas();
    } else {
        drawOverviewCanvas();
    }
}

/**
 * Draw the room layout view
 *
 * Renders the top-down 2D view of the room including:
 * - Background color
 * - Optional grid overlay
 * - All carts positioned in the room
 * - Selection highlighting for the active cart
 *
 * The rendering order ensures proper layering:
 * 1. Background (solid color fill)
 * 2. Grid (if enabled)
 * 3. Carts (with selected cart highlighted)
 *
 * @function drawRoomCanvas
 * @requires canvas - Canvas DOM element
 * @requires ctx - 2D rendering context
 * @requires window.CONFIG.roomSettings.backgroundColor - Room background color
 * @requires window.CONFIG.carts - Array of cart objects to render
 * @requires window.STATE.selectedType - Currently selected entity type
 * @requires window.STATE.selectedId - Currently selected entity ID
 *
 * @example
 * // Render the room layout view
 * drawRoomCanvas();
 *
 * @see {@link drawGrid} for grid rendering details
 * @see {@link drawCart} for cart rendering details
 */
export function drawRoomCanvas() {
    const canvas = document.getElementById('room-canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    const backgroundColor = window.CONFIG?.roomSettings?.backgroundColor || '#fafafa';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    const showGridCheckbox = document.getElementById('show-grid');
    if (showGridCheckbox?.checked) {
        drawGrid();
    }

    // Draw all carts
    const carts = window.CONFIG?.carts || [];
    const selectedType = window.STATE?.selectedType;
    const selectedId = window.STATE?.selectedId;

    carts.forEach(cart => {
        const isSelected = selectedType === 'cart' && selectedId === cart.id;
        drawCart(cart, isSelected);
    });
}

/**
 * Draw grid overlay on canvas
 *
 * Renders a grid pattern over the canvas to assist with cart positioning.
 * The grid size is configurable and can be used with snap-to-grid functionality.
 *
 * Grid characteristics:
 * - Grid lines are semi-transparent gray
 * - Grid spacing is based on window.STATE.gridSize (in feet)
 * - Automatically scales with room dimensions
 * - Covers entire canvas area
 *
 * @function drawGrid
 * @requires canvas - Canvas DOM element
 * @requires ctx - 2D rendering context
 * @requires window.STATE.gridSize - Grid spacing in feet
 * @requires window.CONFIG.roomSettings.pixelsPerFoot - Scale factor for conversion
 *
 * @example
 * // Draw a grid with current settings
 * drawGrid();
 */
export function drawGrid() {
    const canvas = document.getElementById('room-canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Grid styling
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.lineWidth = 1;

    // Calculate grid size in pixels
    const gridSize = window.STATE?.gridSize || 1;
    const pixelsPerFoot = window.CONFIG?.roomSettings?.pixelsPerFoot || 10;
    const gridSizePixels = gridSize * pixelsPerFoot;

    // Draw vertical grid lines
    for (let x = 0; x <= canvas.width; x += gridSizePixels) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y <= canvas.height; y += gridSizePixels) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

/**
 * Draw a single cart on the canvas
 *
 * Renders a cart at its position with the following elements:
 * - Selection highlight (if cart is selected)
 * - Cart body (colored rectangle)
 * - Cart border
 * - Cart name label
 * - Cart ID label
 * - Dimensions and position info (if selected)
 *
 * Cart positioning:
 * - Cart position is stored in normalized coordinates (0-1)
 * - Position (0.5, 0.5) is the room center
 * - Cart dimensions come from CART_TYPES definition
 * - Rendered dimensions account for pixels-per-foot scale
 *
 * @function drawCart
 * @param {Object} cart - Cart object to render
 * @param {string} cart.id - Unique cart identifier
 * @param {string} cart.name - Display name for the cart
 * @param {string} cart.type - Cart type (maps to CART_TYPES)
 * @param {number} cart.x - Normalized X position (0-1)
 * @param {number} cart.y - Normalized Y position (0-1)
 * @param {string} cart.color - Cart color (hex or CSS color)
 * @param {boolean} isSelected - Whether this cart is currently selected
 *
 * @example
 * // Draw a selected cart
 * const cart = {
 *   id: 'cart-1',
 *   name: 'Crash Cart',
 *   type: 'crash',
 *   x: 0.5,
 *   y: 0.5,
 *   color: '#ff0000'
 * };
 * drawCart(cart, true);
 *
 * @see {@link CART_TYPES} for cart dimension definitions
 */
export function drawCart(cart, isSelected) {
    const canvas = document.getElementById('room-canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Calculate cart pixel position from normalized coordinates
    const x = cart.x * canvas.width;
    const y = cart.y * canvas.height;

    // Get cart dimensions from CART_TYPES definition
    const cartTypes = window.CART_TYPES || {};
    const cartType = cartTypes[cart.type] || cartTypes.crash || { width: 2, depth: 1.5 };
    const widthFeet = cartType.width;
    const depthFeet = cartType.depth;

    // Convert feet to pixels
    const pixelsPerFoot = window.CONFIG?.roomSettings?.pixelsPerFoot || 10;
    const widthPixels = widthFeet * pixelsPerFoot;
    const depthPixels = depthFeet * pixelsPerFoot;

    // Draw selection highlight
    if (isSelected) {
        // Selection background (semi-transparent blue)
        ctx.fillStyle = 'rgba(14, 99, 156, 0.2)';
        ctx.fillRect(
            x - widthPixels / 2 - 5,
            y - depthPixels / 2 - 5,
            widthPixels + 10,
            depthPixels + 10
        );

        // Selection border (solid blue)
        ctx.strokeStyle = '#0e639c';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            x - widthPixels / 2 - 5,
            y - depthPixels / 2 - 5,
            widthPixels + 10,
            depthPixels + 10
        );
    }

    // Draw cart body
    ctx.fillStyle = cart.color;
    ctx.fillRect(
        x - widthPixels / 2,
        y - depthPixels / 2,
        widthPixels,
        depthPixels
    );

    // Draw cart border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        x - widthPixels / 2,
        y - depthPixels / 2,
        widthPixels,
        depthPixels
    );

    // Draw cart name label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cart.name, x, y);

    // Draw cart ID label (smaller, below name)
    ctx.font = '9px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(cart.id, x, y + 15);

    // Draw dimensions and position info if selected
    if (isSelected) {
        // Dimensions label (above cart)
        ctx.font = '8px monospace';
        ctx.fillStyle = '#0e639c';
        ctx.fillText(
            `${widthFeet.toFixed(1)}×${depthFeet.toFixed(1)} ft`,
            x,
            y - depthPixels / 2 - 10
        );

        // Position label (below cart)
        // Convert normalized coords to feet for display
        const roomWidth = window.CONFIG?.roomSettings?.width || 20;
        const roomDepth = window.CONFIG?.roomSettings?.depth || 15;
        const xFeet = ((cart.x - 0.5) * roomWidth).toFixed(1);
        const yFeet = ((cart.y - 0.5) * roomDepth).toFixed(1);
        ctx.fillText(
            `(${xFeet}, ${yFeet}) ft`,
            x,
            y + depthPixels / 2 + 18
        );
    }
}

/**
 * Draw the overview statistics canvas
 *
 * Renders a dashboard view showing key project metrics including:
 * - Number of carts
 * - Number of scenarios
 * - Number of drawers
 * - Number of items
 * - Number of achievements
 *
 * Each statistic is displayed in a colored box with:
 * - Icon emoji
 * - Numeric value
 * - Category label
 * - Color-coded border
 *
 * Layout:
 * - Statistics arranged in a grid (3 columns)
 * - Dark background for contrast
 * - Title at the top
 * - Consistent spacing and sizing
 *
 * @function drawOverviewCanvas
 * @requires canvas - Canvas DOM element
 * @requires ctx - 2D rendering context
 * @requires window.CONFIG.carts - Array of cart objects
 * @requires window.CONFIG.scenarios - Array of scenario objects
 * @requires window.CONFIG.drawers - Array of drawer objects
 * @requires window.CONFIG.items - Array of item objects
 * @requires window.CONFIG.achievements - Array of achievement objects
 *
 * @example
 * // Render the overview statistics view
 * drawOverviewCanvas();
 */
export function drawOverviewCanvas() {
    const canvas = document.getElementById('room-canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas and set dark background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gather statistics from CONFIG
    const config = window.CONFIG || {};
    const stats = [
        {
            label: 'Carts',
            value: config.carts?.length || 0,
            icon: '🛒',
            color: '#0e639c'
        },
        {
            label: 'Scenarios',
            value: config.scenarios?.length || 0,
            icon: '📋',
            color: '#0e7a0d'
        },
        {
            label: 'Drawers',
            value: config.drawers?.length || 0,
            icon: '🗄️',
            color: '#a1260d'
        },
        {
            label: 'Items',
            value: config.items?.length || 0,
            icon: '📦',
            color: '#b7950b'
        },
        {
            label: 'Achievements',
            value: config.achievements?.length || 0,
            icon: '🏆',
            color: '#7d3c98'
        }
    ];

    // Layout constants
    const startX = 50;
    const startY = 100;
    const boxWidth = 140;
    const boxHeight = 100;
    const gap = 20;

    // Draw each statistic box
    stats.forEach((stat, index) => {
        // Calculate position in grid (3 columns)
        const x = startX + (index % 3) * (boxWidth + gap);
        const y = startY + Math.floor(index / 3) * (boxHeight + gap);

        // Draw box background
        ctx.fillStyle = '#252526';
        ctx.fillRect(x, y, boxWidth, boxHeight);

        // Draw colored border
        ctx.strokeStyle = stat.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Draw icon
        ctx.font = '32px Arial';
        ctx.fillStyle = stat.color;
        ctx.textAlign = 'center';
        ctx.fillText(stat.icon, x + boxWidth / 2, y + 35);

        // Draw value
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stat.value, x + boxWidth / 2, y + 60);

        // Draw label
        ctx.font = '11px Arial';
        ctx.fillStyle = '#999';
        ctx.fillText(stat.label, x + boxWidth / 2, y + 80);
    });

    // Draw title
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('Project Overview', 50, 50);
}

/**
 * Redraw canvas with current settings
 *
 * Convenience function to trigger a canvas redraw. Useful when
 * configuration or state changes require a visual update.
 *
 * @function redrawCanvas
 *
 * @example
 * // Update a cart position and redraw
 * cart.x = 0.6;
 * redrawCanvas();
 */
export function redrawCanvas() {
    drawCanvas();
}
