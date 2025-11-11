/**
 * Export Module
 *
 * Provides functionality to export the application configuration to a JSON file.
 * This module allows users to download their entire configuration for backup,
 * sharing, or migration purposes.
 *
 * @module persistence/export
 * @requires None - Uses browser Blob and URL APIs
 *
 * Dependencies:
 * - Global CONFIG object (must be in scope when imported)
 * - showAlert() from ui/alerts.js (for user feedback)
 *
 * @author CabinetQuest Team
 * @version 1.0.0
 */

/**
 * Exports the current configuration to a JSON file.
 *
 * This function performs the following operations:
 * 1. Serializes the CONFIG object to formatted JSON (with 2-space indentation)
 * 2. Creates a Blob containing the JSON data
 * 3. Generates a temporary download URL
 * 4. Programmatically triggers a download with timestamped filename
 * 5. Shows a success alert to the user
 *
 * The exported file is named with the pattern: trauma-room-config-{timestamp}.json
 * where timestamp is the current Unix timestamp in milliseconds.
 *
 * @function exportConfiguration
 * @returns {void}
 *
 * @example
 * // Typically called from an "Export" button
 * document.getElementById('export-btn').addEventListener('click', exportConfiguration);
 *
 * @example
 * // The exported JSON structure includes all configuration:
 * {
 *   "carts": [...],
 *   "drawers": [...],
 *   "items": [...],
 *   "scenarios": [...],
 *   "achievements": [...],
 *   "cameraViews": [...],
 *   "roomSettings": {...},
 *   "scoringRules": {...},
 *   "generalSettings": {...}
 * }
 *
 * @requires showAlert from ui/alerts.js
 * @see {@link importConfiguration} in persistence/import.js for the corresponding import function
 */
export function exportConfiguration() {
    // Step 1: Serialize CONFIG to JSON with pretty formatting (2-space indent)
    const dataStr = JSON.stringify(CONFIG, null, 2);

    // Step 2: Create a Blob with the JSON data
    // Content type is set to 'application/json' for proper MIME type
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    // Step 3: Create a temporary URL for the Blob
    // This URL is only valid for the current page session
    const url = URL.createObjectURL(dataBlob);

    // Step 4: Create and configure a temporary download link
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with timestamp for uniqueness
    // Example: trauma-room-config-1699876543210.json
    link.download = `trauma-room-config-${Date.now()}.json`;

    // Step 5: Trigger the download programmatically
    link.click();

    // Step 6: Provide user feedback
    showAlert('Configuration exported', 'success');

    // Note: The Blob URL will be automatically cleaned up by the browser
    // when the page is unloaded. For immediate cleanup, you could add:
    // URL.revokeObjectURL(url);
}

/**
 * File Format Specification
 * -------------------------
 * The exported JSON file follows this structure:
 *
 * @typedef {Object} ExportedConfig
 * @property {Array<Object>} carts - Cart definitions with positions and properties
 * @property {Array<Object>} drawers - Drawer definitions linked to carts
 * @property {Array<Object>} items - Item definitions with drawer placements
 * @property {Array<Object>} scenarios - Training scenario definitions
 * @property {Array<Object>} achievements - Achievement unlock conditions
 * @property {Array<Object>} cameraViews - 3D camera view presets
 * @property {Object} roomSettings - Room appearance settings (colors, dimensions)
 * @property {Object} scoringRules - Point values and scoring thresholds
 * @property {Object} generalSettings - Application-wide settings (title, features)
 *
 * @example
 * // Sample minimal exported configuration
 * {
 *   "carts": [
 *     {
 *       "id": "airway",
 *       "name": "Airway Cart",
 *       "type": "airway",
 *       "x": 0.2,
 *       "y": 0.3,
 *       "width": 80,
 *       "height": 80,
 *       "rotation": 0,
 *       "color": "#4CAF50"
 *     }
 *   ],
 *   "drawers": [
 *     {
 *       "id": "d1",
 *       "cart": "airway",
 *       "name": "Top Drawer",
 *       "number": 1
 *     }
 *   ],
 *   "roomSettings": {
 *     "backgroundColor": "#fafafa",
 *     "width": 800,
 *     "height": 600
 *   }
 * }
 */
