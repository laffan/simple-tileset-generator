/* Tile Tester Events - Mouse and painting interactions */

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
      // Right click to erase, left click to paint
      if (e.shiftKey) {
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (TileTesterState.selectedTile) {
        placeTileAt(pos.gridX, pos.gridY);
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

      if (e.shiftKey) {
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (TileTesterState.selectedTile) {
        placeTileAt(pos.gridX, pos.gridY);
      }
      TileTesterState.lastPaintedCell = { x: pos.gridX, y: pos.gridY };
    }
  });

  // Mouse up - stop painting
  mainCanvas.addEventListener('mouseup', function() {
    TileTesterState.isPainting = false;
    TileTesterState.lastPaintedCell = null;
  });

  // Mouse leave - stop painting
  mainCanvas.addEventListener('mouseleave', function() {
    TileTesterState.isPainting = false;
    TileTesterState.lastPaintedCell = null;
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
      if (confirm('Clear all tiles from the canvas?')) {
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
  // Events are attached to modal elements which will be hidden
  // They don't need explicit removal since they're scoped to the modal
}
