/* Pattern Editor Selection - cmd+drag selection tool for creating custom brushes */

// Selection state for Pattern Editor
const PatternSelectionState = {
  isSelecting: false,           // True while cmd+dragging to create selection
  isFinalized: false,           // True when selection is complete
  selectionStart: null,         // {row, col} - initial click position
  selection: null,              // {startRow, startCol, endRow, endCol}

  // Drag state - for moving the selection
  isDragging: false,
  dragStart: null,              // {row, col}
  dragOffset: { row: 0, col: 0 },
  capturedPixels: null,         // 2D array of pixel values in selection

  // Resize state - for repeating/tiling
  isResizing: false,
  resizeStart: null,            // {row, col}
  originalBounds: null,         // {minRow, minCol, width, height}
  resizeSize: null              // {width, height}
};

// Get normalized selection bounds (handles any drag direction)
function getSelectionBounds() {
  const sel = PatternSelectionState.selection;
  if (!sel) return null;

  const minRow = Math.min(sel.startRow, sel.endRow);
  const maxRow = Math.max(sel.startRow, sel.endRow);
  const minCol = Math.min(sel.startCol, sel.endCol);
  const maxCol = Math.max(sel.startCol, sel.endCol);

  return {
    minRow, maxRow, minCol, maxCol,
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1
  };
}

// Check if a pixel position is inside the current selection
function isInsidePatternSelection(row, col) {
  const bounds = getSelectionBounds();
  if (!bounds) return false;

  return row >= bounds.minRow && row <= bounds.maxRow &&
         col >= bounds.minCol && col <= bounds.maxCol;
}

// Capture pixels from the current selection
function captureSelectionPixels() {
  const state = PatternEditorState;
  const bounds = getSelectionBounds();
  if (!bounds) return null;

  const pixels = [];
  for (let row = 0; row < bounds.height; row++) {
    pixels[row] = [];
    for (let col = 0; col < bounds.width; col++) {
      const srcRow = bounds.minRow + row;
      const srcCol = bounds.minCol + col;
      pixels[row][col] = state.pixelData[srcRow] ? state.pixelData[srcRow][srcCol] || 0 : 0;
    }
  }

  return pixels;
}

// Clear pixels in the selection area
function clearSelectionPixels() {
  const state = PatternEditorState;
  const bounds = getSelectionBounds();
  if (!bounds) return;

  // Capture undo state
  if (typeof UndoRedoManager !== 'undefined') {
    UndoRedoManager.capturePatternState();
  }

  for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
      if (state.pixelData[row]) {
        state.pixelData[row][col] = 0;
      }
    }
  }

  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

// Create a custom brush from the current selection
function createBrushFromSelection() {
  const pixels = captureSelectionPixels();
  if (!pixels || pixels.length === 0) return;

  // Check if there are any filled pixels
  let hasFilledPixels = false;
  for (let row = 0; row < pixels.length; row++) {
    for (let col = 0; col < pixels[row].length; col++) {
      if (pixels[row][col] === 1) {
        hasFilledPixels = true;
        break;
      }
    }
    if (hasFilledPixels) break;
  }

  if (!hasFilledPixels) {
    alert('Selection contains no filled pixels');
    return;
  }

  // Store as custom brush
  BrushState.customBrushData = pixels;

  // Show and select the custom brush
  updateCustomBrushVisibility();
  setCurrentBrush('custom');
  updateBrushPreviews();

  // Clear the selection
  clearPatternSelection();
}

// Place captured pixels at a new position
function placeSelectionPixelsAt(pixels, startRow, startCol) {
  const state = PatternEditorState;
  if (!pixels) return;

  for (let row = 0; row < pixels.length; row++) {
    for (let col = 0; col < pixels[row].length; col++) {
      const targetRow = ((startRow + row) % state.patternSize + state.patternSize) % state.patternSize;
      const targetCol = ((startCol + col) % state.patternSize + state.patternSize) % state.patternSize;

      if (!state.pixelData[targetRow]) {
        state.pixelData[targetRow] = [];
      }
      state.pixelData[targetRow][targetCol] = pixels[row][col];
    }
  }
}

// Place repeated/tiled pixels
function placeRepeatedSelectionPixels(pixels, origWidth, origHeight, startRow, startCol, newWidth, newHeight) {
  const state = PatternEditorState;
  if (!pixels) return;

  for (let row = 0; row < newHeight; row++) {
    for (let col = 0; col < newWidth; col++) {
      const srcRow = row % origHeight;
      const srcCol = col % origWidth;
      const targetRow = ((startRow + row) % state.patternSize + state.patternSize) % state.patternSize;
      const targetCol = ((startCol + col) % state.patternSize + state.patternSize) % state.patternSize;

      if (!state.pixelData[targetRow]) {
        state.pixelData[targetRow] = [];
      }
      state.pixelData[targetRow][targetCol] = pixels[srcRow][srcCol];
    }
  }
}

// Clear the current selection
function clearPatternSelection() {
  PatternSelectionState.isSelecting = false;
  PatternSelectionState.isFinalized = false;
  PatternSelectionState.selectionStart = null;
  PatternSelectionState.selection = null;
  PatternSelectionState.isDragging = false;
  PatternSelectionState.dragStart = null;
  PatternSelectionState.dragOffset = { row: 0, col: 0 };
  PatternSelectionState.capturedPixels = null;
  PatternSelectionState.isResizing = false;
  PatternSelectionState.resizeStart = null;
  PatternSelectionState.originalBounds = null;
  PatternSelectionState.resizeSize = null;

  hidePatternSelectionUI();
  drawPatternEditorCanvas();
}

// Show selection UI (menu and resize handle)
function showPatternSelectionUI() {
  hidePatternSelectionUI(); // Clear any existing UI

  const bounds = getSelectionBounds();
  if (!bounds) return;

  const state = PatternEditorState;
  const canvas = state.editorCanvas;
  const container = canvas.parentElement;

  // Calculate pixel positions
  const patternPixelSize = state.patternSize * state.pixelSize;
  const primaryTileX = state.boundaryOffsetX + (state.BOUNDARY_SIZE - patternPixelSize) / 2;
  const primaryTileY = state.boundaryOffsetY + (state.BOUNDARY_SIZE - patternPixelSize) / 2;

  const selX = primaryTileX + bounds.minCol * state.pixelSize;
  const selY = primaryTileY + bounds.minRow * state.pixelSize;
  const selWidth = bounds.width * state.pixelSize;
  const selHeight = bounds.height * state.pixelSize;

  // Create menu
  const menu = document.createElement('div');
  menu.id = 'patternSelectionMenu';
  menu.className = 'pattern-selection-menu';

  const menuItems = [
    { label: 'New Custom Brush', action: createBrushFromSelection },
    { label: 'Clear', action: () => { clearSelectionPixels(); clearPatternSelection(); } }
  ];

  menuItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'pattern-selection-menu-item';
    btn.textContent = item.label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      item.action();
    });
    menu.appendChild(btn);
  });

  // Position menu above selection, centered
  menu.style.left = `${selX + selWidth / 2}px`;
  menu.style.top = `${selY - 10}px`;

  container.appendChild(menu);

  // Create resize handle (bottom-right corner)
  const handle = document.createElement('div');
  handle.id = 'patternSelectionResizeHandle';
  handle.className = 'pattern-selection-resize-handle';
  handle.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="4" cy="4" r="1.5"/>
      <circle cx="10" cy="4" r="1.5"/>
      <circle cx="4" cy="10" r="1.5"/>
      <circle cx="10" cy="10" r="1.5"/>
    </svg>
  `;

  handle.style.left = `${selX + selWidth - 6}px`;
  handle.style.top = `${selY + selHeight - 6}px`;

  container.appendChild(handle);
}

// Hide selection UI
function hidePatternSelectionUI() {
  const menu = document.getElementById('patternSelectionMenu');
  const handle = document.getElementById('patternSelectionResizeHandle');
  if (menu) menu.remove();
  if (handle) handle.remove();
}

// Check if mouse is on resize handle
function isOnPatternResizeHandle(e) {
  const handle = document.getElementById('patternSelectionResizeHandle');
  if (!handle) return false;

  const rect = handle.getBoundingClientRect();
  return e.clientX >= rect.left && e.clientX <= rect.right &&
         e.clientY >= rect.top && e.clientY <= rect.bottom;
}

// Handle selection mousedown
function handlePatternSelectionMouseDown(e) {
  const state = PatternEditorState;
  const pixel = getPixelFromEvent(e);
  if (!pixel) return false;

  // Check for cmd/ctrl+click to start new selection
  if (e.button === 0 && (e.metaKey || e.ctrlKey) && !PatternSelectionState.isFinalized) {
    e.preventDefault();
    e.stopPropagation();

    clearPatternSelection();
    PatternSelectionState.isSelecting = true;
    PatternSelectionState.selectionStart = { row: pixel.row, col: pixel.col };
    PatternSelectionState.selection = {
      startRow: pixel.row,
      startCol: pixel.col,
      endRow: pixel.row,
      endCol: pixel.col
    };

    drawPatternEditorCanvas();
    return true;
  }

  // Check for resize handle interaction
  if (e.button === 0 && PatternSelectionState.isFinalized && isOnPatternResizeHandle(e)) {
    e.preventDefault();
    e.stopPropagation();

    const bounds = getSelectionBounds();
    PatternSelectionState.isResizing = true;
    PatternSelectionState.resizeStart = { row: pixel.row, col: pixel.col };
    PatternSelectionState.originalBounds = bounds;
    PatternSelectionState.resizeSize = { width: bounds.width, height: bounds.height };
    PatternSelectionState.capturedPixels = captureSelectionPixels();

    // Clear original pixels
    clearSelectionPixelsNoUndo();

    hidePatternSelectionUI();
    state.editorCanvas.style.cursor = 'nwse-resize';
    return true;
  }

  // Check for drag interaction (click inside finalized selection)
  if (e.button === 0 && PatternSelectionState.isFinalized && !e.metaKey && !e.ctrlKey) {
    if (isInsidePatternSelection(pixel.row, pixel.col)) {
      e.preventDefault();
      e.stopPropagation();

      const bounds = getSelectionBounds();
      PatternSelectionState.isDragging = true;
      PatternSelectionState.dragStart = { row: pixel.row, col: pixel.col };
      PatternSelectionState.dragOffset = { row: 0, col: 0 };
      PatternSelectionState.capturedPixels = captureSelectionPixels();

      // Clear original pixels
      clearSelectionPixelsNoUndo();

      // Capture undo state
      if (typeof UndoRedoManager !== 'undefined') {
        UndoRedoManager.capturePatternState();
      }

      hidePatternSelectionUI();
      state.editorCanvas.style.cursor = 'grabbing';
      return true;
    }
  }

  // Click outside selection - clear it
  if (PatternSelectionState.isFinalized && !e.metaKey && !e.ctrlKey) {
    clearPatternSelection();
  }

  return false;
}

// Clear selection pixels without undo capture (internal use)
function clearSelectionPixelsNoUndo() {
  const state = PatternEditorState;
  const bounds = getSelectionBounds();
  if (!bounds) return;

  for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
      if (state.pixelData[row]) {
        state.pixelData[row][col] = 0;
      }
    }
  }
}

// Handle selection mousemove
function handlePatternSelectionMouseMove(e) {
  const state = PatternEditorState;
  const pixel = getPixelFromEvent(e);
  if (!pixel) return false;

  // Handle active selection creation
  if (PatternSelectionState.isSelecting && PatternSelectionState.selectionStart) {
    PatternSelectionState.selection = {
      startRow: PatternSelectionState.selectionStart.row,
      startCol: PatternSelectionState.selectionStart.col,
      endRow: pixel.row,
      endCol: pixel.col
    };
    drawPatternEditorCanvas();
    return true;
  }

  // Handle drag
  if (PatternSelectionState.isDragging && PatternSelectionState.dragStart) {
    PatternSelectionState.dragOffset = {
      row: pixel.row - PatternSelectionState.dragStart.row,
      col: pixel.col - PatternSelectionState.dragStart.col
    };
    drawPatternEditorCanvas();
    return true;
  }

  // Handle resize
  if (PatternSelectionState.isResizing && PatternSelectionState.originalBounds) {
    const bounds = PatternSelectionState.originalBounds;
    const newWidth = Math.max(1, pixel.col - bounds.minCol + 1);
    const newHeight = Math.max(1, pixel.row - bounds.minRow + 1);
    PatternSelectionState.resizeSize = { width: newWidth, height: newHeight };
    drawPatternEditorCanvas();
    return true;
  }

  // Update cursor for finalized selection
  if (PatternSelectionState.isFinalized) {
    if (isOnPatternResizeHandle(e)) {
      state.editorCanvas.style.cursor = 'nwse-resize';
    } else if (isInsidePatternSelection(pixel.row, pixel.col)) {
      state.editorCanvas.style.cursor = 'grab';
    } else {
      state.editorCanvas.style.cursor = 'crosshair';
    }
    return false;
  }

  return false;
}

// Handle selection mouseup
function handlePatternSelectionMouseUp(e) {
  const state = PatternEditorState;

  // Finalize selection creation
  if (PatternSelectionState.isSelecting) {
    PatternSelectionState.isSelecting = false;

    const bounds = getSelectionBounds();
    if (bounds && bounds.width >= 1 && bounds.height >= 1) {
      PatternSelectionState.isFinalized = true;
      showPatternSelectionUI();
    } else {
      clearPatternSelection();
    }
    return true;
  }

  // Finalize drag
  if (PatternSelectionState.isDragging) {
    const bounds = PatternSelectionState.originalBounds || getSelectionBounds();
    const offset = PatternSelectionState.dragOffset;

    // Place pixels at new position
    placeSelectionPixelsAt(
      PatternSelectionState.capturedPixels,
      bounds.minRow + offset.row,
      bounds.minCol + offset.col
    );

    // Update selection bounds
    PatternSelectionState.selection = {
      startRow: bounds.minRow + offset.row,
      startCol: bounds.minCol + offset.col,
      endRow: bounds.maxRow + offset.row,
      endCol: bounds.maxCol + offset.col
    };

    PatternSelectionState.isDragging = false;
    PatternSelectionState.dragStart = null;
    PatternSelectionState.dragOffset = { row: 0, col: 0 };
    PatternSelectionState.capturedPixels = null;

    state.editorCanvas.style.cursor = 'crosshair';
    showPatternSelectionUI();
    drawPatternEditorCanvas();
    updatePatternPreviewCanvas();
    return true;
  }

  // Finalize resize
  if (PatternSelectionState.isResizing) {
    const bounds = PatternSelectionState.originalBounds;
    const newSize = PatternSelectionState.resizeSize;

    // Place repeated pixels
    placeRepeatedSelectionPixels(
      PatternSelectionState.capturedPixels,
      bounds.width,
      bounds.height,
      bounds.minRow,
      bounds.minCol,
      newSize.width,
      newSize.height
    );

    // Update selection bounds
    PatternSelectionState.selection = {
      startRow: bounds.minRow,
      startCol: bounds.minCol,
      endRow: bounds.minRow + newSize.height - 1,
      endCol: bounds.minCol + newSize.width - 1
    };

    PatternSelectionState.isResizing = false;
    PatternSelectionState.resizeStart = null;
    PatternSelectionState.originalBounds = null;
    PatternSelectionState.resizeSize = null;
    PatternSelectionState.capturedPixels = null;

    state.editorCanvas.style.cursor = 'crosshair';
    showPatternSelectionUI();
    drawPatternEditorCanvas();
    updatePatternPreviewCanvas();
    return true;
  }

  return false;
}

// Render the selection on the canvas
function renderPatternSelection(primaryTileX, primaryTileY, patternPixelSize) {
  const state = PatternEditorState;
  const ctx = state.editorCtx;
  const bounds = getSelectionBounds();
  if (!bounds) return;

  const pixelSize = state.pixelSize;

  // Calculate selection rectangle
  let selX = primaryTileX + bounds.minCol * pixelSize;
  let selY = primaryTileY + bounds.minRow * pixelSize;
  let selWidth = bounds.width * pixelSize;
  let selHeight = bounds.height * pixelSize;

  // Handle drag offset
  if (PatternSelectionState.isDragging) {
    const offset = PatternSelectionState.dragOffset;
    selX += offset.col * pixelSize;
    selY += offset.row * pixelSize;

    // Draw captured pixels at offset position
    if (PatternSelectionState.capturedPixels) {
      ctx.globalAlpha = 0.6;
      const pixels = PatternSelectionState.capturedPixels;
      for (let row = 0; row < pixels.length; row++) {
        for (let col = 0; col < pixels[row].length; col++) {
          if (pixels[row][col] === 1) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(selX + col * pixelSize, selY + row * pixelSize, pixelSize, pixelSize);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // Handle resize preview
  if (PatternSelectionState.isResizing && PatternSelectionState.resizeSize) {
    const origBounds = PatternSelectionState.originalBounds;
    const newSize = PatternSelectionState.resizeSize;
    selWidth = newSize.width * pixelSize;
    selHeight = newSize.height * pixelSize;

    // Draw tiled pixels preview
    if (PatternSelectionState.capturedPixels) {
      ctx.globalAlpha = 0.6;
      const pixels = PatternSelectionState.capturedPixels;
      for (let row = 0; row < newSize.height; row++) {
        for (let col = 0; col < newSize.width; col++) {
          const srcRow = row % origBounds.height;
          const srcCol = col % origBounds.width;
          if (pixels[srcRow] && pixels[srcRow][srcCol] === 1) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(selX + col * pixelSize, selY + row * pixelSize, pixelSize, pixelSize);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // Draw selection rectangle
  if (PatternSelectionState.isSelecting) {
    // Active selection: semi-transparent fill
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.fillRect(selX, selY, selWidth, selHeight);
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.strokeRect(selX, selY, selWidth, selHeight);
  } else if (PatternSelectionState.isFinalized || PatternSelectionState.isDragging || PatternSelectionState.isResizing) {
    // Finalized selection: dashed border
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(selX, selY, selWidth, selHeight);
    ctx.setLineDash([]);
  }
}
