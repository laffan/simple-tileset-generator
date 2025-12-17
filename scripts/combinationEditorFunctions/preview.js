/* Combination Editor Preview - Renders preview with pattern-as-mask */

// Update the combination preview canvas
function updateCombinationPreview() {
  const state = CombinationEditorState;
  const canvas = state.previewCanvas;
  const ctx = state.previewCtx;

  if (!canvas || !ctx) return;

  const tileRows = state.tileRows;
  const tileCols = state.tileCols;
  const previewTileSize = 32; // Size of each tile in the preview

  // Set canvas size based on tile grid
  canvas.width = tileCols * previewTileSize;
  canvas.height = tileRows * previewTileSize;

  // Clear canvas
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render the shape divided across tiles
  renderCombinationShapeToTiles(ctx, previewTileSize, tileRows, tileCols);

  // Draw grid lines
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * previewTileSize + 0.5, 0);
    ctx.lineTo(i * previewTileSize + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i <= tileRows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * previewTileSize + 0.5);
    ctx.lineTo(canvas.width, i * previewTileSize + 0.5);
    ctx.stroke();
  }
}

// Render the combination shape to tiles (with per-path pattern masking)
function renderCombinationShapeToTiles(ctx, tileSize, rows, cols) {
  const state = CombinationEditorState;

  // Get shape data
  const shapeData = getCombShapeData();
  if (!shapeData) return;

  const width = cols * tileSize;
  const height = rows * tileSize;

  // Determine paths data
  const pathsData = shapeData.paths || [shapeData];

  // Render each path individually with its own pattern
  pathsData.forEach((pathData, pathIndex) => {
    if (!pathData || !pathData.length) return;

    // Get this path's pattern data
    const pathPattern = CombinationEditorState.pathPatterns[pathIndex];
    let patternData = null;

    if (pathPattern && pathPattern.patternName) {
      patternData = getPatternDataForPath(pathPattern);
    }

    const hasPattern = patternData && hasFilledPixels(patternData);

    // Create temp canvas for this path
    const pathCanvas = document.createElement('canvas');
    pathCanvas.width = width;
    pathCanvas.height = height;
    const pathCtx = pathCanvas.getContext('2d');
    pathCtx.clearRect(0, 0, width, height);

    // Draw the path
    pathCtx.fillStyle = '#333';
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
    pathCtx.fill();

    // Apply pattern if this path has one
    // Pass tileSize so pattern tiles per-tile, not across whole canvas
    if (hasPattern) {
      applyPatternMask(pathCtx, patternData, width, height, tileSize);
    }

    // Draw to main canvas
    ctx.drawImage(pathCanvas, 0, 0);
  });
}

// Get scaled and inverted pattern data for a specific path's pattern settings
function getPatternDataForPath(pathPattern) {
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

// Check if pattern has any filled (dark) pixels
function hasFilledPixels(patternData) {
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

// Render normalized shape data to a canvas
function renderNormalizedShapeToCanvas(ctx, shapeData, width, height) {
  const pathsData = shapeData.paths || [shapeData];

  ctx.fillStyle = '#333';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  // Check for evenodd fill rule
  const useEvenOdd = shapeData.fillRule === 'evenodd';
  const holeIndices = shapeData.holePathIndices || [];

  pathsData.forEach((pathData, pathIndex) => {
    if (!pathData || !pathData.length) return;

    ctx.beginPath();

    pathData.forEach((point, i) => {
      // Convert from normalized (-0.5 to 0.5) to canvas coordinates
      const x = (point[0] + 0.5) * width;
      const y = (point[1] + 0.5) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();

    // If this is a hole path, we need different handling
    if (useEvenOdd && holeIndices.includes(pathIndex)) {
      // Draw the hole
      ctx.fill('evenodd');
    } else {
      ctx.fill(useEvenOdd ? 'evenodd' : 'nonzero');
    }
  });
}

// Apply pattern as a mask to the canvas
// Dark pixels (1) = keep shape, White pixels (0) = remove shape
// The pattern tiles per individual tile (based on tileSize), not stretched across the whole canvas
function applyPatternMask(ctx, patternData, width, height, tileSize) {
  if (!patternData || !patternData.pixels) return;

  const patternSize = patternData.size;
  const pixels = patternData.pixels;

  // Get the current canvas image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // If no tileSize provided, use width (single tile behavior)
  const effectiveTileSize = tileSize || width;

  // Calculate pattern cell size based on individual tile size
  // This makes the pattern repeat for each tile in the combination
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

// Render a single tile from the combination at the given position
function renderCombinationTile(ctx, tileRow, tileCol, tileSize, shapeData, patternData, color) {
  // Create temp canvas for the full combination
  const state = CombinationEditorState;
  const totalWidth = state.tileCols * tileSize;
  const totalHeight = state.tileRows * tileSize;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = totalWidth;
  tempCanvas.height = totalHeight;
  const tempCtx = tempCanvas.getContext('2d');

  // Render the full shape
  tempCtx.fillStyle = color || '#333';
  renderNormalizedShapeToCanvas(tempCtx, shapeData, totalWidth, totalHeight);

  // Apply pattern mask
  if (patternData && hasFilledPixels(patternData)) {
    applyPatternMask(tempCtx, patternData, totalWidth, totalHeight);
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
