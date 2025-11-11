/**
 * Default Configuration Data
 *
 * This module contains all the default initial data that populates the CONFIG object
 * when the application starts or when reset to defaults is triggered.
 *
 * Data includes:
 * - Default carts (emergency medical carts with positioning)
 * - Default drawers (storage compartments within each cart)
 * - Default items (medical equipment and supplies)
 * - Default scenarios (emergency medical situations for training)
 * - Default achievements (gamification rewards)
 * - Default camera views (3D camera perspectives)
 * - Default settings (room, scoring, and general application settings)
 */

/**
 * Default Carts Configuration
 *
 * Defines the emergency medical carts in the trauma room.
 * Each cart represents a specialized equipment station.
 *
 * Properties:
 * - id: Unique identifier for the cart
 * - name: Display name of the cart
 * - type: Cart type (affects 3D model rendering)
 * - x: Horizontal position in room (0.0-1.0, relative to room width)
 * - y: Vertical position in room (0.0-1.0, relative to room depth)
 * - width: Cart width in pixels (for 2D canvas)
 * - height: Cart height in pixels (for 2D canvas)
 * - rotation: Cart rotation in degrees (0, 90, 180, 270)
 * - color: Cart color for visual identification
 * - isInventory: Whether this is the procedure table (inventory staging area)
 */
export const DEFAULT_CARTS = [
    {
        id: 'airway',
        name: 'Airway Cart',
        type: 'airway',
        x: 0.2,
        y: 0.3,
        width: 80,
        height: 80,
        rotation: 0,
        color: '#4CAF50' // Green - airway management
    },
    {
        id: 'med',
        name: 'Medication Cart',
        type: 'medication',
        x: 0.8,
        y: 0.3,
        width: 80,
        height: 80,
        rotation: 90,
        color: '#FF9800' // Orange - medications
    },
    {
        id: 'code',
        name: 'Crash Cart (Code Cart)',
        type: 'crash',
        x: 0.2,
        y: 0.7,
        width: 80,
        height: 80,
        rotation: 180,
        color: '#F44336' // Red - emergency/code situations
    },
    {
        id: 'trauma',
        name: 'Trauma Cart',
        type: 'trauma',
        x: 0.8,
        y: 0.7,
        width: 80,
        height: 80,
        rotation: 270,
        color: '#E91E63' // Pink - trauma care
    },
    {
        id: 'inventory',
        name: 'Procedure Table',
        type: 'procedure',
        x: 0.5,
        y: 0.5,
        width: 80,
        height: 80,
        rotation: 0,
        color: '#757575', // Gray - neutral procedure area
        isInventory: true // Marks this as the inventory/staging area
    }
];

/**
 * Default Drawers Configuration
 *
 * Defines the drawers within each cart. Each cart typically has 3 drawers
 * (top, middle, bottom) for organizing equipment.
 *
 * Properties:
 * - id: Unique identifier for the drawer
 * - cart: Parent cart ID this drawer belongs to
 * - name: Display name of the drawer
 * - number: Drawer position (1=top, 2=middle, 3=bottom)
 */
export const DEFAULT_DRAWERS = [
    // Airway Cart Drawers (d1-d3)
    { id: 'd1', cart: 'airway', name: 'Top Drawer', number: 1 },
    { id: 'd2', cart: 'airway', name: 'Middle Drawer', number: 2 },
    { id: 'd3', cart: 'airway', name: 'Bottom Drawer', number: 3 },

    // Medication Cart Drawers (d4-d6)
    { id: 'd4', cart: 'med', name: 'Top Drawer', number: 1 },
    { id: 'd5', cart: 'med', name: 'Middle Drawer', number: 2 },
    { id: 'd6', cart: 'med', name: 'Bottom Drawer', number: 3 },

    // Code/Crash Cart Drawers (d7-d9)
    { id: 'd7', cart: 'code', name: 'Top Drawer', number: 1 },
    { id: 'd8', cart: 'code', name: 'Middle Drawer', number: 2 },
    { id: 'd9', cart: 'code', name: 'Bottom Drawer', number: 3 },

    // Trauma Cart Drawers (d10-d12)
    { id: 'd10', cart: 'trauma', name: 'Top Drawer', number: 1 },
    { id: 'd11', cart: 'trauma', name: 'Middle Drawer', number: 2 },
    { id: 'd12', cart: 'trauma', name: 'Bottom Drawer', number: 3 }
];

/**
 * Default Items Configuration
 *
 * Defines all medical equipment and supplies stored in the carts.
 * Each item is assigned to a specific cart and drawer.
 *
 * Properties:
 * - id: Unique identifier for the item
 * - name: Display name of the item
 * - cart: Parent cart ID where this item is stored
 * - drawer: Specific drawer ID where this item is located
 */
export const DEFAULT_ITEMS = [
    // Airway Cart Items - Airway management equipment
    { id: 'ett', name: 'Endotracheal Tube', cart: 'airway', drawer: 'd1' },
    { id: 'laryngoscope', name: 'Laryngoscope', cart: 'airway', drawer: 'd1' },
    { id: 'bvm', name: 'Bag-Valve-Mask', cart: 'airway', drawer: 'd2' },
    { id: 'oropharyngeal', name: 'Oropharyngeal Airway', cart: 'airway', drawer: 'd2' },
    { id: 'suction', name: 'Suction Catheter', cart: 'airway', drawer: 'd3' },
    { id: 'oxygen', name: 'Oxygen Mask', cart: 'airway', drawer: 'd3' },

    // Medication Cart Items - Emergency medications
    { id: 'epinephrine', name: 'Epinephrine', cart: 'med', drawer: 'd4' },
    { id: 'atropine', name: 'Atropine', cart: 'med', drawer: 'd4' },
    { id: 'amiodarone', name: 'Amiodarone', cart: 'med', drawer: 'd5' },
    { id: 'lidocaine', name: 'Lidocaine', cart: 'med', drawer: 'd5' },
    { id: 'morphine', name: 'Morphine', cart: 'med', drawer: 'd6' },
    { id: 'naloxone', name: 'Naloxone', cart: 'med', drawer: 'd6' },

    // Code/Crash Cart Items - Cardiac emergency equipment
    { id: 'defibrillator', name: 'Defibrillator Pads', cart: 'code', drawer: 'd7' },
    { id: 'ecg', name: 'ECG Leads', cart: 'code', drawer: 'd7' },
    { id: 'iv-start', name: 'IV Start Kit', cart: 'code', drawer: 'd8' },
    { id: 'saline', name: 'Saline Flush', cart: 'code', drawer: 'd8' },
    { id: 'cpr-board', name: 'CPR Board', cart: 'code', drawer: 'd9' },
    { id: 'aed', name: 'AED', cart: 'code', drawer: 'd9' },

    // Trauma Cart Items - Trauma care equipment
    { id: 'chest-tube', name: 'Chest Tube Kit', cart: 'trauma', drawer: 'd10' },
    { id: 'scalpel', name: 'Scalpel', cart: 'trauma', drawer: 'd10' },
    { id: 'gauze', name: 'Gauze Pads', cart: 'trauma', drawer: 'd11' },
    { id: 'tourniquet', name: 'Tourniquet', cart: 'trauma', drawer: 'd11' },
    { id: 'splint', name: 'Splint', cart: 'trauma', drawer: 'd12' },
    { id: 'cervical-collar', name: 'Cervical Collar', cart: 'trauma', drawer: 'd12' }
];

/**
 * Default Scenarios Configuration
 *
 * Defines training scenarios (emergency medical situations) that test
 * the user's ability to quickly locate and gather the correct equipment.
 *
 * Properties:
 * - id: Unique identifier for the scenario
 * - name: Display name of the scenario
 * - description: Detailed description of the emergency situation
 * - essential: Array of item IDs required for this scenario (must have)
 * - optional: Array of item IDs that are helpful but not required
 */
export const DEFAULT_SCENARIOS = [
    {
        id: 's1',
        name: 'Cardiac Arrest',
        description: 'Patient in cardiac arrest. Prepare for immediate resuscitation.',
        essential: ['defibrillator', 'ecg', 'epinephrine', 'amiodarone'],
        optional: ['cpr-board', 'iv-start', 'saline']
    },
    {
        id: 's2',
        name: 'Airway Obstruction',
        description: 'Patient with complete airway obstruction requiring immediate intervention.',
        essential: ['laryngoscope', 'ett', 'bvm', 'suction'],
        optional: ['oropharyngeal', 'oxygen']
    },
    {
        id: 's3',
        name: 'Severe Trauma',
        description: 'Multiple trauma patient with suspected internal bleeding.',
        essential: ['gauze', 'tourniquet', 'chest-tube', 'iv-start'],
        optional: ['cervical-collar', 'splint', 'scalpel']
    },
    {
        id: 's4',
        name: 'Respiratory Distress',
        description: 'Patient in severe respiratory distress, prepare for potential intubation.',
        essential: ['oxygen', 'bvm', 'laryngoscope', 'ett'],
        optional: ['suction', 'oropharyngeal', 'epinephrine']
    },
    {
        id: 's5',
        name: 'Anaphylaxis Emergency',
        description: 'Severe allergic reaction with airway compromise and hypotension.',
        essential: ['epinephrine', 'iv-start', 'oxygen', 'bvm'],
        optional: ['saline', 'atropine', 'defibrillator']
    },
    {
        id: 's6',
        name: 'Overdose Response',
        description: 'Patient with suspected opioid overdose, unconscious and not breathing.',
        essential: ['naloxone', 'bvm', 'oxygen', 'iv-start'],
        optional: ['suction', 'saline', 'ecg']
    },
    {
        id: 's7',
        name: 'Chest Pain - MI',
        description: 'Patient presenting with severe chest pain, suspected myocardial infarction.',
        essential: ['ecg', 'iv-start', 'oxygen', 'morphine'],
        optional: ['epinephrine', 'amiodarone', 'defibrillator']
    },
    {
        id: 's8',
        name: 'Hemorrhage Control',
        description: 'Major external bleeding from trauma, life-threatening hemorrhage.',
        essential: ['tourniquet', 'gauze', 'iv-start', 'saline'],
        optional: ['splint', 'cervical-collar', 'morphine']
    },
    {
        id: 's9',
        name: 'Pediatric Emergency',
        description: 'Child in respiratory failure, prepare pediatric equipment.',
        essential: ['bvm', 'oxygen', 'ett', 'laryngoscope'],
        optional: ['epinephrine', 'iv-start', 'suction']
    },
    {
        id: 's10',
        name: 'Stroke Alert',
        description: 'Patient with acute stroke symptoms, time-critical intervention needed.',
        essential: ['iv-start', 'ecg', 'oxygen', 'saline'],
        optional: ['morphine', 'gauze', 'atropine']
    }
];

/**
 * Default Achievements Configuration
 *
 * Defines gamification achievements that reward player progress and performance.
 *
 * Properties:
 * - id: Unique identifier for the achievement
 * - title: Achievement title
 * - description: Description of how to earn this achievement
 * - icon: Emoji icon representing the achievement
 * - trigger: Type of trigger for this achievement
 * - value: Optional threshold value for trigger (e.g., time in seconds)
 */
export const DEFAULT_ACHIEVEMENTS = [
    {
        id: 'first-scenario',
        title: 'First Steps',
        description: 'Complete your first scenario',
        icon: '🎯',
        trigger: 'first-scenario'
    },
    {
        id: 'perfect-score',
        title: 'Perfectionist',
        description: 'Get a perfect score',
        icon: '💯',
        trigger: 'perfect-score'
    },
    {
        id: 'speed-demon',
        title: 'Speed Demon',
        description: 'Complete in under 30 seconds',
        icon: '⚡',
        trigger: 'speed',
        value: 30 // 30 seconds threshold
    }
];

/**
 * Default Camera Views Configuration
 *
 * Defines pre-configured 3D camera perspectives for viewing the trauma room.
 * Each view provides a different angle for observing and interacting with carts.
 *
 * Properties:
 * - id: Unique identifier for the camera view
 * - name: Display name of the view
 * - description: Description of what this view shows
 * - position: Camera position in 3D space {x, y, z}
 * - lookAt: Point the camera is looking at {x, y, z}
 * - fov: Field of view in degrees (affects zoom/perspective)
 * - type: View type ('overview' for room views, 'closeup' for cart-specific)
 * - targetCart: ID of cart this view focuses on (null for overview)
 * - targetDrawer: ID of drawer this view focuses on (null if not drawer-specific)
 */
export const DEFAULT_CAMERA_VIEWS = [
    {
        id: 'entry-view',
        name: 'Entry View',
        description: 'Room view as you first enter',
        position: { x: 0, y: 1.67, z: 12 },
        lookAt: { x: 0, y: 0, z: 0 },
        fov: 75,
        type: 'overview',
        targetCart: null,
        targetDrawer: null
    },
    {
        id: 'overhead-view',
        name: 'Overhead View',
        description: 'Bird\'s eye view of the entire room',
        position: { x: 0, y: 15, z: 0 },
        lookAt: { x: 0, y: 0, z: 0 },
        fov: 60,
        type: 'overview',
        targetCart: null,
        targetDrawer: null
    },
    {
        id: 'airway-closeup',
        name: 'Airway Cart Close-up',
        description: 'Close-up view of the Airway Cart',
        position: { x: -6, y: 2, z: -5 },
        lookAt: { x: -6, y: 1.5, z: -7 },
        fov: 65,
        type: 'closeup',
        targetCart: 'airway',
        targetDrawer: null
    },
    {
        id: 'med-closeup',
        name: 'Medication Cart Close-up',
        description: 'Close-up view of the Medication Cart',
        position: { x: 6, y: 2, z: -5 },
        lookAt: { x: 6, y: 1.5, z: -7 },
        fov: 65,
        type: 'closeup',
        targetCart: 'med',
        targetDrawer: null
    },
    {
        id: 'code-closeup',
        name: 'Code Cart Close-up',
        description: 'Close-up view of the Crash Cart',
        position: { x: -6, y: 2, z: 3 },
        lookAt: { x: -6, y: 1.5, z: 5 },
        fov: 65,
        type: 'closeup',
        targetCart: 'code',
        targetDrawer: null
    }
];

/**
 * Default Room Settings Configuration
 *
 * Defines the physical properties and visual settings of the trauma room.
 *
 * Properties:
 * - backgroundColor: Background color for 2D canvas and 3D scene
 * - width: Room width in feet (real-world dimensions)
 * - depth: Room depth in feet (real-world dimensions)
 * - height: Room height in feet (ceiling height)
 * - pixelsPerFoot: Scale factor for converting feet to pixels in 2D canvas
 */
export const DEFAULT_ROOM_SETTINGS = {
    backgroundColor: '#fafafa',
    width: 30,  // feet
    depth: 25,  // feet
    height: 12, // feet
    pixelsPerFoot: 20 // Scale factor for canvas rendering
};

/**
 * Default Scoring Rules Configuration
 *
 * Defines the point values and scoring mechanics for scenario gameplay.
 *
 * Properties:
 * - essentialPoints: Points awarded per essential item collected
 * - optionalPoints: Points awarded per optional item collected
 * - penaltyPoints: Points deducted per incorrect item collected
 * - perfectBonus: Bonus points for collecting all essential items with no mistakes
 * - speedThreshold: Time limit in seconds for speed bonus eligibility
 * - speedBonus: Bonus points for completing under the speed threshold
 */
export const DEFAULT_SCORING_RULES = {
    essentialPoints: 60,
    optionalPoints: 20,
    penaltyPoints: 5,
    perfectBonus: 500,
    speedThreshold: 60,  // seconds
    speedBonus: 300
};

/**
 * Default General Settings Configuration
 *
 * Defines application-wide settings and preferences.
 *
 * Properties:
 * - appTitle: Application title displayed in UI
 * - enableTutorial: Whether to show tutorial/help on first launch
 * - enableSound: Whether sound effects are enabled
 * - enableHaptics: Whether haptic feedback is enabled (for supported devices)
 */
export const DEFAULT_GENERAL_SETTINGS = {
    appTitle: 'Trauma Room Trainer',
    enableTutorial: true,
    enableSound: true,
    enableHaptics: true
};

/**
 * Load Default Configuration Function
 *
 * Populates the CONFIG object with all default data.
 * This function is called on initial load or when resetting to defaults.
 *
 * @param {Object} CONFIG - The global configuration object to populate
 */
export function loadDefaultConfiguration(CONFIG) {
    CONFIG.carts = [...DEFAULT_CARTS];
    CONFIG.drawers = [...DEFAULT_DRAWERS];
    CONFIG.items = [...DEFAULT_ITEMS];
    CONFIG.scenarios = [...DEFAULT_SCENARIOS];
    CONFIG.achievements = [...DEFAULT_ACHIEVEMENTS];
    CONFIG.cameraViews = [...DEFAULT_CAMERA_VIEWS];
    CONFIG.roomSettings = { ...DEFAULT_ROOM_SETTINGS };
    CONFIG.scoringRules = { ...DEFAULT_SCORING_RULES };
    CONFIG.generalSettings = { ...DEFAULT_GENERAL_SETTINGS };
}

/**
 * Get Complete Default Configuration
 *
 * Returns a complete default configuration object without modifying
 * an existing CONFIG object. Useful for testing or creating new configs.
 *
 * @returns {Object} Complete default configuration object
 */
export function getDefaultConfiguration() {
    return {
        carts: [...DEFAULT_CARTS],
        drawers: [...DEFAULT_DRAWERS],
        items: [...DEFAULT_ITEMS],
        scenarios: [...DEFAULT_SCENARIOS],
        achievements: [...DEFAULT_ACHIEVEMENTS],
        cameraViews: [...DEFAULT_CAMERA_VIEWS],
        roomSettings: { ...DEFAULT_ROOM_SETTINGS },
        scoringRules: { ...DEFAULT_SCORING_RULES },
        generalSettings: { ...DEFAULT_GENERAL_SETTINGS }
    };
}
