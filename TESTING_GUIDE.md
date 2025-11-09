# Testing Guide - Trauma Room Trainer
**Complete Testing Documentation for 3D Medical Training Application**

---

## 📋 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Functional Testing](#functional-testing)
3. [Performance Testing](#performance-testing)
4. [Browser Compatibility](#browser-compatibility)
5. [Mobile Testing](#mobile-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Bug Reporting](#bug-reporting)

---

## Testing Overview

### Test Environment Setup

**Requirements:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- Working keyboard and mouse
- Optional: Touch device for mobile testing
- Optional: Various screen sizes/resolutions

**Test Data:**
- Default configuration (5 carts with drawers)
- Custom scenarios (if created)
- Import/export test files

---

## Functional Testing

### Designer Mode Tests (teacher.html / index.html)

#### Scene Rendering
- [ ] **TEST-D001**: Page loads without console errors
- [ ] **TEST-D002**: 3D scene visible with floor and grid
- [ ] **TEST-D003**: 2D canvas renders top-down view
- [ ] **TEST-D004**: Default 5 carts appear in both 2D and 3D
- [ ] **TEST-D005**: Lighting looks realistic (no overly dark/bright areas)
- [ ] **TEST-D006**: Camera positioned correctly (angled view of room)

**How to Test:**
1. Open `index.html` in browser
2. Wait for page to load completely
3. Verify no red errors in console (F12)
4. Check that both 3D and 2D views show carts
5. Look for proper shadows and lighting

#### Camera Controls
- [ ] **TEST-D007**: Left-drag rotates camera around room
- [ ] **TEST-D008**: Scroll wheel zooms in/out smoothly
- [ ] **TEST-D009**: Right-drag pans view
- [ ] **TEST-D010**: Camera cannot go below floor
- [ ] **TEST-D011**: Zoom limits work (min: 5 units, max: 50 units)
- [ ] **TEST-D012**: Damping provides smooth movement

**How to Test:**
1. Click and drag with left mouse button → Should rotate
2. Scroll wheel → Should zoom
3. Right-click and drag → Should pan
4. Try to zoom through floor → Should stop at limit
5. Try extreme zoom out → Should stop at max distance

#### Cart Interaction
- [ ] **TEST-D013**: Click cart to select (blue glow appears)
- [ ] **TEST-D014**: Drag cart moves it across floor
- [ ] **TEST-D015**: Cart position syncs between 3D and 2D views
- [ ] **TEST-D016**: Inspector shows cart properties when selected
- [ ] **TEST-D017**: Rotation slider updates cart orientation (0-360°)
- [ ] **TEST-D018**: Preset rotation buttons work (0°, 90°, 180°, 270°)
- [ ] **TEST-D019**: Cart type dropdown changes cart appearance
- [ ] **TEST-D020**: Color picker updates cart color immediately

**How to Test:**
1. Click any cart → Should see blue highlight
2. Drag cart around → Position updates in both views
3. Check inspector panel → Properties displayed correctly
4. Change rotation → Cart rotates in 3D
5. Change cart type → Geometry updates (e.g., IV pole appears)
6. Change color → Both 2D and 3D update

#### Drawer Interaction
- [ ] **TEST-D021**: Click drawer to select it
- [ ] **TEST-D022**: Selected drawer glows blue
- [ ] **TEST-D023**: Selected drawer slides open smoothly
- [ ] **TEST-D024**: Click elsewhere closes drawer
- [ ] **TEST-D025**: Inspector shows drawer contents
- [ ] **TEST-D026**: Drawers colored by cart type
- [ ] **TEST-D027**: Multiple drawers can be opened sequentially

**How to Test:**
1. Click on a drawer front → Should glow and slide out
2. Observe animation → Should be smooth (lerp-based)
3. Click floor or other object → Drawer closes
4. Try each cart type → Colors should differ
5. Open drawer → Check inspector for item list

#### Cart Management
- [ ] **TEST-D028**: "Add Cart" creates new cart
- [ ] **TEST-D029**: New cart appears in both 3D and 2D
- [ ] **TEST-D030**: "Delete" button removes cart
- [ ] **TEST-D031**: Cart removed from both views
- [ ] **TEST-D032**: Hierarchy updates when carts added/removed
- [ ] **TEST-D033**: Can create 10+ carts without issues

**How to Test:**
1. Click "Add Cart" → New cart appears
2. Count carts in hierarchy, 2D, and 3D → Should match
3. Select cart and click delete → Disappears from all views
4. Add 10 carts → Performance should remain good

#### Data Management
- [ ] **TEST-D034**: Changes autosave every 5 seconds
- [ ] **TEST-D035**: Refresh page preserves changes
- [ ] **TEST-D036**: Export downloads JSON file
- [ ] **TEST-D037**: Import loads configuration correctly
- [ ] **TEST-D038**: Import rebuilds 3D scene
- [ ] **TEST-D039**: "Reset to Defaults" restores original 5 carts
- [ ] **TEST-D040**: Old 2D configs migrate to 3D format

**How to Test:**
1. Make changes → Wait 5 seconds → Refresh → Changes persist
2. Click Export → JSON file downloads
3. Click Import → Select exported file → Scene rebuilds correctly
4. Click Reset → Returns to default 5 carts
5. Import old 2D config → Automatically converts, shows notice

#### Special Cart Types
- [ ] **TEST-D041**: IV Cart has tall pole and hooks
- [ ] **TEST-D042**: Procedure Table is flat with no drawers
- [ ] **TEST-D043**: Crash Cart has 5 red drawers
- [ ] **TEST-D044**: All 7 cart types render correctly
- [ ] **TEST-D045**: Cart dimensions vary by type

**How to Test:**
1. Create or select IV cart → Verify pole extends upward
2. Create procedure table → Should be flat surface
3. Cycle through all cart types → Each should look distinct

#### Top-Down View
- [ ] **TEST-D046**: "Top-Down View" button switches camera
- [ ] **TEST-D047**: Camera transitions smoothly (1 second)
- [ ] **TEST-D048**: Top-down shows birds-eye view
- [ ] **TEST-D049**: Can switch back to orbital view
- [ ] **TEST-D050**: Selection still works in top-down mode

**How to Test:**
1. Click camera toggle button
2. Observe smooth transition
3. Try selecting and moving carts
4. Toggle back to orbital view

---

### Training Mode Tests (trainer.html)

#### Scene Loading
- [ ] **TEST-T001**: Loading screen appears on startup
- [ ] **TEST-T002**: Progress messages update (0% → 100%)
- [ ] **TEST-T003**: Loading screen fades out smoothly
- [ ] **TEST-T004**: Menu screen appears after loading
- [ ] **TEST-T005**: Scenarios listed correctly
- [ ] **TEST-T006**: Quality settings displayed

**How to Test:**
1. Open `trainer.html`
2. Watch loading sequence
3. Verify messages change every ~200ms
4. Check fade-out animation
5. Verify menu appears

#### Menu & Quality Settings
- [ ] **TEST-T007**: Can select Low/Medium/High quality
- [ ] **TEST-T008**: Current quality highlighted
- [ ] **TEST-T009**: Quality description displayed
- [ ] **TEST-T010**: Quality preference saves
- [ ] **TEST-T011**: Refresh preserves quality choice
- [ ] **TEST-T012**: Auto-detection works on first load

**How to Test:**
1. Click each quality level → UI updates
2. Refresh page → Selected quality remembered
3. Open on mobile device → Should auto-select Low
4. Open on desktop with GPU → Should select Med/High

#### First-Person Camera
- [ ] **TEST-T013**: Camera at eye level (5.5 feet)
- [ ] **TEST-T014**: Mouse look works (pointer lock)
- [ ] **TEST-T015**: Mouse moves camera smoothly
- [ ] **TEST-T016**: Pitch limited to prevent flipping
- [ ] **TEST-T017**: Yaw rotates full 360°
- [ ] **TEST-T018**: Crosshair visible in center

**How to Test:**
1. Start scenario → Click to lock pointer
2. Move mouse → Camera follows
3. Try to look straight up/down → Should stop at limit
4. Rotate 360° → Should be smooth
5. Check center of screen → Crosshair visible

#### WASD Movement
- [ ] **TEST-T019**: W key moves forward
- [ ] **TEST-T020**: S key moves backward
- [ ] **TEST-T021**: A key strafes left
- [ ] **TEST-T022**: D key strafes right
- [ ] **TEST-T023**: Shift key enables sprint
- [ ] **TEST-T024**: Movement respects camera direction
- [ ] **TEST-T025**: Cannot walk through walls
- [ ] **TEST-T026**: Cannot walk through carts (if collision enabled)

**How to Test:**
1. Hold W → Should move forward
2. Look left, hold W → Should move in look direction
3. Hold Shift → Speed increases noticeably
4. Walk into wall → Should stop
5. Release keys → Movement stops smoothly

#### Drawer Interaction (Training)
- [ ] **TEST-T027**: Look at drawer → Highlights
- [ ] **TEST-T028**: Interaction prompt appears ("Press E...")
- [ ] **TEST-T029**: E key opens drawer
- [ ] **TEST-T030**: Click mouse also opens drawer
- [ ] **TEST-T031**: Drawer slides out smoothly
- [ ] **TEST-T032**: Look away → Drawer closes

**How to Test:**
1. Walk up to cart
2. Look directly at drawer → Should glow blue
3. Press E → Drawer opens
4. Look away → Drawer closes automatically
5. Try clicking instead of E → Should also work

#### Scenario Gameplay
- [ ] **TEST-T033**: Timer starts when scenario begins
- [ ] **TEST-T034**: Timer updates every second
- [ ] **TEST-T035**: Items checklist displayed
- [ ] **TEST-T036**: Finding item checks it off
- [ ] **TEST-T037**: Progress bar updates
- [ ] **TEST-T038**: All items found triggers completion
- [ ] **TEST-T039**: Completion screen shows stats
- [ ] **TEST-T040**: Score calculated based on time

**How to Test:**
1. Select scenario from menu
2. Watch timer start
3. Open drawers to find items
4. Check item off list when found
5. Find all items → Completion screen appears
6. Verify time, score, achievement displayed

#### Performance Display
- [ ] **TEST-T041**: F3 toggles FPS counter
- [ ] **TEST-T042**: FPS updates every second
- [ ] **TEST-T043**: FPS color-coded (green/orange/red)
- [ ] **TEST-T044**: FPS counter hidden by default
- [ ] **TEST-T045**: Performance warnings in console if <30 FPS

**How to Test:**
1. Press F3 → FPS counter appears
2. Check value → Should be near 60 on desktop
3. Press F3 again → Counter hides
4. If FPS low → Check console for warning

#### Sound Effects (Optional)
- [ ] **TEST-T046**: Drawer open sound plays (if audio file exists)
- [ ] **TEST-T047**: Drawer close sound plays
- [ ] **TEST-T048**: Item found sound plays
- [ ] **TEST-T049**: Completion sound plays
- [ ] **TEST-T050**: No errors if sound files missing
- [ ] **TEST-T051**: Sound preference persists

**How to Test:**
1. Add sound files to `/sounds/` folder
2. Open drawer → Listen for sound
3. Find item → Listen for sound
4. Complete scenario → Listen for success sound
5. Without sounds → Should work silently

---

## Performance Testing

### Desktop Performance
- [ ] **TEST-P001**: 60 FPS with 5 carts (High quality)
- [ ] **TEST-P002**: 55+ FPS with 10 carts (High quality)
- [ ] **TEST-P003**: 45+ FPS with 20 carts (Medium quality)
- [ ] **TEST-P004**: No memory leaks after 10 minutes
- [ ] **TEST-P005**: Scene loads in <2 seconds
- [ ] **TEST-P006**: Smooth camera movement (no stuttering)
- [ ] **TEST-P007**: Drawer animations smooth (60fps)

**How to Test:**
1. Press F3 to show FPS
2. Add carts and monitor performance
3. Run for 10 minutes → Check memory in Task Manager
4. Time from page load to menu appearing
5. Rotate camera → Should be smooth

### Low-End Device Performance
- [ ] **TEST-P008**: 30+ FPS on integrated graphics (Low quality)
- [ ] **TEST-P009**: Auto-detects need for Low quality
- [ ] **TEST-P010**: Shadows disabled on Low quality
- [ ] **TEST-P011**: Reduced draw calls with Low quality
- [ ] **TEST-P012**: Acceptable performance on 5-year-old laptop

**How to Test:**
1. Test on older laptop or tablet
2. Verify auto-detection chooses Low
3. Check FPS → Should be 30+
4. Compare shadows → Should be off on Low

### Load Testing
- [ ] **TEST-P013**: Can handle 25+ carts without crashing
- [ ] **TEST-P014**: Import large configuration works
- [ ] **TEST-P015**: Export large configuration works
- [ ] **TEST-P016**: No slowdown after 100 drawer operations

**How to Test:**
1. Create configuration with 25 carts
2. Test all interactions
3. Export → Should work
4. Open/close drawers 100 times → Should remain responsive

---

## Browser Compatibility

### Chrome/Edge (Chromium)
- [ ] **TEST-B001**: Chrome 90+ works fully
- [ ] **TEST-B002**: Edge 90+ works fully
- [ ] **TEST-B003**: Three.js renders correctly
- [ ] **TEST-B004**: Pointer lock works
- [ ] **TEST-B005**: LocalStorage works

### Firefox
- [ ] **TEST-B006**: Firefox 88+ works fully
- [ ] **TEST-B007**: WebGL renders correctly
- [ ] **TEST-B008**: Camera controls work
- [ ] **TEST-B009**: Performance acceptable

### Safari
- [ ] **TEST-B010**: Safari 14+ works fully
- [ ] **TEST-B011**: WebGL support enabled
- [ ] **TEST-B012**: No Safari-specific bugs
- [ ] **TEST-B013**: Touch events work on iPad

---

## Mobile Testing

### Mobile Browsers
- [ ] **TEST-M001**: Works on Mobile Chrome (Android)
- [ ] **TEST-M002**: Works on Mobile Safari (iOS)
- [ ] **TEST-M003**: Auto-selects Low quality on mobile
- [ ] **TEST-M004**: Touch controls functional (if implemented)
- [ ] **TEST-M005**: 30+ FPS on modern mobile devices
- [ ] **TEST-M006**: Responsive layout

**How to Test:**
1. Open on phone/tablet
2. Check quality auto-selection
3. Test touch interactions
4. Monitor FPS (F3)

---

## Accessibility Testing

### Keyboard Navigation
- [ ] **TEST-A001**: All controls accessible via keyboard
- [ ] **TEST-A002**: Tab navigation works
- [ ] **TEST-A003**: WASD alternative to arrow keys

### Screen Readers
- [ ] **TEST-A004**: Alt text on important UI elements
- [ ] **TEST-A005**: Aria labels where appropriate

### Color Blindness
- [ ] **TEST-A006**: Cart colors distinguishable
- [ ] **TEST-A007**: UI readable with color blindness filters

---

## Bug Reporting

### How to Report Bugs

**Include:**
1. **Browser & Version** (e.g., Chrome 120.0.6099.109)
2. **Operating System** (e.g., Windows 11, macOS 14.1)
3. **Device** (e.g., Desktop, iPhone 15)
4. **Steps to Reproduce**
5. **Expected Behavior**
6. **Actual Behavior**
7. **Screenshots/Videos** (if applicable)
8. **Console Errors** (F12 → Console tab)

**Example:**
```
Browser: Chrome 120, Windows 11
Device: Desktop (NVIDIA RTX 3060)
Test: TEST-D013 (Cart Selection)

Steps:
1. Open index.html
2. Click on Airway Cart

Expected: Cart glows blue and is selected
Actual: Cart does not highlight, console error appears

Console Error: "TypeError: Cannot read property 'material' of undefined"

Screenshot: [attached]
```

---

## Testing Checklist Summary

**Designer Mode:** 50 tests
**Training Mode:** 50 tests
**Performance:** 16 tests
**Browser Compatibility:** 13 tests
**Mobile:** 6 tests
**Accessibility:** 7 tests

**Total: 142 Test Cases**

---

## Test Results Template

```markdown
# Test Results - [Date]

**Tester:** [Name]
**Environment:** [Browser, OS, Device]
**Configuration:** [Default/Custom]

## Summary
- Total Tests: 142
- Passed: __
- Failed: __
- Skipped: __
- Pass Rate: __%

## Failed Tests
| Test ID | Description | Severity | Notes |
|---------|-------------|----------|-------|
| TEST-D007 | Camera rotation | High | Rotation inverted |
| TEST-T019 | Forward movement | Medium | Slow on Mac |

## Notes
[Any additional observations]
```

---

## Automated Testing (Future)

**Potential Tools:**
- **Jest** - Unit testing JavaScript functions
- **Puppeteer** - Automated browser testing
- **Playwright** - Cross-browser testing
- **WebGL Testing** - Three.js scene validation

**Example Test:**
```javascript
test('Cart creation adds to scene', () => {
    const cart = create3DCart(mockCartData);
    expect(cart.children.length).toBeGreaterThan(0);
    expect(cart.userData.type).toBe('cart');
});
```

---

**End of Testing Guide**
**Version:** 1.0
**Last Updated:** 2025-11-06
