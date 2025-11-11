# Source Modules Documentation

This directory contains modularized code extracted from `teacher.js`, organized into logical functional groups.

## Directory Structure

```
src/
├── persistence/
│   ├── storage.js      - localStorage save/load operations
│   ├── export.js       - Configuration export to JSON
│   ├── import.js       - Configuration import from JSON
│   └── migration.js    - Config validation and version migration
├── ui/
│   ├── alerts.js       - Toast notifications and modal management
│   └── statusBar.js    - Status bar counter updates
└── README.md          - This file
```

## Module Overview

### Persistence Modules (`persistence/`)

#### `storage.js`
Handles all localStorage operations for configuration persistence.

**Exports:**
- `saveConfiguration()` - Save CONFIG to localStorage
- `loadConfiguration()` - Load CONFIG from localStorage
- `saveAll()` - Save with UI feedback and status updates

**Dependencies:**
- Global `CONFIG` object
- Global `STATE` object
- `showAlert()` from `ui/alerts.js`
- `loadDefaultConfiguration()` from teacher.js

**Usage:**
```javascript
import { saveConfiguration, loadConfiguration, saveAll } from './persistence/storage.js';

// Load on startup
loadConfiguration();

// Save after changes
CONFIG.carts.push(newCart);
saveConfiguration();

// Save with user feedback
saveAll();
```

---

#### `export.js`
Provides configuration export functionality to JSON files.

**Exports:**
- `exportConfiguration()` - Export CONFIG as downloadable JSON file

**Dependencies:**
- Global `CONFIG` object
- `showAlert()` from `ui/alerts.js`

**Usage:**
```javascript
import { exportConfiguration } from './persistence/export.js';

// Export configuration
document.getElementById('export-btn').addEventListener('click', exportConfiguration);
```

**Output Format:**
```json
{
  "carts": [...],
  "drawers": [...],
  "items": [...],
  "scenarios": [...],
  "achievements": [...],
  "cameraViews": [...],
  "roomSettings": {...},
  "scoringRules": {...},
  "generalSettings": {...}
}
```

---

#### `import.js`
Handles importing configurations from JSON files.

**Exports:**
- `importConfiguration()` - Open import modal
- `processImport()` - Process selected file and import

**Dependencies:**
- Global `CONFIG` object
- `validateAndMigrateConfig()` from `persistence/migration.js`
- `saveConfiguration()` from `persistence/storage.js`
- `buildHierarchy()` from teacher.js
- `updateStatusBar()` from `ui/statusBar.js`
- `drawCanvas()` from teacher.js
- `buildAll3DCarts()` from teacher.js
- `showAlert()` from `ui/alerts.js`
- `closeModal()` from `ui/alerts.js`

**Usage:**
```javascript
import { importConfiguration, processImport } from './persistence/import.js';

// Open import dialog
document.getElementById('import-btn').addEventListener('click', importConfiguration);

// Process import
document.getElementById('import-process-btn').addEventListener('click', processImport);
```

---

#### `migration.js`
Validates and migrates configurations between versions.

**Exports:**
- `validateAndMigrateConfig(config)` - Validate and migrate configuration
- `resetToDefaults()` - Reset all configuration to defaults

**Dependencies:**
- Global `CONFIG` object
- `showAlert()` from `ui/alerts.js`
- `loadDefaultConfiguration()` from teacher.js
- `saveConfiguration()` from `persistence/storage.js`
- `deselectEntity()` from teacher.js
- `buildHierarchy()` from teacher.js
- `updateStatusBar()` from `ui/statusBar.js`
- `drawCanvas()` from teacher.js
- `buildAll3DCarts()` from teacher.js

**Usage:**
```javascript
import { validateAndMigrateConfig, resetToDefaults } from './persistence/migration.js';

// Validate imported config
const validConfig = validateAndMigrateConfig(importedConfig);

// Reset to defaults
document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
```

**Migration Features:**
- Adds `rotation` property to carts (2D → 3D migration)
- Infers cart `type` from name if missing
- Ensures all arrays exist with defaults
- Validates required properties

---

### UI Modules (`ui/`)

#### `alerts.js`
User notification and modal management.

**Exports:**
- `showAlert(message, type)` - Show toast notification
- `closeModal(id)` - Close modal dialog

**Dependencies:**
- DOM element: `#alert-toast`
- Modal elements passed by ID

**Usage:**
```javascript
import { showAlert, closeModal } from './ui/alerts.js';

// Show success message
showAlert('Configuration saved', 'success');

// Show error message
showAlert('Import failed', 'error');

// Close modal
closeModal('import-modal');
```

**Alert Types:**
- `'success'` - Green success toast (default)
- `'error'` - Red error toast
- Custom types can be added via CSS

**Required HTML:**
```html
<div id="alert-toast" class="alert-toast"></div>
```

**Required CSS:**
```css
.alert-toast { /* base styles */ }
.alert-toast.show { opacity: 1; }
.alert-toast.success { background: #4CAF50; }
.alert-toast.error { background: #f44336; }
```

---

#### `statusBar.js`
Updates status bar counters.

**Exports:**
- `updateStatusBar()` - Update all status bar counters

**Dependencies:**
- Global `CONFIG` object
- DOM elements: `#status-carts`, `#status-cameras`, `#status-scenarios`, `#status-drawers`, `#status-items`, `#status-achievements`

**Usage:**
```javascript
import { updateStatusBar } from './ui/statusBar.js';

// Update after configuration changes
CONFIG.carts.push(newCart);
updateStatusBar();

// Update after loading
loadConfiguration();
updateStatusBar();
```

**What It Counts:**
- **Carts**: Non-inventory carts only (excludes procedure tables)
- **Cameras**: Camera view presets
- **Scenarios**: Training scenarios
- **Drawers**: All drawers across all carts
- **Items**: All items in inventory
- **Achievements**: All achievements

**Required HTML:**
```html
<div class="status-bar">
  <span id="status-carts">0</span>
  <span id="status-cameras">0</span>
  <span id="status-scenarios">0</span>
  <span id="status-drawers">0</span>
  <span id="status-items">0</span>
  <span id="status-achievements">0</span>
</div>
```

---

## Integration Guide

### Step 1: Add Module Script Tags

Add to your HTML (before `teacher.js`):

```html
<!-- UI Modules -->
<script type="module" src="src/ui/alerts.js"></script>
<script type="module" src="src/ui/statusBar.js"></script>

<!-- Persistence Modules -->
<script type="module" src="src/persistence/storage.js"></script>
<script type="module" src="src/persistence/export.js"></script>
<script type="module" src="src/persistence/import.js"></script>
<script type="module" src="src/persistence/migration.js"></script>

<!-- Main Application -->
<script type="module" src="teacher.js"></script>
```

### Step 2: Update teacher.js

Replace the extracted functions with imports:

```javascript
// Import persistence functions
import {
    saveConfiguration,
    loadConfiguration,
    saveAll
} from './src/persistence/storage.js';

import { exportConfiguration } from './src/persistence/export.js';

import {
    importConfiguration,
    processImport
} from './src/persistence/import.js';

import {
    validateAndMigrateConfig,
    resetToDefaults
} from './src/persistence/migration.js';

// Import UI functions
import { showAlert, closeModal } from './src/ui/alerts.js';
import { updateStatusBar } from './src/ui/statusBar.js';
```

### Step 3: Remove Original Functions

Delete the following functions from teacher.js (they're now in modules):
- `saveConfiguration()`
- `loadConfiguration()`
- `saveAll()`
- `exportConfiguration()`
- `importConfiguration()`
- `processImport()`
- `validateAndMigrateConfig()`
- `resetToDefaults()`
- `showAlert()`
- `closeModal()`
- `updateStatusBar()`

### Step 4: Ensure Global Objects Are Accessible

The modules need access to `CONFIG` and `STATE`. Make sure these are declared before importing modules:

```javascript
// In teacher.js (at the top)
let CONFIG = {
    carts: [],
    drawers: [],
    items: [],
    scenarios: [],
    achievements: [],
    cameraViews: [],
    roomSettings: {},
    scoringRules: {},
    generalSettings: {}
};

let STATE = {
    unsavedChanges: false,
    // ... other state properties
};
```

---

## Dependency Graph

```
teacher.js (main application)
    │
    ├── persistence/storage.js
    │       ├── Depends on: CONFIG, STATE
    │       └── Depends on: ui/alerts.js (showAlert)
    │
    ├── persistence/export.js
    │       ├── Depends on: CONFIG
    │       └── Depends on: ui/alerts.js (showAlert)
    │
    ├── persistence/import.js
    │       ├── Depends on: CONFIG
    │       ├── Depends on: persistence/migration.js (validateAndMigrateConfig)
    │       ├── Depends on: persistence/storage.js (saveConfiguration)
    │       ├── Depends on: ui/statusBar.js (updateStatusBar)
    │       ├── Depends on: ui/alerts.js (showAlert, closeModal)
    │       └── Depends on: teacher.js functions (buildHierarchy, drawCanvas, buildAll3DCarts)
    │
    ├── persistence/migration.js
    │       ├── Depends on: CONFIG
    │       ├── Depends on: ui/alerts.js (showAlert)
    │       ├── Depends on: ui/statusBar.js (updateStatusBar)
    │       └── Depends on: teacher.js functions (loadDefaultConfiguration, deselectEntity, buildHierarchy, drawCanvas, buildAll3DCarts)
    │
    ├── ui/alerts.js
    │       └── Depends on: DOM elements (#alert-toast, modals)
    │
    └── ui/statusBar.js
            ├── Depends on: CONFIG
            └── Depends on: DOM elements (#status-*)
```

---

## localStorage Key Reference

| Key | Description | Format |
|-----|-------------|--------|
| `traumaRoomConfig` | Complete application configuration | JSON string |

---

## Testing Checklist

After integration, verify these features work:

- [ ] Configuration saves to localStorage
- [ ] Configuration loads from localStorage on page reload
- [ ] Export downloads a JSON file
- [ ] Import accepts and validates JSON files
- [ ] Import shows error for invalid files
- [ ] Migration adds missing properties to old configs
- [ ] Reset to defaults works
- [ ] Status bar updates after changes
- [ ] Toast notifications appear and disappear
- [ ] Modals open and close correctly
- [ ] Save button updates status message
- [ ] All counters in status bar are accurate

---

## Version History

### v1.0.0 (Current)
- Initial extraction from teacher.js
- 6 modules created (4 persistence, 2 UI)
- Full JSDoc documentation
- ES6 module exports

---

## Future Enhancements

Potential improvements for these modules:

1. **Error Handling**
   - Add try-catch blocks in all public functions
   - Graceful fallbacks for missing DOM elements
   - Detailed error logging

2. **TypeScript Conversion**
   - Add type definitions for CONFIG and STATE
   - Type-safe function parameters
   - Better IDE autocomplete

3. **Event System**
   - Emit events when configuration changes
   - Allow modules to subscribe to changes
   - Decouple modules further

4. **Testing**
   - Unit tests for each module
   - Integration tests
   - Mock DOM for testing

5. **Additional Features**
   - Auto-save functionality
   - Undo/redo support
   - Configuration versioning
   - Cloud backup/sync

---

## License

Copyright CabinetQuest Team. All rights reserved.
