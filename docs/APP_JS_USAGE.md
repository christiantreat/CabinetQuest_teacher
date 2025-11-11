# CabinetQuest Teacher - Application Entry Point (app.js)

## Overview

The `src/app.js` file is the main application entry point that imports and wires together all extracted modules. It provides:

- Global application state (CONFIG, STATE)
- Initialization sequence
- Global function exposure for HTML onclick handlers
- Module coordination and orchestration

## File Structure

```
src/app.js
├── Configuration & Constants Imports
├── Core Module Imports
├── Persistence Module Imports
├── UI Module Imports
├── Entity Manager Imports
├── 3D Scene Module Imports
├── 2D Canvas Module Imports
├── View Module Imports
├── Utility Module Imports
├── Global State Definitions (CONFIG, STATE)
├── 3D Scene Global Variables
├── 2D Canvas Global Variables
├── Setter Functions
├── Initialization Function (init)
├── Helper Functions (sync3DToWindow, previewGame)
└── Global API Export (window.App)
```

## Architecture

### Module Import Strategy

All modules are imported using ES6 `import` statements at the top of the file:

```javascript
// Example imports
import { selectEntity, deselectEntity, getEntity } from './core/state.js';
import { saveConfiguration, loadConfiguration, saveAll } from './persistence/storage.js';
import { buildHierarchy, refreshHierarchy } from './ui/hierarchy.js';
```

### Global State Management

#### CONFIG Object
Contains all application configuration data:
- `carts` - Cart entities array
- `drawers` - Drawer entities array
- `items` - Item entities array
- `scenarios` - Scenario configurations array
- `achievements` - Achievement definitions array
- `cameraViews` - Camera view configurations array
- `roomSettings` - Room dimensions and appearance
- `scoringRules` - Game scoring configuration
- `generalSettings` - General app settings

#### STATE Object
Contains UI and interaction state:
- `selectedType` - Currently selected entity type
- `selectedId` - Currently selected entity ID
- `canvasMode` - Canvas display mode ('room' or 'overview')
- `draggedCart` - Cart being dragged (if any)
- `mousePos` - Current mouse position in feet
- `unsavedChanges` - Whether there are unsaved changes
- `snapToGrid` - Whether grid snapping is enabled
- `gridSize` - Grid size in feet

### Initialization Sequence

The `init()` function coordinates the startup in this order:

1. **Load Configuration**
   - Loads from localStorage or defaults

2. **Setup 2D Canvas**
   - Gets canvas element and context
   - Sets up event listeners
   - Syncs UI controls with loaded config
   - Sets canvas size based on room dimensions
   - Draws initial canvas view

3. **Build UI**
   - Builds hierarchy tree
   - Updates status bar

4. **Initialize 3D Scene**
   - Creates Three.js scene, camera, renderer
   - Creates floor, grid, and lighting
   - Sets up orbit controls
   - Initializes 3D interaction handlers
   - Builds all 3D cart models
   - Starts animation loop
   - Syncs 3D objects to window

5. **Setup Keyboard Shortcuts**
   - Registers undo/redo keyboard shortcuts
   - Updates undo/redo button states

6. **Setup Autosave**
   - Starts 5-second autosave interval

### Global Window Exposure

For HTML onclick handlers and cross-module access, app.js exposes:

#### Direct Global Objects
```javascript
window.CONFIG        // Global configuration
window.STATE         // Global state
window.HISTORY       // Undo/redo history
window.CART_TYPES    // Cart type constants
window.DRAWER_COLOR_MAP  // Drawer color mappings
```

#### 3D Scene Objects
```javascript
window.scene         // Three.js scene
window.camera        // Three.js camera
window.renderer      // Three.js renderer
window.controls      // Orbit controls
window.floor         // Floor mesh
window.floorGrid     // Grid helper
window.selectedCart3D    // Currently selected cart
window.dragPlane     // Drag interaction plane
window.cartMeshes    // Map of cart ID to mesh
```

#### 2D Canvas Objects
```javascript
window.canvas        // Canvas element
window.ctx           // Canvas 2D context
```

#### Functions for HTML
```javascript
window.undo()
window.redo()
window.saveAll()
window.exportConfiguration()
window.importConfiguration()
window.processImport()
window.resetToDefaults()
window.refreshHierarchy()
window.setCanvasMode(mode)
window.toggleCameraView()
window.previewGame()
window.closeModal(id)
```

#### App Namespace
All functions are also available via `window.App`:
```javascript
window.App.init()
window.App.selectEntity(type, id)
window.App.createNewCart()
window.App.updateCartProperty(prop, value)
// ... etc
```

## Usage in HTML

### Option 1: ES6 Module (Recommended)

Update `index.html` to load app.js as a module:

```html
<!-- Remove old script tag -->
<!-- <script src="teacher.js"></script> -->

<!-- Add new module script tag -->
<script type="module" src="src/app.js"></script>
```

### Option 2: Build Step

Use a bundler like webpack, rollup, or vite to bundle all modules:

```bash
# Example with vite
npm install -D vite
npx vite build
```

## Function Categories

### Core Functions
- `selectEntity(type, id)` - Select an entity and update UI
- `deselectEntity()` - Clear current selection
- `getEntity(type, id)` - Retrieve an entity by type and ID

### History Management
- `recordAction(type, data)` - Record action for undo
- `undo()` - Undo last action
- `redo()` - Redo last undone action
- `canUndo()` - Check if undo is available
- `canRedo()` - Check if redo is available

### Persistence
- `saveConfiguration()` - Save to localStorage
- `loadConfiguration()` - Load from localStorage
- `saveAll()` - Save with UI feedback
- `exportConfiguration()` - Export to JSON file
- `importConfiguration()` - Open import dialog
- `processImport()` - Process imported file
- `resetToDefaults()` - Reset to factory defaults

### UI Management
- `showAlert(message, type)` - Display toast notification
- `closeModal(id)` - Close modal dialog
- `buildHierarchy()` - Build complete hierarchy tree
- `refreshHierarchy()` - Refresh tree with feedback
- `filterHierarchy()` - Filter tree based on search
- `updateStatusBar()` - Update status counters
- `updateInspector()` - Update property inspector

### Entity Creation
- `createNewCart()` - Create new cart entity
- `createNewDrawer()` - Create new drawer entity
- `createNewItem()` - Create new item entity
- `createNewScenario()` - Create new scenario
- `createNewCameraView()` - Create new camera view
- `createNewAchievement()` - Create new achievement

### Entity Updates
- `updateCartProperty(prop, value)` - Update cart property
- `updateCartPositionFeet(axis, valueFeet)` - Update cart position
- `updateDrawerProperty(prop, value)` - Update drawer property
- `updateItemProperty(prop, value)` - Update item property
- `updateScenarioProperty(prop, value)` - Update scenario property
- `updateCameraViewProperty(prop, value)` - Update camera view
- `updateAchievementProperty(prop, value)` - Update achievement
- `deleteCurrentEntity()` - Delete selected entity

### 3D Scene Management
- `initThreeJS()` - Initialize Three.js scene
- `buildAll3DCarts()` - Build all 3D cart models
- `selectCart3D(cartId)` - Select cart in 3D view
- `deselectCart3D()` - Deselect cart in 3D view
- `selectDrawer3D(drawerId)` - Select drawer in 3D view
- `deselectDrawer3D()` - Deselect drawer in 3D view

### 2D Canvas Management
- `drawCanvas()` - Render canvas based on mode
- `setCanvasMode(mode)` - Set canvas display mode
- `getCanvasMode()` - Get current canvas mode
- `toggleCanvasMode()` - Toggle between modes

### Camera Views
- `toggleCameraView()` - Toggle between orbital and top-down
- `previewCameraView()` - Preview a saved camera view

### Preview
- `previewGame()` - Open trainer.html in new tab

### Utilities
- `snapToGrid(value, gridSize)` - Snap value to grid
- `degreesToRadians(degrees)` - Convert degrees to radians
- `radiansToDegrees(radians)` - Convert radians to degrees

## Module Communication Pattern

### How Modules Access Globals

Modules access global state through `window`:

```javascript
// Example from a module
export function updateCartProperty(prop, value) {
    const cart = getEntity('cart', window.STATE.selectedId);
    if (cart) {
        cart[prop] = value;
        window.STATE.unsavedChanges = true;
        // ... rest of function
    }
}
```

### How Modules Update 3D Scene Objects

The 3D scene module exports setter functions:

```javascript
// In 3d/scene.js
export function setControls(newControls) {
    controls = newControls;
}

// Used by other modules
import { setControls } from './3d/scene.js';
setControls(myControls);
```

After initialization, app.js syncs these to window via `sync3DToWindow()`.

## Benefits of This Architecture

1. **Modular Organization**
   - Each module has a single responsibility
   - Easy to locate and modify specific functionality

2. **Clear Dependencies**
   - Import statements show exactly what each module uses
   - No hidden global dependencies (except window.*)

3. **Maintainable Code**
   - Changes to a module don't affect others
   - Easy to add new features by creating new modules

4. **Testable**
   - Individual modules can be tested in isolation
   - Mock dependencies via imports

5. **Tree-Shakeable**
   - Bundlers can remove unused code
   - Smaller production builds

6. **Type-Safe Ready**
   - Can add TypeScript by renaming .js to .ts
   - JSDoc comments provide type hints

## Migration from teacher.js

The old monolithic `teacher.js` file has been split into:

- **Configuration**: `src/config/` - Constants and defaults
- **Core**: `src/core/` - State and history management
- **Persistence**: `src/persistence/` - Save/load/import/export
- **UI**: `src/ui/` - Alerts, status bar, hierarchy, inspectors
- **Entities**: `src/entities/` - CRUD operations for each entity type
- **3D**: `src/3d/` - Three.js scene, objects, interaction
- **2D**: `src/2d/` - Canvas rendering and interaction
- **Views**: `src/views/` - Camera view management
- **Utils**: `src/utils/` - Math utilities

All functionality remains the same, but now organized into logical modules.

## Extending the Application

### Adding a New Entity Type

1. Create manager in `src/entities/`:
   ```javascript
   // src/entities/newTypeManager.js
   export function createNewType() { ... }
   export function updateTypeProperty(prop, value) { ... }
   ```

2. Create inspector in `src/ui/inspector/`:
   ```javascript
   // src/ui/inspector/newTypeInspector.js
   export function buildTypeInspector(entity, container) { ... }
   ```

3. Import and expose in `src/app.js`:
   ```javascript
   import { createNewType, updateTypeProperty } from './entities/newTypeManager.js';

   const App = {
       // ... existing functions
       createNewType,
       updateTypeProperty
   };
   ```

### Adding a New Feature Module

1. Create the module:
   ```javascript
   // src/features/myFeature.js
   export function doSomething() {
       // Access globals via window
       const config = window.CONFIG;
       // ... implementation
   }
   ```

2. Import in `src/app.js`:
   ```javascript
   import { doSomething } from './features/myFeature.js';

   const App = {
       // ... existing functions
       doSomething
   };
   ```

3. Use in HTML:
   ```html
   <button onclick="window.App.doSomething()">Do Something</button>
   ```

## Troubleshooting

### Module Not Found Errors
- Ensure all import paths are correct relative to the importing file
- Check that files exist at the specified paths
- Use `.js` extension in import statements

### Window Object Not Defined
- Make sure app.js is loaded before any code tries to access `window.App`
- Check browser console for initialization errors
- Verify `window.onload = init` is being called

### 3D Objects Are Null/Undefined
- Check that `sync3DToWindow()` is being called after 3D initialization
- Ensure Three.js library is loaded before app.js
- Look for errors in the 3D initialization sequence

### Functions Not Available in HTML
- Verify functions are added to the `App` object in app.js
- Check that they're exposed to window: `window.functionName = functionName`
- Ensure app.js has fully loaded before HTML tries to call functions

## Performance Considerations

- **Autosave**: Runs every 5 seconds, only saves if there are changes
- **3D Rendering**: Uses requestAnimationFrame for 60 FPS
- **Canvas Redraw**: Only redraws when needed (on state changes)
- **Module Loading**: All modules loaded at startup (consider code splitting for large apps)

## Future Improvements

1. **Code Splitting**: Load modules on demand
2. **TypeScript**: Add type safety
3. **Build Process**: Bundle and minify for production
4. **Service Worker**: Offline support
5. **Web Workers**: Move heavy processing off main thread
6. **State Management**: Consider Redux or MobX for complex state
