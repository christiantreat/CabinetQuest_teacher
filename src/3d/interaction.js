/**
 * ==============================================================================
 * 3D INTERACTION MODULE
 * ==============================================================================
 *
 * This module handles 3D user interaction including:
 * - Raycasting for object picking
 * - Mouse event handling (down, move, up)
 * - Touch event handling for mobile/tablet devices
 * - Drag-and-drop cart positioning in 3D space
 * - Coordinate conversion between 2D canvas and 3D space
 * - Orbit control management during interactions
 *
 * The interaction system uses Three.js raycasting to detect clicks/taps on
 * carts and drawers, allowing users to select and manipulate them in
 * the 3D view. During drag operations, carts can be repositioned with
 * optional grid snapping.
 *
 * Touch Support:
 * - Single-touch: Cart/drawer selection and dragging
 * - Multi-touch: Passed to OrbitControls for camera zoom/pan
 * - Touch tracking prevents interference between interaction and camera control
 *
 * Dependencies:
 * - Three.js library (THREE global)
 * - scene, camera, renderer, raycaster, mouse, dragPlane from scene module
 * - controls from sceneObjects module
 * - cartMeshes, setSelectedCart3D from scene module
 * - STATE, CONFIG from config module
 * - Selection functions from selection module
 *
 * Exports:
 * - init3DInteraction(): Initialize raycaster and event listeners
 * - onThreeMouseDown(): Handle mouse down events
 * - onThreeMouseMove(): Handle mouse move events (dragging)
 * - onThreeMouseUp(): Handle mouse up events
 * - onThreeTouchStart(): Handle touch start events
 * - onThreeTouchMove(): Handle touch move events
 * - onThreeTouchEnd(): Handle touch end/cancel events
 *
 * @module 3d/interaction
 */


import { FINE_GRID_SIZE } from '../config/constants.js';
import {
    scene,
    camera,
    renderer,
    raycaster,
    mouse,
    dragPlane,
    cartMeshes,
    setSelectedCart3D,
    setDragPlane,
    setRaycaster,
    setMouse
} from './scene.js';
import { controls } from './sceneObjects.js';
import { selectCart3D, deselectCart3D, selectDrawer3D, deselectDrawer3D } from './selection.js';

// ===== STATE TRACKING =====

/**
 * Currently selected cart being dragged
 * @type {THREE.Group|null}
 */
let selectedCart3D = null;

/**
 * Cart position before drag operation (for undo/redo)
 * @type {Object|null}
 */
let cartDragStartPosition = null;

// ===== INITIALIZATION =====

/**
 * Initialize 3D interaction system
 *
 * This function sets up the raycasting infrastructure and event listeners
 * needed for 3D interaction:
 * - Creates raycaster for object picking
 * - Initializes mouse coordinate tracking
 * - Creates invisible drag plane at floor level
 * - Attaches mouse event listeners to renderer
 *
 * The drag plane is an invisible horizontal mesh at y=0 that provides
 * a surface for raycasting during drag operations. This allows smooth
 * cart positioning across the floor.
 *
 * Call this function once after the 3D scene is initialized.
 *
 * @returns {void}
 *
 * @example
 * initThreeJS();
 * init3DInteraction();
 *
 * @version 2.1 - Fixed: Now uses setRaycaster/setMouse instead of Object.assign
 */
export function init3DInteraction() {
    // Initialize raycaster for picking objects in 3D space
    // Raycaster creates a ray from camera through mouse position
    const newRaycaster = new THREE.Raycaster();
    setRaycaster(newRaycaster);

    // Initialize mouse vector for normalized device coordinates
    // NDC range from -1 to +1 for both x and y
    const newMouse = new THREE.Vector2();
    setMouse(newMouse);

    // Create invisible drag plane at floor level
    // This plane is used for raycasting during cart drag operations
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.MeshBasicMaterial({
        visible: false,      // Invisible to user
        side: THREE.DoubleSide // Raycast works from both sides
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Rotate to horizontal (plane starts vertical)
    plane.position.y = 0;             // At floor level

    scene.add(plane);
    setDragPlane(plane);

    // Attach mouse event listeners to 3D renderer canvas
    renderer.domElement.addEventListener('mousedown', onThreeMouseDown);
    renderer.domElement.addEventListener('mousemove', onThreeMouseMove);
    renderer.domElement.addEventListener('mouseup', onThreeMouseUp);

    // Attach touch event listeners for mobile/tablet support
    renderer.domElement.addEventListener('touchstart', onThreeTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onThreeTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onThreeTouchEnd);
    renderer.domElement.addEventListener('touchcancel', onThreeTouchEnd);

    console.log('✓ 3D interaction enabled (mouse + touch)');
}

// ===== MOUSE EVENT HANDLERS =====

/**
 * Handle mouse down events in 3D view
 *
 * This function performs raycasting to detect what object was clicked:
 * - Carts: Selects cart and enables dragging
 * - Drawers: Selects drawer and opens it
 * - Empty space: Deselects current selection
 *
 * When a cart is clicked:
 * - Stores initial position for undo/redo
 * - Disables orbit controls to prevent camera rotation during drag
 * - Calls selection functions to highlight the cart
 *
 * When a drawer is clicked:
 * - Opens the drawer with animation
 * - Highlights the drawer
 * - Does NOT enable dragging
 *
 * @param {MouseEvent} event - Browser mouse event
 * @returns {void}
 *
 * @fires selectCart3D When a cart is clicked
 * @fires selectDrawer3D When a drawer is clicked
 * @fires deselectCart3D When empty space is clicked
 * @fires deselectDrawer3D When empty space is clicked
 */
export function onThreeMouseDown(event) {
    // Only process clicks when in room view mode
    if (window.STATE.canvasMode !== 'room') return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Set up raycaster from camera through mouse position
    raycaster.setFromCamera(mouse, camera);

    // Collect all clickable meshes (carts and drawers)
    const clickableMeshes = [];
    cartMeshes.forEach((cartGroup) => {
        // Add cart body
        if (cartGroup.userData.clickable) {
            clickableMeshes.push(cartGroup.userData.clickable);
        }

        // Add drawers
        cartGroup.children.forEach((child) => {
            if (child.userData && child.userData.drawerId && child.userData.clickable) {
                clickableMeshes.push(child.userData.clickable);
            }
        });
    });

    // Perform raycasting to find intersections
    // intersects array is sorted by distance (closest first)
    const intersects = raycaster.intersectObjects(clickableMeshes, false);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Check if drawer or cart was clicked
        if (clickedObject.userData.type === 'drawer') {
            // ===== DRAWER CLICKED =====
            const drawerId = clickedObject.userData.drawerId;
            selectDrawer3D(drawerId);

            // Also select in 2D system (requires external module)
            // This assumes selectEntity function is available globally
            if (typeof selectEntity === 'function') {
                selectEntity('drawer', drawerId);
            }

            // Note: Drawers cannot be dragged, only selected

        } else if (clickedObject.userData.cartId) {
            // ===== CART CLICKED =====
            const cartId = clickedObject.userData.cartId;

            // Select cart for dragging
            selectCart3D(cartId);
            selectedCart3D = cartMeshes.get(cartId);
            setSelectedCart3D(selectedCart3D);

            // Store starting position for undo/redo
            const cart = getEntity('cart', cartId);
            if (cart) {
                cartDragStartPosition = {
                    x: cart.x,
                    y: cart.y,
                    rotation: cart.rotation
                };
            }

            // Also select in 2D system
            if (typeof selectEntity === 'function') {
                selectEntity('cart', cartId);
            }

            // Disable orbit controls during drag to prevent camera movement
            if (controls && controls.enabled !== undefined) {
                controls.enabled = false;
            }
        }
    } else {
        // ===== EMPTY SPACE CLICKED =====
        // Deselect everything
        deselectCart3D();
        deselectDrawer3D();

        // Deselect in 2D system
        if (typeof deselectEntity === 'function') {
            deselectEntity();
        }
    }
}

/**
 * Handle mouse move events in 3D view
 *
 * This function handles cart dragging:
 * - Only active when a cart is selected (selectedCart3D !== null)
 * - Raycasts to drag plane to get floor position
 * - Updates cart 3D position with optional grid snapping
 * - Updates corresponding 2D data in CONFIG
 * - Triggers UI updates (canvas redraw, inspector update)
 *
 * Grid snapping:
 * If window.STATE.snapToGrid is enabled, cart position snaps to FINE_GRID_SIZE
 * intervals (0.25 feet / 3 inches) for precise alignment.
 *
 * Coordinate conversion:
 * 3D positions (feet) are converted to normalized 2D coordinates (0-1)
 * for storage in CONFIG, maintaining consistency between views.
 *
 * @param {MouseEvent} event - Browser mouse event
 * @returns {void}
 */
export function onThreeMouseMove(event) {
    // Only process move events when dragging a cart
    if (!selectedCart3D) return;

    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to drag plane to get intersection point
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(dragPlane);

    if (intersects.length > 0) {
        const point = intersects[0].point; // Intersection point on floor

        // Update 3D position
        selectedCart3D.position.x = point.x;
        selectedCart3D.position.z = point.z;

        // Apply grid snapping if enabled
        if (window.STATE.snapToGrid) {
            const gridSize = FINE_GRID_SIZE; // 0.25 feet (3 inches)
            selectedCart3D.position.x = Math.round(point.x / gridSize) * gridSize;
            selectedCart3D.position.z = Math.round(point.z / gridSize) * gridSize;
        }

        // Update 2D data in CONFIG
        const cart = getEntity('cart', selectedCart3D.userData.cartId);
        if (cart) {
            // Convert 3D feet coordinates to normalized 0-1 coordinates
            const roomWidth = window.CONFIG.roomSettings.width;
            const roomDepth = window.CONFIG.roomSettings.depth;
            cart.x = (selectedCart3D.position.x / roomWidth) + 0.5;
            cart.y = (selectedCart3D.position.z / roomDepth) + 0.5;

            // Mark as unsaved
            window.STATE.unsavedChanges = true;

            // Update 2D view and inspector (requires external functions)
            if (typeof drawCanvas === 'function') {
                drawCanvas();
            }
            if (typeof updateInspector === 'function') {
                updateInspector();
            }
        }
    }
}

/**
 * Handle mouse up events in 3D view
 *
 * This function completes a drag operation:
 * - Records cart movement for undo/redo system
 * - Clears drag state
 * - Re-enables orbit controls
 *
 * Undo/redo integration:
 * If the cart position actually changed during the drag, a MOVE_CART
 * action is recorded with both old and new positions. This allows
 * users to undo/redo cart movements.
 *
 * Position change detection:
 * The function compares stored start position with final position.
 * If positions match exactly, no undo action is recorded to avoid
 * cluttering the history with non-changes.
 *
 * @param {MouseEvent} event - Browser mouse event
 * @returns {void}
 */
export function onThreeMouseUp(event) {
    if (selectedCart3D) {
        // Record cart movement for undo/redo
        if (cartDragStartPosition) {
            const cartId = selectedCart3D.userData.cartId;
            const cart = getEntity('cart', cartId);

            if (cart) {
                const newPosition = {
                    x: cart.x,
                    y: cart.y,
                    rotation: cart.rotation
                };

                // Only record if position actually changed
                // This prevents recording no-op actions
                if (cartDragStartPosition.x !== newPosition.x ||
                    cartDragStartPosition.y !== newPosition.y ||
                    cartDragStartPosition.rotation !== newPosition.rotation) {

                    // Record action (requires external function)
                    if (typeof recordAction === 'function') {
                        recordAction('MOVE_CART', {
                            cartId: cartId,
                            oldPosition: cartDragStartPosition,
                            newPosition: newPosition
                        });
                    }
                }
            }

            // Clear drag start position
            cartDragStartPosition = null;
        }

        // Clear selection
        selectedCart3D = null;
        setSelectedCart3D(null);

        // Re-enable orbit controls for camera movement
        if (controls && controls.enabled !== undefined) {
            controls.enabled = true;
        }
    }
}

// ===== TOUCH EVENT HANDLERS =====

/**
 * Track the active touch for cart dragging
 * @type {number|null}
 */
let activeTouchId = null;

/**
 * Handle touch start events in 3D view
 *
 * Converts touch events to mouse-like coordinates and delegates
 * to the existing mouse handler. Supports single-touch interaction
 * for cart selection and dragging.
 *
 * Multi-touch behavior:
 * - First touch: Handled as primary interaction (cart selection/drag)
 * - Additional touches: Ignored, allowing OrbitControls to handle zoom/pan
 *
 * @param {TouchEvent} event - Browser touch event
 * @returns {void}
 */
export function onThreeTouchStart(event) {
    // Only handle single touch for interaction
    // OrbitControls will handle multi-touch for camera control
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        activeTouchId = touch.identifier;

        // Convert touch event to mouse-like event
        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };

        // Delegate to mouse handler
        onThreeMouseDown(mouseEvent);

        // Prevent default only if we're dragging something
        // This allows OrbitControls to work when not dragging
        if (selectedCart3D) {
            event.preventDefault();
        }
    }
}

/**
 * Handle touch move events in 3D view
 *
 * Converts active touch to mouse-like coordinates for cart dragging.
 * Only processes the touch that initiated the drag operation.
 *
 * @param {TouchEvent} event - Browser touch event
 * @returns {void}
 */
export function onThreeTouchMove(event) {
    // Only process if we have an active touch
    if (activeTouchId === null) return;

    // Find the active touch
    for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        if (touch.identifier === activeTouchId) {
            // Convert touch event to mouse-like event
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };

            // Delegate to mouse handler
            onThreeMouseMove(mouseEvent);

            // Prevent scrolling while dragging
            if (selectedCart3D) {
                event.preventDefault();
            }
            break;
        }
    }
}

/**
 * Handle touch end/cancel events in 3D view
 *
 * Completes the touch interaction and clears active touch tracking.
 *
 * @param {TouchEvent} event - Browser touch event
 * @returns {void}
 */
export function onThreeTouchEnd(event) {
    // Only process if we have an active touch
    if (activeTouchId === null) return;

    // Check if the active touch ended
    let touchEnded = true;
    for (let i = 0; i < event.touches.length; i++) {
        if (event.touches[i].identifier === activeTouchId) {
            touchEnded = false;
            break;
        }
    }

    if (touchEnded) {
        // Convert to mouse-like event (use last known position or center)
        const mouseEvent = {
            clientX: 0,
            clientY: 0
        };

        // Delegate to mouse handler
        onThreeMouseUp(mouseEvent);

        // Clear active touch
        activeTouchId = null;
    }
}

// ===== HELPER FUNCTIONS =====

/**
 * Get entity from CONFIG by type and ID
 *
 * This is a local helper that searches CONFIG for entities.
 * Falls back to global getEntity function if available.
 *
 * @param {string} type - Entity type ('cart', 'drawer', etc.)
 * @param {string} id - Entity ID
 * @returns {Object|null} Entity object or null if not found
 * @private
 */
function getEntity(type, id) {
    // Try to use global getEntity if available
    if (typeof window !== 'undefined' && typeof window.getEntity === 'function') {
        return window.getEntity(type, id);
    }

    // Fallback: search CONFIG directly
    if (type === 'cart') {
        return window.CONFIG.carts.find(c => c.id === id) || null;
    } else if (type === 'drawer') {
        return window.CONFIG.drawers.find(d => d.id === id) || null;
    }

    return null;
}

// Note: Functions selectEntity, deselectEntity, drawCanvas, updateInspector,
// and recordAction are expected to be available globally from other modules.
// In a fully modular system, these would be properly imported.
