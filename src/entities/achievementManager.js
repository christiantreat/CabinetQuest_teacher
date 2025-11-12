/**
 * @fileoverview Achievement Manager Module
 * @description Manages achievement entities including creation and property updates.
 * Achievements are unlockable rewards that motivate players and track their progress
 * through the training scenarios.
 *
 * @module entities/achievementManager
 * @requires globals (CONFIG, STATE)
 * @requires helpers (getEntity, recordAction, buildHierarchy, selectEntity, showAlert)
 */

// ========================================
// ACHIEVEMENT PROPERTY UPDATES
// ========================================

/**
 * Updates a property on the currently selected achievement entity
 *
 * @description
 * This function updates any property on an achievement and handles side effects:
 * - Records the change for undo/redo functionality
 * - Updates the visual hierarchy in the UI
 *
 * Achievement Properties:
 * - id: Unique identifier for the achievement
 * - title: Display title of the achievement
 * - description: Detailed description of how to earn this achievement
 * - icon: Emoji or icon representing the achievement (e.g., '🏆', '⭐', '🎯')
 * - trigger: Event that unlocks the achievement (e.g., 'first-scenario', 'perfect-score', 'speed-bonus')
 * - value: Numeric value associated with the achievement (e.g., scenario count, time threshold)
 *
 * Common Trigger Types:
 * - 'first-scenario': Complete first scenario
 * - 'complete-all': Complete all scenarios
 * - 'perfect-score': Get perfect score on any scenario
 * - 'speed-bonus': Complete scenario under time threshold
 * - 'no-mistakes': Complete scenario without wrong items
 * - 'scenario-count': Complete N scenarios (value = N)
 *
 * @param {string} prop - The property name to update
 * @param {*} value - The new value for the property
 *
 * @example
 * // Update achievement title
 * updateAchievementProperty('title', 'Speed Demon');
 *
 * @example
 * // Update achievement description
 * updateAchievementProperty('description', 'Complete any scenario in under 30 seconds');
 *
 * @example
 * // Update achievement icon
 * updateAchievementProperty('icon', '⚡');
 *
 * @example
 * // Update achievement trigger
 * updateAchievementProperty('trigger', 'speed-bonus');
 *
 * @example
 * // Update achievement value (for count-based achievements)
 * updateAchievementProperty('value', 5); // Complete 5 scenarios
 */
export function updateAchievementProperty(prop, value) {
    const achievement = getEntity('achievement', STATE.selectedId);
    if (achievement) {
        const oldValue = achievement[prop];
        achievement[prop] = value;
        STATE.unsavedChanges = true;

        // Record action for undo/redo
        recordAction('UPDATE_ACHIEVEMENT_PROPERTY', {
            achievementId: achievement.id,
            property: prop,
            oldValue: oldValue,
            newValue: value
        });

        buildHierarchy();
    }
}

// ========================================
// ACHIEVEMENT CREATION
// ========================================

/**
 * Creates a new achievement entity with default properties
 *
 * @description
 * Generates a new achievement with a unique timestamp-based ID and default properties:
 * - Default title: 'New Achievement'
 * - Default description: 'Describe how to earn this achievement...'
 * - Default icon: '🏆' (trophy emoji)
 * - Default trigger: 'first-scenario'
 * - Default value: 0
 *
 * The function:
 * 1. Creates the achievement object
 * 2. Adds it to CONFIG.achievements
 * 3. Updates the unsaved changes flag
 * 4. Rebuilds the hierarchy UI
 * 5. Updates the status bar
 * 6. Selects the new achievement
 *
 * After creation, customize the achievement's title, description, icon, trigger,
 * and value to match your desired unlock criteria.
 *
 * @returns {void}
 *
 * @example
 * // Create a new achievement
 * createNewAchievement();
 * // Result: A new achievement is created and selected, ready for configuration
 *
 * @example
 * // Typical workflow:
 * createNewAchievement();
 * updateAchievementProperty('title', 'First Timer');
 * updateAchievementProperty('description', 'Complete your first scenario');
 * updateAchievementProperty('icon', '🎓');
 * updateAchievementProperty('trigger', 'first-scenario');
 */
export function createNewAchievement() {
    const id = `achievement_${Date.now()}`;
    const newAchievement = {
        id: id,
        title: 'New Achievement',
        description: 'Describe how to earn this achievement...',
        icon: '🏆',
        trigger: 'first-scenario',
        value: 0
    };

    CONFIG.achievements.push(newAchievement);
    STATE.unsavedChanges = true;
    buildHierarchy();
    updateStatusBar();
    selectEntity('achievement', id);
    showAlert('New achievement created', 'success');
}
