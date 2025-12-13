/* Pattern Editor Drawing - drawing interaction functions */

function startPatternDrawing(e) {
  const state = PatternEditorState;
  const pixel = getPixelFromEvent(e);
  if (!pixel || !isPixelInBounds(pixel)) return;

  state.isDrawing = true;
  state.startPixel = pixel;
  state.currentPixel = pixel;

  // Determine draw color based on current pixel state
  const currentValue = state.pixelData[pixel.row] ? state.pixelData[pixel.row][pixel.col] : 0;
  state.drawColor = currentValue === 1 ? 0 : 1;

  // Toggle the first pixel immediately
  togglePatternPixel(pixel.row, pixel.col, state.drawColor);

  // Start hold timer for line mode
  state.holdTimer = setTimeout(() => {
    state.isLineMode = true;
    // Initialize preview data
    state.previewData = copyPatternPixels(state.pixelData);
  }, state.HOLD_THRESHOLD);

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function handlePatternMouseMove(e) {
  const state = PatternEditorState;
  if (!state.isDrawing) return;

  const pixel = getPixelFromEvent(e);
  if (!pixel || !isPixelInBounds(pixel)) return;

  if (pixel.row === state.currentPixel.row && pixel.col === state.currentPixel.col) {
    return; // Same pixel, no change
  }

  state.currentPixel = pixel;

  if (state.isLineMode) {
    // Update line preview
    updateLinePreview();
  } else {
    // Freehand drawing - toggle pixels as we drag
    togglePatternPixel(pixel.row, pixel.col, state.drawColor);
  }

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function stopPatternDrawing() {
  const state = PatternEditorState;

  if (state.holdTimer) {
    clearTimeout(state.holdTimer);
    state.holdTimer = null;
  }

  if (state.isLineMode && state.previewData) {
    // Apply the line to actual data
    applyLineToPattern();
  }

  state.isDrawing = false;
  state.isLineMode = false;
  state.previewData = null;
  state.startPixel = null;
  state.currentPixel = null;

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function cancelPatternDrawing() {
  const state = PatternEditorState;

  if (state.holdTimer) {
    clearTimeout(state.holdTimer);
    state.holdTimer = null;
  }

  state.isDrawing = false;
  state.isLineMode = false;
  state.previewData = null;
  state.startPixel = null;
  state.currentPixel = null;

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function togglePatternPixel(row, col, value) {
  const state = PatternEditorState;

  if (row < 0 || row >= state.patternSize || col < 0 || col >= state.patternSize) {
    return;
  }

  if (!state.pixelData[row]) {
    state.pixelData[row] = [];
  }

  state.pixelData[row][col] = value !== undefined ? value : (state.pixelData[row][col] === 1 ? 0 : 1);
}

function updateLinePreview() {
  const state = PatternEditorState;
  if (!state.startPixel || !state.currentPixel) return;

  // Reset preview to current state
  state.previewData = copyPatternPixels(state.pixelData);

  // Draw line using Bresenham's algorithm
  const x0 = state.startPixel.col;
  const y0 = state.startPixel.row;
  const x1 = state.currentPixel.col;
  const y1 = state.currentPixel.row;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    if (!state.previewData[y]) state.previewData[y] = [];
    state.previewData[y][x] = state.drawColor;

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function applyLineToPattern() {
  const state = PatternEditorState;
  if (!state.previewData) return;

  // Copy preview data to actual pixel data
  state.pixelData = copyPatternPixels(state.previewData);
}

function copyPatternPixels(data) {
  return data.map(row => row ? [...row] : []);
}

function invertPatternEditorPixels() {
  const state = PatternEditorState;

  for (let row = 0; row < state.patternSize; row++) {
    if (!state.pixelData[row]) state.pixelData[row] = [];
    for (let col = 0; col < state.patternSize; col++) {
      state.pixelData[row][col] = state.pixelData[row][col] === 1 ? 0 : 1;
    }
  }

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}
