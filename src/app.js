/**
 * @fileoverview Main Application Entry Point
 *
 * This is the central module that imports and wires together all application modules.
 * It provides:
 * - Global application state (CONFIG, STATE)
 * - Initialization sequence
 * - Global function exposure for HTML onclick handlers
 * - Module coordination and orchestration
 *
 * Initialization Order:
 * 1. Configuration loading (from localStorage or defaults)
 * 2. UI setup (canvas, hierarchy, inspector)
 * 3. 3D scene initialization
 * 4. Event listeners and keyboard shortcuts
 * 5. Autosave setup
 *
 * @module src/app
 * @author CabinetQuest Team
 * @version 1.0.0
 */

// ========================================
// IMPORT CONFIGURATION & CONSTANTS
// ========================================

import {
    CART_TYPES,
    DRAWER_COLOR_MAP,
    DEFAULT_DRAWER_COLOR,
    SELECTION_COLOR,
    SELECTION_INTENSITY,
    DRAWER_SELECTION_INTENSITY,
    DEFAULT_GRID_SIZE,
    FINE_GRID_SIZE,
    WHEEL_DIMENSIONS,
    DRAWER_PROPERTIES,
    HANDLE_DIMENSIONS,
    IV_POLE_DIMENSIONS,
    PROCEDURE_SURFACE,
    DRAWER_ANIMATION,
    CART_MATERIAL,
    DRAWER_MATERIAL,
    HANDLE_MATERIAL,
    WHEEL_MATERIAL
} from './config/constants.js';

import {
    DEFAULT_CARTS,
    DEFAULT_DRAWERS,
    DEFAULT_ITEMS,
    DEFAULT_SCENARIOS,
    DEFAULT_ACHIEVEMENTS,
    DEFAULT_CAMERA_VIEWS,
    DEFAULT_ROOM_SETTINGS,
    DEFAULT_SCORING_RULES,
    DEFAULT_GENERAL_SETTINGS,
    loadDefaultConfiguration,
    getDefaultConfiguration
} from './config/defaultData.js';

// ========================================
// IMPORT CORE MODULES
// ========================================

import {
    selectEntity,
    deselectEntity,
    getEntity
} from './core/state.js';

import {
    HISTORY,
    recordAction,
    undo,
    redo,
    canUndo,
    canRedo,
    updateUndoRedoButtons,
    setupUndoRedoKeyboard
} from './core/history.js';

// ========================================
// IMPORT PERSISTENCE MODULES
// ========================================

import {
    saveConfiguration,
    loadConfiguration,
    saveAll
} from './persistence/storage.js';

import {
    exportConfiguration
} from './persistence/export.js';

import {
    importConfiguration,
    processImport
} from './persistence/import.js';

import {
    validateAndMigrateConfig,
    resetToDefaults
} from './persistence/migration.js';

// ========================================
// IMPORT UI MODULES
// ========================================

import {
    showAlert,
    closeModal
} from './ui/alerts.js';

import {
    updateStatusBar
} from './ui/statusBar.js';

import {
    buildHierarchy,
    createCartsWithDrawersNode,
    createCategoryNode,
    refreshHierarchy,
    filterHierarchy
} from './ui/hierarchy.js';

import {
    updateInspector
} from './ui/inspector/inspector.js';

import {
    buildCartInspector
} from './ui/inspector/cartInspector.js';

import {
    buildDrawerInspector
} from './ui/inspector/drawerInspector.js';

import {
    buildItemInspector,
    buildItemMultiselect
} from './ui/inspector/itemInspector.js';

import {
    buildScenarioInspector
} from './ui/inspector/scenarioInspector.js';

import {
    buildCameraViewInspector,
    calculateCameraRotationData
} from './ui/inspector/cameraViewInspector.js';

import {
    buildAchievementInspector
} from './ui/inspector/achievementInspector.js';

// ========================================
// IMPORT ENTITY MANAGERS
// ========================================

import {
    updateCartProperty,
    updateCartPositionFeet,
    createNewCart
} from './entities/cartManager.js';

import {
    updateDrawerProperty,
    createNewDrawer
} from './entities/drawerManager.js';

import {
    updateItemProperty,
    createNewItem
} from './entities/itemManager.js';

import {
    updateScenarioProperty,
    createNewScenario
} from './entities/scenarioManager.js';

import {
    updateCameraViewProperty,
    createNewCameraView
} from './entities/cameraViewManager.js';

import {
    updateAchievementProperty,
    createNewAchievement
} from './entities/achievementManager.js';

import {
    deleteCurrentEntity
} from './entities/entityDeletion.js';

// ========================================
// IMPORT 3D MODULES
// ========================================

import {
    initThreeJS,
    onThreeResize,
    animateThree,
    setControls,
    setFloor,
    setFloorGrid,
    setSelectedCart3D,
    setDragPlane
} from './3d/scene.js';

import {
    createFloor,
    createGrid,
    createLighting,
    createOrbitControls,
    animateThreeScene
} from './3d/sceneObjects.js';

import {
    getDrawerColor,
    createDrawer,
    create3DCart,
    buildAll3DCarts
} from './3d/cartModel.js';

import {
    init3DInteraction,
    onThreeMouseDown,
    onThreeMouseMove,
    onThreeMouseUp
} from './3d/interaction.js';

import {
    selectCart3D,
    deselectCart3D,
    createSelectionHelpers,
    removeSelectionHelpers,
    selectDrawer3D,
    deselectDrawer3D,
    getSelectedDrawer3D,
    getSelectionHelpers
} from './3d/selection.js';

import {
    openDrawer,
    closeDrawer,
    animateDrawer,
    rotateCart,
    slideCart,
    pulseHighlight
} from './3d/animation.js';

// ========================================
// IMPORT 2D CANVAS MODULES
// ========================================

import {
    initCanvas,
    setupCanvas,
    getCanvasDimensions,
    updateCanvasSize,
    clearCanvas
} from './2d/canvas.js';

import {
    drawCanvas
} from './2d/drawing.js';

import {
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp
} from './2d/interaction.js';

import {
    CanvasMode,
    setCanvasMode,
    getCanvasMode,
    toggleCanvasMode,
    isRoomMode,
    isOverviewMode,
    initCanvasMode
} from './2d/modes.js';

// ========================================
// IMPORT VIEW MODULES
// ========================================

import {
    CameraViewMode,
    toggleCameraView,
    previewCameraView,
    animateCameraTo,
    getCameraViewMode,
    isOrbitalMode,
    isTopDownMode,
    resetCameraView,
    initCameraViews,
    saveCameraState,
    restoreCameraState
} from './views/cameraViews.js';

// ========================================
// IMPORT UTILITY MODULES
// ========================================

import {
    easeInOutCubic,
    clamp,
    lerp,
    snapToGrid,
    degreesToRadians,
    radiansToDegrees,
    distance2D,
    distance3D,
    mapRange
} from './utils/math.js';

// ========================================
// GLOBAL APPLICATION STATE
// ========================================

/**
 * Global configuration object containing all application data
 * @type {Object}
 * @property {Array} carts - All cart entities
 * @property {Array} drawers - All drawer entities
 * @property {Array} items - All item entities
 * @property {Array} scenarios - All scenario configurations
 * @property {Array} achievements - All achievement definitions
 * @property {Array} cameraViews - All camera view configurations
 * @property {Object} roomSettings - Room dimensions and appearance
 * @property {Object} scoringRules - Game scoring configuration
 * @property {Object} generalSettings - General app settings
 */
export let CONFIG = {
    carts: [],
    drawers: [],
    items: [],
    scenarios: [],
    achievements: [],
    cameraViews: [],
    roomSettings: {
        backgroundColor: '#fafafa',
        width: 30,  // feet
        depth: 25,  // feet
        height: 12, // feet
        pixelsPerFoot: 20
    },
    scoringRules: {
        essentialPoints: 60,
        optionalPoints: 20,
        penaltyPoints: 5,
        perfectBonus: 500,
        speedThreshold: 60,
        speedBonus: 300
    },
    generalSettings: {
        appTitle: 'Trauma Room Trainer',
        enableTutorial: true,
        enableSound: true,
        enableHaptics: true
    }
};

/**
 * Global application state for UI and interaction
 * @type {Object}
 * @property {string|null} selectedType - Currently selected entity type
 * @property {string|null} selectedId - Currently selected entity ID
 * @property {string} canvasMode - Canvas display mode ('room' or 'overview')
 * @property {Object|null} draggedCart - Cart being dragged (if any)
 * @property {Object} mousePos - Current mouse position in feet
 * @property {boolean} unsavedChanges - Whether there are unsaved changes
 * @property {boolean} snapToGrid - Whether grid snapping is enabled
 * @property {number} gridSize - Grid size in feet
 */
export let STATE = {
    selectedType: null,
    selectedId: null,
    canvasMode: 'room',
    draggedCart: null,
    mousePos: { x: 0, y: 0 },
    unsavedChanges: false,
    snapToGrid: true,
    gridSize: 1.0
};

// ========================================
// 3D SCENE GLOBALS
// ========================================

/**
 * Three.js scene object
 * @type {THREE.Scene|null}
 */
export let scene = null;

/**
 * Three.js camera object
 * @type {THREE.PerspectiveCamera|null}
 */
export let camera = null;

/**
 * Three.js renderer object
 * @type {THREE.WebGLRenderer|null}
 */
export let renderer = null;

/**
 * Orbit controls for camera manipulation
 * @type {OrbitControls|null}
 */
export let controls = null;

/**
 * Floor mesh object
 * @type {THREE.Mesh|null}
 */
export let floor = null;

/**
 * Grid helper object
 * @type {THREE.GridHelper|null}
 */
export let floorGrid = null;

/**
 * Currently selected cart in 3D view
 * @type {THREE.Group|null}
 */
export let selectedCart3D = null;

/**
 * Invisible plane for drag operations
 * @type {THREE.Mesh|null}
 */
export let dragPlane = null;

/**
 * Map of cart IDs to their 3D mesh groups
 * @type {Object<string, THREE.Group>}
 */
export let cartMeshes = {};

// ========================================
// 2D CANVAS GLOBALS
// ========================================

/**
 * Canvas element reference
 * @type {HTMLCanvasElement|null}
 */
export let canvas = null;

/**
 * Canvas 2D rendering context
 * @type {CanvasRenderingContext2D|null}
 */
export let ctx = null;

// ========================================
// SETTER FUNCTIONS FOR MODULE ACCESS
// ========================================

/**
 * Updates the global CONFIG object
 * This is used by modules that need to modify configuration
 * @param {Object} newConfig - New configuration object
 */
export function setConfig(newConfig) {
    CONFIG = newConfig;
}

/**
 * Updates the global STATE object
 * This is used by modules that need to modify state
 * @param {Object} newState - New state object
 */
export function setState(newState) {
    STATE = newState;
}

/**
 * Updates the Three.js scene object
 * @param {THREE.Scene} newScene - New scene object
 */
export function setScene(newScene) {
    scene = newScene;
}

/**
 * Updates the Three.js camera object
 * @param {THREE.Camera} newCamera - New camera object
 */
export function setCamera(newCamera) {
    camera = newCamera;
}

/**
 * Updates the Three.js renderer object
 * @param {THREE.WebGLRenderer} newRenderer - New renderer object
 */
export function setRenderer(newRenderer) {
    renderer = newRenderer;
}

/**
 * Updates the canvas element reference
 * @param {HTMLCanvasElement} newCanvas - New canvas element
 */
export function setCanvas(newCanvas) {
    canvas = newCanvas;
    ctx = newCanvas ? newCanvas.getContext('2d') : null;
}

/**
 * Updates the cart meshes map
 * @param {Object} newCartMeshes - New cart meshes object
 */
export function setCartMeshes(newCartMeshes) {
    cartMeshes = newCartMeshes;
}

// ========================================
// APPLICATION INITIALIZATION
// ========================================

/**
 * Synchronize 3D scene objects to window
 *
 * After 3D initialization, this copies the scene object references
 * to the window object so they're accessible to all modules and
 * HTML onclick handlers.
 *
 * Note: The 3D modules create these objects during initialization
 * and store them in module-scoped variables. We need to expose them
 * globally for cross-module access.
 */
function sync3DToWindow() {
    // Use dynamic import to get the current values from the scene module
    // This is necessary because the objects are created at runtime
    Promise.all([
        import('./3d/scene.js'),
        import('./3d/cartModel.js')
    ]).then(([sceneModule, cartModule]) => {
        // Sync scene objects
        window.scene = sceneModule.scene;
        window.camera = sceneModule.camera;
        window.renderer = sceneModule.renderer;
        window.controls = sceneModule.controls;
        window.floor = sceneModule.floor;
        window.floorGrid = sceneModule.floorGrid;
        window.selectedCart3D = sceneModule.selectedCart3D;
        window.dragPlane = sceneModule.dragPlane;

        // Sync cart meshes
        window.cartMeshes = cartModule.cartMeshes || {};

        console.log('✓ 3D objects synced to window');
    });
}

/**
 * Main application initialization function
 *
 * This function coordinates the startup sequence:
 * 1. Load configuration (from localStorage or defaults)
 * 2. Setup 2D canvas and event listeners
 * 3. Build UI hierarchy and status bar
 * 4. Initialize 3D scene and objects
 * 5. Setup keyboard shortcuts
 * 6. Start autosave timer
 *
 * Called automatically on window.onload
 */
export function init() {
    console.log('🚀 Initializing CabinetQuest Teacher...');

    // ===== STEP 1: LOAD CONFIGURATION =====
    console.log('📦 Loading configuration...');
    loadConfiguration();
    console.log('✓ Configuration loaded');

    // ===== STEP 2: SETUP 2D CANVAS =====
    console.log('🎨 Setting up 2D canvas...');
    if (!initCanvas()) {
        console.error('Failed to initialize canvas');
        return;
    }
    setupCanvas();

    // Sync UI controls with loaded config
    document.getElementById('room-bg-color').value = CONFIG.roomSettings.backgroundColor;
    document.getElementById('room-width').value = CONFIG.roomSettings.width;
    document.getElementById('room-height').value = CONFIG.roomSettings.depth;
    document.getElementById('grid-size').value = STATE.gridSize;

    // Set canvas size based on room dimensions
    updateCanvasSize(
        CONFIG.roomSettings.width,
        CONFIG.roomSettings.depth,
        CONFIG.roomSettings.pixelsPerFoot
    );

    drawCanvas();
    console.log('✓ 2D canvas ready');

    // ===== STEP 3: BUILD UI =====
    console.log('🏗️ Building UI hierarchy...');
    buildHierarchy();
    updateStatusBar();
    console.log('✓ UI hierarchy built');

    // ===== STEP 4: INITIALIZE 3D SCENE =====
    console.log('🎬 Initializing 3D scene...');
    initThreeJS();
    createFloor();
    createGrid();
    createLighting();
    createOrbitControls();
    init3DInteraction();
    buildAll3DCarts();
    animateThreeScene();

    // Sync 3D objects to window for cross-module access
    sync3DToWindow();

    console.log('✓ 3D scene ready');

    // ===== STEP 5: SETUP KEYBOARD SHORTCUTS =====
    console.log('⌨️ Setting up keyboard shortcuts...');
    setupUndoRedoKeyboard();
    updateUndoRedoButtons();
    console.log('✓ Keyboard shortcuts ready');

    // ===== STEP 6: SETUP AUTOSAVE =====
    console.log('💾 Setting up autosave...');
    setInterval(() => {
        if (STATE.unsavedChanges) {
            saveConfiguration();
            STATE.unsavedChanges = false;
        }
    }, 5000); // Autosave every 5 seconds
    console.log('✓ Autosave enabled (5s interval)');

    // ===== STEP 7: SETUP ADDITIONAL LISTENERS =====
    // Grid size listener
    document.getElementById('grid-size').addEventListener('input', (e) => {
        STATE.gridSize = parseFloat(e.target.value);
        drawCanvas();
    });

    console.log('✅ CabinetQuest Teacher initialized successfully!');
}

/**
 * Preview the game in a new tab
 *
 * Saves the current configuration and opens the trainer.html in a new tab
 * so the designer can test their configuration.
 */
export function previewGame() {
    // Save current config to localStorage so trainer can use it
    saveConfiguration();

    // Open the trainer page (the actual game)
    const previewUrl = 'trainer.html';
    const previewWindow = window.open(previewUrl, '_blank');

    if (previewWindow) {
        showAlert('Preview opened in new tab', 'success');
    } else {
        showAlert('Please allow popups to preview the game', 'error');
    }
}

// ========================================
// GLOBAL API EXPORT
// ========================================

/**
 * Global App object exposed to window for HTML onclick handlers
 *
 * This object contains all functions that need to be accessible from
 * HTML onclick attributes and other global contexts.
 */
const App = {
    // ===== CONFIGURATION & STATE =====
    CONFIG,
    STATE,
    HISTORY,

    // ===== CONSTANTS =====
    CART_TYPES,
    DRAWER_COLOR_MAP,
    CanvasMode,
    CameraViewMode,

    // ===== CORE FUNCTIONS =====
    init,
    selectEntity,
    deselectEntity,
    getEntity,

    // ===== HISTORY =====
    recordAction,
    undo,
    redo,
    canUndo,
    canRedo,
    updateUndoRedoButtons,

    // ===== PERSISTENCE =====
    saveConfiguration,
    saveAll,
    loadConfiguration,
    exportConfiguration,
    importConfiguration,
    processImport,
    resetToDefaults,

    // ===== UI =====
    showAlert,
    closeModal,
    buildHierarchy,
    refreshHierarchy,
    filterHierarchy,
    updateStatusBar,
    updateInspector,

    // ===== ENTITY MANAGEMENT =====
    createNewCart,
    createNewDrawer,
    createNewItem,
    createNewScenario,
    createNewCameraView,
    createNewAchievement,
    updateCartProperty,
    updateCartPositionFeet,
    updateDrawerProperty,
    updateItemProperty,
    updateScenarioProperty,
    updateCameraViewProperty,
    updateAchievementProperty,
    deleteCurrentEntity,

    // ===== 3D SCENE =====
    initThreeJS,
    buildAll3DCarts,
    selectCart3D,
    deselectCart3D,
    selectDrawer3D,
    deselectDrawer3D,

    // ===== 2D CANVAS =====
    drawCanvas,
    setCanvasMode,
    getCanvasMode,
    toggleCanvasMode,

    // ===== CAMERA VIEWS =====
    toggleCameraView,
    previewCameraView,

    // ===== PREVIEW =====
    previewGame,

    // ===== UTILITIES =====
    snapToGrid,
    degreesToRadians,
    radiansToDegrees
};

// Make App globally available for HTML onclick handlers
if (typeof window !== 'undefined') {
    window.App = App;

    // Also expose global objects directly for backward compatibility
    window.CONFIG = CONFIG;
    window.STATE = STATE;
    window.HISTORY = HISTORY;
    window.CART_TYPES = CART_TYPES;
    window.DRAWER_COLOR_MAP = DRAWER_COLOR_MAP;

    // Expose 3D scene objects for module access
    window.scene = scene;
    window.camera = camera;
    window.renderer = renderer;
    window.controls = controls;
    window.floor = floor;
    window.floorGrid = floorGrid;
    window.selectedCart3D = selectedCart3D;
    window.dragPlane = dragPlane;
    window.cartMeshes = cartMeshes;

    // Expose 2D canvas objects for module access
    window.canvas = canvas;
    window.ctx = ctx;

    // Expose setter functions for modules to update globals
    window.setScene = setScene;
    window.setCamera = setCamera;
    window.setRenderer = setRenderer;
    window.setControls = setControls;
    window.setFloor = setFloor;
    window.setFloorGrid = setFloorGrid;
    window.setSelectedCart3D = setSelectedCart3D;
    window.setDragPlane = setDragPlane;
    window.setCanvas = setCanvas;
    window.setCartMeshes = setCartMeshes;

    // Expose individual functions that HTML uses directly
    window.undo = undo;
    window.redo = redo;
    window.saveAll = saveAll;
    window.exportConfiguration = exportConfiguration;
    window.importConfiguration = importConfiguration;
    window.processImport = processImport;
    window.resetToDefaults = resetToDefaults;
    window.refreshHierarchy = refreshHierarchy;
    window.setCanvasMode = setCanvasMode;
    window.toggleCameraView = toggleCameraView;
    window.previewGame = previewGame;
    window.closeModal = closeModal;

    // Setup window.onload handler
    window.onload = init;
}

// ========================================
// DEFAULT EXPORT
// ========================================

export default App;
