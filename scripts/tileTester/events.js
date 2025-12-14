/* Tile Tester Events - Mouse and painting interactions */

// Track if we're in erase mode during a drag
var tileTesterEraseMode = false;

// Setup all event listeners for tile tester
function setupTileTesterEvents() {
  setupMainCanvasEvents();
  setupPaletteCanvasEvents();
  setupControlButtonEvents();
}

// Setup main canvas mouse events
function setupMainCanvasEvents() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');

  if (!mainCanvas) return;

  // Mouse down - start painting
  mainCanvas.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return; // Left click only

    TileTesterState.isPainting = true;

    const pos = getGridPositionFromCanvasClick(e);
    if (pos) {
      const layer = getActiveLayer();

      // Check if there's already a tile at this position
      const existingTile = layer && layer.tiles[pos.gridY] && layer.tiles[pos.gridY][pos.gridX];

      if (e.shiftKey) {
        // Shift held = always erase
        tileTesterEraseMode = true;
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (existingTile) {
        // Clicking on existing tile = erase mode for this drag
        tileTesterEraseMode = true;
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (TileTesterState.selectedTile) {
        // No existing tile = place mode for this drag
        tileTesterEraseMode = false;
        placeTileAtWithoutToggle(pos.gridX, pos.gridY);
      }

      TileTesterState.lastPaintedCell = { x: pos.gridX, y: pos.gridY };
    }
  });

  // Mouse move - continue painting
  mainCanvas.addEventListener('mousemove', function(e) {
    if (!TileTesterState.isPainting) return;

    const pos = getGridPositionFromCanvasClick(e);
    if (pos) {
      // Prevent painting same cell repeatedly
      if (TileTesterState.lastPaintedCell &&
          TileTesterState.lastPaintedCell.x === pos.gridX &&
          TileTesterState.lastPaintedCell.y === pos.gridY) {
        return;
      }

      // Continue in the mode we started (erase or place)
      if (tileTesterEraseMode) {
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (TileTesterState.selectedTile) {
        placeTileAtWithoutToggle(pos.gridX, pos.gridY);
      }

      TileTesterState.lastPaintedCell = { x: pos.gridX, y: pos.gridY };
    }
  });

  // Mouse up - stop painting
  mainCanvas.addEventListener('mouseup', function() {
    TileTesterState.isPainting = false;
    TileTesterState.lastPaintedCell = null;
    tileTesterEraseMode = false;
  });

  // Mouse leave - stop painting
  mainCanvas.addEventListener('mouseleave', function() {
    TileTesterState.isPainting = false;
    TileTesterState.lastPaintedCell = null;
    tileTesterEraseMode = false;
  });

  // Context menu for erase
  mainCanvas.addEventListener('contextmenu', function(e) {
    e.preventDefault();

    const pos = getGridPositionFromCanvasClick(e);
    if (pos) {
      eraseTileAt(pos.gridX, pos.gridY);
    }
  });
}

// Place tile without toggle behavior (for drag painting)
function placeTileAtWithoutToggle(gridX, gridY) {
  const layer = getActiveLayer();
  if (!layer || !TileTesterState.selectedTile) return;

  // Check bounds
  if (gridX < 0 || gridX >= TileTesterState.gridWidth ||
      gridY < 0 || gridY >= TileTesterState.gridHeight) {
    return;
  }

  // Ensure row exists
  if (!layer.tiles[gridY]) {
    layer.tiles[gridY] = [];
  }

  // Always place (no toggle)
  layer.tiles[gridY][gridX] = {
    row: TileTesterState.selectedTile.row,
    col: TileTesterState.selectedTile.col
  };

  // Redraw canvas
  renderTileTesterMainCanvas();
}

// Setup palette canvas events
function setupPaletteCanvasEvents() {
  const paletteCanvas = document.getElementById('tileTesterPaletteCanvas');

  if (!paletteCanvas) return;

  paletteCanvas.addEventListener('click', handlePaletteClick);
}

// Setup control button events
function setupControlButtonEvents() {
  // Background color button
  const bgColorBtn = document.getElementById('tileTesterBgColorBtn');
  const bgColorPicker = document.getElementById('tileTesterBgColorPicker');

  if (bgColorBtn && bgColorPicker) {
    bgColorBtn.addEventListener('click', function() {
      bgColorPicker.click();
    });

    bgColorPicker.addEventListener('input', function() {
      TileTesterState.backgroundColor = this.value;
      renderTileTesterMainCanvas();
    });

    // Initialize picker with current color
    bgColorPicker.value = TileTesterState.backgroundColor;
  }

  // Clear button
  const clearBtn = document.getElementById('tileTesterClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (confirm('Clear all tiles from the current layer?')) {
        clearTileTesterGrid();
      }
    });
  }

  // Download button
  const downloadBtn = document.getElementById('tileTesterDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadTileTesterCanvas);
  }

  // Close button
  const closeBtn = document.getElementById('tileTesterCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeTileTester);
  }
}

// Remove all event listeners (called when closing modal)
function removeTileTesterEvents() {
  tileTesterEraseMode = false;
}
