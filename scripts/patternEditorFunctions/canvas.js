/* Pattern Editor Canvas - canvas rendering functions */

// Calculate the zoom level needed to fit pattern in the boundary
function calculateZoomForPatternSize(patternSize) {
  const state = PatternEditorState;
  // Calculate pixel size so pattern fits within boundary
  return state.BOUNDARY_SIZE / patternSize;
}

// Convert slider value (1-100) to actual zoom multiplier
// Slider 1 = 0.25x (zoomed out), Slider 100 = 1x (pattern fills boundary)
function sliderToZoom(sliderValue) {
  // Map 1-100 to 0.25-1 (linear mapping)
  const minZoom = 0.25;
  const maxZoom = 1;
  const t = (sliderValue - 1) / 99; // 0 to 1
  return minZoom + t * (maxZoom - minZoom);
}

// Convert zoom multiplier to slider value
function zoomToSlider(zoom) {
  const minZoom = 0.25;
  const maxZoom = 1;
  const t = (zoom - minZoom) / (maxZoom - minZoom);
  return Math.round(1 + t * 99);
}

function resizePatternEditorCanvas() {
  const state = PatternEditorState;
  if (!state.editorCanvas) return;

  // Fixed canvas size
  const canvasSize = 410;
  state.editorCanvas.width = canvasSize;
  state.editorCanvas.height = canvasSize;

  // Calculate offset to center the boundary
  state.boundaryOffsetX = (canvasSize - state.BOUNDARY_SIZE) / 2;
  state.boundaryOffsetY = (canvasSize - state.BOUNDARY_SIZE) / 2;

  // Calculate pixel size based on zoom
  // editorZoom is slider value, convert to actual multiplier
  const zoomMultiplier = sliderToZoom(state.editorZoom);
  state.pixelSize = zoomMultiplier * (state.BOUNDARY_SIZE / state.patternSize);
}

function drawPatternEditorCanvas() {
  const state = PatternEditorState;
  if (!state.editorCtx) return;

  const ctx = state.editorCtx;
  ctx.clearRect(0, 0, state.editorCanvas.width, state.editorCanvas.height);

  // Fill background
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, state.editorCanvas.width, state.editorCanvas.height);

  // Calculate the pattern tile size in pixels
  const patternPixelSize = state.patternSize * state.pixelSize;

  // Calculate how the tiles are positioned relative to the boundary
  // The primary tile (0,0) is positioned so that when zoom=1, it fills the boundary
  // Apply panning offset during drag
  const primaryTileX = state.boundaryOffsetX + (state.BOUNDARY_SIZE - patternPixelSize) / 2 + state.patternOffsetX;
  const primaryTileY = state.boundaryOffsetY + (state.BOUNDARY_SIZE - patternPixelSize) / 2 + state.patternOffsetY;

  // Calculate how many tiles we need to cover the entire canvas
  const tilesLeft = Math.ceil((primaryTileX) / patternPixelSize) + 1;
  const tilesRight = Math.ceil((state.editorCanvas.width - primaryTileX) / patternPixelSize) + 1;
  const tilesUp = Math.ceil((primaryTileY) / patternPixelSize) + 1;
  const tilesDown = Math.ceil((state.editorCanvas.height - primaryTileY) / patternPixelSize) + 1;

  // Draw all visible tiles
  for (let ty = -tilesUp; ty < tilesDown; ty++) {
    for (let tx = -tilesLeft; tx < tilesRight; tx++) {
      const offsetX = primaryTileX + tx * patternPixelSize;
      const offsetY = primaryTileY + ty * patternPixelSize;
      const isPrimary = (tx === 0 && ty === 0);
      drawPatternEditorInstance(offsetX, offsetY, isPrimary);
    }
  }

  // Draw the red boundary box - stays fixed (doesn't move with panning)
  const boundaryX = state.boundaryOffsetX + (state.BOUNDARY_SIZE - patternPixelSize) / 2;
  const boundaryY = state.boundaryOffsetY + (state.BOUNDARY_SIZE - patternPixelSize) / 2;
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    boundaryX,
    boundaryY,
    patternPixelSize,
    patternPixelSize
  );
}

function drawPatternEditorInstance(offsetX, offsetY, isPrimary) {
  const state = PatternEditorState;
  const ctx = state.editorCtx;

  for (let row = 0; row < state.patternSize; row++) {
    for (let col = 0; col < state.patternSize; col++) {
      const x = offsetX + col * state.pixelSize;
      const y = offsetY + row * state.pixelSize;

      // Check bounds - skip if completely outside canvas
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

  // Draw grid lines (only if pixels are large enough)
  if (state.pixelSize >= 4) {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, state.pixelSize, state.pixelSize);
  }
}

function updatePatternPreviewCanvas() {
  const state = PatternEditorState;
  if (!state.previewCanvas || !state.previewCtx) return;

  const ctx = state.previewCtx;

  // Get the main tile size from the page
  const sizeInput = document.getElementById('sizeInput');
  const tileSize = sizeInput ? parseInt(sizeInput.value) || 64 : 64;

  // Fixed preview dimensions
  const containerWidth = 200;
  const containerHeight = 432;

  // Set canvas size
  state.previewCanvas.width = containerWidth;
  state.previewCanvas.height = containerHeight;

  // Calculate how many tiles fit
  const tilesX = Math.ceil(containerWidth / tileSize) + 1;
  const tilesY = Math.ceil(containerHeight / tileSize) + 1;

  // Calculate pixel size within each tile
  const previewPixelSize = tileSize / state.patternSize;

  ctx.clearRect(0, 0, containerWidth, containerHeight);

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, containerWidth, containerHeight);

  // Draw tiled pattern
  ctx.fillStyle = '#000000';
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
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

// Update zoom when pattern size changes to keep boundary filled
function updateZoomForPatternSize(patternSize) {
  const state = PatternEditorState;

  // Set zoom so pattern fills the boundary (zoom = 1x)
  const defaultZoom = 1; // 1x means pattern fits exactly in boundary
  const sliderValue = zoomToSlider(defaultZoom);

  state.editorZoom = sliderValue;

  // Update the slider
  const slider = document.getElementById('patternEditorZoom');
  if (slider) {
    slider.value = sliderValue;
  }

  // Update display
  updateEditorZoomDisplay();
}
