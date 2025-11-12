/**
 * @fileoverview Room Settings Management
 *
 * Handles room configuration changes:
 * - Room dimensions (width/depth)
 * - Room background color
 * - Grid snapping toggle
 *
 * @module src/ui/roomSettings
 */

import { showAlert } from './alerts.js';

/**
 * Updates room dimensions and rebuilds canvas and 3D scene
 * Called when room width or depth input changes
 */
export function updateRoomSize() {
    const widthFeet = parseInt(document.getElementById('room-width').value);
    const depthFeet = parseInt(document.getElementById('room-height').value);

    window.CONFIG.roomSettings.width = widthFeet;
    window.CONFIG.roomSettings.depth = depthFeet;

    // Update canvas size based on feet and scale factor
    const canvas = document.getElementById('room-canvas');
    if (canvas) {
        canvas.width = widthFeet * window.CONFIG.roomSettings.pixelsPerFoot;
        canvas.height = depthFeet * window.CONFIG.roomSettings.pixelsPerFoot;
    }

    window.STATE.unsavedChanges = true;
    window.App.drawCanvas();

    // Rebuild 3D floor and grid with new dimensions
    if (window.floor) {
        window.scene.remove(window.floor);
        window.floor.geometry.dispose();
        window.floor.material.dispose();
    }
    if (window.floorGrid) {
        window.scene.remove(window.floorGrid);
        window.floorGrid.geometry.dispose();
        window.floorGrid.material.dispose();
    }

    // Import createFloor and createGrid dynamically
    import('../3d/sceneObjects.js').then(module => {
        module.createFloor();
        module.createGrid();
    });

    // Update all cart positions to maintain origin at center with new room dimensions
    window.CONFIG.carts.forEach(cart => {
        // Cart positions are stored as percentages (0-1), so they stay relative
        // Just need to redraw everything
    });

    window.App.buildAll3DCarts();
}

/**
 * Updates room background color
 * Called when background color input changes
 */
export function updateRoomBackground() {
    window.CONFIG.roomSettings.backgroundColor = document.getElementById('room-bg-color').value;
    window.STATE.unsavedChanges = true;
    window.App.drawCanvas();
}

/**
 * Toggles grid snapping on/off
 * Called when snap-to-grid checkbox changes
 */
export function updateSnapToGrid() {
    window.STATE.snapToGrid = document.getElementById('snap-to-grid').checked;
    showAlert(`Snap to grid ${window.STATE.snapToGrid ? 'enabled' : 'disabled'}`, 'success');
}
