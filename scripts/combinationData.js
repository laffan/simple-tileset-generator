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
 * NEW Combination data structure (v2):
 * {
 *   id: string,                    // Unique identifier
 *   name: string,                  // Display name (optional)
 *   tileRows: number,              // Number of tile rows (1-8)
 *   tileCols: number,              // Number of tile columns (1-8)
 *   shapeData: array,              // Normalized path data (same format as shapes)
 *   patternData: {                 // Optional pattern mask
 *     size: number,
 *     pixels: number[][]           // 0 = transparent (remove), 1 = opaque (keep)
 *   }
 * }
 *
 * The shape is divided across (tileRows × tileCols) tiles.
 * The pattern acts as a mask: dark pixels keep the shape, white pixels remove it.
 */

// Create an empty combination with given dimensions
function createEmptyCombination(rows, cols) {
  // Default shape is a square filling the entire area
  const defaultShapeData = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5]
  ];

  return {
    id: generateCombinationId(),
    name: '',
    tileRows: rows || 2,
    tileCols: cols || 2,
    shapeData: defaultShapeData,
    patternData: null  // No mask by default
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
// x, y: position of the top-left corner
// tileSize: size of a single tile
// ctx: canvas rendering context
// combinationData: the combination to render
// color: fill color for the shape
function drawCombination(x, y, tileSize, ctx, combinationData, color) {
  if (!combinationData || !combinationData.shapeData) return { width: 1, height: 1 };

  const { tileRows, tileCols, shapeData, pathPatterns, patternData } = combinationData;
  const totalWidth = tileCols * tileSize;
  const totalHeight = tileRows * tileSize;

  // Create a temporary canvas for the full combination
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = totalWidth;
  tempCanvas.height = totalHeight;
  const tempCtx = tempCanvas.getContext('2d');

  // Render the shape (with per-path patterns if available)
  // Pass tileSize so patterns tile per-tile, not stretched across whole canvas
  tempCtx.fillStyle = color || ctx.fillStyle || '#333';
  renderNormalizedShape(tempCtx, shapeData, totalWidth, totalHeight, pathPatterns, tileSize);

  // Legacy: Apply single pattern mask if present and no pathPatterns
  if (!pathPatterns && patternData && patternData.pixels && hasPatternFill(patternData)) {
    applyPatternMaskToCombination(tempCtx, patternData, totalWidth, totalHeight, tileSize);
  }

  // Draw to the main canvas
  ctx.drawImage(tempCanvas, x, y);

  return { width: tileCols, height: tileRows };
}

// Check if pattern has any filled pixels
function hasPatternFill(patternData) {
  if (!patternData || !patternData.pixels) return false;
  for (const row of patternData.pixels) {
    if (row) {
      for (const pixel of row) {
        if (pixel === 1) return true;
      }
    }
  }
  return false;
}

// Helper functions for bezier curve rendering
function getPointCoords(point) {
  if (Array.isArray(point)) {
    return { x: point[0], y: point[1] };
  }
  return { x: point.x, y: point.y };
}

// Draw a path with bezier curve support
function drawPathWithCurves(ctx, pathData, width, height, closePath) {
  if (!pathData || !pathData.length) return;

  pathData.forEach((point, i) => {
    const coords = getPointCoords(point);
    const px = (coords.x + 0.5) * width;
    const py = (coords.y + 0.5) * height;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      // Check if we need to draw a bezier curve
      const prevPoint = pathData[i - 1];
      const prevCoords = getPointCoords(prevPoint);

      const prevHasCtrlRight = !Array.isArray(prevPoint) && prevPoint.ctrlRight;
      const currentHasCtrlLeft = !Array.isArray(point) && point.ctrlLeft;

      if (prevHasCtrlRight || currentHasCtrlLeft) {
        // Bezier curve
        const cp1x = prevHasCtrlRight
          ? (prevCoords.x + prevPoint.ctrlRight.x + 0.5) * width
          : (prevCoords.x + 0.5) * width;
        const cp1y = prevHasCtrlRight
          ? (prevCoords.y + prevPoint.ctrlRight.y + 0.5) * height
          : (prevCoords.y + 0.5) * height;
        const cp2x = currentHasCtrlLeft
          ? (coords.x + point.ctrlLeft.x + 0.5) * width
          : px;
        const cp2y = currentHasCtrlLeft
          ? (coords.y + point.ctrlLeft.y + 0.5) * height
          : py;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
  });

  // Handle closing segment (last point to first point)
  if (closePath && pathData.length > 2) {
    const lastPoint = pathData[pathData.length - 1];
    const firstPoint = pathData[0];
    const lastCoords = getPointCoords(lastPoint);
    const firstCoords = getPointCoords(firstPoint);

    const lastHasCtrlRight = !Array.isArray(lastPoint) && lastPoint.ctrlRight;
    const firstHasCtrlLeft = !Array.isArray(firstPoint) && firstPoint.ctrlLeft;

    if (lastHasCtrlRight || firstHasCtrlLeft) {
      const cp1x = lastHasCtrlRight
        ? (lastCoords.x + lastPoint.ctrlRight.x + 0.5) * width
        : (lastCoords.x + 0.5) * width;
      const cp1y = lastHasCtrlRight
        ? (lastCoords.y + lastPoint.ctrlRight.y + 0.5) * height
        : (lastCoords.y + 0.5) * height;
      const cp2x = firstHasCtrlLeft
        ? (firstCoords.x + firstPoint.ctrlLeft.x + 0.5) * width
        : (firstCoords.x + 0.5) * width;
      const cp2y = firstHasCtrlLeft
        ? (firstCoords.y + firstPoint.ctrlLeft.y + 0.5) * height
        : (firstCoords.y + 0.5) * height;
      const fx = (firstCoords.x + 0.5) * width;
      const fy = (firstCoords.y + 0.5) * height;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, fx, fy);
    }
  }

  ctx.closePath();
}

// Render normalized shape to canvas (with optional per-path patterns)
// tileSize is used so patterns tile per-tile rather than across the whole canvas
// Supports bezier curves via control points
// Supports holePathIndices for proper hole rendering using destination-out
function renderNormalizedShape(ctx, shapeData, width, height, pathPatterns, tileSize) {
  // Handle multi-path shapes
  const pathsData = shapeData.paths || [shapeData];
  const fillRule = shapeData.fillRule || 'nonzero';
  const holeIndices = shapeData.holePathIndices || [];
  const hasPerPathPatterns = pathPatterns && Object.keys(pathPatterns).length > 0;

  // If we have per-path patterns, render each path separately
  if (hasPerPathPatterns) {
    // First pass: render all non-hole paths
    pathsData.forEach((pathData, pathIndex) => {
      if (!pathData || !pathData.length) return;
      if (holeIndices.includes(pathIndex)) return; // Skip holes in first pass

      // Create temp canvas for this path
      const pathCanvas = document.createElement('canvas');
      pathCanvas.width = width;
      pathCanvas.height = height;
      const pathCtx = pathCanvas.getContext('2d');
      pathCtx.fillStyle = ctx.fillStyle;

      // Draw the path with bezier curve support
      pathCtx.beginPath();
      drawPathWithCurves(pathCtx, pathData, width, height, true);
      pathCtx.fill(fillRule);

      // Apply this path's pattern if it has one
      // Pass tileSize so pattern tiles per-tile, not across whole canvas
      const pathPattern = pathPatterns[pathIndex];
      if (pathPattern && pathPattern.patternName) {
        const patternData = getScaledPatternData(pathPattern);
        if (patternData && hasPatternFill(patternData)) {
          applyPatternMaskToCombination(pathCtx, patternData, width, height, tileSize);
        }
      }

      // Draw to main canvas
      ctx.drawImage(pathCanvas, 0, 0);
    });

    // Second pass: erase hole paths using destination-out
    if (holeIndices.length > 0) {
      const savedComposite = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'destination-out';

      holeIndices.forEach(holeIndex => {
        const pathData = pathsData[holeIndex];
        if (!pathData || !pathData.length) return;

        ctx.beginPath();
        drawPathWithCurves(ctx, pathData, width, height, true);
        ctx.fill();
      });

      ctx.globalCompositeOperation = savedComposite;
    }
  } else {
    // No per-path patterns - check if we have holes
    if (holeIndices.length > 0) {
      // First pass: draw all non-hole paths
      pathsData.forEach((pathData, pathIndex) => {
        if (!pathData || !pathData.length) return;
        if (holeIndices.includes(pathIndex)) return;

        ctx.beginPath();
        drawPathWithCurves(ctx, pathData, width, height, true);
        ctx.fill(fillRule);
      });

      // Second pass: erase holes with destination-out
      const savedComposite = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'destination-out';

      holeIndices.forEach(holeIndex => {
        const pathData = pathsData[holeIndex];
        if (!pathData || !pathData.length) return;

        ctx.beginPath();
        drawPathWithCurves(ctx, pathData, width, height, true);
        ctx.fill();
      });

      ctx.globalCompositeOperation = savedComposite;
    } else {
      // No holes - render all paths together (original behavior)
      ctx.beginPath();

      pathsData.forEach((pathData) => {
        if (!pathData || !pathData.length) return;
        drawPathWithCurves(ctx, pathData, width, height, true);
      });

      ctx.fill(fillRule);
    }
  }
}

// Get pattern data from pathPattern settings
// Returns the ORIGINAL pattern (not scaled) plus the grid size
function getScaledPatternData(pathPattern) {
  if (!pathPattern || !pathPattern.patternName) return null;

  const patternData = getPatternPixelData(pathPattern.patternName);
  if (!patternData) return null;

  const gridSize = pathPattern.patternSize || 16;
  const shouldInvert = pathPattern.patternInvert || false;

  // Return original pattern with grid size info
  let pixels = patternData.pixels;

  // Apply invert if needed
  if (shouldInvert) {
    pixels = [];
    for (let y = 0; y < patternData.size; y++) {
      pixels[y] = [];
      for (let x = 0; x < patternData.size; x++) {
        const val = (patternData.pixels[y] && patternData.pixels[y][x]) ? 1 : 0;
        pixels[y][x] = val === 1 ? 0 : 1;
      }
    }
  }

  return {
    size: patternData.size,  // Original pattern size (e.g., 8)
    gridSize: gridSize,       // User-selected grid size (e.g., 4, 8, 16, 32)
    pixels: pixels
  };
}

// Apply pattern as mask (dark = keep, white = remove)
// Pattern tiles per individual tile (based on tileSize), not stretched across whole canvas
// gridSize controls how many cells per tile (pattern wraps/samples as needed)
function applyPatternMaskToCombination(ctx, patternData, width, height, tileSize) {
  if (!patternData || !patternData.pixels) return;

  const patternSize = patternData.size;      // Original pattern dimensions (e.g., 8)
  const gridSize = patternData.gridSize || patternSize;  // User-selected grid size (e.g., 4, 8, 16, 32)
  const pixels = patternData.pixels;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // If no tileSize provided, use width (single tile behavior)
  const effectiveTileSize = tileSize || width;

  // Calculate cell size based on GRID SIZE (user selection), not pattern size
  const cellWidth = effectiveTileSize / gridSize;
  const cellHeight = effectiveTileSize / gridSize;

  // For each pixel in the canvas, determine if it should be masked
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate which grid cell this pixel falls into
      const gridX = Math.floor((x % effectiveTileSize) / cellWidth);
      const gridY = Math.floor((y % effectiveTileSize) / cellHeight);

      // Sample from the original pattern (with wrapping if gridSize > patternSize)
      const px = gridX % patternSize;
      const py = gridY % patternSize;

      const patternPixel = pixels[py] && pixels[py][px];

      // If pattern pixel is white (0), clear this pixel
      if (patternPixel === 0) {
        const i = (y * width + x) * 4;
        data[i + 3] = 0; // Make transparent
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Draw a single tile from a combination
// tileRow, tileCol: which tile to draw (0-indexed)
// tileSize: size of the tile
// ctx: canvas context
// combinationData: the combination data
// color: fill color
function drawCombinationTile(tileRow, tileCol, tileSize, ctx, combinationData, color) {
  if (!combinationData || !combinationData.shapeData) return;

  const { tileRows, tileCols, shapeData, pathPatterns, patternData } = combinationData;
  const totalWidth = tileCols * tileSize;
  const totalHeight = tileRows * tileSize;

  // Create temp canvas for the full combination
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = totalWidth;
  tempCanvas.height = totalHeight;
  const tempCtx = tempCanvas.getContext('2d');

  // Render the full shape (with per-path patterns if available)
  // Pass tileSize so patterns tile per-tile, not stretched across whole canvas
  tempCtx.fillStyle = color || '#333';
  renderNormalizedShape(tempCtx, shapeData, totalWidth, totalHeight, pathPatterns, tileSize);

  // Legacy: Apply single pattern mask if present and no pathPatterns
  if (!pathPatterns && patternData && patternData.pixels && hasPatternFill(patternData)) {
    applyPatternMaskToCombination(tempCtx, patternData, totalWidth, totalHeight, tileSize);
  }

  // Extract the specific tile
  const srcX = tileCol * tileSize;
  const srcY = tileRow * tileSize;

  ctx.drawImage(
    tempCanvas,
    srcX, srcY, tileSize, tileSize,
    0, 0, tileSize, tileSize
  );
}

// Get the dimensions of a combination in tiles
function getCombinationDimensions(combinationData) {
  if (!combinationData) return { width: 1, height: 1 };
  return {
    width: combinationData.tileCols || 1,
    height: combinationData.tileRows || 1
  };
}

// Legacy support: Check if combination has content
function hasCombinationCells(combinationData) {
  return combinationData && combinationData.shapeData;
}

// Legacy support: resizeCombination now just updates tile dimensions
function resizeCombination(combinationData, newCols, newRows) {
  if (!combinationData) return combinationData;

  combinationData.tileCols = Math.max(1, Math.min(8, newCols));
  combinationData.tileRows = Math.max(1, Math.min(8, newRows));

  return combinationData;
}

// Migrate old combination data format to new format
function migrateCombinationData(oldData) {
  if (!oldData) return null;

  // Check if already new format
  if (oldData.shapeData !== undefined) {
    return oldData;
  }

  // Old format had gridWidth/gridHeight and cells array
  if (oldData.gridWidth !== undefined && oldData.cells) {
    // Create new format with default square shape
    const newData = {
      id: oldData.id,
      name: oldData.name || '',
      tileRows: oldData.gridHeight || 2,
      tileCols: oldData.gridWidth || 2,
      shapeData: [
        [-0.5, -0.5],
        [0.5, -0.5],
        [0.5, 0.5],
        [-0.5, 0.5]
      ],
      patternData: null
    };

    return newData;
  }

  return oldData;
}
