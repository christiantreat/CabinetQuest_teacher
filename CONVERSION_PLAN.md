# 3D Conversion Plan - Technical Documentation

## Phase 1: Data Structure Updates

### Current Cart Structure (2D)
```javascript
{
  id: string,
  name: string,
  color: string,
  x: number (0-1),      // Normalized X position
  y: number (0-1),      // Normalized Y position (currently represents depth)
  width: number (px),   // Pixel width
  height: number (px),  // Pixel height
  isInventory: boolean
}
```

### New Cart Structure (3D)
```javascript
{
  id: string,
  name: string,
  color: string,
  // Position in feet (1 unit = 1 foot)
  x: number,            // Left/right position (0-centered room)
  y: number,            // Height above floor (default: 0)
  z: number,            // Forward/backward depth (converts from old y)
  // Rotation in degrees
  rotation: number,     // Facing direction (0-360°, 0=north, 90=east, etc.)
  // Dimensions in feet
  width: number,        // Width in feet (default: 2.42 ft ≈ 29")
  height: number,       // Height in feet (default: 3.5 ft ≈ 42")
  depth: number,        // Depth in feet (default: 2.04 ft ≈ 24.5")
  type: string,         // 'crash', 'airway', 'medication', 'iv', 'procedure'
  isInventory: boolean
}
```

### Room Settings Updates
```javascript
roomSettings: {
  backgroundColor: '#fafafa',
  // Room dimensions in feet (grid-based)
  width: 30,           // feet (instead of pixels)
  depth: 25,           // feet (replaces height)
  gridSize: 1,         // feet (instead of pixels, can use 0.25 increments)
  // 3D specific
  cameraMode: 'orbital', // 'orbital' or 'firstPerson'
  showFloor: true,
  showGrid: true,
  floorColor: '#f5f5f0'
}
```

### Drawer Structure (Enhanced for 3D)
```javascript
{
  id: string,
  name: string,
  cart: string,        // Parent cart ID
  number: number,      // Drawer position (1=top, 2, 3=bottom)
  // 3D specific
  height: number,      // Height in inches (default: 6")
  color: string,       // Based on category
  isOpen: boolean      // Animation state (designer mode)
}
```

## Standard Cart Dimensions (Real-World)

### Crash Cart (Code Cart)
- Height: 42" (3.5 ft)
- Width: 29" (2.42 ft)
- Depth: 24.5" (2.04 ft)
- Drawer interior: 22" wide × 16.5" deep
- Handle: Center of each drawer front
- Drawers: 5 drawers, ~6" height each
- Color accent: Red (#F44336)

### Airway Cart
- Height: 42" (3.5 ft)
- Width: 29" (2.42 ft)
- Depth: 24.5" (2.04 ft)
- Drawers: 4 drawers
- Color accent: Blue (#2196F3)

### Medication Cart
- Height: 36" (3 ft)
- Width: 29" (2.42 ft)
- Depth: 24.5" (2.04 ft)
- Drawers: 3 drawers + top surface
- Color accent: Orange (#FF9800)

### IV Cart
- Height: 60" (5 ft) - tall pole
- Base Width: 18" (1.5 ft)
- Base Depth: 18" (1.5 ft)
- Hooks at top for IV bags
- Small drawer base
- Color accent: Purple (#9C27B0)

### Procedure Table
- Height: 36" (3 ft)
- Width: 48" (4 ft)
- Depth: 30" (2.5 ft)
- No drawers (flat top surface)
- Color accent: Gray (#757575)

## Camera Modes

### Orbital Mode (Designer)
- Position: Above and angled (45°)
- Target: Room center
- Controls: Mouse drag to rotate, scroll to zoom
- Purpose: Room layout design

### First-Person Mode (Training)
- Position: Standing height (5.5 ft)
- Controls: WASD + mouse look
- Purpose: Training simulation

## Conversion Strategy

### Coordinate System Conversion
```javascript
// OLD (2D normalized):
cart.x = 0.5  // Center horizontally
cart.y = 0.3  // Top third of canvas

// NEW (3D feet-based):
cart.x = 0     // Room center (0,0 is center)
cart.y = 0     // Floor level
cart.z = -7.5  // Near back of room (if room is 25ft deep)
cart.rotation = 180  // Facing forward
```

### Migration Function
```javascript
function migrateTo3D(oldCart) {
  return {
    ...oldCart,
    // Convert normalized coords to feet-based
    x: (oldCart.x - 0.5) * 30,  // Assumes 30ft room width
    y: 0,  // Floor level
    z: (oldCart.y - 0.5) * 25,  // Convert y to z depth
    rotation: 0,  // Default facing north
    // Convert pixel dimensions to feet
    width: (oldCart.width || 80) / 33,  // ~80px ≈ 2.4ft
    height: 3.5,  // Standard cart height
    depth: 2,     // Standard cart depth
    type: inferCartType(oldCart.id)
  };
}
```

## Implementation Notes

- Unit scale: 1 = 1 foot
- Grid increments: 0.25 feet (3 inches)
- Floor at Y=0
- Room centered at (0, 0)
- Positive Z = toward viewer
- Negative Z = away from viewer
- Rotation: 0° = facing north (negative Z)

## Backward Compatibility

Old 2D configurations will be automatically converted on load:
1. Detect missing z/rotation properties
2. Apply migration function
3. Save converted config
4. Display conversion notice to user

---

**Status**: Phase 1 Complete - Ready for Phase 2 Implementation
**Next**: Add Three.js and create 3D scene foundation
