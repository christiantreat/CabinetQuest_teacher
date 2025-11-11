/**
 * Alerts Module
 *
 * Provides user notification and modal management functionality.
 * This module handles displaying toast notifications and controlling
 * modal dialogs throughout the application.
 *
 * @module ui/alerts
 * @requires None - Pure JavaScript DOM manipulation
 *
 * Dependencies:
 * - DOM elements:
 *   - #alert-toast: Toast notification element
 *   - Modal elements passed to closeModal() by ID
 *
 * CSS Classes Used:
 * - .alert-toast: Base toast styling
 * - .show: Makes toast visible
 * - .success: Green success styling
 * - .error: Red error styling
 * - .active: Makes modals visible
 *
 * @author CabinetQuest Team
 * @version 1.0.0
 */

/**
 * Displays a toast notification to the user.
 *
 * Shows a temporary toast message at a fixed position (typically bottom-right
 * of the screen). The toast automatically disappears after 3 seconds.
 *
 * Toast types:
 * - 'success': Green toast for successful operations
 * - 'error': Red toast for errors or failures
 * - Custom types can be added via CSS
 *
 * The function:
 * 1. Sets the message text
 * 2. Applies CSS classes for visibility and styling
 * 3. Sets a timeout to hide the toast after 3 seconds
 *
 * @function showAlert
 * @param {string} message - The message to display in the toast
 * @param {string} [type='success'] - The type of alert ('success', 'error', etc.)
 * @returns {void}
 *
 * @example
 * // Show a success message
 * showAlert('Configuration saved successfully', 'success');
 *
 * @example
 * // Show an error message
 * showAlert('Failed to load file', 'error');
 *
 * @example
 * // Default type is 'success'
 * showAlert('Operation complete');
 *
 * @example
 * // Multiple alerts in sequence
 * showAlert('Step 1 complete', 'success');
 * // Previous toast will be replaced if called within 3 seconds
 * showAlert('Step 2 complete', 'success');
 */
export function showAlert(message, type = 'success') {
    // Step 1: Get the toast element from the DOM
    const alert = document.getElementById('alert-toast');

    // Step 2: Set the message text
    alert.textContent = message;

    // Step 3: Apply CSS classes for visibility and styling
    // Replace all classes with: 'alert-toast' + 'show' + type (e.g., 'success')
    alert.className = `alert-toast show ${type}`;

    // Step 4: Auto-hide the toast after 3 seconds (3000ms)
    setTimeout(() => {
        alert.classList.remove('show');
    }, 3000);
}

/**
 * Closes a modal dialog by removing its 'active' class.
 *
 * This function provides a generic way to close any modal dialog in the
 * application. It assumes modals are shown/hidden using an 'active' CSS class.
 *
 * The function:
 * 1. Finds the modal element by ID
 * 2. Removes the 'active' class to hide it
 *
 * Note: This function does not validate if the element exists. If the ID
 * is invalid, it will throw an error. Consider adding error handling if needed.
 *
 * @function closeModal
 * @param {string} id - The DOM element ID of the modal to close (without '#')
 * @returns {void}
 *
 * @example
 * // Close the import modal
 * closeModal('import-modal');
 *
 * @example
 * // Close a confirmation dialog
 * closeModal('confirm-delete-modal');
 *
 * @example
 * // Typically called from modal close buttons or after operations complete
 * document.querySelector('#import-modal .close-btn').addEventListener('click', () => {
 *   closeModal('import-modal');
 * });
 *
 * @example
 * // Programmatic closing after successful import
 * function processImport() {
 *   // ... import logic ...
 *   closeModal('import-modal');
 *   showAlert('Import successful', 'success');
 * }
 */
export function closeModal(id) {
    // Get the modal element by ID and remove the 'active' class
    // The 'active' class is assumed to control modal visibility via CSS
    document.getElementById(id).classList.remove('active');
}

/**
 * HTML Structure Requirements
 * ----------------------------
 * For this module to work correctly, the HTML must include:
 *
 * @example
 * <!-- Toast notification element -->
 * <div id="alert-toast" class="alert-toast"></div>
 *
 * @example
 * <!-- Modal structure -->
 * <div id="import-modal" class="modal">
 *   <div class="modal-content">
 *     <button onclick="closeModal('import-modal')">Close</button>
 *     <!-- Modal content -->
 *   </div>
 * </div>
 */

/**
 * CSS Requirements
 * ----------------
 * Required CSS classes for proper functionality:
 *
 * @example
 * // Toast base styles
 * .alert-toast {
 *   position: fixed;
 *   bottom: 20px;
 *   right: 20px;
 *   padding: 15px 25px;
 *   border-radius: 4px;
 *   opacity: 0;
 *   transition: opacity 0.3s;
 *   z-index: 10000;
 * }
 *
 * // Show state
 * .alert-toast.show {
 *   opacity: 1;
 * }
 *
 * // Success type
 * .alert-toast.success {
 *   background-color: #4CAF50;
 *   color: white;
 * }
 *
 * // Error type
 * .alert-toast.error {
 *   background-color: #f44336;
 *   color: white;
 * }
 *
 * // Modal base styles
 * .modal {
 *   display: none;
 *   position: fixed;
 *   top: 0;
 *   left: 0;
 *   width: 100%;
 *   height: 100%;
 *   background-color: rgba(0, 0, 0, 0.5);
 *   z-index: 9999;
 * }
 *
 * // Active modal
 * .modal.active {
 *   display: flex;
 * }
 */

/**
 * Usage Patterns
 * --------------
 * Common usage patterns throughout the application:
 *
 * @example
 * // Success operation
 * function saveData() {
 *   localStorage.setItem('data', JSON.stringify(data));
 *   showAlert('Data saved successfully', 'success');
 * }
 *
 * @example
 * // Error handling
 * function loadData() {
 *   try {
 *     const data = JSON.parse(localStorage.getItem('data'));
 *   } catch (error) {
 *     showAlert('Failed to load data: ' + error.message, 'error');
 *   }
 * }
 *
 * @example
 * // Modal workflow
 * function openSettings() {
 *   document.getElementById('settings-modal').classList.add('active');
 * }
 *
 * function saveSettings() {
 *   // ... save logic ...
 *   closeModal('settings-modal');
 *   showAlert('Settings saved', 'success');
 * }
 *
 * function cancelSettings() {
 *   closeModal('settings-modal');
 * }
 */

/**
 * Alert Type Extensions
 * ---------------------
 * To add new alert types, simply add corresponding CSS:
 *
 * @example
 * // Warning type
 * .alert-toast.warning {
 *   background-color: #ff9800;
 *   color: white;
 * }
 *
 * // Usage:
 * showAlert('This action cannot be undone', 'warning');
 *
 * @example
 * // Info type
 * .alert-toast.info {
 *   background-color: #2196F3;
 *   color: white;
 * }
 *
 * // Usage:
 * showAlert('Loading configuration...', 'info');
 */
