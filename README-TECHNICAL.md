# Technical Documentation

This document provides detailed technical information for developers working on Simple Tileset Generator.

## Architecture Overview

Simple Tileset Generator is a vanilla JavaScript application with no build process or framework dependencies. It uses HTML5 Canvas for rendering and Two.js for the vector-based shape editor.

### Technology Stack

- **Vanilla JavaScript (ES6+)** - No framework, modular script organization
- **HTML5 Canvas API** - Tileset rendering, pattern editing, color picker
- **Two.js v0.8.10** (CDN) - Vector graphics for shape editor
- **CSS Grid & Flexbox** - Layout system

## Project Structure

```
simple-tileset-generator/
├── index.html              # Main HTML with UI structure and script loading
├── styles.css              # CSS entry point (imports component styles)
├── styles/
│   ├── base.css            # Typography, resets, form elements
│   ├── layout.css          # Two-column layout, header, footer
│   └── components.css      # UI components (buttons, modals, tabs, etc.)
├── scripts/
│   ├── main.js             # Application entry point, event listeners
│   ├── config.js           # Configuration constants
│   ├── canvas.js           # Main tileset canvas drawing
│   ├── shapes.js           # Shape list UI, drag-and-drop, selection
│   ├── patterns.js         # Pattern list UI, drag-and-drop, selection
│   ├── colors.js           # Color picker, palettes, color input
│   ├── sizeControls.js     # Tile size button controls
│   ├── session.js          # Save/load session functionality
│   ├── utils.js            # Utility functions
│   ├── shapeData.js        # Shape path data helpers, custom shape registration
│   ├── patternData.js      # Pattern pixel data helpers, custom pattern registration
│   ├── editor.js           # Shape editor entry point
│   ├── shapes/             # Individual shape definitions (30+ files)
│   │   ├── registry.js     # Shape renderer/data registries
│   │   ├── square.js       # Example: square shape definition
│   │   └── ...
│   ├── patterns/           # Individual pattern definitions (14 files)
│   │   ├── registry.js     # Pattern renderer/data registries
│   │   ├── checkerboard.js # Example: checkerboard pattern
│   │   └── ...
│   ├── editorFunctions/    # Shape editor modules
│   │   ├── state.js        # EditorState object
│   │   ├── coordinates.js  # Coordinate conversion
│   │   ├── grid.js         # Grid drawing
│   │   ├── pathManagement.js
│   │   ├── anchorManagement.js
│   │   ├── pointOperations.js
│   │   ├── pathNavigation.js
│   │   ├── eventHandlers.js
│   │   ├── shapeToolbar.js
│   │   └── modalManager.js
│   ├── patternEditorFunctions/  # Pattern editor modules
│   │   ├── state.js
│   │   ├── canvas.js
│   │   ├── drawing.js
│   │   ├── events.js
│   │   └── modalManager.js
│   └── tileTester/         # Tile tester modules
│       ├── state.js        # TileTesterState object
│       ├── mainCanvas.js   # Main canvas rendering
│       ├── paletteWindow.js
│       ├── layersPanel.js
│       ├── events.js
│       └── modalManager.js
└── swatches/               # Pre-made color palettes
    ├── muzli.json
    ├── adobe.json
    ├── colourlovers.json
    ├── coolors.json
    └── colorhunt.json
```

## Core Systems

### 1. Tileset Generation (`canvas.js`, `main.js`)

The main tileset is rendered on `<canvas id="canvas">`.

**Key function: `drawShapes(colors, size)`**

```javascript
function drawShapes(colors, size) {
  // Canvas dimensions = colors.length × selectedShapes.length + selectedPatterns.length
  canvas.width = colors.length * size;
  canvas.height = (selectedShapes.length + selectedPatterns.length) * size;

  // Draw shapes (each row = one shape, each column = one color)
  selectedShapes.forEach((shape, shapeIndex) => {
    colors.forEach((color, colorIndex) => {
      drawShape(colorIndex * size, shapeIndex * size, size, ctx, shape);
    });
  });

  // Draw patterns below shapes
  selectedPatterns.forEach((pattern, patternIndex) => {
    colors.forEach((color, colorIndex) => {
      drawPattern(colorIndex * size, (numShapes + patternIndex) * size, size, ctx, pattern);
    });
  });
}
```

**Triggering regeneration:**
- `generateTileset()` in `main.js` reads current colors/size and calls `drawShapes()`
- Called automatically on: color change, size change, shape/pattern selection change

### 2. Shape System

#### Registry Pattern (`shapes/registry.js`)

Shapes use a registry pattern for extensibility:

```javascript
var shapeRenderers = {};   // Shape name → render function
var shapePathData = {};    // Shape name → path definition
```

#### Shape Definition Format

Each shape file (e.g., `shapes/square.js`) registers itself:

```javascript
shapePathData.square = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};

shapeRenderers.square = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.square);
};
```

**Coordinate system:** 0-1 normalized coordinates, scaled by tile size at render time.

**Bezier curves:** Supported via `ctrlLeft` and `ctrlRight` on vertices:

```javascript
{
  x: 0.5, y: 0,
  ctrlLeft: { x: -0.276, y: 0 },   // Relative to vertex
  ctrlRight: { x: 0.276, y: 0 }
}
```

#### Multi-Path Shapes

Complex shapes with holes use the `paths` array format:

```javascript
{
  paths: [
    { vertices: [...], closed: true },  // Outer path
    { vertices: [...], closed: true }   // Inner path (hole)
  ],
  holePathIndices: [1]  // Which paths are holes
}
```

Holes are rendered using `destination-out` composite operation.

#### Shape Order and Selection (`shapes.js`)

- `shapeOrder[]` - Array of shape names in current order (supports duplicates)
- `getSelectedShapes()` - Returns array of checked shape names
- `rebuildShapeList()` - Reconstructs UI from `shapeOrder`, preserves checkbox states
- Drag-and-drop reordering modifies `shapeOrder` and rebuilds

### 3. Pattern System

#### Registry Pattern (`patterns/registry.js`)

```javascript
var patternRenderers = {};    // Pattern name → render function
var patternPixelData = {};    // Pattern name → pixel definition
```

#### Pattern Definition Format

Patterns use a 2D pixel array where 1 = filled, 0 = empty:

```javascript
patternPixelData.checkerboard = {
  size: 8,
  pixels: [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    // ... (8 rows total)
  ]
};

patternRenderers.checkerboard = function(x, y, size, ctx) {
  drawPatternFromPixelData(x, y, size, ctx, patternPixelData.checkerboard);
};
```

**Rendering:** The pattern grid is scaled to fit the tile size. Each pixel becomes `tileSize / patternSize` actual pixels.

### 4. Color System (`colors.js`)

#### Color Wheel (Picker Tab)

Uses HSL color model:

```javascript
let colorWheelState = {
  hue: 0,          // 0-360
  saturation: 100, // 0-100
  lightness: 50,   // 0-100
  opacity: 100     // 0-100
};
```

**Color field canvas:** 2D gradient showing saturation (horizontal) and lightness (vertical) for current hue.

**Key functions:**
- `initColorField()` - Sets up canvas with gradients
- `drawColorField()` - Renders HSL gradient
- `updateWheelPreview()` - Updates preview color and opacity slider
- `hslToRgb(h, s, l)` - Color conversion for final hex output

#### Palettes Tab

Pre-made palettes loaded from JSON files in `swatches/`:

```javascript
const paletteSources = [
  'swatches/muzli.json',
  'swatches/adobe.json',
  // ...
];
```

Each JSON contains:
```json
{
  "name": "Source Name",
  "url": "https://source-url.com",
  "palettes": [
    ["#FF0000", "#00FF00", "#0000FF"],
    ["#FFFFFF", "#000000"]
  ]
}
```

#### Swatches Tab

Procedurally generated RGB color grid:

```javascript
function generateColorPalette(complexity) {
  // complexity = step size (lower = more colors)
  for (let r = 0; r < 256; r += complexity) {
    for (let g = 0; g < 256; g += complexity) {
      for (let b = 0; b < 256; b += complexity) {
        // Add color swatch
      }
    }
  }
}
```

### 5. Shape Editor (`editor.js`, `editorFunctions/`)

Vector editor using Two.js for interactive path editing.

#### State Management (`editorFunctions/state.js`)

```javascript
const EditorState = {
  two: null,              // Two.js instance
  paths: [],              // Array of Two.Path objects
  anchors: [],            // Visual anchor points
  selectedAnchors: [],    // Currently selected points
  selectedPathIndices: [], // Multi-select for paths
  currentPathIndex: 0,    // Active path in multi-path shape
  boundingBox: null,      // Transform controls
  holePathIndices: []     // Paths marked as holes
};
```

#### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `coordinates.js` | Canvas ↔ normalized coordinate conversion |
| `grid.js` | Background grid rendering |
| `pathManagement.js` | Create, load, convert paths |
| `anchorManagement.js` | Visual anchor point management |
| `pointOperations.js` | Add, delete, toggle curve points |
| `pathNavigation.js` | Multi-path selection and navigation |
| `eventHandlers.js` | Mouse events, keyboard shortcuts |
| `shapeToolbar.js` | Toolbar actions (add shapes, reflect, align, cut) |
| `modalManager.js` | Modal open/close, save shape |

#### Keyboard Shortcuts

- `Cmd/Ctrl` - Show resize/rotate handles
- `Shift + drag` - Constrain to axis
- `Shift + resize` - Lock aspect ratio
- `Shift + rotate` - Snap to 45°
- `Alt + drag` - Duplicate shape
- `Shift + D` - Duplicate in place
- `Alt + click point` - Toggle curve/angle
- `Backspace/Delete` - Delete selected point

### 6. Pattern Editor (`patternEditorFunctions/`)

Pixel-based editor for creating/editing patterns.

#### State (`patternEditorFunctions/state.js`)

```javascript
const PatternEditorState = {
  canvas: null,
  ctx: null,
  previewCanvas: null,
  gridSize: 8,
  pixels: [],      // 2D array of 0/1 values
  isDrawing: false,
  drawMode: 1      // 1 = draw, 0 = erase
};
```

#### Features

- Click/drag to draw pixels
- Grid size selection (4, 8, 16, 32, custom)
- Invert pattern
- Upload image (converted to 1-bit)
- Download pattern as image
- Live preview tiling

### 7. Tile Tester (`tileTester/`)

Full-screen modal for testing tileset appearance.

#### State (`tileTester/state.js`)

```javascript
var TileTesterState = {
  layers: [],           // Array of layer objects
  activeLayerId: null,
  gridWidth: 16,
  gridHeight: 12,
  selectedTile: null,   // { row, col } of selected tile
  backgroundColor: '#d0d0d0',
  canvasZoom: 1,
  canvasPan: { x: 0, y: 0 }
};
```

#### Layer System

Each layer contains:
```javascript
{
  id: number,
  name: string,
  tiles: [][], // 2D grid of { row, col } or null
  opacity: 1,
  visible: true
}
```

#### Features

- Multi-layer support with opacity
- Tile palette window (draggable, resizable)
- Canvas zoom (1x-4x)
- Space + drag to pan
- Background color picker
- Export to PNG

### 8. Session Management (`session.js`)

Saves and loads complete application state as JSON.

#### Session Data Structure (v5)

```javascript
{
  version: 5,
  colors: "FFFFFF, 000000",
  tileSize: "64",
  paletteComplexity: "40",
  shapeOrder: ["square", "circle", "custom_123..."],
  selectedIndices: [0, 2],
  patternOrder: ["checkerboard", "dots"],
  selectedPatternIndices: [0],
  fitPreview: false,
  customShapes: { "custom_123...": { paths: [...] } },
  customPatterns: { "custom_456...": { size: 8, pixels: [...] } },
  tileTester: { layers: [...], backgroundColor: "#d0d0d0" }
}
```

### 9. Custom Shapes and Patterns

#### Creating Custom Shapes

1. Edit any shape with the shape editor
2. Modifications are saved as `custom_<timestamp>_<random>` shapes
3. Custom shapes stored in `customShapeRegistry`
4. Automatically registered with `shapeRenderers` and `shapePathData`

**Registration (`shapeData.js`):**

```javascript
function registerCustomShape(shapeId, pathData) {
  customShapeRegistry[shapeId] = pathData;
  shapePathData[shapeId] = pathData;
  shapeRenderers[shapeId] = function(x, y, size, ctx) {
    drawShapeFromPath(x, y, size, ctx, pathData);
  };
}
```

#### Creating Custom Patterns

1. Edit any pattern with the pattern editor
2. Modifications saved as `custom_<timestamp>_<random>` patterns
3. Custom patterns stored in `customPatternRegistry`

## Script Loading Order

Scripts must be loaded in dependency order (see `index.html`):

1. **Two.js** (CDN)
2. **config.js** - Constants
3. **shapes/registry.js** - Registries
4. **shapes/*.js** - Individual shapes
5. **patterns/registry.js** - Registries
6. **patterns/*.js** - Individual patterns
7. **Core scripts** - shapeData, patternData, shapes, patterns, canvas, sizeControls, colors, utils
8. **Editor modules** - editorFunctions/*.js, then editor.js
9. **Pattern editor modules** - patternEditorFunctions/*.js
10. **Tile tester modules** - tileTester/*.js
11. **main.js** - Entry point
12. **session.js** - Must be last (uses all above)

## Global Variables

Due to vanilla JS architecture, these are globally accessible:

| Variable | File | Purpose |
|----------|------|---------|
| `shapeRenderers` | shapes/registry.js | Shape render functions |
| `shapePathData` | shapes/registry.js | Shape path definitions |
| `patternRenderers` | patterns/registry.js | Pattern render functions |
| `patternPixelData` | patterns/registry.js | Pattern pixel definitions |
| `shapeOrder` | shapes.js | Current shape order array |
| `patternOrder` | patterns.js | Current pattern order array |
| `EditorState` | editorFunctions/state.js | Shape editor state |
| `PatternEditorState` | patternEditorFunctions/state.js | Pattern editor state |
| `TileTesterState` | tileTester/state.js | Tile tester state |
| `canvas`, `ctx` | index.html | Main tileset canvas |
| `shapes` | Referenced in shapes.js | Default shapes list |
| `patterns` | Referenced in patterns.js | Default patterns list |

## Adding New Shapes

1. Create `scripts/shapes/myShape.js`:

```javascript
shapePathData.myShape = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0.5, y: 1 }
  ],
  closed: true
};

shapeRenderers.myShape = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.myShape);
};
```

2. Add to `index.html` script loading:
```html
<script src="scripts/shapes/myShape.js"></script>
```

3. Add to default shapes array (in shapes.js or config)

## Adding New Patterns

1. Create `scripts/patterns/myPattern.js`:

```javascript
patternPixelData.myPattern = {
  size: 8,
  pixels: [
    [1, 1, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 1, 1, 0, 0],
    // ... 8 rows
  ]
};

patternRenderers.myPattern = function(x, y, size, ctx) {
  drawPatternFromPixelData(x, y, size, ctx, patternPixelData.myPattern);
};
```

2. Add to `index.html` script loading
3. Add to default patterns array

## CSS Architecture

Styles are modular under `styles/`:

- **base.css** - Reset, typography, form styling
- **layout.css** - Two-column grid, header, footer
- **components.css** - All UI components:
  - Shape/pattern selection lists
  - Color picker and tabs
  - Modals (shape editor, pattern editor, tile tester)
  - Buttons, sliders, checkboxes

## Performance Considerations

1. **Canvas rendering** - Shapes are redrawn completely on each change
2. **Drag-and-drop** - Rebuilds entire list UI after reorder
3. **Pattern editor** - Large grid sizes (32+) can impact responsiveness
4. **Tile tester** - Large grids with many layers may slow rendering

## Browser Compatibility

- Modern browsers with ES6+ support
- HTML5 Canvas required
- CSS Grid and Flexbox for layout
- No IE11 support
