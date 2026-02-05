/* Pattern Editor Drawing - drawing interaction functions */

function startPatternDrawing(e) {
  const state = PatternEditorState;

  // If spacebar is held, start panning instead of drawing
  if (state.isSpacebarHeld) {
    // Capture state before panning starts
    if (typeof UndoRedoManager !== 'undefined') {
      UndoRedoManager.capturePatternState();
    }
    startPatternPanning(e);
    return;
  }

  const pixel = getPixelFromEvent(e);
  if (!pixel || !isPixelInBounds(pixel)) return;

  // Capture state before drawing starts
  if (typeof UndoRedoManager !== 'undefined') {
    UndoRedoManager.capturePatternState();
  }

  state.isDrawing = true;
  state.startPixel = pixel;
  state.currentPixel = pixel;

  // Determine draw color based on erase mode (no longer toggles based on current pixel)
  if (typeof BrushState !== 'undefined' && BrushState.isErasing) {
    state.drawColor = 0; // Erase mode
  } else {
    state.drawColor = 1; // Draw mode
  }

  // Check if shift is held for line mode
  if (e.shiftKey) {
    state.isLineMode = true;
    // Initialize preview data for line mode
    state.previewData = copyPatternPixels(state.pixelData);
  } else {
    // Freehand mode - apply brush at the first pixel
    applyBrushAtPixel(pixel.row, pixel.col, state.drawColor);
  }

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function handlePatternMouseMove(e) {
  const state = PatternEditorState;

  // Handle panning mode
  if (state.isPanning) {
    handlePatternPanning(e);
    return;
  }

  // Always track hover pixel for ghost preview
  const hoverPixel = getPixelFromEvent(e);
  if (hoverPixel && isPixelInBounds(hoverPixel)) {
    if (typeof setHoverPixel === 'function') {
      setHoverPixel(hoverPixel);
    }
  } else {
    if (typeof setHoverPixel === 'function') {
      setHoverPixel(null);
    }
  }

  // If not drawing, just redraw for hover preview
  if (!state.isDrawing) {
    drawPatternEditorCanvas();
    return;
  }

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
    // Freehand drawing - apply brush as we drag
    applyBrushAtPixel(pixel.row, pixel.col, state.drawColor);
  }

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function stopPatternDrawing() {
  const state = PatternEditorState;

  // Handle panning stop
  if (state.isPanning) {
    stopPatternPanning();
    return;
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

// Apply brush at a given pixel position
function applyBrushAtPixel(centerRow, centerCol, value) {
  const state = PatternEditorState;

  // Get pixels affected by the brush
  let pixels;
  if (typeof getBrushPixels === 'function') {
    pixels = getBrushPixels(centerRow, centerCol);
  } else {
    // Fallback to single pixel if brush system not loaded
    pixels = [{ row: centerRow, col: centerCol }];
  }

  // Apply value to all affected pixels
  pixels.forEach(pixel => {
    // Wrap coordinates to pattern bounds for seamless editing
    const wrappedRow = ((pixel.row % state.patternSize) + state.patternSize) % state.patternSize;
    const wrappedCol = ((pixel.col % state.patternSize) + state.patternSize) % state.patternSize;

    if (!state.pixelData[wrappedRow]) {
      state.pixelData[wrappedRow] = [];
    }
    state.pixelData[wrappedRow][wrappedCol] = value;
  });
}

// Apply brush at a given pixel position in preview data (for line mode)
function applyBrushAtPixelPreview(centerRow, centerCol, value, previewData, patternSize) {
  // Get pixels affected by the brush
  let pixels;
  if (typeof getBrushPixels === 'function') {
    pixels = getBrushPixels(centerRow, centerCol);
  } else {
    // Fallback to single pixel if brush system not loaded
    pixels = [{ row: centerRow, col: centerCol }];
  }

  // Apply value to all affected pixels in preview data
  pixels.forEach(pixel => {
    // Wrap coordinates to pattern bounds
    const wrappedRow = ((pixel.row % patternSize) + patternSize) % patternSize;
    const wrappedCol = ((pixel.col % patternSize) + patternSize) % patternSize;

    if (!previewData[wrappedRow]) {
      previewData[wrappedRow] = [];
    }
    previewData[wrappedRow][wrappedCol] = value;
  });
}

function updateLinePreview() {
  const state = PatternEditorState;
  if (!state.startPixel || !state.currentPixel) return;

  // Reset preview to current state
  state.previewData = copyPatternPixels(state.pixelData);

  // Draw line using Bresenham's algorithm with brush
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
    // Apply brush at each point along the line
    applyBrushAtPixelPreview(y, x, state.drawColor, state.previewData, state.patternSize);

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

  // Capture state before invert
  if (typeof UndoRedoManager !== 'undefined') {
    UndoRedoManager.capturePatternState();
  }

  for (let row = 0; row < state.patternSize; row++) {
    if (!state.pixelData[row]) state.pixelData[row] = [];
    for (let col = 0; col < state.patternSize; col++) {
      state.pixelData[row][col] = state.pixelData[row][col] === 1 ? 0 : 1;
    }
  }

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

// Panning functions for spacebar+drag pattern repositioning

function startPatternPanning(e) {
  const state = PatternEditorState;
  const rect = state.editorCanvas.getBoundingClientRect();

  state.isPanning = true;
  state.hasPanned = true;

  // Store start position in canvas coordinates
  state.panStartX = e.clientX - rect.left;
  state.panStartY = e.clientY - rect.top;

  // Change cursor to grabbing
  state.editorCanvas.style.cursor = 'grabbing';
}

function handlePatternPanning(e) {
  const state = PatternEditorState;
  const rect = state.editorCanvas.getBoundingClientRect();

  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  // Calculate raw offset from drag start
  const rawOffsetX = currentX - state.panStartX;
  const rawOffsetY = currentY - state.panStartY;

  // Snap to nearest grid cell (discrete jumps)
  const cellsX = Math.round(rawOffsetX / state.pixelSize);
  const cellsY = Math.round(rawOffsetY / state.pixelSize);

  state.patternOffsetX = cellsX * state.pixelSize;
  state.patternOffsetY = cellsY * state.pixelSize;

  drawPatternEditorCanvas();
}

function stopPatternPanning() {
  const state = PatternEditorState;

  state.isPanning = false;

  // Don't snap here - snap happens on spacebar release
  // Just change cursor back to grab (still holding spacebar)
  if (state.isSpacebarHeld) {
    state.editorCanvas.style.cursor = 'grab';
  } else {
    state.editorCanvas.style.cursor = 'crosshair';
  }

  // Keep the offset - it will be applied when spacebar is released
}
