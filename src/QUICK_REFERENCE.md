# Quick Reference Guide

## Extracted Functions from teacher.js

This guide provides a quick lookup for all functions extracted from teacher.js and their new locations.

---

## Function Location Map

| Original Function | New Location | Line in teacher.js |
|-------------------|--------------|-------------------|
| `saveConfiguration()` | `src/persistence/storage.js` | 3045 |
| `loadConfiguration()` | `src/persistence/storage.js` | 3056 |
| `saveAll()` | `src/persistence/storage.js` | 3049 |
| `exportConfiguration()` | `src/persistence/export.js` | 3269 |
| `importConfiguration()` | `src/persistence/import.js` | 3280 |
| `processImport()` | `src/persistence/import.js` | 3284 |
| `validateAndMigrateConfig()` | `src/persistence/migration.js` | 3317 |
| `resetToDefaults()` | `src/persistence/migration.js` | 3395 |
| `showAlert()` | `src/ui/alerts.js` | 3426 |
| `closeModal()` | `src/ui/alerts.js` | 3436 |
| `updateStatusBar()` | `src/ui/statusBar.js` | 3035 |

---

## Import Cheat Sheet

### Option 1: Import from index.js (Recommended)

```javascript
import {
    // Storage
    saveConfiguration,
    loadConfiguration,
    saveAll,

    // Export
    exportConfiguration,

    // Import
    importConfiguration,
    processImport,

    // Migration
    validateAndMigrateConfig,
    resetToDefaults,

    // Alerts
    showAlert,
    closeModal,

    // Status Bar
    updateStatusBar
} from './src/index.js';
```

### Option 2: Import from Individual Modules

```javascript
// Persistence
import { saveConfiguration, loadConfiguration, saveAll } from './src/persistence/storage.js';
import { exportConfiguration } from './src/persistence/export.js';
import { importConfiguration, processImport } from './src/persistence/import.js';
import { validateAndMigrateConfig, resetToDefaults } from './src/persistence/migration.js';

// UI
import { showAlert, closeModal } from './src/ui/alerts.js';
import { updateStatusBar } from './src/ui/statusBar.js';
```

---

## Common Use Cases

### 1. Save Configuration

```javascript
import { saveConfiguration } from './src/index.js';

CONFIG.carts.push(newCart);
saveConfiguration();
```

### 2. Save with User Feedback

```javascript
import { saveAll } from './src/index.js';

CONFIG.items.push(newItem);
saveAll(); // Saves + shows toast + updates status
```

### 3. Load Configuration

```javascript
import { loadConfiguration } from './src/index.js';

window.onload = () => {
    loadConfiguration();
    // CONFIG is now populated
};
```

### 4. Export Configuration

```javascript
import { exportConfiguration } from './src/index.js';

document.getElementById('export-btn').onclick = exportConfiguration;
```

### 5. Import Configuration

```javascript
import { importConfiguration, processImport } from './src/index.js';

// Open modal
document.getElementById('import-btn').onclick = importConfiguration;

// Process file
document.getElementById('import-process-btn').onclick = processImport;
```

### 6. Reset to Defaults

```javascript
import { resetToDefaults } from './src/index.js';

document.getElementById('reset-btn').onclick = resetToDefaults;
```

### 7. Show Notifications

```javascript
import { showAlert } from './src/index.js';

showAlert('Operation successful', 'success');
showAlert('An error occurred', 'error');
```

### 8. Update Status Bar

```javascript
import { updateStatusBar } from './src/index.js';

CONFIG.carts.push(newCart);
updateStatusBar(); // Updates all counters
```

---

## Dependencies Between Modules

```
alerts.js (no dependencies)
    ↑
    ├── storage.js
    ├── export.js
    ├── import.js
    └── migration.js

statusBar.js (no dependencies)
    ↑
    ├── import.js
    └── migration.js

storage.js
    ↑
    ├── import.js
    └── migration.js

migration.js
    ↑
    └── import.js
```

**Key Insight:** `alerts.js` and `statusBar.js` have no dependencies on other modules, making them safe to import first.

---

## Global Variables Required

These modules depend on global variables from teacher.js:

| Module | Requires |
|--------|----------|
| `storage.js` | `CONFIG`, `STATE` |
| `export.js` | `CONFIG` |
| `import.js` | `CONFIG` |
| `migration.js` | `CONFIG` |
| `alerts.js` | None (DOM only) |
| `statusBar.js` | `CONFIG` |

**Important:** Ensure `CONFIG` and `STATE` are defined before importing modules.

---

## DOM Elements Required

### alerts.js
- `#alert-toast` - Toast notification container

### statusBar.js
- `#status-carts` - Cart counter
- `#status-cameras` - Camera counter
- `#status-scenarios` - Scenario counter
- `#status-drawers` - Drawer counter
- `#status-items` - Item counter
- `#status-achievements` - Achievement counter

### storage.js
- `#room-bg-color` - Room background color input
- `#status-message` - Status message display

### import.js
- `#import-modal` - Import modal dialog
- `#import-file` - File input element

---

## Integration Steps

### Step 1: Add to HTML

```html
<script type="module" src="src/index.js"></script>
<script type="module" src="teacher.js"></script>
```

### Step 2: Update teacher.js

```javascript
// Add imports at the top
import {
    saveConfiguration,
    loadConfiguration,
    saveAll,
    exportConfiguration,
    importConfiguration,
    processImport,
    validateAndMigrateConfig,
    resetToDefaults,
    showAlert,
    closeModal,
    updateStatusBar
} from './src/index.js';

// Remove the original function definitions (lines 3035-3438)
// Keep all other code
```

### Step 3: Test

- [ ] Save/load works
- [ ] Export downloads JSON
- [ ] Import accepts JSON
- [ ] Reset to defaults works
- [ ] Alerts appear and disappear
- [ ] Status bar updates
- [ ] No console errors

---

## Troubleshooting

### "CONFIG is not defined"
**Solution:** Ensure `CONFIG` is declared before importing modules.

### "Cannot find module"
**Solution:** Check file paths are correct. Use `./src/index.js` not `src/index.js`.

### "showAlert is not a function"
**Solution:** Make sure you've imported the function and removed the original definition.

### Status bar shows "0" for everything
**Solution:** Call `updateStatusBar()` after `loadConfiguration()`.

### Import button doesn't work
**Solution:** Ensure modal HTML exists with id="import-modal".

---

## File Sizes

| File | Lines | Size |
|------|-------|------|
| `storage.js` | ~180 | 7.5 KB |
| `export.js` | ~150 | 5.8 KB |
| `import.js` | ~220 | 8.2 KB |
| `migration.js` | ~280 | 10.5 KB |
| `alerts.js` | ~250 | 9.1 KB |
| `statusBar.js` | ~240 | 8.9 KB |
| `index.js` | ~170 | 6.4 KB |
| **Total** | **~1,490** | **~56.4 KB** |

---

## Version Compatibility

- **Extracted from:** teacher.js (current version)
- **Compatible with:** All modern browsers with ES6 module support
- **Requires:** No build step (native ES6 modules)
- **IE11:** Not supported (use Babel to transpile)

---

## License

Copyright CabinetQuest Team. All rights reserved.
