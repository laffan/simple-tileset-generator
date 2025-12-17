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

// Render normalized shape to canvas (with optional per-path patterns)
// tileSize is used so patterns tile per-tile rather than across the whole canvas
function renderNormalizedShape(ctx, shapeData, width, height, pathPatterns, tileSize) {
  // Handle multi-path shapes
  const pathsData = shapeData.paths || [shapeData];
  const fillRule = shapeData.fillRule || 'nonzero';
  const hasPerPathPatterns = pathPatterns && Object.keys(pathPatterns).length > 0;

  // If we have per-path patterns, render each path separately
  if (hasPerPathPatterns) {
    pathsData.forEach((pathData, pathIndex) => {
      if (!pathData || !pathData.length) return;

      // Create temp canvas for this path
      const pathCanvas = document.createElement('canvas');
      pathCanvas.width = width;
      pathCanvas.height = height;
      const pathCtx = pathCanvas.getContext('2d');
      pathCtx.fillStyle = ctx.fillStyle;

      // Draw the path
      pathCtx.beginPath();
      pathData.forEach((point, i) => {
        const x = (point[0] + 0.5) * width;
        const y = (point[1] + 0.5) * height;
        if (i === 0) {
          pathCtx.moveTo(x, y);
        } else {
          pathCtx.lineTo(x, y);
        }
      });
      pathCtx.closePath();
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
  } else {
    // No per-path patterns - render all paths together (original behavior)
    ctx.beginPath();

    pathsData.forEach((pathData) => {
      if (!pathData || !pathData.length) return;

      pathData.forEach((point, i) => {
        const x = (point[0] + 0.5) * width;
        const y = (point[1] + 0.5) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.closePath();
    });

    ctx.fill(fillRule);
  }
}

// Get scaled pattern data from pathPattern settings
function getScaledPatternData(pathPattern) {
  if (!pathPattern || !pathPattern.patternName) return null;

  const patternData = getPatternPixelData(pathPattern.patternName);
  if (!patternData) return null;

  const targetSize = pathPattern.patternSize || 16;
  const sourceSize = patternData.size || 8;
  const shouldInvert = pathPattern.patternInvert || false;

  // Scale pattern to target size
  const scaledPixels = [];
  for (let y = 0; y < targetSize; y++) {
    scaledPixels[y] = [];
    for (let x = 0; x < targetSize; x++) {
      const srcX = Math.floor(x * sourceSize / targetSize);
      const srcY = Math.floor(y * sourceSize / targetSize);
      let pixelValue = (patternData.pixels[srcY] && patternData.pixels[srcY][srcX]) ? 1 : 0;

      if (shouldInvert) {
        pixelValue = pixelValue === 1 ? 0 : 1;
      }

      scaledPixels[y][x] = pixelValue;
    }
  }

  return {
    size: targetSize,
    pixels: scaledPixels
  };
}

// Apply pattern as mask (dark = keep, white = remove)
// Pattern tiles per individual tile (based on tileSize), not stretched across whole canvas
function applyPatternMaskToCombination(ctx, patternData, width, height, tileSize) {
  if (!patternData || !patternData.pixels) return;

  const patternSize = patternData.size;
  const pixels = patternData.pixels;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // If no tileSize provided, use width (single tile behavior)
  const effectiveTileSize = tileSize || width;

  // Calculate pattern cell size based on individual tile size
  const cellWidth = effectiveTileSize / patternSize;
  const cellHeight = effectiveTileSize / patternSize;

  // For each pixel in the canvas, determine if it should be masked
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate which pattern cell this pixel falls into (with tiling)
      const px = Math.floor((x % effectiveTileSize) / cellWidth) % patternSize;
      const py = Math.floor((y % effectiveTileSize) / cellHeight) % patternSize;

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
