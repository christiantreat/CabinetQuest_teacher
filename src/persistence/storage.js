/**
 * Storage Module
 *
 * Handles all local storage operations for the Trauma Room Trainer configuration.
 * This module provides functions to save and load the application configuration
 * to/from browser localStorage.
 *
 * @module persistence/storage
 * @requires None - Pure JavaScript localStorage API
 *
 * Dependencies:
 * - Global CONFIG object (must be in scope when imported)
 * - Global STATE object (must be in scope when imported)
 * - showAlert() from ui/alerts.js (for saveAll function)
 *
 * localStorage Key:
 * - 'traumaRoomConfig': Stores the entire CONFIG object as JSON string
 *
 * @author CabinetQuest Team
 * @version 1.0.0
 */

import { loadDefaultConfiguration } from '../config/defaultData.js';

/**
 * Saves the current configuration to localStorage.
 *
 * Serializes the entire CONFIG object to JSON and stores it in localStorage
 * under the key 'traumaRoomConfig'. This function is typically called after
 * any configuration changes to persist them across browser sessions.
 *
 * @function saveConfiguration
 * @returns {void}
 *
 * @example
 * // After modifying CONFIG
 * CONFIG.carts.push(newCart);
 * saveConfiguration(); // Persist changes
 *
 * @see {@link loadConfiguration} for the corresponding load function
 */
export function saveConfiguration() {
    localStorage.setItem('traumaRoomConfig', JSON.stringify(CONFIG));
}

/**
 * Saves all configuration changes and updates UI feedback.
 *
 * This is a higher-level save function that:
 * 1. Calls saveConfiguration() to persist data
 * 2. Resets the unsaved changes flag in STATE
 * 3. Updates the status message with timestamp
 * 4. Shows a success alert to the user
 *
 * @function saveAll
 * @returns {void}
 *
 * @example
 * // Typically called from a "Save" button click
 * document.getElementById('save-btn').addEventListener('click', saveAll);
 *
 * @requires showAlert from ui/alerts.js
 * @see {@link saveConfiguration} for the core save operation
 */
export function saveAll() {
    // Persist configuration to localStorage
    saveConfiguration();

    // Clear the unsaved changes flag
    STATE.unsavedChanges = false;

    // Update status bar with save timestamp
    document.getElementById('status-message').textContent = 'Saved at ' + new Date().toLocaleTimeString();

    // Show user feedback
    showAlert('All changes saved', 'success');
}

/**
 * Loads configuration from localStorage or initializes with defaults.
 *
 * Attempts to load the saved configuration from localStorage. If found,
 * it parses the JSON and merges it with the CONFIG object, ensuring all
 * required properties exist. If no saved configuration exists, it calls
 * loadDefaultConfiguration() to initialize with default values.
 *
 * The function performs a defensive merge, keeping existing CONFIG structure
 * values as fallbacks if any properties are missing from the loaded data.
 *
 * @function loadConfiguration
 * @returns {void}
 *
 * @example
 * // Called during application initialization
 * window.onload = function() {
 *     loadConfiguration();
 *     // ... rest of initialization
 * };
 *
 * @see {@link saveConfiguration} for the corresponding save function
 * @see {@link loadDefaultConfiguration} for default initialization
 */
export function loadConfiguration() {
    // Attempt to retrieve saved configuration
    const saved = localStorage.getItem('traumaRoomConfig');

    if (saved) {
        // Parse the saved JSON configuration
        const loadedConfig = JSON.parse(saved);

        // Merge loaded config with default structure to ensure all properties exist
        // This defensive approach prevents errors if the saved config is missing properties
        CONFIG.carts = loadedConfig.carts || [];
        CONFIG.drawers = loadedConfig.drawers || [];
        CONFIG.items = loadedConfig.items || [];
        CONFIG.scenarios = loadedConfig.scenarios || [];
        CONFIG.achievements = loadedConfig.achievements || [];
        CONFIG.cameraViews = loadedConfig.cameraViews || [];

        // Settings objects with fallbacks to current CONFIG values
        CONFIG.roomSettings = loadedConfig.roomSettings || CONFIG.roomSettings;
        CONFIG.scoringRules = loadedConfig.scoringRules || CONFIG.scoringRules;
        CONFIG.generalSettings = loadedConfig.generalSettings || CONFIG.generalSettings;
    } else {
        // No saved configuration found - initialize with defaults
        loadDefaultConfiguration(CONFIG);
    }

    // Update UI elements to reflect loaded settings
    // Note: Assumes the element exists; add error handling if needed
    document.getElementById('room-bg-color').value = CONFIG.roomSettings.backgroundColor;
}

/**
 * Note: The loadDefaultConfiguration() function is called by loadConfiguration()
 * but is defined elsewhere in the application. It should be imported if this
 * module is used independently.
 *
 * External function reference:
 * @external loadDefaultConfiguration
 * @description Initializes CONFIG with default values for a new installation
 */
