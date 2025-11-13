/**
 * @fileoverview Scenario Manager Module
 * @description Manages scenario entities including creation and property updates.
 * Scenarios define training situations with required items, objectives, and feedback.
 * They are the core of the educational gameplay experience.
 *
 * @module entities/scenarioManager
 * @requires globals (CONFIG, STATE)
 * @requires helpers (getEntity, recordAction, buildHierarchy, selectEntity, showAlert)
 */

// Import required globals and helper functions
const CONFIG = window.CONFIG;
const STATE = window.STATE;
const getEntity = window.getEntity;
const recordAction = window.recordAction;
const buildHierarchy = window.buildHierarchy;
const selectEntity = window.selectEntity;
const showAlert = window.showAlert;
const updateStatusBar = window.updateStatusBar;

// ========================================
// SCENARIO PROPERTY UPDATES
// ========================================

/**
 * Updates a property on the currently selected scenario entity
 *
 * @description
 * This function updates any property on a scenario and handles side effects:
 * - Records the change for undo/redo functionality
 * - Updates the visual hierarchy in the UI
 *
 * Scenario Properties:
 * - id: Unique identifier for the scenario
 * - name: Display name of the scenario
 * - description: Detailed description of the medical emergency or training situation
 * - essential: Array of item IDs that are required for success
 * - optional: Array of item IDs that provide bonus points
 * - successFeedback: Message shown when player collects all essential items
 * - partialFeedback: Message shown when player collects some but not all essential items
 * - failureFeedback: Message shown when player misses critical items
 *
 * @param {string} prop - The property name to update
 * @param {*} value - The new value for the property
 *
 * @example
 * // Update scenario name
 * updateScenarioProperty('name', 'Cardiac Arrest Response');
 *
 * @example
 * // Update scenario description
 * updateScenarioProperty('description', 'Patient in full cardiac arrest, requires immediate intervention');
 *
 * @example
 * // Update success feedback message
 * updateScenarioProperty('successFeedback', 'Excellent! You gathered all critical items.');
 */
export function updateScenarioProperty(prop, value) {
    const scenario = getEntity('scenario', STATE.selectedId);
    if (scenario) {
        const oldValue = scenario[prop];
        scenario[prop] = value;
        STATE.unsavedChanges = true;

        // Record action for undo/redo
        recordAction('UPDATE_SCENARIO_PROPERTY', {
            scenarioId: scenario.id,
            property: prop,
            oldValue: oldValue,
            newValue: value
        });

        buildHierarchy();
    }
}

// ========================================
// SCENARIO CREATION
// ========================================

/**
 * Creates a new scenario entity with default properties
 *
 * @description
 * Generates a new scenario with a unique timestamp-based ID and default properties:
 * - Default name: 'New Scenario'
 * - Default description: 'Describe the medical emergency here...'
 * - Empty essential items list
 * - Empty optional items list
 * - Default success feedback: 'Perfect!'
 * - Default partial feedback: 'Good, but incomplete.'
 * - Default failure feedback: 'Missing critical items.'
 *
 * The function:
 * 1. Creates the scenario object
 * 2. Adds it to CONFIG.scenarios
 * 3. Updates the unsaved changes flag
 * 4. Rebuilds the hierarchy UI
 * 5. Updates the status bar
 * 6. Selects the new scenario
 *
 * After creation, use toggleScenarioItem() to add items to the essential/optional lists.
 *
 * @returns {void}
 *
 * @example
 * // Create a new scenario
 * createNewScenario();
 * // Result: A new scenario is created and selected, ready for configuration
 */
export function createNewScenario() {
    const id = `scenario_${Date.now()}`;
    const newScenario = {
        id: id,
        name: 'New Scenario',
        description: 'Describe the medical emergency here...',
        essential: [],
        optional: [],
        successFeedback: 'Perfect!',
        partialFeedback: 'Good, but incomplete.',
        failureFeedback: 'Missing critical items.'
    };

    CONFIG.scenarios.push(newScenario);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('scenario', id);
    showAlert('New scenario created', 'success');
}
