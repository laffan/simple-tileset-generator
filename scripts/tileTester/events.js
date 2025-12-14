/* Tile Tester Events - Mouse and painting interactions */

// Track if we're in erase mode during a drag
var tileTesterEraseMode = false;

// Track if events are already set up
var tileTesterEventsInitialized = false;

// Store event handler references for removal
var tileTesterEventHandlers = {
  mainCanvasMouseDown: null,
  mainCanvasMouseMove: null,
  mainCanvasMouseUp: null,
  mainCanvasMouseLeave: null,
  mainCanvasContextMenu: null,
  paletteClick: null
};

// Setup all event listeners for tile tester
function setupTileTesterEvents() {
  if (tileTesterEventsInitialized) return;
  tileTesterEventsInitialized = true;

  setupMainCanvasEvents();
  setupPaletteCanvasEvents();
  setupControlButtonEvents();
}

// Setup main canvas mouse events
function setupMainCanvasEvents() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');
  if (!mainCanvas) return;

  // Mouse down - start painting
  tileTesterEventHandlers.mainCanvasMouseDown = function(e) {
    if (e.button !== 0) return;

    TileTesterState.isPainting = true;

    const pos = getGridPositionFromCanvasClick(e);
    if (pos) {
      const layer = getActiveLayer();
      const existingTile = layer && layer.tiles[pos.gridY] && layer.tiles[pos.gridY][pos.gridX];

      if (e.shiftKey) {
        tileTesterEraseMode = true;
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (existingTile) {
        tileTesterEraseMode = true;
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (TileTesterState.selectedTile) {
        tileTesterEraseMode = false;
        placeTileAtWithoutToggle(pos.gridX, pos.gridY);
      }

      TileTesterState.lastPaintedCell = { x: pos.gridX, y: pos.gridY };
    }
  };

  // Mouse move - continue painting
  tileTesterEventHandlers.mainCanvasMouseMove = function(e) {
    if (!TileTesterState.isPainting) return;

    const pos = getGridPositionFromCanvasClick(e);
    if (pos) {
      if (TileTesterState.lastPaintedCell &&
          TileTesterState.lastPaintedCell.x === pos.gridX &&
          TileTesterState.lastPaintedCell.y === pos.gridY) {
        return;
      }

      if (tileTesterEraseMode) {
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (TileTesterState.selectedTile) {
        placeTileAtWithoutToggle(pos.gridX, pos.gridY);
      }

      TileTesterState.lastPaintedCell = { x: pos.gridX, y: pos.gridY };
    }
  };

  // Mouse up - stop painting
  tileTesterEventHandlers.mainCanvasMouseUp = function() {
    TileTesterState.isPainting = false;
    TileTesterState.lastPaintedCell = null;
    tileTesterEraseMode = false;
  };

  // Mouse leave - stop painting
  tileTesterEventHandlers.mainCanvasMouseLeave = function() {
    TileTesterState.isPainting = false;
    TileTesterState.lastPaintedCell = null;
    tileTesterEraseMode = false;
  };

  // Context menu for erase
  tileTesterEventHandlers.mainCanvasContextMenu = function(e) {
    e.preventDefault();
    const pos = getGridPositionFromCanvasClick(e);
    if (pos) {
      eraseTileAt(pos.gridX, pos.gridY);
    }
  };

  mainCanvas.addEventListener('mousedown', tileTesterEventHandlers.mainCanvasMouseDown);
  mainCanvas.addEventListener('mousemove', tileTesterEventHandlers.mainCanvasMouseMove);
  mainCanvas.addEventListener('mouseup', tileTesterEventHandlers.mainCanvasMouseUp);
  mainCanvas.addEventListener('mouseleave', tileTesterEventHandlers.mainCanvasMouseLeave);
  mainCanvas.addEventListener('contextmenu', tileTesterEventHandlers.mainCanvasContextMenu);
}

// Place tile without toggle behavior (for drag painting)
function placeTileAtWithoutToggle(gridX, gridY) {
  const layer = getActiveLayer();
  if (!layer || !TileTesterState.selectedTile) return;

  if (gridX < 0 || gridX >= TileTesterState.gridWidth ||
      gridY < 0 || gridY >= TileTesterState.gridHeight) {
    return;
  }

  if (!layer.tiles[gridY]) {
    layer.tiles[gridY] = [];
  }

  layer.tiles[gridY][gridX] = {
    row: TileTesterState.selectedTile.row,
    col: TileTesterState.selectedTile.col
  };

  renderTileTesterMainCanvas();
  updateLayerThumbnail(layer.id);
}

// Setup palette canvas events
function setupPaletteCanvasEvents() {
  const paletteCanvas = document.getElementById('tileTesterPaletteCanvas');
  if (!paletteCanvas) return;

  tileTesterEventHandlers.paletteClick = handlePaletteClick;
  paletteCanvas.addEventListener('click', tileTesterEventHandlers.paletteClick);
}

// Setup control button events
function setupControlButtonEvents() {
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

    bgColorPicker.value = TileTesterState.backgroundColor;
  }

  const clearBtn = document.getElementById('tileTesterClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (confirm('Clear all tiles from the current layer?')) {
        clearTileTesterGrid();
        updateLayerThumbnail(TileTesterState.activeLayerId);
      }
    });
  }

  const downloadBtn = document.getElementById('tileTesterDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadTileTesterCanvas);
  }

  const closeBtn = document.getElementById('tileTesterCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeTileTester);
  }
}

// Remove all event listeners (called when closing modal)
function removeTileTesterEvents() {
  tileTesterEraseMode = false;

  const mainCanvas = document.getElementById('tileTesterMainCanvas');
  const paletteCanvas = document.getElementById('tileTesterPaletteCanvas');

  if (mainCanvas) {
    if (tileTesterEventHandlers.mainCanvasMouseDown) {
      mainCanvas.removeEventListener('mousedown', tileTesterEventHandlers.mainCanvasMouseDown);
    }
    if (tileTesterEventHandlers.mainCanvasMouseMove) {
      mainCanvas.removeEventListener('mousemove', tileTesterEventHandlers.mainCanvasMouseMove);
    }
    if (tileTesterEventHandlers.mainCanvasMouseUp) {
      mainCanvas.removeEventListener('mouseup', tileTesterEventHandlers.mainCanvasMouseUp);
    }
    if (tileTesterEventHandlers.mainCanvasMouseLeave) {
      mainCanvas.removeEventListener('mouseleave', tileTesterEventHandlers.mainCanvasMouseLeave);
    }
    if (tileTesterEventHandlers.mainCanvasContextMenu) {
      mainCanvas.removeEventListener('contextmenu', tileTesterEventHandlers.mainCanvasContextMenu);
    }
  }

  if (paletteCanvas && tileTesterEventHandlers.paletteClick) {
    paletteCanvas.removeEventListener('click', tileTesterEventHandlers.paletteClick);
  }

  tileTesterEventsInitialized = false;
}
