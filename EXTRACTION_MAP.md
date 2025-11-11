# Code Extraction Map from teacher.js

This document maps exactly what code from `teacher.js` was extracted into which module files.

## Extraction Summary

### From teacher.js → src/config/constants.js

**Lines 558-623** → CART_TYPES object
```javascript
const CART_TYPES = {
    crash: { name: 'Crash Cart (Code Cart)', width: 2.0, ... },
    airway: { name: 'Airway Cart', width: 2.0, ... },
    medication: { name: 'Medication Cart', ... },
    iv: { name: 'IV Cart', ... },
    procedure: { name: 'Procedure Table', ... },
    trauma: { name: 'Trauma Cart', ... },
    supply: { name: 'Supply Cart', ... }
};
```

**Lines 635-640** → DRAWER_COLOR_MAP
```javascript
const colorMap = {
    'airway': 0x4CAF50,    // Green
    'med': 0x2196F3,       // Blue
    'code': 0xF44336,      // Red
    'trauma': 0xFF9800     // Orange
};
```

**Plus:** All magic numbers extracted to named constants (wheel dimensions, drawer properties, animation settings, etc.)

---

### From teacher.js → src/3d/cartModel.js

**Lines 626-644** → `getDrawerColor()` function
```javascript
function getDrawerColor(drawer) {
    const drawerItems = CONFIG.items.filter(item => item.drawer === drawer.id);
    if (drawerItems.length === 0) {
        return 0x999999; // Gray for empty drawers
    }
    // Color mapping logic...
}
```

**Lines 646-695** → `createDrawer()` function
```javascript
function createDrawer(drawer, cartWidth, drawerHeight, cartDepth, index, startY) {
    const drawerGroup = new THREE.Group();
    // Drawer geometry creation
    // Handle creation
    // Positioning logic
    return drawerGroup;
}
```

**Lines 697-837** → `create3DCart()` function
```javascript
function create3DCart(cartData) {
    const cartGroup = new THREE.Group();
    // Cart body creation
    // Wheels creation
    // IV pole for IV carts
    // Procedure surface for tables
    // Drawer addition
    // Positioning and rotation
    return cartGroup;
}
```

**Lines 839-867** → `buildAll3DCarts()` function
```javascript
function buildAll3DCarts() {
    // Clear existing carts with proper disposal
    cartMeshes.forEach((mesh) => {
        mesh.traverse((child) => {
            // Dispose geometries and materials
        });
        scene.remove(mesh);
    });
    cartMeshes.clear();
    
    // Create 3D version of each cart
    CONFIG.carts.forEach(cart => {
        const cart3D = create3DCart(cart);
        scene.add(cart3D);
        cartMeshes.set(cart.id, cart3D);
    });
}
```

---

### From teacher.js → src/3d/interaction.js

**Lines 870-891** → `init3DInteraction()` function
```javascript
function init3DInteraction() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Create invisible drag plane at floor level
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.MeshBasicMaterial({
        visible: false,
        side: THREE.DoubleSide
    });
    dragPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    // ... setup and event listeners
}
```

**Lines 893-965** → `onThreeMouseDown()` function
```javascript
function onThreeMouseDown(event) {
    if (STATE.canvasMode !== 'room') return;
    
    // Calculate mouse position in NDC
    // Perform raycasting
    // Handle cart vs drawer clicks
    // Store drag start position
    // Disable orbit controls during drag
}
```

**Lines 967-1006** → `onThreeMouseMove()` function
```javascript
function onThreeMouseMove(event) {
    if (!selectedCart3D) return;
    
    // Calculate mouse position
    // Raycast to drag plane
    // Update 3D position with grid snapping
    // Update 2D data in CONFIG
    // Trigger UI updates
}
```

**Lines 1008-1041** → `onThreeMouseUp()` function
```javascript
function onThreeMouseUp(event) {
    if (selectedCart3D) {
        // Record cart movement for undo/redo
        // Only if position changed
        // Clear drag state
        // Re-enable orbit controls
    }
}
```

---

### From teacher.js → src/3d/selection.js

**Lines 1043-1062** → `selectCart3D()` function
```javascript
function selectCart3D(cartId) {
    deselectCart3D();
    
    const cartGroup = cartMeshes.get(cartId);
    if (!cartGroup) return;
    
    // Add emissive glow
    const body = cartGroup.userData.clickable;
    if (body) {
        body.material = body.material.clone();
        body.material.emissive = new THREE.Color(0x0e639c);
        body.material.emissiveIntensity = 0.3;
    }
    
    // Add visual helpers
    createSelectionHelpers(cartGroup);
}
```

**Lines 1064-1075** → `deselectCart3D()` function
```javascript
function deselectCart3D() {
    removeSelectionHelpers();
    
    cartMeshes.forEach((cartGroup) => {
        const body = cartGroup.userData.clickable;
        if (body && body.material.emissive) {
            body.material.emissive = new THREE.Color(0x000000);
            body.material.emissiveIntensity = 0;
        }
    });
}
```

**Lines 1084-1123** → `createSelectionHelpers()` function
```javascript
function createSelectionHelpers(cartGroup) {
    removeSelectionHelpers();
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(cartGroup);
    
    // Create bounding box wireframe
    // Create facing arrow
    // Add to scene
}
```

**Lines 1125-1134** → `removeSelectionHelpers()` function
```javascript
function removeSelectionHelpers() {
    if (selectionHelpers.boundingBox) {
        scene.remove(selectionHelpers.boundingBox);
        selectionHelpers.boundingBox = null;
    }
    if (selectionHelpers.facingArrow) {
        scene.remove(selectionHelpers.facingArrow);
        selectionHelpers.facingArrow = null;
    }
}
```

**Lines 1136-1167** → `selectDrawer3D()` function
```javascript
function selectDrawer3D(drawerId) {
    deselectDrawer3D();
    deselectCart3D();
    
    // Find the drawer in cart hierarchy
    let drawerGroup = null;
    cartMeshes.forEach((cartGroup) => {
        cartGroup.children.forEach((child) => {
            if (child.userData && child.userData.drawerId === drawerId) {
                drawerGroup = child;
            }
        });
    });
    
    // Add selection highlight
    // Open the drawer (animate)
}
```

**Lines 1169-1183** → `deselectDrawer3D()` function
```javascript
function deselectDrawer3D() {
    if (selectedDrawer3D) {
        closeDrawer(selectedDrawer3D);
        
        const drawerFront = selectedDrawer3D.userData.clickable;
        if (drawerFront && drawerFront.material.emissive) {
            drawerFront.material.emissive = new THREE.Color(0x000000);
            drawerFront.material.emissiveIntensity = 0;
        }
        
        selectedDrawer3D = null;
    }
}
```

---

### From teacher.js → src/3d/animation.js

**Lines 1186-1194** → `openDrawer()` function
```javascript
function openDrawer(drawerGroup) {
    if (drawerGroup.userData.isOpen) return;
    
    drawerGroup.userData.isOpen = true;
    drawerGroup.userData.targetZ = drawerGroup.position.z + 0.5; // Pull out 6 inches
    
    animateDrawer(drawerGroup);
}
```

**Lines 1196-1203** → `closeDrawer()` function
```javascript
function closeDrawer(drawerGroup) {
    if (!drawerGroup.userData.isOpen) return;
    
    drawerGroup.userData.isOpen = false;
    drawerGroup.userData.targetZ = 0; // Push back to original position
    
    animateDrawer(drawerGroup);
}
```

**Lines 1205-1228** → `animateDrawer()` function
```javascript
function animateDrawer(drawerGroup) {
    const animate = () => {
        if (!drawerGroup.userData.targetZ && drawerGroup.userData.targetZ !== 0) return;
        
        const current = drawerGroup.position.z;
        const target = drawerGroup.userData.targetZ;
        const diff = target - current;
        
        if (Math.abs(diff) < 0.01) {
            // Done animating
            drawerGroup.position.z = target;
            drawerGroup.userData.targetZ = null;
            return;
        }
        
        // Lerp toward target
        drawerGroup.position.z += diff * 0.15;
        
        // Continue animating
        requestAnimationFrame(animate);
    };
    
    animate();
}
```

---

## Global Variables Extracted

**Lines 399-404** → State variables (moved to scene.js exports)
```javascript
let scene, camera, renderer, controls;
let cartMeshes = new Map();
let raycaster, mouse;
let selectedCart3D = null;
let dragPlane;
```

**Lines 1077-1082** → Selection state (moved to selection.js)
```javascript
let selectedDrawer3D = null;
let selectionHelpers = {
    boundingBox: null,
    facingArrow: null
};
let cartDragStartPosition = null;
```

---

## Code Enhancements in New Modules

### 1. Constants Module Additions
- All magic numbers replaced with named constants
- Comprehensive JSDoc type definitions
- Organized by category (dimensions, colors, materials)
- Physical units documented (feet, inches)

### 2. Cart Model Enhancements
- Detailed JSDoc for all functions
- Inline comments explaining 3D operations
- Better memory management documentation
- Examples in JSDoc

### 3. Interaction Module Improvements
- Clearer coordinate conversion documentation
- Better separation of concerns
- Explicit integration point documentation
- Helper function for entity access

### 4. Selection Module Additions
- Read-only accessor functions
- Better state encapsulation
- Mutually exclusive selection logic documented

### 5. Animation Module Additions
- Utility functions (lerp, smoothstep, isAnimationComplete)
- Future enhancement placeholders (rotateCart, slideCart, pulseHighlight)
- Animation timing documentation
- Performance characteristics documented

---

## Lines of Code Summary

| Original teacher.js | New Module | Lines Extracted |
|-------------------|-----------|----------------|
| Lines 558-623 | constants.js | 66 lines → 287 lines (expanded with docs) |
| Lines 626-867 | cartModel.js | 242 lines → 480 lines (documented) |
| Lines 870-1041 | interaction.js | 172 lines → 380 lines (documented) |
| Lines 1043-1183 | selection.js | 141 lines → 320 lines (documented) |
| Lines 1186-1228 | animation.js | 43 lines → 285 lines (expanded) |
| **Total** | **All modules** | **664 lines → 1,752 lines** |

The code expanded ~2.6x due to:
- Comprehensive JSDoc documentation
- Inline explanatory comments
- File headers and module descriptions
- Additional utility functions
- Future enhancement placeholders
- Type definitions and examples

---

## Integration Status

✅ **Extracted and Modularized:**
- Cart type definitions
- Cart geometry creation
- Drawer creation and coloring
- Mouse interaction and raycasting
- Selection visual feedback
- Drawer animations

⚠️ **Still in teacher.js (not extracted):**
- 2D canvas rendering (different concern)
- UI event handlers (2D specific)
- Entity management (cart/drawer CRUD)
- Inspector panel updates
- Undo/redo system
- Export/import functionality

🔄 **Requires Integration:**
- Import new modules in teacher.js
- Replace old function calls with imports
- Test all interactions
- Verify memory management
- Update any dependent code
