/**
 * @fileoverview 3D Camera View Management Module
 *
 * This module manages camera positioning and view modes in the 3D scene.
 * It provides functionality for:
 * - Toggling between orbital and top-down camera views
 * - Animating smooth camera transitions
 * - Previewing saved camera view configurations
 * - Managing camera state and controls
 *
 * Camera View Modes:
 * - Orbital: Free-form 3D perspective with orbit controls enabled
 * - Top-Down: Fixed orthographic-like view directly above the scene
 *
 * The module uses smooth animations with easing for professional-looking
 * camera movements and preserves user's previous camera position when
 * switching between modes.
 *
 * @module src/views/cameraViews
 * @requires three.js (THREE global object)
 * @requires teacher.js (globals: camera, controls, STATE)
 */

/**
 * Camera view modes
 * @readonly
 * @enum {string}
 */
export const CameraViewMode = {
    /** Orbital 3D view with user controls */
    ORBITAL: 'orbital',
    /** Fixed top-down view */
    TOP_DOWN: 'topDown'
};

/**
 * Current camera view mode
 * @type {string}
 */
let cameraViewMode = CameraViewMode.ORBITAL;

/**
 * Saved camera position for mode switching
 * @type {THREE.Vector3|null}
 */
let savedCameraPosition = null;

/**
 * Saved camera rotation for mode switching
 * @type {THREE.Euler|null}
 */
let savedCameraRotation = null;

/**
 * Toggle between camera view modes
 *
 * Switches the camera between orbital 3D view and top-down view:
 *
 * Orbital Mode:
 * - Free 3D perspective view
 * - Orbit controls enabled
 * - User can rotate, pan, and zoom
 * - Natural viewing angle for examining details
 *
 * Top-Down Mode:
 * - Fixed position directly above scene center
 * - Looking straight down
 * - Orbit controls disabled
 * - Bird's eye view matching 2D canvas layout
 * - Standardized orientation (no roll)
 *
 * The function:
 * - Saves current camera state before switching
 * - Animates smoothly to new position
 * - Updates controls enabled state
 * - Updates UI button text
 * - Shows user feedback alert
 *
 * @function toggleCameraView
 * @requires camera - THREE.js PerspectiveCamera instance
 * @requires controls - Orbit controls instance
 * @requires showAlert - Function to display user feedback (from teacher.js)
 *
 * @example
 * // Toggle between views
 * toggleCameraView(); // Switches to top-down
 * toggleCameraView(); // Switches back to orbital
 *
 * @see {@link animateCameraTo} for animation implementation
 * @see {@link previewCameraView} for previewing saved views
 */
export function toggleCameraView() {
    const camera = window.camera;
    const controls = window.controls;

    // Validate camera and controls are available
    if (!camera || !controls) {
        if (window.showAlert) {
            window.showAlert('Camera controls not available', 'error');
        }
        return;
    }

    if (cameraViewMode === CameraViewMode.ORBITAL) {
        // Switch to top-down view
        // Save current camera state for restoration later
        savedCameraPosition = camera.position.clone();
        savedCameraRotation = camera.rotation.clone();

        // Define top-down camera position (directly above center)
        const targetPosition = new window.THREE.Vector3(0, 30, 0);
        const targetLookAt = new window.THREE.Vector3(0, 0, 0);

        // Animate to top-down position
        animateCameraTo(targetPosition, targetLookAt, () => {
            // Standardize camera rotation for consistent top-down orientation
            // Looking straight down (-90 degrees on X axis) with no roll
            camera.rotation.set(-Math.PI / 2, 0, 0);

            // Update mode state
            cameraViewMode = CameraViewMode.TOP_DOWN;

            // Disable orbit controls in top-down mode
            if (controls.enabled !== undefined) {
                controls.enabled = false;
            }

            // Update UI button text
            const buttonElement = document.getElementById('toggle-camera-view');
            if (buttonElement) {
                buttonElement.textContent = '📷 3D View';
            }

            // Show user feedback
            if (window.showAlert) {
                window.showAlert('Top-down view activated', 'success');
            }
        });
    } else {
        // Switch back to orbital view
        // Re-enable orbit controls
        if (controls.enabled !== undefined) {
            controls.enabled = true;
        }

        // Use saved position or default orbital position
        const targetPosition = savedCameraPosition || new window.THREE.Vector3(15, 10, 15);
        const targetRotation = savedCameraRotation;
        const targetLookAt = new window.THREE.Vector3(0, 0, 0);

        // Animate to orbital position
        animateCameraTo(targetPosition, targetLookAt, () => {
            // Restore saved rotation if available
            if (targetRotation) {
                camera.rotation.copy(targetRotation);
            }

            // Update mode state
            cameraViewMode = CameraViewMode.ORBITAL;

            // Update UI button text
            const buttonElement = document.getElementById('toggle-camera-view');
            if (buttonElement) {
                buttonElement.textContent = '📷 Top View';
            }

            // Show user feedback
            if (window.showAlert) {
                window.showAlert('3D orbital view activated', 'success');
            }
        });
    }
}

/**
 * Preview a saved camera view
 *
 * Animates the camera to a predefined camera view configuration.
 * Used to preview camera views created in the inspector/editor.
 *
 * The function:
 * - Retrieves the camera view configuration
 * - Sets camera position from view data
 * - Sets field of view (FOV)
 * - Updates projection matrix
 * - Sets controls target (look-at point)
 * - Shows user feedback
 *
 * Camera view objects contain:
 * - position: {x, y, z} - Camera position in 3D space
 * - lookAt: {x, y, z} - Point camera is looking at
 * - fov: number - Field of view in degrees
 * - name: string - Display name for the view
 *
 * @function previewCameraView
 * @requires STATE.selectedId - ID of camera view to preview
 * @requires getEntity - Function to retrieve entity by type and ID (from teacher.js)
 * @requires camera - THREE.js PerspectiveCamera instance
 * @requires controls - Orbit controls instance
 * @requires showAlert - Function to display user feedback (from teacher.js)
 *
 * @example
 * // Select a camera view and preview it
 * selectEntity('cameraview', 'view-1');
 * previewCameraView();
 *
 * @see {@link toggleCameraView} for mode switching
 * @see {@link animateCameraTo} for smooth camera animation
 */
export function previewCameraView() {
    const getEntity = window.getEntity;
    const selectedId = window.STATE?.selectedId;
    const camera = window.camera;
    const controls = window.controls;

    // Get the camera view configuration
    const view = getEntity ? getEntity('cameraview', selectedId) : null;

    if (!view || !camera) {
        console.warn('Camera view or camera not available');
        return;
    }

    // Apply camera position from view configuration
    camera.position.set(view.position.x, view.position.y, view.position.z);

    // Apply field of view and update projection
    camera.fov = view.fov;
    camera.updateProjectionMatrix();

    // Update orbit controls target to look at specified point
    if (controls) {
        controls.target.set(view.lookAt.x, view.lookAt.y, view.lookAt.z);
        controls.update();
    }

    // Show user feedback
    if (window.showAlert) {
        window.showAlert(`Previewing camera view: ${view.name}`, 'success');
    }
}

/**
 * Animate camera to target position
 *
 * Smoothly animates the camera from its current position to a target
 * position over a specified duration with easing.
 *
 * Animation features:
 * - Smooth interpolation using lerp (linear interpolation)
 * - Eased timing with cubic easing function
 * - Automatically updates look-at direction
 * - Callback on completion
 * - Uses requestAnimationFrame for smooth 60fps animation
 *
 * The animation runs for 800ms by default and uses a cubic ease-in-out
 * curve for natural-looking motion (slow start, fast middle, slow end).
 *
 * @function animateCameraTo
 * @param {THREE.Vector3} targetPosition - Destination position for camera
 * @param {THREE.Vector3} targetLookAt - Point for camera to look at
 * @param {Function} [onComplete] - Optional callback when animation completes
 * @requires camera - THREE.js PerspectiveCamera instance
 *
 * @example
 * // Animate to position (10, 5, 10) looking at origin
 * const targetPos = new THREE.Vector3(10, 5, 10);
 * const lookAt = new THREE.Vector3(0, 0, 0);
 * animateCameraTo(targetPos, lookAt, () => {
 *   console.log('Animation complete!');
 * });
 *
 * @example
 * // Simple movement without callback
 * animateCameraTo(
 *   new THREE.Vector3(0, 20, 0),
 *   new THREE.Vector3(0, 0, 0)
 * );
 *
 * @see {@link easeInOutCubic} for easing function
 */
export function animateCameraTo(targetPosition, targetLookAt, onComplete) {
    const camera = window.camera;
    if (!camera) return;

    // Store starting position
    const startPosition = camera.position.clone();

    // Animation parameters
    const duration = 800; // milliseconds
    const startTime = Date.now();

    /**
     * Animation loop function
     * @private
     */
    function animate() {
        // Calculate animation progress (0 to 1)
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Apply easing to progress
        const eased = easeInOutCubic(progress);

        // Interpolate camera position
        camera.position.lerpVectors(startPosition, targetPosition, eased);

        // Update camera look-at direction
        camera.lookAt(targetLookAt);

        // Continue animation or complete
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Animation complete - call callback if provided
            if (onComplete) {
                onComplete();
            }
        }
    }

    // Start animation loop
    animate();
}

/**
 * Cubic ease-in-out easing function
 *
 * Provides smooth acceleration and deceleration for animations.
 * The curve starts slow, speeds up in the middle, and slows down at the end,
 * creating natural-looking motion.
 *
 * Mathematical formula:
 * - First half (t < 0.5): 4t³ (cubic acceleration)
 * - Second half (t ≥ 0.5): 1 - (-2t + 2)³ / 2 (cubic deceleration)
 *
 * @function easeInOutCubic
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Eased progress value between 0 and 1
 *
 * @example
 * // Get eased value for 50% progress
 * const eased = easeInOutCubic(0.5);
 * console.log(eased); // 0.5 (inflection point)
 *
 * @example
 * // Use in custom animation
 * const progress = elapsedTime / duration;
 * const eased = easeInOutCubic(progress);
 * object.position.x = startX + (endX - startX) * eased;
 *
 * @see {@link https://easings.net/#easeInOutCubic} for visualization
 */
export function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Get current camera view mode
 *
 * @function getCameraViewMode
 * @returns {string} Current camera view mode
 *
 * @example
 * const mode = getCameraViewMode();
 * console.log(`Current mode: ${mode}`);
 */
export function getCameraViewMode() {
    return cameraViewMode;
}

/**
 * Check if camera is in orbital mode
 *
 * @function isOrbitalMode
 * @returns {boolean} True if camera is in orbital mode
 *
 * @example
 * if (isOrbitalMode()) {
 *   console.log('Controls are enabled');
 * }
 */
export function isOrbitalMode() {
    return cameraViewMode === CameraViewMode.ORBITAL;
}

/**
 * Check if camera is in top-down mode
 *
 * @function isTopDownMode
 * @returns {boolean} True if camera is in top-down mode
 *
 * @example
 * if (isTopDownMode()) {
 *   console.log('Controls are disabled');
 * }
 */
export function isTopDownMode() {
    return cameraViewMode === CameraViewMode.TOP_DOWN;
}

/**
 * Reset camera to default orbital view
 *
 * Moves camera to the default orbital position without saving state.
 * Useful for initialization or reset operations.
 *
 * @function resetCameraView
 * @param {Function} [onComplete] - Optional callback when reset completes
 *
 * @example
 * // Reset to default view
 * resetCameraView(() => {
 *   console.log('Camera reset complete');
 * });
 */
export function resetCameraView(onComplete) {
    const camera = window.camera;
    const controls = window.controls;

    if (!camera) return;

    // Ensure controls are enabled
    if (controls && controls.enabled !== undefined) {
        controls.enabled = true;
    }

    // Default orbital position
    const defaultPosition = new window.THREE.Vector3(15, 10, 15);
    const defaultLookAt = new window.THREE.Vector3(0, 0, 0);

    // Animate to default position
    animateCameraTo(defaultPosition, defaultLookAt, () => {
        cameraViewMode = CameraViewMode.ORBITAL;

        // Update UI
        const buttonElement = document.getElementById('toggle-camera-view');
        if (buttonElement) {
            buttonElement.textContent = '📷 Top View';
        }

        if (onComplete) {
            onComplete();
        }
    });
}

/**
 * Initialize camera view system
 *
 * Sets up the camera view system and attaches event listeners.
 * Should be called during application initialization.
 *
 * @function initCameraViews
 *
 * @example
 * // Initialize during app setup
 * initCameraViews();
 */
export function initCameraViews() {
    // Set initial mode
    cameraViewMode = CameraViewMode.ORBITAL;

    // Attach toggle button listener
    const toggleButton = document.getElementById('toggle-camera-view');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleCameraView);
    }

    // Initialize button text
    if (toggleButton) {
        toggleButton.textContent = '📷 Top View';
    }
}

/**
 * Save current camera position and rotation
 *
 * Captures the current camera state for later restoration.
 * Useful before programmatic camera movements.
 *
 * @function saveCameraState
 *
 * @example
 * // Save state before animation
 * saveCameraState();
 * animateCameraTo(newPos, newLookAt);
 */
export function saveCameraState() {
    const camera = window.camera;
    if (!camera) return;

    savedCameraPosition = camera.position.clone();
    savedCameraRotation = camera.rotation.clone();
}

/**
 * Restore saved camera position and rotation
 *
 * Restores camera to previously saved state.
 * Returns false if no saved state exists.
 *
 * @function restoreCameraState
 * @param {boolean} [animated=true] - Whether to animate the restoration
 * @param {Function} [onComplete] - Optional callback when restoration completes
 * @returns {boolean} True if state was restored, false if no saved state
 *
 * @example
 * // Restore with animation
 * restoreCameraState(true, () => {
 *   console.log('Camera restored');
 * });
 *
 * @example
 * // Restore instantly
 * restoreCameraState(false);
 */
export function restoreCameraState(animated = true, onComplete) {
    const camera = window.camera;

    if (!camera || !savedCameraPosition) {
        return false;
    }

    if (animated) {
        const lookAt = new window.THREE.Vector3(0, 0, 0);
        animateCameraTo(savedCameraPosition, lookAt, () => {
            if (savedCameraRotation) {
                camera.rotation.copy(savedCameraRotation);
            }
            if (onComplete) {
                onComplete();
            }
        });
    } else {
        camera.position.copy(savedCameraPosition);
        if (savedCameraRotation) {
            camera.rotation.copy(savedCameraRotation);
        }
        if (onComplete) {
            onComplete();
        }
    }

    return true;
}
