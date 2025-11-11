/**
 * @fileoverview Scenario Inspector Panel Module
 *
 * This module builds and manages the scenario property panel in the inspector.
 * When a scenario is selected in the hierarchy, this panel displays editable properties
 * including scenario identification, item requirements, and feedback messages.
 *
 * Features:
 * - Scenario identification (ID, Name, Description)
 * - Essential items multiselect (required items for scenario completion)
 * - Optional items multiselect (bonus items that improve score)
 * - Customizable feedback messages (success, partial success, failure)
 * - Delete action
 *
 * Scenarios define learning challenges where students must gather specific items
 * from the carts. Essential items are required for completion, while optional items
 * provide bonus points. The feedback messages guide student learning based on their
 * performance.
 *
 * @module ui/inspector/scenarioInspector
 * @requires ui/inspector/itemInspector - buildItemMultiselect function
 * @requires globals - CONFIG
 *
 * @author CabinetQuest Teacher
 * @version 1.0.0
 */

import { buildItemMultiselect } from './itemInspector.js';

/**
 * Builds and displays the scenario property panel in the inspector.
 *
 * This function generates a comprehensive property panel for scenario entities with:
 * - Basic properties (ID, name, description)
 * - Essential items multiselect grid (clickable item chips)
 * - Optional items multiselect grid (clickable item chips)
 * - Feedback message customization (success, partial, failure)
 * - Delete action button
 *
 * The multiselect grids allow instructors to visually select which items are
 * required (essential) versus which items earn bonus points (optional). Students
 * receive different feedback based on which items they collect:
 *
 * Scoring Logic:
 * - All essential items: Success feedback
 * - Some essential items: Partial success feedback
 * - Missing essential items: Failure feedback
 * - Optional items: Bonus points added to score
 *
 * @function buildScenarioInspector
 * @param {Object} scenario - The scenario entity to display properties for
 * @param {string} scenario.id - Unique identifier for the scenario
 * @param {string} scenario.name - Display name of the scenario (e.g., "Cardiac Arrest Response")
 * @param {string} scenario.description - Detailed description of the scenario
 * @param {string[]} [scenario.essential=[]] - Array of item IDs required for completion
 * @param {string[]} [scenario.optional=[]] - Array of item IDs that provide bonus points
 * @param {string} [scenario.successFeedback='Perfect!'] - Message shown when all essential items collected
 * @param {string} [scenario.partialFeedback='Good, but incomplete.'] - Message shown when some essential items collected
 * @param {string} [scenario.failureFeedback='Missing critical items.'] - Message shown when essential items missing
 * @param {HTMLElement} container - The DOM element to render the panel into
 * @returns {void}
 *
 * @example
 * // Build inspector for a cardiac arrest scenario
 * const scenario = {
 *   id: 'scenario-cardiac-arrest',
 *   name: 'Cardiac Arrest Response',
 *   description: 'Respond to a patient in cardiac arrest by gathering essential medications and equipment.',
 *   essential: ['item-epi', 'item-atropine', 'item-defibrillator'],
 *   optional: ['item-amiodarone', 'item-lidocaine'],
 *   successFeedback: 'Excellent! You gathered all essential items.',
 *   partialFeedback: 'Good start, but you missed some critical items.',
 *   failureFeedback: 'Missing essential items. Review the cardiac arrest protocol.'
 * };
 * const container = document.getElementById('inspector-content');
 * buildScenarioInspector(scenario, container);
 *
 * @example
 * // Build inspector for a new scenario with defaults
 * const scenario = {
 *   id: 'scenario-new',
 *   name: 'New Scenario',
 *   description: '',
 *   essential: [],
 *   optional: []
 * };
 * buildScenarioInspector(scenario, container); // Shows default feedback messages
 *
 * @example
 * // Build inspector showing item selection
 * const scenario = {
 *   id: 'scenario-airway',
 *   name: 'Difficult Airway Management',
 *   description: 'Manage a difficult airway situation.',
 *   essential: ['item-laryngoscope', 'item-ett'],
 *   optional: ['item-bougie', 'item-video-scope']
 * };
 * buildScenarioInspector(scenario, container);
 * // Essential items appear highlighted in the multiselect grid
 * // Optional items appear highlighted in separate grid
 */
export function buildScenarioInspector(scenario, container) {
    // Build multiselect HTML for essential items
    // These are required items that must be collected for scenario completion
    const essentialHTML = buildItemMultiselect(scenario.essential || [], 'essential');

    // Build multiselect HTML for optional items
    // These are bonus items that improve the score but aren't required
    const optionalHTML = buildItemMultiselect(scenario.optional || [], 'optional');

    // Build the inspector panel HTML with inline event handlers
    // Note: Event handlers call global functions defined in teacher.js
    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Scenario Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${scenario.id}" onchange="updateScenarioProperty('id', this.value)">
            </div>

            <div class="form-field">
                <label>Name</label>
                <input type="text" value="${scenario.name}" onchange="updateScenarioProperty('name', this.value)">
            </div>

            <div class="form-field">
                <label>Description</label>
                <textarea onchange="updateScenarioProperty('description', this.value)">${scenario.description}</textarea>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Essential Items</div>
            <div class="item-multiselect" id="essential-items">
                ${essentialHTML}
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Optional Items</div>
            <div class="item-multiselect" id="optional-items">
                ${optionalHTML}
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Feedback Messages</div>

            <div class="form-field">
                <label>Success Message</label>
                <textarea onchange="updateScenarioProperty('successFeedback', this.value)">${scenario.successFeedback || 'Perfect!'}</textarea>
            </div>

            <div class="form-field">
                <label>Partial Success Message</label>
                <textarea onchange="updateScenarioProperty('partialFeedback', this.value)">${scenario.partialFeedback || 'Good, but incomplete.'}</textarea>
            </div>

            <div class="form-field">
                <label>Failure Message</label>
                <textarea onchange="updateScenarioProperty('failureFeedback', this.value)">${scenario.failureFeedback || 'Missing critical items.'}</textarea>
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Scenario</button>
        </div>
    `;
}
