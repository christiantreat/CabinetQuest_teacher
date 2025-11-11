# 3D Cart Model and Interaction Module Extraction

## Overview
Successfully extracted and modularized 3D cart modeling, interaction, selection, and animation code from `teacher.js` into specialized, well-documented ES6 modules.

## Created Modules

### 1. **src/config/constants.js** (8.2 KB)
**Purpose:** Central repository for all 3D visualization constants

**Exports:**
- `CART_TYPES` - Complete cart type definitions with physical properties
  - crash, airway, medication, iv, procedure, trauma, supply
  - Dimensions, colors, drawer counts, special features
- `DRAWER_COLOR_MAP` - Color coding for drawer contents
- `DEFAULT_DRAWER_COLOR` - Fallback color for empty drawers
- `SELECTION_COLOR` & intensities - Selection highlight colors
- `DEFAULT_GRID_SIZE` & `FINE_GRID_SIZE` - Grid snapping values
- `WHEEL_DIMENSIONS` - Cart wheel properties
- `DRAWER_PROPERTIES` - Drawer physical constants
- `HANDLE_DIMENSIONS` - Drawer handle properties
- `IV_POLE_DIMENSIONS` - IV pole specifications
- `PROCEDURE_SURFACE` - Procedure table properties
- `DRAWER_ANIMATION` - Animation timing constants
- Material property objects (CART_MATERIAL, DRAWER_MATERIAL, etc.)

**Key Features:**
- Comprehensive JSDoc documentation
- All magic numbers replaced with named constants
- Easy to modify cart types and properties
- Type definitions for better IDE support

---

### 2. **src/3d/cartModel.js** (17 KB)
**Purpose:** 3D cart geometry creation and management

**Exports:**
- `getDrawerColor(drawer)` - Determine drawer color based on contents
- `createDrawer(drawer, cartWidth, drawerHeight, cartDepth, index, startY)` - Create drawer mesh with handle
- `create3DCart(cartData)` - Create complete 3D cart with all features
- `buildAll3DCarts()` - Build all carts from CONFIG and add to scene

**Key Features:**
- Creates detailed cart geometries with:
  - Cart body with proper materials
  - Edge wireframes for definition
  - Four wheels at corners
  - Drawers with handles
  - Special features (IV poles, procedure surfaces)
- Proper memory management with geometry/material disposal
- Converts between 2D canvas coordinates and 3D space
- Shadow casting and receiving for realistic lighting

**Dependencies:**
- CONFIG from config module
- CART_TYPES and constants from constants module
- scene, cartMeshes from scene module

---

### 3. **src/3d/interaction.js** (14 KB)
**Purpose:** Mouse interaction and raycasting for 3D objects

**Exports:**
- `init3DInteraction()` - Initialize raycaster and event listeners
- `onThreeMouseDown(event)` - Handle click events on carts/drawers
- `onThreeMouseMove(event)` - Handle drag operations
- `onThreeMouseUp(event)` - Complete drag and record actions

**Key Features:**
- Raycasting for precise object picking
- Separate handling for cart vs drawer clicks
- Drag-and-drop with grid snapping
- Coordinate conversion (3D feet ↔ 2D normalized)
- Orbit control management during drag
- Integration with undo/redo system
- Updates both 3D scene and 2D data

**Dependencies:**
- STATE, CONFIG from config module
- Scene variables from scene module
- controls from sceneObjects module
- Selection functions from selection module

**Integration Points:**
- Calls global `selectEntity()`, `deselectEntity()` for 2D sync
- Calls global `drawCanvas()`, `updateInspector()` for UI updates
- Calls global `recordAction()` for undo/redo
- Uses global `getEntity()` for data access

---

### 4. **src/3d/selection.js** (11 KB)
**Purpose:** Visual selection feedback and state management

**Exports:**
- `selectCart3D(cartId)` - Select and highlight cart
- `deselectCart3D()` - Remove cart selection
- `selectDrawer3D(drawerId)` - Select and open drawer
- `deselectDrawer3D()` - Close and deselect drawer
- `createSelectionHelpers(cartGroup)` - Add bounding box and arrow
- `removeSelectionHelpers()` - Remove visual helpers
- `getSelectedDrawer3D()` - Access selected drawer (read-only)
- `getSelectionHelpers()` - Access helper objects (read-only)

**Key Features:**
- Emissive glow for selected objects
- Visual selection helpers:
  - Bounding box (blue wireframe)
  - Facing arrow (shows cart orientation)
- Mutually exclusive selection (cart OR drawer)
- Automatic drawer animation on selection
- Proper cleanup of visual elements

**Dependencies:**
- scene, cartMeshes from scene module
- SELECTION_COLOR, intensities from constants module
- openDrawer, closeDrawer from animation module

---

### 5. **src/3d/animation.js** (9.2 KB)
**Purpose:** Smooth animations for interactive 3D elements

**Exports:**
- `openDrawer(drawerGroup)` - Animate drawer opening
- `closeDrawer(drawerGroup)` - Animate drawer closing
- `animateDrawer(drawerGroup)` - Core animation loop
- `lerp(start, end, t)` - Linear interpolation utility
- `smoothstep(t)` - Easing function
- `isAnimationComplete(current, target, threshold)` - Animation check utility

**Key Features:**
- Smooth lerp-based animations
- Self-contained animation loops (not global)
- Natural easing (fast start, slow end)
- Configurable animation speed and threshold
- Future-ready with placeholder functions for:
  - Cart rotation animation
  - Cart sliding animation
  - Pulse/highlight effects

**Dependencies:**
- DRAWER_PROPERTIES, DRAWER_ANIMATION from constants module

**Animation Behavior:**
- Lerp factor: 0.15 (15% of remaining distance per frame)
- At 60 FPS: ~500ms for complete animation
- Threshold: 0.01 feet (0.12 inches) for completion

---

## Module Architecture

```
src/
├── config/
│   ├── config.js          (existing - CONFIG, STATE)
│   └── constants.js       ⭐ NEW - Cart types and constants
│
└── 3d/
    ├── scene.js           (existing - Scene, camera, renderer)
    ├── sceneObjects.js    (existing - Floor, lights, controls)
    ├── cartModel.js       ⭐ NEW - Cart geometry creation
    ├── interaction.js     ⭐ NEW - Mouse events and raycasting
    ├── selection.js       ⭐ NEW - Selection visual feedback
    └── animation.js       ⭐ NEW - Drawer animations
```

## Dependency Graph

```
constants.js (no dependencies)
    ↓
cartModel.js → constants.js, config.js, scene.js
    ↓
animation.js → constants.js
    ↓
selection.js → constants.js, scene.js, animation.js
    ↓
interaction.js → constants.js, config.js, scene.js, sceneObjects.js, selection.js
```

## Integration with Existing Code

### Shared Scene Variables
The modules use scene.js exports:
- `scene` - Three.js scene object
- `camera` - Perspective camera
- `renderer` - WebGL renderer
- `raycaster` - For object picking
- `mouse` - Mouse position vector
- `dragPlane` - Invisible floor plane for dragging
- `cartMeshes` - Map of cart ID to mesh group
- `controls` - Orbit controls (from sceneObjects)

### Global Function Dependencies
The interaction module expects these global functions (from other modules):
- `selectEntity(type, id)` - Select entity in 2D view
- `deselectEntity()` - Clear 2D selection
- `getEntity(type, id)` - Get entity data from CONFIG
- `drawCanvas()` - Redraw 2D canvas
- `updateInspector()` - Update inspector panel
- `recordAction(type, data)` - Record for undo/redo

## Usage Examples

### Initialize 3D System
```javascript
import { initThreeJS } from './src/3d/scene.js';
import { createFloor, createGrid, createLighting, createOrbitControls } from './src/3d/sceneObjects.js';
import { init3DInteraction } from './src/3d/interaction.js';
import { buildAll3DCarts } from './src/3d/cartModel.js';

// Initialize scene
initThreeJS();
createFloor();
createGrid();
createLighting();
createOrbitControls();

// Initialize interaction
init3DInteraction();

// Build all carts
buildAll3DCarts();
```

### Add a New Cart Type
```javascript
// In constants.js
export const CART_TYPES = {
    // ... existing types ...
    newType: {
        name: 'New Cart Type',
        width: 2.0,
        height: 4.0,
        depth: 1.5,
        color: '#00FF00',
        drawers: 3,
        drawerHeight: 1.0
    }
};
```

### Programmatic Selection
```javascript
import { selectCart3D } from './src/3d/selection.js';

// Select a cart
selectCart3D('cart_001');

// Selection will:
// - Highlight with blue glow
// - Show bounding box
// - Show facing arrow
```

### Custom Drawer Animation
```javascript
import { openDrawer, closeDrawer } from './src/3d/animation.js';

// Find drawer in scene
const drawer = findDrawerGroup('drawer_001');

// Open with smooth animation
openDrawer(drawer);

// Close after 2 seconds
setTimeout(() => closeDrawer(drawer), 2000);
```

## Key Improvements Over Original Code

1. **Modularity**: Code organized by responsibility
2. **Documentation**: Comprehensive JSDoc for all functions
3. **Constants**: All magic numbers replaced with named constants
4. **Type Safety**: JSDoc types for better IDE support
5. **Memory Management**: Proper disposal of Three.js resources
6. **Maintainability**: Easy to locate and modify specific features
7. **Reusability**: Functions can be imported and used independently
8. **Future-Proof**: Placeholder functions for future enhancements

## Code Statistics

| Module | Lines of Code | Functions | Exports |
|--------|--------------|-----------|---------|
| constants.js | 287 | 0 (pure data) | 20 constants |
| cartModel.js | 480 | 4 | 4 functions |
| interaction.js | 380 | 5 | 4 functions |
| selection.js | 320 | 8 | 8 functions |
| animation.js | 285 | 8 | 8 functions |
| **Total** | **1,752** | **25** | **44 exports** |

## Next Steps for Full Integration

1. **Import in teacher.js**: Replace old code with module imports
2. **Test all interactions**: Verify cart creation, selection, dragging
3. **Test drawer behavior**: Verify opening/closing animations
4. **Test memory**: Check for leaks when rebuilding carts
5. **Add interior panels**: Implement black panel behind drawers
6. **Enhance animations**: Add cart rotation, sliding effects
7. **Add sound effects**: Hook into animation events
8. **Optimize performance**: Profile and optimize heavy operations

## Notes

- All files use ES6 module syntax (`import`/`export`)
- Comprehensive inline comments explain complex 3D operations
- File headers describe module purpose and dependencies
- Each function has JSDoc with parameters, returns, examples
- Constants include unit measurements (feet, inches)
- Color values documented with their hex codes
- Future enhancement suggestions included as commented functions
