# Quick Start Guide - 3D Cart Modules

## Module Import Reference

### Import All 3D Modules in teacher.js

```javascript
// Constants
import {
    CART_TYPES,
    DRAWER_COLOR_MAP,
    DEFAULT_DRAWER_COLOR,
    SELECTION_COLOR,
    WHEEL_DIMENSIONS,
    DRAWER_PROPERTIES,
    // ... other constants as needed
} from './src/config/constants.js';

// Cart Modeling
import {
    getDrawerColor,
    createDrawer,
    create3DCart,
    buildAll3DCarts
} from './src/3d/cartModel.js';

// Interaction
import {
    init3DInteraction,
    onThreeMouseDown,
    onThreeMouseMove,
    onThreeMouseUp
} from './src/3d/interaction.js';

// Selection
import {
    selectCart3D,
    deselectCart3D,
    selectDrawer3D,
    deselectDrawer3D,
    createSelectionHelpers,
    removeSelectionHelpers
} from './src/3d/selection.js';

// Animation
import {
    openDrawer,
    closeDrawer,
    animateDrawer
} from './src/3d/animation.js';
```

---

## Initialization Sequence

```javascript
// 1. Initialize Three.js scene (already done via scene.js)
import { initThreeJS } from './src/3d/scene.js';
import {
    createFloor,
    createGrid,
    createLighting,
    createOrbitControls,
    animateThreeScene
} from './src/3d/sceneObjects.js';

initThreeJS();
createFloor();
createGrid();
createLighting();
createOrbitControls();
animateThreeScene(); // Start animation loop

// 2. Initialize 3D interaction
init3DInteraction();

// 3. Build all carts from CONFIG
buildAll3DCarts();

console.log('3D system initialized and ready!');
```

---

## Common Operations

### 1. Creating a New Cart

```javascript
// Add cart data to CONFIG
const newCart = {
    id: 'cart_new',
    type: 'crash', // Use CART_TYPES key
    x: 0.5,        // Normalized 0-1 (0.5 = center)
    y: 0.5,
    rotation: 0,   // Degrees
    color: '#F44336' // Optional override
};

CONFIG.carts.push(newCart);

// Create 3D representation
const cart3D = create3DCart(newCart);
scene.add(cart3D);
cartMeshes.set(newCart.id, cart3D);
```

### 2. Rebuilding All Carts

```javascript
// After making changes to CONFIG.carts or CONFIG.drawers
buildAll3DCarts();

// This will:
// - Dispose of all existing cart meshes
// - Clear cartMeshes map
// - Recreate all carts from CONFIG
// - Add them back to the scene
```

### 3. Selecting a Cart Programmatically

```javascript
// Select a cart by ID
selectCart3D('cart_001');

// This will:
// - Add blue emissive glow
// - Show bounding box
// - Show facing arrow
// - Log to console
```

### 4. Selecting a Drawer Programmatically

```javascript
// Select a drawer by ID
selectDrawer3D('drawer_001');

// This will:
// - Deselect any cart selection
// - Add blue emissive glow to drawer
// - Animate drawer opening
// - Store selection state
```

### 5. Deselecting Everything

```javascript
// Clear all selections
deselectCart3D();
deselectDrawer3D();

// This will:
// - Remove all visual highlights
// - Close open drawers
// - Remove helper objects
// - Clear selection state
```

### 6. Manually Animating a Drawer

```javascript
// Find drawer group (helper function needed)
function findDrawerGroup(drawerId) {
    let found = null;
    cartMeshes.forEach((cartGroup) => {
        cartGroup.children.forEach((child) => {
            if (child.userData && child.userData.drawerId === drawerId) {
                found = child;
            }
        });
    });
    return found;
}

// Open a specific drawer
const drawer = findDrawerGroup('drawer_001');
if (drawer) {
    openDrawer(drawer);
}

// Close after 2 seconds
setTimeout(() => {
    if (drawer) {
        closeDrawer(drawer);
    }
}, 2000);
```

---

## Customizing Cart Types

### Add a New Cart Type

```javascript
// In src/config/constants.js

export const CART_TYPES = {
    // ... existing types ...
    
    diagnostic: {
        name: 'Diagnostic Cart',
        width: 2.5,      // feet
        height: 4.5,     // feet
        depth: 2.0,      // feet
        color: '#00BCD4', // Cyan
        drawers: 6,
        drawerHeight: 0.7
    }
};
```

### Modify Cart Appearance

```javascript
// Change wheel size
export const WHEEL_DIMENSIONS = {
    radius: 0.15,    // Larger wheels
    width: 0.10,     // Thicker wheels
    inset: 0.2,
    color: 0x222222
};

// Change drawer animation speed
export const DRAWER_ANIMATION = {
    lerpFactor: 0.25,  // Faster (default 0.15)
    threshold: 0.01
};
```

---

## Troubleshooting

### Issue: Carts not appearing

**Check:**
1. Is `buildAll3DCarts()` called after scene initialization?
2. Are there carts in `CONFIG.carts`?
3. Check browser console for errors

**Solution:**
```javascript
console.log('Cart count:', CONFIG.carts.length);
console.log('Meshes in scene:', cartMeshes.size);
buildAll3DCarts(); // Rebuild
```

### Issue: Can't click on carts

**Check:**
1. Is `init3DInteraction()` called?
2. Is `STATE.canvasMode === 'room'`?
3. Are event listeners attached?

**Solution:**
```javascript
console.log('Canvas mode:', STATE.canvasMode);
console.log('Raycaster:', raycaster);
init3DInteraction(); // Re-initialize
```

### Issue: Drawers not animating

**Check:**
1. Is drawer selection working?
2. Check drawer userData for targetZ

**Solution:**
```javascript
const drawer = findDrawerGroup('drawer_001');
console.log('Drawer state:', drawer.userData);
openDrawer(drawer); // Manually trigger
```

### Issue: Selection helpers not appearing

**Check:**
1. Are helpers being removed prematurely?
2. Check scene children

**Solution:**
```javascript
console.log('Scene children:', scene.children.length);
selectCart3D('cart_001'); // Re-select
```

---

## Performance Tips

### 1. Dispose Properly

```javascript
// Always dispose when removing carts
function removeCart(cartId) {
    const cart3D = cartMeshes.get(cartId);
    if (cart3D) {
        cart3D.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        scene.remove(cart3D);
        cartMeshes.delete(cartId);
    }
}
```

### 2. Batch Updates

```javascript
// Instead of multiple rebuilds:
CONFIG.carts.push(cart1);
buildAll3DCarts();
CONFIG.carts.push(cart2);
buildAll3DCarts();

// Do this:
CONFIG.carts.push(cart1);
CONFIG.carts.push(cart2);
buildAll3DCarts(); // Single rebuild
```

### 3. Limit Animation Loops

```javascript
// Animations automatically stop when complete
// No need to manually clear them

// Check if animation is done:
if (!drawer.userData.targetZ) {
    console.log('Animation complete');
}
```

---

## Advanced Usage

### Custom Drawer Color Logic

```javascript
// Modify getDrawerColor in cartModel.js
export function getDrawerColor(drawer) {
    const drawerItems = CONFIG.items.filter(item => item.drawer === drawer.id);
    
    if (drawerItems.length === 0) {
        return DEFAULT_DRAWER_COLOR;
    }
    
    // Custom logic: color by item type
    const hasAirway = drawerItems.some(item => item.category === 'airway');
    if (hasAirway) return 0x4CAF50; // Green
    
    const hasMeds = drawerItems.some(item => item.category === 'medication');
    if (hasMeds) return 0x2196F3; // Blue
    
    return DEFAULT_DRAWER_COLOR;
}
```

### Add Cart Interior Panel

```javascript
// In create3DCart function, after creating body:

// Add interior panel (black background visible behind drawers)
const panelGeometry = new THREE.PlaneGeometry(width * 0.95, height * 0.95);
const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    side: THREE.FrontSide
});
const interiorPanel = new THREE.Mesh(panelGeometry, panelMaterial);
interiorPanel.position.y = height / 2;
interiorPanel.position.z = (depth / 2) - 0.12; // Behind drawer fronts
cartGroup.add(interiorPanel);
```

### Implement Cart Rotation

```javascript
// Add to interaction.js or new module
export function rotateCart3D(cartId, degrees) {
    const cartGroup = cartMeshes.get(cartId);
    if (!cartGroup) return;
    
    const targetRotation = (degrees * Math.PI) / 180;
    const current = cartGroup.rotation.y;
    
    function animate() {
        const diff = targetRotation - cartGroup.rotation.y;
        
        if (Math.abs(diff) < 0.01) {
            cartGroup.rotation.y = targetRotation;
            
            // Update CONFIG
            const cart = CONFIG.carts.find(c => c.id === cartId);
            if (cart) cart.rotation = degrees;
            
            return;
        }
        
        cartGroup.rotation.y += diff * 0.15;
        requestAnimationFrame(animate);
    }
    
    animate();
}
```

---

## File Structure Reference

```
src/
├── config/
│   ├── config.js              ← CONFIG, STATE
│   └── constants.js           ← CART_TYPES, all constants ⭐
│
└── 3d/
    ├── scene.js               ← Scene setup, variables
    ├── sceneObjects.js        ← Floor, lights, controls
    ├── cartModel.js           ← Cart creation ⭐
    ├── interaction.js         ← Mouse events ⭐
    ├── selection.js           ← Selection visuals ⭐
    └── animation.js           ← Drawer animations ⭐
```

---

## Next Steps

1. **Test basic functionality:**
   - Initialize scene
   - Build carts
   - Click to select
   - Drag to move
   - Click drawers

2. **Integrate with existing code:**
   - Import modules in teacher.js
   - Replace old function calls
   - Test undo/redo
   - Test save/load

3. **Enhance features:**
   - Add interior panels
   - Implement cart rotation
   - Add sound effects
   - Improve animations

4. **Optimize:**
   - Profile performance
   - Check memory usage
   - Optimize large scenes

For questions or issues, refer to:
- **MODULE_EXTRACTION_SUMMARY.md** - Complete module documentation
- **EXTRACTION_MAP.md** - Line-by-line extraction details
- Inline JSDoc comments in each module file
