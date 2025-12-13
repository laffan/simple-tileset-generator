/* Pattern Editor Canvas - canvas rendering functions */

function resizePatternEditorCanvas() {
  const state = PatternEditorState;
  if (!state.editorCanvas) return;

  const container = state.editorCanvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // Calculate pixel size based on zoom
  state.pixelSize = state.editorZoom * 8;

  // Canvas size to show pattern with tiling
  const patternPixelSize = state.patternSize * state.pixelSize;

  // Calculate how many tiles we can show
  const tilesX = Math.ceil(containerWidth / patternPixelSize) + 1;
  const tilesY = Math.ceil(containerHeight / patternPixelSize) + 1;

  // Set canvas to show multiple tiles
  state.editorCanvas.width = tilesX * patternPixelSize;
  state.editorCanvas.height = tilesY * patternPixelSize;

  // Store for rendering
  state.tilesX = tilesX;
  state.tilesY = tilesY;
  state.patternPixelSize = patternPixelSize;
}

function drawPatternEditorCanvas() {
  const state = PatternEditorState;
  if (!state.editorCtx) return;

  const ctx = state.editorCtx;
  ctx.clearRect(0, 0, state.editorCanvas.width, state.editorCanvas.height);

  // Draw multiple tiles
  for (let ty = 0; ty < state.tilesY; ty++) {
    for (let tx = 0; tx < state.tilesX; tx++) {
      const offsetX = tx * state.patternPixelSize;
      const offsetY = ty * state.patternPixelSize;
      drawPatternEditorInstance(offsetX, offsetY, tx === 0 && ty === 0);
    }
  }

  // Draw border around the primary (editable) tile
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, state.patternPixelSize, state.patternPixelSize);
}

function drawPatternEditorInstance(offsetX, offsetY, isPrimary) {
  const state = PatternEditorState;
  const ctx = state.editorCtx;

  for (let row = 0; row < state.patternSize; row++) {
    for (let col = 0; col < state.patternSize; col++) {
      const x = offsetX + col * state.pixelSize;
      const y = offsetY + row * state.pixelSize;

      // Check bounds
      if (x + state.pixelSize < 0 || y + state.pixelSize < 0) continue;
      if (x > state.editorCanvas.width || y > state.editorCanvas.height) continue;

      // Get pixel value
      let pixelValue = state.pixelData[row] ? state.pixelData[row][col] : 0;

      // Check for preview data (for line mode preview)
      if (isPrimary && state.previewData && state.previewData[row] && state.previewData[row][col] !== undefined) {
        pixelValue = state.previewData[row][col];
      }

      // Draw pixel
      drawPatternEditorPixel(x, y, pixelValue, isPrimary && state.previewData && state.previewData[row] && state.previewData[row][col] !== undefined);
    }
  }
}

function drawPatternEditorPixel(x, y, value, isPreview) {
  const state = PatternEditorState;
  const ctx = state.editorCtx;

  if (isPreview) {
    // Preview pixels with transparency
    ctx.fillStyle = value === 1 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
  } else {
    ctx.fillStyle = value === 1 ? '#000000' : '#ffffff';
  }

  ctx.fillRect(x, y, state.pixelSize, state.pixelSize);

  // Draw grid lines
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, state.pixelSize, state.pixelSize);
}

function updatePatternPreviewCanvas() {
  const state = PatternEditorState;
  if (!state.previewCanvas || !state.previewCtx) return;

  const ctx = state.previewCtx;
  const previewPixelSize = state.previewZoom;

  // Set canvas size to show tiled pattern
  const tileSize = state.patternSize * previewPixelSize;
  const tilesX = Math.ceil(state.previewCanvas.width / tileSize);
  const tilesY = Math.ceil(state.previewCanvas.height / tileSize);

  ctx.clearRect(0, 0, state.previewCanvas.width, state.previewCanvas.height);

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, state.previewCanvas.width, state.previewCanvas.height);

  // Draw tiled pattern
  ctx.fillStyle = '#000000';
  for (let ty = 0; ty <= tilesY; ty++) {
    for (let tx = 0; tx <= tilesX; tx++) {
      for (let row = 0; row < state.patternSize; row++) {
        for (let col = 0; col < state.patternSize; col++) {
          if (state.pixelData[row] && state.pixelData[row][col] === 1) {
            const x = tx * tileSize + col * previewPixelSize;
            const y = ty * tileSize + row * previewPixelSize;
            ctx.fillRect(x, y, previewPixelSize, previewPixelSize);
          }
        }
      }
    }
  }
}
