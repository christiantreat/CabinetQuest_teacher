/**
 * @fileoverview 2D Canvas Setup and Initialization Module
 *
 * This module handles the setup and initialization of the 2D canvas element
 * used for the top-down room layout view. It configures the canvas context,
 * DOM references, and event listeners for mouse interactions and position tracking.
 *
 * The canvas provides a 2D bird's-eye view of the room where users can:
 * - View and position carts in the room layout
 * - Drag and drop carts to new positions
 * - See real-time coordinate feedback
 * - Toggle grid snapping for precise placement
 *
 * @module src/2d/canvas
 * @requires teacher.js (globals: CONFIG, STATE, canvas, ctx)
 */

/**
 * Canvas DOM element reference
 * @type {HTMLCanvasElement}
 * @description The main 2D canvas element for room layout visualization
 */
export let canvas;

/**
 * 2D rendering context for the canvas
 * @type {CanvasRenderingContext2D}
 * @description Used for all 2D drawing operations on the canvas
 */
export let ctx;

/**
 * Initialize canvas and context references
 *
 * This function should be called during application initialization to set up
 * the canvas element and its 2D rendering context. It retrieves the canvas
 * DOM element by ID and obtains its 2D rendering context.
 *
 * @function initCanvas
 * @returns {boolean} True if initialization was successful, false otherwise
 *
 * @example
 * // Call during app initialization
 * if (initCanvas()) {
 *   setupCanvas();
 * } else {
 *   console.error('Failed to initialize canvas');
 * }
 */
export function initCanvas() {
    const canvasElement = document.getElementById('room-canvas');
    if (!canvasElement) {
        console.error('Canvas element "room-canvas" not found');
        return false;
    }

    canvas = canvasElement;
    ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('Failed to get 2D context from canvas');
        return false;
    }

    return true;
}

/**
 * Set up canvas event listeners and interactions
 *
 * Configures all mouse event handlers for the 2D canvas including:
 * - Mouse down: Initiates cart dragging or selection
 * - Mouse move: Updates drag position and tracks cursor coordinates
 * - Mouse up: Completes drag operation
 * - Mouse leave: Cancels drag operation when cursor leaves canvas
 *
 * Also sets up real-time coordinate tracking that displays the current
 * mouse position in feet relative to the room center, updating the UI
 * info display.
 *
 * The coordinate system:
 * - Uses normalized (0-1) coordinates internally
 * - Converts to feet based on room dimensions for display
 * - Origin (0.5, 0.5) represents the room center
 * - X increases to the right, Y increases downward
 *
 * @function setupCanvas
 * @requires handleCanvasMouseDown - Mouse down event handler (from interaction.js)
 * @requires handleCanvasMouseMove - Mouse move event handler (from interaction.js)
 * @requires handleCanvasMouseUp - Mouse up event handler (from interaction.js)
 * @requires window.CONFIG.roomSettings - Room dimensions and scale settings
 * @requires window.STATE.mousePos - Global state object for mouse position
 *
 * @example
 * // Set up canvas after initialization
 * initCanvas();
 * setupCanvas();
 *
 * @see {@link module:src/2d/interaction} for mouse event handler implementations
 *
 * @version 2.1 - Requires initCanvas() to be called first
 */
export function setupCanvas() {
    // Import handler functions (these should be passed as dependencies or imported)
    // For now, we'll assume they exist in global scope
    const { handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp } =
        window.canvasHandlers || {};

    if (!canvas) {
        console.error('Canvas not initialized. Call initCanvas() first.');
        return;
    }

    // Mouse events for drag and drop interactions
    if (handleCanvasMouseDown) {
        canvas.addEventListener('mousedown', handleCanvasMouseDown);
    }
    if (handleCanvasMouseMove) {
        canvas.addEventListener('mousemove', handleCanvasMouseMove);
    }
    if (handleCanvasMouseUp) {
        canvas.addEventListener('mouseup', handleCanvasMouseUp);
        canvas.addEventListener('mouseleave', handleCanvasMouseUp);
    }

    // Track mouse position in feet coordinates
    // This provides real-time feedback of cursor position to the user
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();

        // Convert mouse position to normalized (0-1) coordinates
        const normX = (e.clientX - rect.left) / canvas.width;
        const normY = (e.clientY - rect.top) / canvas.height;

        // Convert to feet coordinates (centered at room center)
        // Formula: ((normalized - 0.5) * roomDimension)
        // - normX/normY of 0.5 is the center (0,0) in feet
        // - normX/normY of 0 is the left/top edge
        // - normX/normY of 1 is the right/bottom edge
        const xFeet = ((normX - 0.5) * window.window.CONFIG.roomSettings.width).toFixed(1);
        const yFeet = ((normY - 0.5) * window.window.CONFIG.roomSettings.depth).toFixed(1);

        // Update global state for other modules to access
        if (window.STATE && window.window.STATE.mousePos) {
            window.window.STATE.mousePos.x = xFeet;
            window.window.STATE.mousePos.y = yFeet;
        }

        // Update UI display element
        const infoElement = document.getElementById('canvas-info-mouse');
        if (infoElement) {
            infoElement.textContent = `X: ${xFeet} ft, Y: ${yFeet} ft`;
        }
    });
}

/**
 * Get canvas dimensions
 *
 * @function getCanvasDimensions
 * @returns {{width: number, height: number}} Canvas width and height in pixels
 *
 * @example
 * const {width, height} = getCanvasDimensions();
 * console.log(`Canvas size: ${width}x${height}px`);
 */
export function getCanvasDimensions() {
    return {
        width: canvas ? canvas.width : 0,
        height: canvas ? canvas.height : 0
    };
}

/**
 * Update canvas size based on room dimensions
 *
 * Recalculates canvas pixel dimensions based on the current room settings
 * in feet and the pixels-per-foot scale factor.
 *
 * @function updateCanvasSize
 * @param {number} widthFeet - Room width in feet
 * @param {number} depthFeet - Room depth in feet
 * @param {number} pixelsPerFoot - Scale factor for conversion
 *
 * @example
 * // Update canvas size for a 20x15 foot room at 10 pixels per foot
 * updateCanvasSize(20, 15, 10);
 */
export function updateCanvasSize(widthFeet, depthFeet, pixelsPerFoot) {
    if (!canvas) {
        console.error('Canvas not initialized');
        return;
    }

    canvas.width = widthFeet * pixelsPerFoot;
    canvas.height = depthFeet * pixelsPerFoot;
}

/**
 * Clear the entire canvas
 *
 * @function clearCanvas
 *
 * @example
 * clearCanvas();
 * // Canvas is now blank and ready for new content
 */
export function clearCanvas() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
