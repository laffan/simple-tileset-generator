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
  paletteMouseLeave: null,
  downloadLinkHandlers: [],  // Store download link handlers to prevent accumulation
  closeBtnHandler: null,     // Store close button handler to prevent accumulation
  modalClickHandler: null    // Store modal click handler for dropdown closing
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

  // Mouse down - start painting (sparse format)
  tileTesterEventHandlers.mainCanvasMouseDown = function(e) {
    if (e.button !== 0) return;

    // Don't paint when space panning
    if (TileTesterState.isSpacePanning) return;

    TileTesterState.isPainting = true;

    const pos = getGridPositionFromCanvasClick(e);
    if (pos) {
      const layer = getActiveLayer();
      // Convert internal grid position to tile coordinates for sparse lookup
      const tileCoords = internalToTileCoords(pos.gridX, pos.gridY);
      const existingTile = layer && getTileAtPosition(layer, tileCoords.x, tileCoords.y);

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

// Place tile without toggle behavior (for drag painting) - sparse format
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

  // FIRST: expand grid if needed (may shift origin)
  // This must happen BEFORE converting to tile coordinates so the tile
  // renders at the clicked position without any canvas jumping
  ensureGridForInternalPosition(gridX, gridY, 1);

  // NOW convert internal grid position to tile coordinates (using updated origin)
  const tileCoords = internalToTileCoords(gridX, gridY);
  const tileX = tileCoords.x;
  const tileY = tileCoords.y;

  // Convert to semantic tile reference for persistence across tileset changes
  const tileRef = coordsToTileRef(TileTesterState.selectedTile.row, TileTesterState.selectedTile.col);
  const newTile = tileRef || {
    row: TileTesterState.selectedTile.row,
    col: TileTesterState.selectedTile.col
  };
  setTileAtPosition(layer, tileX, tileY, newTile);

  // Render and update transform
  renderTileTesterMainCanvas();
  updateCanvasTransform();
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
  const bgColorLink = document.getElementById('tileTesterBgColorLink');
  const bgColorPicker = document.getElementById('tileTesterBgColorPicker');
  const clearBgLink = document.getElementById('tileTesterClearBgLink');
  const clearBgSeparator = document.getElementById('tileTesterClearBgSeparator');

  if (bgColorLink && bgColorPicker) {
    bgColorLink.addEventListener('click', function(e) {
      e.preventDefault();
      bgColorPicker.click();
    });

    bgColorPicker.addEventListener('input', function() {
      TileTesterState.backgroundColor = this.value;
      renderTileTesterMainCanvas();
      updateClearBackgroundVisibility();
      // Update container background to match for seamless panning
      const container = document.querySelector('.tester-canvas-container');
      if (container) container.style.backgroundColor = this.value;
    });

    bgColorPicker.value = TileTesterState.backgroundColor;
  }

  // Clear background link - resets background to default transparent
  if (clearBgLink) {
    clearBgLink.addEventListener('click', function(e) {
      e.preventDefault();
      TileTesterState.backgroundColor = '#d0d0d0';
      if (bgColorPicker) {
        bgColorPicker.value = TileTesterState.backgroundColor;
      }
      renderTileTesterMainCanvas();
      updateClearBackgroundVisibility();
      // Update container background to match for seamless panning
      const container = document.querySelector('.tester-canvas-container');
      if (container) container.style.backgroundColor = TileTesterState.backgroundColor;
    });
  }

  // Clear shapes link
  const clearLink = document.getElementById('tileTesterClearLink');
  if (clearLink) {
    clearLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Clear all tiles from the current layer?')) {
        clearTileTesterGrid();
        updateLayerThumbnail(TileTesterState.activeLayerId);
      }
    });
  }

  // Download dropdown handling
  const downloadDropdown = document.getElementById('tileTesterDownloadDropdown');
  if (downloadDropdown) {
    // Clear any previously stored handlers first
    tileTesterEventHandlers.downloadLinkHandlers = [];

    // Handle dropdown trigger clicks
    const trigger = downloadDropdown.querySelector('.tester-download-trigger');
    if (trigger) {
      const triggerHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const wasOpen = downloadDropdown.classList.contains('open');
        downloadDropdown.classList.toggle('open', !wasOpen);
      };
      tileTesterEventHandlers.downloadLinkHandlers.push({ link: trigger, handler: triggerHandler });
      trigger.addEventListener('click', triggerHandler);
    }

    // Handle dropdown option clicks
    downloadDropdown.querySelectorAll('.tester-download-option').forEach(option => {
      const optionHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const format = this.dataset.format;

        // Close dropdown
        downloadDropdown.classList.remove('open');

        // Execute appropriate download
        if (format === 'png') {
          downloadTileTesterCanvas();
        } else if (format === 'svg') {
          downloadTilemapSVG();
        } else if (format === 'tiled-png') {
          downloadTiledPNG();
        } else if (format === 'tiled-svg') {
          downloadTiledSVG();
        }
      };
      tileTesterEventHandlers.downloadLinkHandlers.push({ link: option, handler: optionHandler });
      option.addEventListener('click', optionHandler);
    });

    // Close dropdown when clicking outside (within the modal)
    const modalClickHandler = function(e) {
      if (!e.target.closest('.tester-download-dropdown')) {
        downloadDropdown.classList.remove('open');
      }
    };
    // Store the handler for cleanup
    if (!tileTesterEventHandlers.modalClickHandler) {
      tileTesterEventHandlers.modalClickHandler = modalClickHandler;
      document.getElementById('tileTesterModal').addEventListener('click', modalClickHandler);
    }
  }

  // Initial visibility check for clear background link
  updateClearBackgroundVisibility();

  // Close button - store handler to prevent accumulation
  const closeBtn = document.getElementById('tileTesterCloseBtn');
  if (closeBtn && !tileTesterEventHandlers.closeBtnHandler) {
    tileTesterEventHandlers.closeBtnHandler = closeTileTester;
    closeBtn.addEventListener('click', tileTesterEventHandlers.closeBtnHandler);
  }
}

// Show/hide clear background link based on whether a custom background is set
function updateClearBackgroundVisibility() {
  const clearBgLink = document.getElementById('tileTesterClearBgLink');
  const clearBgSeparator = document.getElementById('tileTesterClearBgSeparator');
  const defaultBg = '#d0d0d0';

  if (clearBgLink && clearBgSeparator) {
    const isCustomBg = TileTesterState.backgroundColor !== defaultBg;
    clearBgLink.style.display = isCustomBg ? 'inline' : 'none';
    clearBgSeparator.style.display = isCustomBg ? 'inline' : 'none';
  }
  // Note: Close button handler is now set up in setupControlButtonEvents()
  // to prevent listener accumulation
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

  // Remove download link handlers to prevent accumulation
  if (tileTesterEventHandlers.downloadLinkHandlers) {
    tileTesterEventHandlers.downloadLinkHandlers.forEach(({ link, handler }) => {
      link.removeEventListener('click', handler);
    });
    tileTesterEventHandlers.downloadLinkHandlers = [];
  }

  // Remove modal click handler for dropdown
  if (tileTesterEventHandlers.modalClickHandler) {
    const modal = document.getElementById('tileTesterModal');
    if (modal) {
      modal.removeEventListener('click', tileTesterEventHandlers.modalClickHandler);
    }
    tileTesterEventHandlers.modalClickHandler = null;
  }

  // Close dropdown if open
  const downloadDropdown = document.getElementById('tileTesterDownloadDropdown');
  if (downloadDropdown) {
    downloadDropdown.classList.remove('open');
  }

  // Remove close button handler
  const closeBtn = document.getElementById('tileTesterCloseBtn');
  if (closeBtn && tileTesterEventHandlers.closeBtnHandler) {
    closeBtn.removeEventListener('click', tileTesterEventHandlers.closeBtnHandler);
    tileTesterEventHandlers.closeBtnHandler = null;
  }

  // Reset panning state (but preserve zoom and pan position)
  TileTesterState.isSpacePanning = false;

  // Remove layers panel events
  if (typeof removeLayersPanelEvents === 'function') {
    removeLayersPanelEvents();
  }

  // Remove sidebar toggle events
  if (typeof removeSidebarToggleEvents === 'function') {
    removeSidebarToggleEvents();
  }

  // Remove section fold events
  if (typeof removeSectionFoldEvents === 'function') {
    removeSectionFoldEvents();
  }

  tileTesterEventsInitialized = false;
}

// Setup zoom controls
function setupZoomControls() {
  const zoomLinks = document.querySelectorAll('.tester-zoom-link');

  zoomLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const zoom = parseFloat(this.dataset.zoom);
      setCanvasZoom(zoom);

      // Update active state
      zoomLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Update active state to match current zoom level
  updateZoomControlsUI();
}

// Update zoom controls UI to reflect current zoom level
function updateZoomControlsUI() {
  const zoomLinks = document.querySelectorAll('.tester-zoom-link');
  const currentZoom = TileTesterState.canvasZoom || 1;

  zoomLinks.forEach(link => {
    const linkZoom = parseFloat(link.dataset.zoom);
    if (linkZoom === currentZoom) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
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

  const zoom = TileTesterState.canvasZoom || 1;
  const pan = TileTesterState.canvasPan;

  // Use CSS width/height for pixel-perfect scaling (no anti-aliasing)
  const baseWidth = canvas.width;
  const baseHeight = canvas.height;

  canvas.style.width = (baseWidth * zoom) + 'px';
  canvas.style.height = (baseHeight * zoom) + 'px';

  // Use CSS transform for positioning to support panning
  canvas.style.transform = `translate(${pan.x * zoom}px, ${pan.y * zoom}px)`;
  canvas.style.marginLeft = '0';
  canvas.style.marginTop = '0';

  // Update grid overlay to match canvas position and zoom
  if (overlay) {
    overlay.style.transform = `translate(${pan.x * zoom}px, ${pan.y * zoom}px)`;
    overlay.style.marginLeft = '0';
    overlay.style.marginTop = '0';
  }

  // Update grid overlay size
  updateGridOverlay();

  // Set container background to match canvas background to avoid black gaps when panning
  container.style.backgroundColor = TileTesterState.backgroundColor;
  container.style.overflow = 'hidden';
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

    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panStartOffset = { ...TileTesterState.canvasPan };
    if (canvas) canvas.style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', function(e) {
    if (!isPanning || !TileTesterState.isSpacePanning) return;

    const zoom = TileTesterState.canvasZoom || 1;
    const dx = (e.clientX - panStart.x) / zoom;
    const dy = (e.clientY - panStart.y) / zoom;

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
