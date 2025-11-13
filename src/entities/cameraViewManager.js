/**
 * @fileoverview Camera View Manager Module
 * @description Manages camera view entities including creation, updates, position/rotation
 * calculations, and preset configurations. Camera views define different perspectives
 * of the 3D trauma room for training scenarios.
 *
 * @module entities/cameraViewManager
 * @requires THREE.js (Vector3 for 3D math)
 * @requires globals (CONFIG, STATE, camera, controls)
 * @requires helpers (getEntity, recordAction, buildHierarchy, updateInspector,
 *                    selectEntity, showAlert)
 */

// Import required globals and helper functions
const CONFIG = window.CONFIG;
const STATE = window.STATE;
const camera = () => window.camera;
const controls = () => window.controls;
const getEntity = window.getEntity;
const recordAction = window.recordAction;
const buildHierarchy = window.buildHierarchy;
const updateInspector = window.updateInspector;
const selectEntity = window.selectEntity;
const showAlert = window.showAlert;
const updateStatusBar = window.updateStatusBar;

// ========================================
// CAMERA VIEW PROPERTY UPDATES
// ========================================

/**
 * Updates a property on the currently selected camera view entity
 *
 * @description
 * This function updates any property on a camera view and handles side effects:
 * - Records the change for undo/redo functionality
 * - Updates the visual hierarchy in the UI
 * - Refreshes the inspector to show updated rotation/direction information
 *
 * Camera View Properties:
 * - id: Unique identifier for the camera view
 * - name: Display name of the camera view
 * - description: Description of what this view shows
 * - position: Object with x, y, z coordinates (feet) where camera is located
 * - lookAt: Object with x, y, z coordinates (feet) where camera is looking
 * - fov: Field of view in degrees (typically 60-90)
 * - type: View type ('overview', 'closeup', 'custom')
 * - targetCart: Cart ID for cart-specific views (optional)
 * - targetDrawer: Drawer ID for drawer close-up views (optional)
 *
 * @param {string} prop - The property name to update
 * @param {*} value - The new value for the property
 *
 * @example
 * // Update camera view name
 * updateCameraViewProperty('name', 'Entry View');
 *
 * @example
 * // Update field of view
 * updateCameraViewProperty('fov', 75);
 *
 * @example
 * // Update view type
 * updateCameraViewProperty('type', 'overview');
 */
export function updateCameraViewProperty(prop, value) {
    const view = getEntity('cameraview', STATE.selectedId);
    if (view) {
        const oldValue = view[prop];
        view[prop] = value;
        STATE.unsavedChanges = true;

        // Record action for undo/redo
        recordAction('UPDATE_CAMERAVIEW_PROPERTY', {
            viewId: view.id,
            property: prop,
            oldValue: oldValue,
            newValue: value
        });

        buildHierarchy();
        updateInspector(); // Refresh to show updated rotation/direction if needed
    }
}

/**
 * Updates a single axis of the camera position
 *
 * @description
 * Updates the x, y, or z coordinate of the camera's position in 3D space.
 * Position is measured in feet from the room origin.
 * Also refreshes the inspector to show updated rotation/direction calculations.
 *
 * @param {string} axis - The axis to update ('x', 'y', or 'z')
 * @param {number} value - The position value in feet
 *
 * @example
 * // Move camera 10 feet to the right
 * updateCameraViewPosition('x', 10);
 *
 * @example
 * // Raise camera to 6 feet height
 * updateCameraViewPosition('y', 6);
 *
 * @example
 * // Move camera 15 feet back
 * updateCameraViewPosition('z', 15);
 */
export function updateCameraViewPosition(axis, value) {
    const view = getEntity('cameraview', STATE.selectedId);
    if (view) {
        view.position[axis] = value;
        STATE.unsavedChanges = true;
        updateInspector(); // Refresh to show updated rotation/direction
    }
}

/**
 * Updates a single axis of the camera's look-at target
 *
 * @description
 * Updates the x, y, or z coordinate of where the camera is looking.
 * The lookAt point is measured in feet from the room origin.
 * Also refreshes the inspector to show updated rotation/direction calculations.
 *
 * @param {string} axis - The axis to update ('x', 'y', or 'z')
 * @param {number} value - The target value in feet
 *
 * @example
 * // Look at room center
 * updateCameraViewLookAt('x', 0);
 * updateCameraViewLookAt('y', 0);
 * updateCameraViewLookAt('z', 0);
 *
 * @example
 * // Look at a point 3 feet above floor
 * updateCameraViewLookAt('y', 3);
 */
export function updateCameraViewLookAt(axis, value) {
    const view = getEntity('cameraview', STATE.selectedId);
    if (view) {
        view.lookAt[axis] = value;
        STATE.unsavedChanges = true;
        updateInspector(); // Refresh to show updated rotation/direction
    }
}

// ========================================
// CAMERA ROTATION CALCULATIONS
// ========================================

/**
 * Calculates camera rotation data from position and lookAt target
 *
 * @description
 * This function performs the exact same conversion logic used in trainer.js
 * switchCameraView() to calculate camera rotation from position and lookAt vectors.
 *
 * The calculation process:
 * 1. Creates 3D vectors for position and lookAt
 * 2. Calculates normalized direction vector from position to lookAt
 * 3. Computes yaw (horizontal rotation) and pitch (vertical rotation)
 * 4. Determines human-readable facing direction (North, South, East, West)
 *
 * Important Notes:
 * - Three.js cameras look down their local -Z axis by default
 * - Yaw is the horizontal angle (rotation around Y axis)
 * - Pitch is the vertical angle (up/down)
 * - Direction calculation matches trainer.js exactly for consistency
 *
 * @param {Object} view - The camera view object with position and lookAt properties
 * @param {Object} view.position - Camera position {x, y, z} in feet
 * @param {Object} view.lookAt - Look-at target {x, y, z} in feet
 *
 * @returns {Object} Rotation data object containing:
 * @returns {number} .yaw - Yaw angle in radians
 * @returns {number} .yawDeg - Yaw angle in degrees
 * @returns {number} .pitch - Pitch angle in radians
 * @returns {number} .pitchDeg - Pitch angle in degrees
 * @returns {THREE.Vector3} .direction - Normalized direction vector
 * @returns {string} .facing - Human-readable facing direction
 *
 * @example
 * const view = {
 *   position: { x: 0, y: 5, z: 15 },
 *   lookAt: { x: 0, y: 0, z: 0 }
 * };
 * const rotation = calculateCameraRotationData(view);
 * console.log(rotation.facing); // "South (into room, -Z)"
 * console.log(rotation.yawDeg); // 0
 * console.log(rotation.pitchDeg); // ~-18.43 (looking down)
 */
export function calculateCameraRotationData(view) {
    // Create position and lookAt vectors
    const position = new THREE.Vector3(view.position.x, view.position.y, view.position.z);
    const lookAt = new THREE.Vector3(view.lookAt.x, view.lookAt.y, view.lookAt.z);

    // Calculate direction vector from position to lookAt
    const direction = lookAt.clone().sub(position).normalize();

    // Calculate yaw and pitch (same formula as trainer.js:331-332)
    // Three.js cameras look down their local -Z axis, so we need to negate direction.z
    const yaw = Math.atan2(direction.x, -direction.z);
    const pitch = Math.asin(-direction.y);

    // Calculate direction vector from yaw and pitch (same as trainer.js:1766-1770)
    const directionFromRotation = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        -Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch)
    );

    // Determine human-readable facing direction (same as trainer.js:1773-1778)
    const yawDeg = yaw * 180 / Math.PI;
    let facing = '';
    if (yawDeg >= -45 && yawDeg < 45) facing = 'South (into room, -Z)';
    else if (yawDeg >= 45 && yawDeg < 135) facing = 'West (-X)';
    else if (yawDeg >= 135 || yawDeg < -135) facing = 'North (toward entrance, +Z)';
    else facing = 'East (+X)';

    return {
        yaw: yaw,
        yawDeg: yawDeg,
        pitch: pitch,
        pitchDeg: pitch * 180 / Math.PI,
        direction: directionFromRotation,
        facing: facing
    };
}

// ========================================
// CAMERA VIEW PRESETS
// ========================================

/**
 * Applies a preset camera configuration to the currently selected camera view
 *
 * @description
 * Sets the camera view to one of several predefined configurations:
 *
 * - **entry**: Entry view - as if entering from the front of the room
 *   - Position: (0, 1.67, 12) - eye level at room entrance
 *   - LookAt: (0, 0, 0) - looking at room center
 *   - FOV: 75 degrees
 *
 * - **overhead**: Overhead view - bird's eye view of the room
 *   - Position: (0, 15, 0) - 15 feet above room center
 *   - LookAt: (0, 0, 0) - looking down at room center
 *   - FOV: 60 degrees
 *
 * - **current**: Use current 3D camera view
 *   - Captures the current position, lookAt, and FOV from the 3D preview camera
 *   - Allows designers to position the camera visually then save that view
 *
 * @param {string} preset - The preset name ('entry', 'overhead', or 'current')
 *
 * @example
 * // Set camera to entry view
 * setCameraViewPreset('entry');
 *
 * @example
 * // Set camera to overhead view
 * setCameraViewPreset('overhead');
 *
 * @example
 * // Capture current 3D camera position
 * setCameraViewPreset('current');
 */
export function setCameraViewPreset(preset) {
    const view = getEntity('cameraview', STATE.selectedId);
    if (!view) return;

    switch (preset) {
        case 'entry':
            // Entry view - as if entering from the front
            view.position = { x: 0, y: 1.67, z: 12 };
            view.lookAt = { x: 0, y: 0, z: 0 };
            view.fov = 75;
            break;
        case 'overhead':
            // Overhead view - bird's eye view of the room
            view.position = { x: 0, y: 15, z: 0 };
            view.lookAt = { x: 0, y: 0, z: 0 };
            view.fov = 60;
            break;
        case 'current':
            // Use current 3D camera view
            const cam = camera();
            const ctrl = controls();
            if (cam) {
                view.position = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
                view.lookAt = { x: ctrl.target.x, y: ctrl.target.y, z: ctrl.target.z };
                view.fov = cam.fov;
            }
            break;
    }

    STATE.unsavedChanges = true;
    updateInspector();
    showAlert(`Camera preset "${preset}" applied`, 'success');
}

// ========================================
// CAMERA VIEW CREATION
// ========================================

/**
 * Creates a new camera view entity with default properties
 *
 * @description
 * Generates a new camera view with a unique timestamp-based ID and default properties:
 * - Default name: 'New Camera View'
 * - Default description: 'Camera view description'
 * - Default position: (0, 5, 15) - back and above room center
 * - Default lookAt: (0, 0, 0) - looking at room center
 * - Default FOV: 75 degrees
 * - Default type: 'custom'
 * - No target cart or drawer initially
 *
 * The function:
 * 1. Creates the camera view object
 * 2. Adds it to CONFIG.cameraViews
 * 3. Updates the unsaved changes flag
 * 4. Rebuilds the hierarchy UI
 * 5. Updates the status bar
 * 6. Selects the new camera view
 *
 * @returns {void}
 *
 * @example
 * // Create a new camera view
 * createNewCameraView();
 * // Result: A new camera view is created and selected, ready for configuration
 */
export function createNewCameraView() {
    const id = `camera_${Date.now()}`;
    const newCameraView = {
        id: id,
        name: 'New Camera View',
        description: 'Camera view description',
        position: { x: 0, y: 5, z: 15 }, // Camera position (feet)
        lookAt: { x: 0, y: 0, z: 0 },    // Where camera looks
        fov: 75,                          // Field of view
        type: 'custom',                   // 'overview', 'closeup', 'custom'
        targetCart: null,                 // For cart-specific views
        targetDrawer: null                // For drawer close-ups
    };

    CONFIG.cameraViews.push(newCameraView);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('cameraview', id);
    showAlert('New camera view created', 'success');
}
