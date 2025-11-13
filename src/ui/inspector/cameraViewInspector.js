/**
 * @fileoverview Camera View Inspector Panel Module
 *
 * This module builds and manages the camera view property panel in the inspector.
 * When a camera view is selected in the hierarchy, this panel displays editable properties
 * including camera position, look-at target, field of view, and calculated rotation data.
 *
 * Features:
 * - Camera view identification (Name, Description, Type)
 * - 3D position controls (X, Y, Z in feet)
 * - Look-at target controls (X, Y, Z in feet)
 * - Calculated rotation display (yaw, pitch, direction vector, facing)
 * - Field of view adjustment
 * - Preset position buttons (entry, overhead, current view)
 * - Optional target assignment (cart or drawer)
 * - Preview and delete actions
 *
 * The calculated rotation section shows how the camera's position and look-at target
 * translate to yaw/pitch rotations in the game preview mode. This helps instructors
 * understand the camera orientation and ensure views are positioned correctly.
 *
 * @module ui/inspector/cameraViewInspector
 * @requires THREE - Three.js library for vector math
 * @requires globals - CONFIG
 *
 * @author CabinetQuest Teacher
 * @version 1.0.0
 */

/**
 * Calculates camera rotation data from position and look-at target.
 *
 * This helper function computes yaw (horizontal rotation) and pitch (vertical rotation)
 * angles from a camera's position and look-at target. The calculations match the
 * formulas used in trainer.js to ensure consistency between the teacher tool preview
 * and the actual game view.
 *
 * The function also determines a human-readable facing direction (North, South, East, West)
 * to help instructors understand camera orientation at a glance.
 *
 * Coordinate System:
 * - +X axis: East (right)
 * - -X axis: West (left)
 * - +Y axis: Up (height)
 * - -Y axis: Down
 * - +Z axis: North (toward entrance)
 * - -Z axis: South (into room)
 *
 * Camera Convention:
 * - Three.js cameras look down their local -Z axis
 * - Yaw = 0° means facing South (into room, -Z direction)
 * - Pitch = 0° means looking horizontally
 * - Positive pitch = looking up
 * - Negative pitch = looking down
 *
 * @function calculateCameraRotationData
 * @param {Object} view - The camera view entity with position and lookAt properties
 * @param {Object} view.position - Camera position in feet
 * @param {number} view.position.x - X coordinate (east/west)
 * @param {number} view.position.y - Y coordinate (height)
 * @param {number} view.position.z - Z coordinate (north/south)
 * @param {Object} view.lookAt - Target point the camera is looking at
 * @param {number} view.lookAt.x - Target X coordinate
 * @param {number} view.lookAt.y - Target Y coordinate
 * @param {number} view.lookAt.z - Target Z coordinate
 * @returns {Object} Rotation data object
 * @returns {number} returns.yaw - Horizontal rotation in radians
 * @returns {number} returns.yawDeg - Horizontal rotation in degrees
 * @returns {number} returns.pitch - Vertical rotation in radians
 * @returns {number} returns.pitchDeg - Vertical rotation in degrees
 * @returns {THREE.Vector3} returns.direction - Normalized direction vector
 * @returns {string} returns.facing - Human-readable facing direction
 *
 * @example
 * // Calculate rotation for camera looking at room center from entry
 * const view = {
 *   position: { x: 0, y: 6, z: 15 },  // At entry, elevated
 *   lookAt: { x: 0, y: 3, z: 0 }      // Looking at room center
 * };
 * const rotation = calculateCameraRotationData(view);
 * console.log(rotation.facing); // "South (into room, -Z)"
 * console.log(rotation.yawDeg); // ~0° (facing into room)
 * console.log(rotation.pitchDeg); // Negative (looking down)
 *
 * @example
 * // Calculate rotation for overhead camera
 * const view = {
 *   position: { x: 0, y: 20, z: 0 },  // High above center
 *   lookAt: { x: 0, y: 0, z: 0 }       // Looking straight down
 * };
 * const rotation = calculateCameraRotationData(view);
 * console.log(rotation.pitchDeg); // ~-90° (looking straight down)
 *
 * @example
 * // Calculate rotation for side view
 * const view = {
 *   position: { x: -10, y: 5, z: 0 }, // West side of room
 *   lookAt: { x: 0, y: 3, z: 0 }       // Looking at center
 * };
 * const rotation = calculateCameraRotationData(view);
 * console.log(rotation.facing); // "East (+X)"
 * console.log(rotation.yawDeg); // ~90° (facing east)
 */
export function calculateCameraRotationData(view) {
    // Create position and lookAt vectors using Three.js Vector3
    const position = new THREE.Vector3(view.position.x, view.position.y, view.position.z);
    const lookAt = new THREE.Vector3(view.lookAt.x, view.lookAt.y, view.lookAt.z);

    // Calculate direction vector from position to lookAt
    // This represents the direction the camera is facing
    const direction = lookAt.clone().sub(position).normalize();

    // Calculate yaw (horizontal rotation) and pitch (vertical rotation)
    // Formula matches trainer.js:331-332 to ensure consistency
    // Three.js cameras look down their local -Z axis, so we negate direction.z
    const yaw = Math.atan2(direction.x, -direction.z);    // Horizontal angle
    const pitch = Math.asin(-direction.y);                 // Vertical angle

    // Calculate direction vector from yaw and pitch for verification
    // This should match the original direction vector
    // Formula matches trainer.js:1766-1770
    const directionFromRotation = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),      // X component
        -Math.sin(pitch),                      // Y component
        -Math.cos(yaw) * Math.cos(pitch)      // Z component
    );

    // Determine human-readable facing direction based on yaw angle
    // Divides the horizontal plane into four quadrants
    // Formula matches trainer.js:1773-1778
    const yawDeg = yaw * 180 / Math.PI;
    let facing = '';
    if (yawDeg >= -45 && yawDeg < 45) {
        facing = 'South (into room, -Z)';
    } else if (yawDeg >= 45 && yawDeg < 135) {
        facing = 'West (-X)';
    } else if (yawDeg >= 135 || yawDeg < -135) {
        facing = 'North (toward entrance, +Z)';
    } else {
        facing = 'East (+X)';
    }

    // Return comprehensive rotation data for display
    return {
        yaw: yaw,                              // Radians
        yawDeg: yawDeg,                        // Degrees
        pitch: pitch,                          // Radians
        pitchDeg: pitch * 180 / Math.PI,      // Degrees
        direction: directionFromRotation,      // Vector3
        facing: facing                         // String description
    };
}

/**
 * Builds and displays the camera view property panel in the inspector.
 *
 * This function generates a comprehensive property panel for camera view entities with:
 * - Basic properties (name, description, type)
 * - Position controls (X, Y, Z coordinates in feet)
 * - Look-at target controls (X, Y, Z coordinates in feet)
 * - Calculated rotation display (read-only, shows yaw, pitch, direction, facing)
 * - Field of view adjustment
 * - Preset buttons (entry view, overhead view, use current 3D view)
 * - Optional target assignment (cart or drawer for guided views)
 * - Preview and delete action buttons
 *
 * The calculated rotation section is highlighted in a blue background to draw attention
 * to the important relationship between position/lookAt and the actual game view rotation.
 * This helps instructors understand how students will see the camera view during gameplay.
 *
 * View Types:
 * - Overview: Wide view of entire room or large area
 * - Close-up: Focused view of specific cart or drawer
 * - Custom: Manually configured view position
 *
 * @function buildCameraViewInspector
 * @param {Object} view - The camera view entity to display properties for
 * @param {string} view.name - Display name of the camera view
 * @param {string} view.description - Description of what this view shows
 * @param {string} view.type - View type ('overview', 'closeup', 'custom')
 * @param {Object} view.position - Camera position in feet
 * @param {number} view.position.x - X position
 * @param {number} view.position.y - Y position (height)
 * @param {number} view.position.z - Z position
 * @param {Object} view.lookAt - Target point in feet
 * @param {number} view.lookAt.x - Target X
 * @param {number} view.lookAt.y - Target Y
 * @param {number} view.lookAt.z - Target Z
 * @param {number} view.fov - Field of view in degrees (30-120)
 * @param {string} [view.targetCart] - Optional cart ID to focus on
 * @param {string} [view.targetDrawer] - Optional drawer ID to focus on
 * @param {HTMLElement} container - The DOM element to render the panel into
 * @returns {void}
 *
 * @example
 * // Build inspector for an entry overview camera
 * const view = {
 *   name: 'Entry View',
 *   description: 'View from the entrance showing the entire room',
 *   type: 'overview',
 *   position: { x: 0, y: 7, z: 15 },
 *   lookAt: { x: 0, y: 3, z: 0 },
 *   fov: 75,
 *   targetCart: null,
 *   targetDrawer: null
 * };
 * const container = document.getElementById('inspector-content');
 * buildCameraViewInspector(view, container);
 *
 * @example
 * // Build inspector for a close-up view of specific cart
 * const view = {
 *   name: 'Crash Cart Close-up',
 *   description: 'Close view of the main crash cart',
 *   type: 'closeup',
 *   position: { x: 3, y: 4, z: 5 },
 *   lookAt: { x: 0, y: 2.5, z: 0 },
 *   fov: 60,
 *   targetCart: 'crash-cart',
 *   targetDrawer: 'drawer-meds'
 * };
 * buildCameraViewInspector(view, container);
 */
export function buildCameraViewInspector(view, container) {
    // Build cart selection dropdown for optional targeting
    // Filter out inventory cart as it's not relevant for student views
    const cartOptions = window.CONFIG.carts.filter(c => !c.isInventory).map(c =>
        `<option value="${c.id}" ${view.targetCart === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    // Build drawer selection dropdown for optional targeting
    const drawerOptions = window.CONFIG.drawers.map(d =>
        `<option value="${d.id}" ${view.targetDrawer === d.id ? 'selected' : ''}>${d.name}</option>`
    ).join('');

    // Calculate rotation data to show consistency with game preview
    // This shows instructors how the camera will appear to students
    const rotationData = calculateCameraRotationData(view);

    // Build the inspector panel HTML with inline event handlers
    // Note: Event handlers call global functions defined in teacher.js
    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Camera View Properties</div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${view.name}" onchange="updateCameraViewProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Description</label>
                <textarea onchange="updateCameraViewProperty('description', this.value)">${view.description}</textarea>
            </div>

            <div class="form-field">
                <label>View Type</label>
                <select onchange="updateCameraViewProperty('type', this.value)">
                    <option value="overview" ${view.type === 'overview' ? 'selected' : ''}>Room Overview</option>
                    <option value="closeup" ${view.type === 'closeup' ? 'selected' : ''}>Close-up</option>
                    <option value="custom" ${view.type === 'custom' ? 'selected' : ''}>Custom</option>
                </select>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Camera Position (feet)</div>

            <div class="form-field">
                <label>X Position</label>
                <input type="number" step="0.5" value="${view.position.x}" onchange="updateCameraViewPosition('x', parseFloat(this.value))">
            </div>

            <div class="form-field">
                <label>Y Position (height)</label>
                <input type="number" step="0.5" value="${view.position.y}" onchange="updateCameraViewPosition('y', parseFloat(this.value))">
            </div>

            <div class="form-field">
                <label>Z Position</label>
                <input type="number" step="0.5" value="${view.position.z}" onchange="updateCameraViewPosition('z', parseFloat(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Look At Target (feet)</div>

            <div class="form-field">
                <label>X Target</label>
                <input type="number" step="0.5" value="${view.lookAt.x}" onchange="updateCameraViewLookAt('x', parseFloat(this.value))">
            </div>

            <div class="form-field">
                <label>Y Target</label>
                <input type="number" step="0.5" value="${view.lookAt.y}" onchange="updateCameraViewLookAt('y', parseFloat(this.value))">
            </div>

            <div class="form-field">
                <label>Z Target</label>
                <input type="number" step="0.5" value="${view.lookAt.z}" onchange="updateCameraViewLookAt('z', parseFloat(this.value))">
            </div>
        </div>

        <div class="inspector-section" style="background-color: #f0f8ff; border-left: 4px solid #4CAF50;">
            <div class="inspector-section-title">📐 Calculated Rotation (Game Preview)</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px;">
                This shows how the camera will appear in game preview mode
            </div>

            <div class="form-field">
                <label>Yaw (Horizontal Rotation)</label>
                <div style="padding: 8px; background: white; border-radius: 4px; font-family: monospace;">
                    ${rotationData.yawDeg.toFixed(2)}° (${rotationData.yaw.toFixed(4)} rad)
                </div>
            </div>

            <div class="form-field">
                <label>Pitch (Vertical Rotation)</label>
                <div style="padding: 8px; background: white; border-radius: 4px; font-family: monospace;">
                    ${rotationData.pitchDeg.toFixed(2)}° (${rotationData.pitch.toFixed(4)} rad)
                </div>
            </div>

            <div class="form-field">
                <label>Direction Vector</label>
                <div style="padding: 8px; background: white; border-radius: 4px; font-family: monospace;">
                    (${rotationData.direction.x.toFixed(4)}, ${rotationData.direction.y.toFixed(4)}, ${rotationData.direction.z.toFixed(4)})
                </div>
            </div>

            <div class="form-field">
                <label>Facing Direction</label>
                <div style="padding: 8px; background: white; border-radius: 4px; font-weight: bold; color: #4CAF50;">
                    ${rotationData.facing}
                </div>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Camera Settings</div>

            <div class="form-field">
                <label>Field of View (FOV)</label>
                <input type="number" min="30" max="120" value="${view.fov}" onchange="updateCameraViewProperty('fov', parseFloat(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Presets</div>

            <button class="btn btn-secondary btn-block" onclick="setCameraViewPreset('entry')">📍 Entry View</button>
            <button class="btn btn-secondary btn-block" onclick="setCameraViewPreset('overhead')">🔝 Overhead View</button>
            <button class="btn btn-secondary btn-block" onclick="setCameraViewPreset('current')">📷 Use Current 3D View</button>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Target (Optional)</div>

            <div class="form-field">
                <label>Target Cart</label>
                <select onchange="updateCameraViewProperty('targetCart', this.value || null)">
                    <option value="">None</option>
                    ${cartOptions}
                </select>
            </div>

            <div class="form-field">
                <label>Target Drawer</label>
                <select onchange="updateCameraViewProperty('targetDrawer', this.value || null)">
                    <option value="">None</option>
                    ${drawerOptions}
                </select>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-primary btn-block" onclick="previewCameraView()">👁️ Preview in 3D</button>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Camera View</button>
        </div>
    `;
}
