/* Combination data helpers - for multi-tile composite shapes */

// List of built-in combinations (starts empty - all user-created)
const combinations = [];

// Dedicated storage for custom combinations
const customCombinationRegistry = {};

// Helper function to get combination data
function getCombinationData(combinationName) {
  return customCombinationRegistry[combinationName] || null;
}

// Check if a name is a combination
function isCombination(name) {
  return name && name.startsWith('combination_');
}

// Generate a unique ID for a combination
function generateCombinationId() {
  return 'combination_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Combination data structure:
 * {
 *   id: string,                    // Unique identifier
 *   name: string,                  // Display name (optional)
 *   gridWidth: number,             // Number of tiles horizontally (1-5)
 *   gridHeight: number,            // Number of tiles vertically (1-5)
 *   cells: [                       // 2D array of cell data
 *     [
 *       {
 *         enabled: boolean,        // Is this cell part of the combination?
 *         shape: string,           // Shape name/ID (null if using default square)
 *         pattern: string|null     // Pattern name/ID to mask the shape (null if none)
 *       },
 *       ...
 *     ],
 *     ...
 *   ]
 * }
 */

// Create an empty combination with given dimensions
function createEmptyCombination(width, height) {
  const cells = [];
  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      cells[y][x] = {
        enabled: true,
        shape: 'square',
        pattern: null
      };
    }
  }
  return {
    id: generateCombinationId(),
    name: '',
    gridWidth: width,
    gridHeight: height,
    cells: cells
  };
}

// Create a default 2x2 combination
function createDefaultCombination() {
  return createEmptyCombination(2, 2);
}

// Deep copy combination data
function copyCombinationData(data) {
  return JSON.parse(JSON.stringify(data));
}

// Register a custom combination
function registerCustomCombination(combinationId, combinationData) {
  // Store in registry
  customCombinationRegistry[combinationId] = combinationData;
}

// Unregister a custom combination
function unregisterCustomCombination(combinationId) {
  delete customCombinationRegistry[combinationId];
}

// Get all custom combination data for session saving
function getCustomCombinationData() {
  const customData = {};
  for (const key in customCombinationRegistry) {
    if (customCombinationRegistry.hasOwnProperty(key)) {
      customData[key] = JSON.parse(JSON.stringify(customCombinationRegistry[key]));
    }
  }
  return customData;
}

// Load custom combination data from session
function loadCustomCombinationData(customData) {
  if (!customData) return;
  for (const key in customData) {
    if (customData.hasOwnProperty(key)) {
      registerCustomCombination(key, customData[key]);
    }
  }
}

// Render a combination to a canvas context
// Returns an object with width and height in tiles
function drawCombination(x, y, tileSize, ctx, combinationData) {
  if (!combinationData || !combinationData.cells) return { width: 1, height: 1 };

  const { gridWidth, gridHeight, cells } = combinationData;

  // Draw each enabled cell
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const cell = cells[row] && cells[row][col];
      if (!cell || !cell.enabled) continue;

      const cellX = x + col * tileSize;
      const cellY = y + row * tileSize;

      // Draw the shape
      const shapeName = cell.shape || 'square';

      if (cell.pattern) {
        // Pattern acts as a mask for the shape
        // First, draw the shape to a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tileSize;
        tempCanvas.height = tileSize;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw the shape in the current fill color
        tempCtx.fillStyle = ctx.fillStyle;
        drawShape(0, 0, tileSize, tempCtx, shapeName);

        // Apply pattern as mask using destination-in
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.fillStyle = '#000000';
        drawPattern(0, 0, tileSize, tempCtx, cell.pattern);

        // Draw the result to the main canvas
        ctx.drawImage(tempCanvas, cellX, cellY);
      } else {
        // Just draw the shape directly
        drawShape(cellX, cellY, tileSize, ctx, shapeName);
      }
    }
  }

  return { width: gridWidth, height: gridHeight };
}

// Get the bounding dimensions of a combination in tiles
function getCombinationDimensions(combinationData) {
  if (!combinationData) return { width: 1, height: 1 };
  return {
    width: combinationData.gridWidth || 1,
    height: combinationData.gridHeight || 1
  };
}

// Check if any cells in the combination are enabled
function hasCombinationCells(combinationData) {
  if (!combinationData || !combinationData.cells) return false;

  for (let row = 0; row < combinationData.gridHeight; row++) {
    for (let col = 0; col < combinationData.gridWidth; col++) {
      const cell = combinationData.cells[row] && combinationData.cells[row][col];
      if (cell && cell.enabled) return true;
    }
  }
  return false;
}

// Resize combination grid (preserving existing cells where possible)
function resizeCombination(combinationData, newWidth, newHeight) {
  const newCells = [];

  for (let y = 0; y < newHeight; y++) {
    newCells[y] = [];
    for (let x = 0; x < newWidth; x++) {
      // Copy existing cell data if available
      if (y < combinationData.gridHeight && x < combinationData.gridWidth &&
          combinationData.cells[y] && combinationData.cells[y][x]) {
        newCells[y][x] = { ...combinationData.cells[y][x] };
      } else {
        // Create new cell (disabled by default for expansion)
        newCells[y][x] = {
          enabled: false,
          shape: 'square',
          pattern: null
        };
      }
    }
  }

  combinationData.gridWidth = newWidth;
  combinationData.gridHeight = newHeight;
  combinationData.cells = newCells;

  return combinationData;
}
