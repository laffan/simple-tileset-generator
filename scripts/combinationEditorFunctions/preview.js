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

// Render the combination shape to tiles (with pattern masking)
function renderCombinationShapeToTiles(ctx, tileSize, rows, cols) {
  const state = CombinationEditorState;

  // Get shape data
  const shapeData = getCombShapeData();
  if (!shapeData) return;

  // Create a temporary canvas to render the full shape
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cols * tileSize;
  tempCanvas.height = rows * tileSize;
  const tempCtx = tempCanvas.getContext('2d');

  // Clear with transparent background
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Render shape (normalized coordinates to canvas coordinates)
  renderNormalizedShapeToCanvas(tempCtx, shapeData, cols * tileSize, rows * tileSize);

  // Apply pattern mask if pattern has any filled pixels
  const patternData = getCombPatternData();
  if (patternData && hasFilledPixels(patternData)) {
    applyPatternMask(tempCtx, patternData, cols * tileSize, rows * tileSize);
  }

  // Draw to preview canvas
  ctx.drawImage(tempCanvas, 0, 0);
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
function applyPatternMask(ctx, patternData, width, height) {
  if (!patternData || !patternData.pixels) return;

  const patternSize = patternData.size;
  const pixels = patternData.pixels;

  // Get the current canvas image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calculate how the pattern tiles over the canvas
  const pixelWidth = width / patternSize;
  const pixelHeight = height / patternSize;

  for (let py = 0; py < patternSize; py++) {
    for (let px = 0; px < patternSize; px++) {
      const patternPixel = pixels[py] && pixels[py][px];

      // If pattern pixel is white (0), clear that region
      if (patternPixel === 0) {
        // Calculate canvas region for this pattern pixel
        const startX = Math.floor(px * pixelWidth);
        const endX = Math.floor((px + 1) * pixelWidth);
        const startY = Math.floor(py * pixelHeight);
        const endY = Math.floor((py + 1) * pixelHeight);

        // Clear pixels in this region
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const i = (y * width + x) * 4;
            // Make fully transparent
            data[i + 3] = 0;
          }
        }
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
