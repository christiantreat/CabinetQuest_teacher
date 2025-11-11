/**
 * Import Module
 *
 * Handles importing configuration from JSON files. This module provides
 * functionality to read, validate, and apply configuration files created
 * by the export functionality or manually crafted.
 *
 * @module persistence/import
 * @requires FileReader API for reading uploaded files
 *
 * Dependencies:
 * - Global CONFIG object (must be in scope when imported)
 * - validateAndMigrateConfig() from persistence/migration.js
 * - saveConfiguration() from persistence/storage.js
 * - buildHierarchy() from teacher.js (rebuilds hierarchy UI)
 * - updateStatusBar() from ui/statusBar.js
 * - drawCanvas() from teacher.js (redraws 2D canvas)
 * - buildAll3DCarts() from teacher.js (rebuilds 3D scene)
 * - showAlert() from ui/alerts.js
 * - closeModal() from ui/alerts.js
 *
 * @author CabinetQuest Team
 * @version 1.0.0
 */

/**
 * Opens the import modal dialog.
 *
 * Displays the import modal to allow users to select a configuration file
 * for import. This function simply shows the UI; the actual import logic
 * is handled by processImport().
 *
 * @function importConfiguration
 * @returns {void}
 *
 * @example
 * // Typically called from an "Import" button
 * document.getElementById('import-btn').addEventListener('click', importConfiguration);
 *
 * @see {@link processImport} for the actual import processing logic
 */
export function importConfiguration() {
    // Show the import modal by adding the 'active' class
    document.getElementById('import-modal').classList.add('active');
}

/**
 * Processes the selected configuration file and imports it.
 *
 * This function performs the complete import workflow:
 * 1. Validates that a file was selected
 * 2. Reads the file content using FileReader API
 * 3. Parses the JSON data
 * 4. Validates and migrates the configuration (handles version differences)
 * 5. Replaces the current CONFIG with the imported one
 * 6. Saves the new configuration to localStorage
 * 7. Rebuilds all UI components to reflect the new configuration
 * 8. Closes the import modal
 * 9. Shows success/error feedback
 *
 * The function includes error handling for:
 * - No file selected
 * - Invalid JSON format
 * - Configuration validation failures
 * - File reading errors
 *
 * @function processImport
 * @returns {void}
 *
 * @throws {Error} If the configuration file is invalid or missing required properties
 *
 * @example
 * // Typically called from the import modal's "Import" button
 * document.getElementById('import-process-btn').addEventListener('click', processImport);
 *
 * @requires validateAndMigrateConfig from persistence/migration.js
 * @requires saveConfiguration from persistence/storage.js
 * @requires buildHierarchy from teacher.js
 * @requires updateStatusBar from ui/statusBar.js
 * @requires drawCanvas from teacher.js
 * @requires buildAll3DCarts from teacher.js
 * @requires showAlert from ui/alerts.js
 * @requires closeModal from ui/alerts.js
 */
export function processImport() {
    // Step 1: Get the file input element and selected file
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    // Step 2: Validate that a file was selected
    if (!file) {
        showAlert('Please select a file', 'error');
        return;
    }

    // Step 3: Create a FileReader to read the file content
    const reader = new FileReader();

    // Step 4: Define the handler for when the file is loaded
    reader.onload = (e) => {
        try {
            // Step 5: Parse the JSON content
            let importedConfig = JSON.parse(e.target.result);

            // Step 6: Validate and migrate the configuration
            // This handles version differences and ensures all required properties exist
            importedConfig = validateAndMigrateConfig(importedConfig);

            // Step 7: Replace the current configuration with the imported one
            CONFIG = importedConfig;

            // Step 8: Persist the new configuration to localStorage
            saveConfiguration();

            // Step 9: Rebuild all UI components to reflect the new configuration
            buildHierarchy();        // Rebuild the hierarchy tree view
            updateStatusBar();       // Update status bar counts
            drawCanvas();            // Redraw the 2D canvas view
            buildAll3DCarts();       // Rebuild the 3D scene

            // Step 10: Close the import modal
            closeModal('import-modal');

            // Step 11: Show success feedback
            showAlert('Configuration imported successfully', 'success');

        } catch (error) {
            // Step 12: Handle any errors during import
            console.error('Import error:', error);
            showAlert('Invalid configuration file: ' + error.message, 'error');
        }
    };

    // Step 13: Start reading the file as text
    // This triggers the reader.onload handler when complete
    reader.readAsText(file);
}

/**
 * Expected Configuration File Format
 * -----------------------------------
 * The import function expects a JSON file with the following structure:
 *
 * @typedef {Object} ImportableConfig
 * @property {Array<Object>} carts - Required. Cart definitions
 * @property {Array<Object>} [drawers] - Optional. Drawer definitions
 * @property {Array<Object>} [items] - Optional. Item definitions
 * @property {Array<Object>} [scenarios] - Optional. Scenario definitions
 * @property {Array<Object>} [achievements] - Optional. Achievement definitions
 * @property {Array<Object>} [cameraViews] - Optional. Camera view presets
 * @property {Object} [roomSettings] - Optional. Room appearance settings
 * @property {Object} [scoringRules] - Optional. Scoring configuration
 * @property {Object} [generalSettings] - Optional. General app settings
 *
 * @example
 * // Minimal valid configuration
 * {
 *   "carts": [
 *     {
 *       "id": "cart1",
 *       "name": "My Cart",
 *       "type": "supply",
 *       "x": 0.5,
 *       "y": 0.5,
 *       "width": 80,
 *       "height": 80,
 *       "rotation": 0,
 *       "color": "#4CAF50"
 *     }
 *   ]
 * }
 *
 * @example
 * // Error handling examples
 * // Invalid JSON:
 * {
 *   "carts": [  // <- Missing closing bracket
 * }
 * // Result: "Invalid configuration file: Unexpected end of JSON input"
 *
 * // Missing required property:
 * {
 *   "drawers": []  // <- Missing 'carts' array
 * }
 * // Result: "Invalid configuration file: Missing or invalid carts array"
 */

/**
 * Import Process Flow
 * -------------------
 * 1. User clicks Import button → importConfiguration() shows modal
 * 2. User selects file in modal
 * 3. User clicks Process/Import button → processImport() is called
 * 4. File is read using FileReader API
 * 5. JSON is parsed
 * 6. Configuration is validated via validateAndMigrateConfig()
 * 7. Old configuration is replaced
 * 8. New configuration is saved to localStorage
 * 9. All UI components are rebuilt
 * 10. Modal is closed and success message shown
 */
