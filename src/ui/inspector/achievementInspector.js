/**
 * @fileoverview Achievement Inspector Panel Module
 *
 * This module builds and manages the achievement property panel in the inspector.
 * When an achievement is selected in the hierarchy, this panel displays editable
 * properties including achievement identification, display information, and trigger
 * conditions.
 *
 * Features:
 * - Achievement identification (ID, Title, Description)
 * - Icon customization (emoji or character)
 * - Trigger type selection (first scenario, perfect score, speed, efficient, count, all)
 * - Trigger value configuration (for count-based achievements)
 * - Delete action
 *
 * Achievements provide gamification and motivation for students. They unlock when
 * specific conditions are met during gameplay, such as completing scenarios with
 * perfect scores, finishing quickly, or collecting only essential items.
 *
 * Trigger Types:
 * - first-scenario: Awarded upon completing the first scenario
 * - perfect-score: Awarded for getting a perfect score on any scenario
 * - speed: Awarded for completing a scenario under a time threshold
 * - efficient: Awarded for collecting only essential items (no extras)
 * - count: Awarded after completing N scenarios (value specifies N)
 * - all: Awarded after completing all scenarios
 *
 * @module ui/inspector/achievementInspector
 * @requires globals - None (self-contained)
 *
 * @author CabinetQuest Teacher
 * @version 1.0.0
 */

/**
 * Builds and displays the achievement property panel in the inspector.
 *
 * This function generates a property panel for achievement entities with:
 * - Basic properties (ID, title, description)
 * - Visual customization (icon field accepting emoji or special characters)
 * - Trigger configuration (type dropdown and value input)
 * - Delete action button
 *
 * The trigger type determines when the achievement unlocks:
 * - first-scenario: Unlocks when student completes their first scenario
 * - perfect-score: Unlocks when student achieves 100% on a scenario
 * - speed: Unlocks when student completes scenario quickly (value = max seconds)
 * - efficient: Unlocks when student collects only essential items
 * - count: Unlocks after completing N scenarios (value = required count)
 * - all: Unlocks after completing all available scenarios
 *
 * The value field is used differently depending on trigger type:
 * - speed: Maximum time in seconds
 * - count: Number of scenarios to complete
 * - Others: Value is ignored (can be 0)
 *
 * @function buildAchievementInspector
 * @param {Object} achievement - The achievement entity to display properties for
 * @param {string} achievement.id - Unique identifier for the achievement
 * @param {string} achievement.title - Display title of the achievement (e.g., "First Steps")
 * @param {string} achievement.description - Description shown when achievement unlocks
 * @param {string} [achievement.icon='🏆'] - Emoji or character to display (max 2 characters)
 * @param {string} achievement.trigger - Trigger type (first-scenario, perfect-score, speed, efficient, count, all)
 * @param {number} [achievement.value=0] - Trigger value (used for speed and count types)
 * @param {HTMLElement} container - The DOM element to render the panel into
 * @returns {void}
 *
 * @example
 * // Build inspector for a first scenario achievement
 * const achievement = {
 *   id: 'first-steps',
 *   title: 'First Steps',
 *   description: 'Complete your first scenario',
 *   icon: '🎯',
 *   trigger: 'first-scenario',
 *   value: 0
 * };
 * const container = document.getElementById('inspector-content');
 * buildAchievementInspector(achievement, container);
 *
 * @example
 * // Build inspector for a count-based achievement
 * const achievement = {
 *   id: 'experienced',
 *   title: 'Experienced Responder',
 *   description: 'Complete 10 scenarios',
 *   icon: '⭐',
 *   trigger: 'count',
 *   value: 10
 * };
 * buildAchievementInspector(achievement, container);
 * // Value field shows 10 (number of scenarios required)
 *
 * @example
 * // Build inspector for a speed achievement
 * const achievement = {
 *   id: 'speed-demon',
 *   title: 'Speed Demon',
 *   description: 'Complete a scenario in under 60 seconds',
 *   icon: '⚡',
 *   trigger: 'speed',
 *   value: 60
 * };
 * buildAchievementInspector(achievement, container);
 * // Value field shows 60 (maximum seconds allowed)
 *
 * @example
 * // Build inspector for a perfect score achievement
 * const achievement = {
 *   id: 'perfectionist',
 *   title: 'Perfectionist',
 *   description: 'Achieve a perfect score',
 *   icon: '💯',
 *   trigger: 'perfect-score',
 *   value: 0
 * };
 * buildAchievementInspector(achievement, container);
 * // Value field shows 0 (not used for this trigger type)
 *
 * @example
 * // Build inspector for an efficiency achievement
 * const achievement = {
 *   id: 'efficient',
 *   title: 'Efficient Responder',
 *   description: 'Collect only essential items with no extras',
 *   icon: '🎯',
 *   trigger: 'efficient',
 *   value: 0
 * };
 * buildAchievementInspector(achievement, container);
 */
export function buildAchievementInspector(achievement, container) {
    // Build the inspector panel HTML with inline event handlers
    // Note: Event handlers call global functions defined in teacher.js
    container.innerHTML = `
        <div class="inspector-section">
            <div class="inspector-section-title">Achievement Properties</div>

            <div class="form-field">
                <label>ID</label>
                <input type="text" value="${achievement.id}" onchange="updateAchievementProperty('id', this.value)">
            </div>

            <div class="form-field">
                <label>Title</label>
                <input type="text" value="${achievement.title}" onchange="updateAchievementProperty('title', this.value)">
            </div>

            <div class="form-field">
                <label>Description</label>
                <textarea onchange="updateAchievementProperty('description', this.value)">${achievement.description}</textarea>
            </div>

            <div class="form-field">
                <label>Icon</label>
                <input type="text" value="${achievement.icon || '🏆'}" maxlength="2" onchange="updateAchievementProperty('icon', this.value)">
            </div>

            <div class="form-field">
                <label>Trigger Type</label>
                <select onchange="updateAchievementProperty('trigger', this.value)">
                    <option value="first-scenario" ${achievement.trigger === 'first-scenario' ? 'selected' : ''}>First Scenario</option>
                    <option value="perfect-score" ${achievement.trigger === 'perfect-score' ? 'selected' : ''}>Perfect Score</option>
                    <option value="speed" ${achievement.trigger === 'speed' ? 'selected' : ''}>Speed Challenge</option>
                    <option value="efficient" ${achievement.trigger === 'efficient' ? 'selected' : ''}>Efficient (No Extras)</option>
                    <option value="count" ${achievement.trigger === 'count' ? 'selected' : ''}>Complete N Scenarios</option>
                    <option value="all" ${achievement.trigger === 'all' ? 'selected' : ''}>All Scenarios</option>
                </select>
            </div>

            <div class="form-field">
                <label>Trigger Value</label>
                <input type="number" min="0" value="${achievement.value || 0}" onchange="updateAchievementProperty('value', parseInt(this.value))">
            </div>
        </div>

        <div class="inspector-section">
            <div class="inspector-section-title">Actions</div>
            <button class="btn btn-danger btn-block" onclick="deleteCurrentEntity()">🗑️ Delete Achievement</button>
        </div>
    `;
}
