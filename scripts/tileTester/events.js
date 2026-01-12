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
  mainCanvasHoverMove: null,
  paletteClick: null,
  paletteMouseDown: null,
  paletteMouseMove: null,
  paletteMouseUp: null,
  paletteMouseLeave: null
};

// Setup all event listeners for tile tester
function setupTileTesterEvents() {
  if (tileTesterEventsInitialized) return;
  tileTesterEventsInitialized = true;

  setupMainCanvasEvents();
  setupPaletteCanvasEvents();
  setupControlButtonEvents();
  setupZoomControls();
  setupSpacePanning();
}

// Setup main canvas mouse events
function setupMainCanvasEvents() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');
  if (!mainCanvas) return;

  // Mouse down - start painting
  tileTesterEventHandlers.mainCanvasMouseDown = function(e) {
    if (e.button !== 0) return;

    // Don't paint when space panning
    if (TileTesterState.isSpacePanning) return;

    TileTesterState.isPainting = true;

    const pos = getGridPositionFromCanvasClick(e);
    if (pos) {
      const layer = getActiveLayer();
      const existingTile = layer && layer.tiles[pos.gridY] && layer.tiles[pos.gridY][pos.gridX];

      if (e.shiftKey) {
        tileTesterEraseMode = true;
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (existingTile && !TileTesterState.selectedTiles && !TileTesterState.selectedCustomTile) {
        // Only toggle erase mode for single tile selection, not multi-tile or custom tile
        tileTesterEraseMode = true;
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (TileTesterState.selectedTile || TileTesterState.selectedTiles || TileTesterState.selectedCustomTile) {
        tileTesterEraseMode = false;
        placeTileAtWithoutToggle(pos.gridX, pos.gridY);
      }

      TileTesterState.lastPaintedCell = { x: pos.gridX, y: pos.gridY };
    }
  };

  // Mouse move - continue painting or update hover position for ghost preview
  tileTesterEventHandlers.mainCanvasMouseMove = function(e) {
    const pos = getGridPositionFromCanvasClick(e);

    // Update hover position for ghost preview (when not painting and not space panning)
    if (!TileTesterState.isPainting && !TileTesterState.isSpacePanning && !TileTesterState.isCanvasSelecting) {
      if (pos) {
        const hasSelection = TileTesterState.selectedTile || TileTesterState.selectedTiles || TileTesterState.selectedCustomTile;
        if (hasSelection) {
          const prevPos = TileTesterState.hoverPosition;
          if (!prevPos || prevPos.gridX !== pos.gridX || prevPos.gridY !== pos.gridY) {
            TileTesterState.hoverPosition = { gridX: pos.gridX, gridY: pos.gridY };
            renderTileTesterMainCanvas();
          }
        }
      }
      return;
    }

    if (!TileTesterState.isPainting) return;

    if (pos) {
      if (TileTesterState.lastPaintedCell &&
          TileTesterState.lastPaintedCell.x === pos.gridX &&
          TileTesterState.lastPaintedCell.y === pos.gridY) {
        return;
      }

      if (tileTesterEraseMode) {
        eraseTileAt(pos.gridX, pos.gridY);
      } else if (TileTesterState.selectedTile || TileTesterState.selectedTiles || TileTesterState.selectedCustomTile) {
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

  // Mouse leave - stop painting and clear hover position
  tileTesterEventHandlers.mainCanvasMouseLeave = function() {
    TileTesterState.isPainting = false;
    TileTesterState.lastPaintedCell = null;
    tileTesterEraseMode = false;
    // Clear hover position and redraw to remove ghost preview
    if (TileTesterState.hoverPosition) {
      TileTesterState.hoverPosition = null;
      renderTileTesterMainCanvas();
    }
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
  if (!layer) return;

  // Handle custom tile selection
  if (TileTesterState.selectedCustomTile) {
    placeCustomTileAt(gridX, gridY);
    return;
  }

  // Handle multi-tile selection
  if (TileTesterState.selectedTiles) {
    placeMultiTilesAt(gridX, gridY);
    updateLayerThumbnail(layer.id);
    return;
  }

  if (!TileTesterState.selectedTile) return;

  if (gridX < 0 || gridX >= TileTesterState.gridWidth ||
      gridY < 0 || gridY >= TileTesterState.gridHeight) {
    return;
  }

  if (!layer.tiles[gridY]) {
    layer.tiles[gridY] = [];
  }

  // Convert to semantic tile reference for persistence across tileset changes
  const tileRef = coordsToTileRef(TileTesterState.selectedTile.row, TileTesterState.selectedTile.col);
  if (tileRef) {
    layer.tiles[gridY][gridX] = tileRef;
  } else {
    // Fallback to old format if conversion fails
    layer.tiles[gridY][gridX] = {
      row: TileTesterState.selectedTile.row,
      col: TileTesterState.selectedTile.col
    };
  }

  renderTileTesterMainCanvas();
  updateLayerThumbnail(layer.id);
}

// Setup palette canvas events
function setupPaletteCanvasEvents() {
  const paletteCanvas = document.getElementById('tileTesterPaletteCanvas');
  if (!paletteCanvas) return;

  // Use mouse down/move/up for drag selection instead of click
  tileTesterEventHandlers.paletteMouseDown = handlePaletteMouseDown;
  tileTesterEventHandlers.paletteMouseMove = handlePaletteMouseMove;
  tileTesterEventHandlers.paletteMouseUp = handlePaletteMouseUp;
  tileTesterEventHandlers.paletteMouseLeave = function() {
    // End selection if mouse leaves palette
    if (TileTesterState.isSelectingMultiple) {
      handlePaletteMouseUp({ clientX: 0, clientY: 0 });
    }
  };

  paletteCanvas.addEventListener('mousedown', tileTesterEventHandlers.paletteMouseDown);
  paletteCanvas.addEventListener('mousemove', tileTesterEventHandlers.paletteMouseMove);
  paletteCanvas.addEventListener('mouseup', tileTesterEventHandlers.paletteMouseUp);
  paletteCanvas.addEventListener('mouseleave', tileTesterEventHandlers.paletteMouseLeave);
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

  // Download dropdown handling
  const downloadDropdown = document.getElementById('tileTesterDownloadDropdown');
  const downloadBtn = document.getElementById('tileTesterDownloadBtn');

  if (downloadDropdown && downloadBtn) {
    // Toggle dropdown on button click
    downloadBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      downloadDropdown.classList.toggle('active');
    });

    // Handle download option selection
    downloadDropdown.querySelectorAll('.download-option').forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const format = this.dataset.format;
        downloadDropdown.classList.remove('active');

        if (format === 'svg') {
          downloadTilemapSVG();
        } else {
          downloadTileTesterCanvas();
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!downloadDropdown.contains(e.target)) {
        downloadDropdown.classList.remove('active');
      }
    });
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

  if (paletteCanvas) {
    if (tileTesterEventHandlers.paletteClick) {
      paletteCanvas.removeEventListener('click', tileTesterEventHandlers.paletteClick);
    }
    if (tileTesterEventHandlers.paletteMouseDown) {
      paletteCanvas.removeEventListener('mousedown', tileTesterEventHandlers.paletteMouseDown);
    }
    if (tileTesterEventHandlers.paletteMouseMove) {
      paletteCanvas.removeEventListener('mousemove', tileTesterEventHandlers.paletteMouseMove);
    }
    if (tileTesterEventHandlers.paletteMouseUp) {
      paletteCanvas.removeEventListener('mouseup', tileTesterEventHandlers.paletteMouseUp);
    }
    if (tileTesterEventHandlers.paletteMouseLeave) {
      paletteCanvas.removeEventListener('mouseleave', tileTesterEventHandlers.paletteMouseLeave);
    }
  }

  // Reset zoom and pan
  TileTesterState.canvasZoom = 1;
  TileTesterState.canvasPan = { x: 0, y: 0 };
  TileTesterState.isSpacePanning = false;

  tileTesterEventsInitialized = false;
}

// Setup zoom controls
function setupZoomControls() {
  const zoomLinks = document.querySelectorAll('.tester-zoom-link');

  zoomLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const zoom = parseInt(this.dataset.zoom, 10);
      setCanvasZoom(zoom);

      // Update active state
      zoomLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// Set canvas zoom level
function setCanvasZoom(zoom) {
  TileTesterState.canvasZoom = zoom;
  updateCanvasTransform();
}

// Update canvas transform based on zoom and pan
function updateCanvasTransform() {
  const container = document.querySelector('.tester-canvas-container');
  const canvas = document.getElementById('tileTesterMainCanvas');
  const overlay = document.getElementById('tileTesterGridOverlay');

  if (!container || !canvas) return;

  const zoom = TileTesterState.canvasZoom;
  const pan = TileTesterState.canvasPan;

  // Use CSS width/height for pixel-perfect scaling (no anti-aliasing)
  const baseWidth = canvas.width;
  const baseHeight = canvas.height;

  canvas.style.width = (baseWidth * zoom) + 'px';
  canvas.style.height = (baseHeight * zoom) + 'px';
  canvas.style.marginLeft = (pan.x * zoom) + 'px';
  canvas.style.marginTop = (pan.y * zoom) + 'px';

  // Update grid overlay to match canvas position and zoom
  if (overlay) {
    overlay.style.marginLeft = (pan.x * zoom) + 'px';
    overlay.style.marginTop = (pan.y * zoom) + 'px';
  }

  // Update grid overlay size
  updateGridOverlay();

  // Update container overflow based on zoom
  if (zoom > 1) {
    container.style.overflow = 'hidden';
  } else {
    container.style.overflow = 'visible';
    // Reset pan when at 1x
    TileTesterState.canvasPan = { x: 0, y: 0 };
    canvas.style.marginLeft = '0';
    canvas.style.marginTop = '0';
    if (overlay) {
      overlay.style.marginLeft = '0';
      overlay.style.marginTop = '0';
    }
  }
}

// Setup space key panning
function setupSpacePanning() {
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let panStartOffset = { x: 0, y: 0 };

  const mainArea = document.querySelector('.tester-main-area');
  const canvas = document.getElementById('tileTesterMainCanvas');

  // Key down - start space panning mode
  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && !TileTesterState.isSpacePanning) {
      const modal = document.getElementById('tileTesterModal');
      if (!modal || !modal.classList.contains('active')) return;
      if (TileTesterState.canvasZoom <= 1) return;

      e.preventDefault();
      TileTesterState.isSpacePanning = true;
      if (canvas) canvas.style.cursor = 'grab';
    }
  });

  // Key up - end space panning mode
  document.addEventListener('keyup', function(e) {
    if (e.code === 'Space') {
      TileTesterState.isSpacePanning = false;
      isPanning = false;
      if (canvas) canvas.style.cursor = '';
    }
  });

  // Mouse events for panning - attach to main area to capture all events
  if (!mainArea) return;

  mainArea.addEventListener('mousedown', function(e) {
    if (!TileTesterState.isSpacePanning) return;
    if (TileTesterState.canvasZoom <= 1) return;

    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panStartOffset = { ...TileTesterState.canvasPan };
    if (canvas) canvas.style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', function(e) {
    if (!isPanning || !TileTesterState.isSpacePanning) return;

    const dx = (e.clientX - panStart.x) / TileTesterState.canvasZoom;
    const dy = (e.clientY - panStart.y) / TileTesterState.canvasZoom;

    TileTesterState.canvasPan = {
      x: panStartOffset.x + dx,
      y: panStartOffset.y + dy
    };

    updateCanvasTransform();
  });

  document.addEventListener('mouseup', function() {
    if (isPanning) {
      isPanning = false;
      if (TileTesterState.isSpacePanning && canvas) {
        canvas.style.cursor = 'grab';
      }
    }
  });
}
