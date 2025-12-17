/* Custom Tiles - User-created composite tiles from canvas selections */

// Generate unique ID for custom tile
function generateCustomTileId() {
  return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Add a custom tile from current canvas selection
function addCustomTileFromSelection() {
  const state = TileTesterState;
  if (!state.canvasSelection) return;

  const sel = state.canvasSelection;
  const tileSize = state.tileSize;

  // Calculate grid bounds
  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Collect tile references from all visible layers (composite view)
  const tileRefs = [];

  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const gridX = minGridX + localX;
      const gridY = minGridY + localY;

      // Check bounds
      if (gridX < 0 || gridX >= state.gridWidth || gridY < 0 || gridY >= state.gridHeight) {
        continue;
      }

      // Get tile from topmost visible layer that has a tile at this position
      let foundTile = null;
      for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        if (!layer.visible) continue;

        const tile = layer.tiles[gridY] && layer.tiles[gridY][gridX];
        if (tile) {
          foundTile = { ...tile };
          break;
        }
      }

      if (foundTile) {
        tileRefs.push({
          row: foundTile.row,
          col: foundTile.col,
          localX: localX,
          localY: localY
        });
      }
    }
  }

  // Only create custom tile if we have at least one tile reference
  if (tileRefs.length === 0) {
    clearCanvasSelection();
    return;
  }

  // Create the custom tile
  const customTile = {
    id: generateCustomTileId(),
    tileRefs: tileRefs,
    width: width,
    height: height
  };

  state.customTiles.push(customTile);

  // Clear selection
  clearCanvasSelection();

  // Update palette to show new custom tile
  renderCustomTilesInPalette();
}

// Remove a custom tile by ID
function removeCustomTile(tileId) {
  const index = TileTesterState.customTiles.findIndex(t => t.id === tileId);
  if (index !== -1) {
    TileTesterState.customTiles.splice(index, 1);
    renderCustomTilesInPalette();
  }
}

// Clear the canvas drag selection
function clearCanvasSelection() {
  TileTesterState.isCanvasSelecting = false;
  TileTesterState.canvasSelectionStart = null;
  TileTesterState.canvasSelection = null;
  hideSelectionUI();
  renderTileTesterMainCanvas();
}

// Setup canvas selection events - called from setupMainCanvasEvents
function setupCanvasSelectionEvents() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');
  if (!mainCanvas) return;

  // Store original mousedown handler
  const originalMouseDown = tileTesterEventHandlers.mainCanvasMouseDown;

  // Replace with enhanced version that handles Cmd/Ctrl+drag
  tileTesterEventHandlers.mainCanvasMouseDown = function(e) {
    // Check for Cmd/Ctrl+click for canvas selection
    if (e.button === 0 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();

      // Don't start selection if space panning
      if (TileTesterState.isSpacePanning) return;

      const pos = getGridPositionFromCanvasClick(e);
      if (!pos) return;

      TileTesterState.isCanvasSelecting = true;
      TileTesterState.canvasSelectionStart = { row: pos.gridY, col: pos.gridX };
      TileTesterState.canvasSelection = {
        startRow: pos.gridY,
        startCol: pos.gridX,
        endRow: pos.gridY,
        endCol: pos.gridX
      };

      hideSelectionUI();
      renderCanvasSelection();
      return;
    }

    // Clear canvas selection if clicking without Cmd/Ctrl
    if (TileTesterState.canvasSelection && !e.metaKey && !e.ctrlKey) {
      clearCanvasSelection();
    }

    // Call original handler for normal painting
    if (originalMouseDown) {
      originalMouseDown.call(this, e);
    }
  };

  // Store original mousemove handler
  const originalMouseMove = tileTesterEventHandlers.mainCanvasMouseMove;

  tileTesterEventHandlers.mainCanvasMouseMove = function(e) {
    // Handle canvas selection drag
    if (TileTesterState.isCanvasSelecting && TileTesterState.canvasSelectionStart) {
      const pos = getGridPositionFromCanvasClick(e);
      if (pos) {
        TileTesterState.canvasSelection = {
          startRow: TileTesterState.canvasSelectionStart.row,
          startCol: TileTesterState.canvasSelectionStart.col,
          endRow: pos.gridY,
          endCol: pos.gridX
        };
        renderCanvasSelection();
      }
      return;
    }

    // Call original handler
    if (originalMouseMove) {
      originalMouseMove.call(this, e);
    }
  };

  // Store original mouseup handler
  const originalMouseUp = tileTesterEventHandlers.mainCanvasMouseUp;

  tileTesterEventHandlers.mainCanvasMouseUp = function(e) {
    // Handle canvas selection end
    if (TileTesterState.isCanvasSelecting) {
      TileTesterState.isCanvasSelecting = false;

      // Check if we have a valid selection (at least one tile)
      if (TileTesterState.canvasSelection) {
        showSelectionUI();
      }
      return;
    }

    // Call original handler
    if (originalMouseUp) {
      originalMouseUp.call(this, e);
    }
  };

  // Re-attach event listeners with new handlers
  mainCanvas.removeEventListener('mousedown', originalMouseDown);
  mainCanvas.removeEventListener('mousemove', originalMouseMove);
  mainCanvas.removeEventListener('mouseup', originalMouseUp);

  mainCanvas.addEventListener('mousedown', tileTesterEventHandlers.mainCanvasMouseDown);
  mainCanvas.addEventListener('mousemove', tileTesterEventHandlers.mainCanvasMouseMove);
  mainCanvas.addEventListener('mouseup', tileTesterEventHandlers.mainCanvasMouseUp);

  // Add escape key handler to clear selection
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && TileTesterState.canvasSelection) {
      clearCanvasSelection();
    }
  });
}

// Render selection rectangle on canvas (blue color to differentiate from palette red)
function renderCanvasSelection() {
  // First render the normal canvas
  renderTileTesterMainCanvas();

  const sel = TileTesterState.canvasSelection;
  if (!sel) return;

  const ctx = TileTesterState.mainCtx;
  const tileSize = TileTesterState.tileSize;

  const minRow = Math.min(sel.startRow, sel.endRow);
  const maxRow = Math.max(sel.startRow, sel.endRow);
  const minCol = Math.min(sel.startCol, sel.endCol);
  const maxCol = Math.max(sel.startCol, sel.endCol);

  const x = minCol * tileSize;
  const y = minRow * tileSize;
  const width = (maxCol - minCol + 1) * tileSize;
  const height = (maxRow - minRow + 1) * tileSize;

  // Semi-transparent blue fill
  ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
  ctx.fillRect(x, y, width, height);

  // Blue border
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
}

// Show the "Add to custom tile" button UI
function showSelectionUI() {
  const sel = TileTesterState.canvasSelection;
  if (!sel) return;

  // Remove existing UI if any
  hideSelectionUI();

  const tileSize = TileTesterState.tileSize;
  const zoom = TileTesterState.canvasZoom || 1;

  // Calculate selection bounds
  const minRow = Math.min(sel.startRow, sel.endRow);
  const minCol = Math.min(sel.startCol, sel.endCol);
  const maxCol = Math.max(sel.startCol, sel.endCol);

  // Calculate center position for the button
  const selectionCenterX = ((minCol + maxCol + 1) / 2) * tileSize * zoom;
  const selectionTop = minRow * tileSize * zoom;

  // Get canvas position
  const canvas = document.getElementById('tileTesterMainCanvas');
  const canvasRect = canvas.getBoundingClientRect();

  // Create UI container
  const ui = document.createElement('div');
  ui.id = 'customTileSelectionUI';
  ui.className = 'custom-tile-selection-ui';

  // Position above the selection
  ui.style.position = 'fixed';
  ui.style.left = (canvasRect.left + selectionCenterX) + 'px';
  ui.style.top = (canvasRect.top + selectionTop - 45) + 'px';
  ui.style.transform = 'translateX(-50%)';
  ui.style.zIndex = '1000';

  // Create button
  const btn = document.createElement('button');
  btn.className = 'custom-tile-add-btn';
  btn.textContent = 'Add to Custom Tiles';
  btn.onclick = function(e) {
    e.stopPropagation();
    addCustomTileFromSelection();
  };

  ui.appendChild(btn);
  document.body.appendChild(ui);

  // Render the selection overlay
  renderCanvasSelection();
}

// Hide the selection UI
function hideSelectionUI() {
  const existing = document.getElementById('customTileSelectionUI');
  if (existing) {
    existing.remove();
  }
}

// Render custom tiles section in the palette
function renderCustomTilesInPalette() {
  const container = document.getElementById('tileTesterCustomTilesContainer');
  if (!container) return;

  const customTiles = TileTesterState.customTiles;
  const tileSize = TileTesterState.tileSize;
  const sourceCanvas = document.getElementById('canvas');

  // Clear container
  container.innerHTML = '';

  if (customTiles.length === 0) {
    container.innerHTML = '<div class="custom-tiles-empty">No custom tiles yet.<br>Cmd/Ctrl+drag on canvas to select.</div>';
    return;
  }

  // Create grid of custom tiles
  customTiles.forEach((customTile) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-tile-item';
    wrapper.dataset.customTileId = customTile.id;

    // Create canvas for preview
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = customTile.width * tileSize;
    previewCanvas.height = customTile.height * tileSize;
    const previewCtx = previewCanvas.getContext('2d');

    // Fill with transparent background indicator (checkerboard)
    drawCheckerboard(previewCtx, previewCanvas.width, previewCanvas.height);

    // Draw the tile references
    if (sourceCanvas) {
      customTile.tileRefs.forEach(ref => {
        const srcX = ref.col * tileSize;
        const srcY = ref.row * tileSize;
        const destX = ref.localX * tileSize;
        const destY = ref.localY * tileSize;

        previewCtx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );
      });
    }

    // Scale down preview for display
    const maxPreviewSize = 80;
    const scale = Math.min(maxPreviewSize / previewCanvas.width, maxPreviewSize / previewCanvas.height, 1);

    previewCanvas.style.width = (previewCanvas.width * scale) + 'px';
    previewCanvas.style.height = (previewCanvas.height * scale) + 'px';

    wrapper.appendChild(previewCanvas);

    // Add remove button (hidden by default, shown on hover)
    const removeBtn = document.createElement('button');
    removeBtn.className = 'custom-tile-remove-btn';
    removeBtn.textContent = 'REMOVE';
    removeBtn.onclick = function(e) {
      e.stopPropagation();
      removeCustomTile(customTile.id);
    };
    wrapper.appendChild(removeBtn);

    // Click to select for painting
    wrapper.addEventListener('click', function(e) {
      if (e.target === removeBtn) return;
      selectCustomTileForPainting(customTile);
    });

    container.appendChild(wrapper);
  });
}

// Draw checkerboard pattern for transparency indication
function drawCheckerboard(ctx, width, height) {
  const checkSize = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#e0e0e0';
  for (let y = 0; y < height; y += checkSize) {
    for (let x = 0; x < width; x += checkSize) {
      if ((x / checkSize + y / checkSize) % 2 === 0) {
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }
  }
}

// Select a custom tile for painting on the canvas
function selectCustomTileForPainting(customTile) {
  // Clear existing selections
  TileTesterState.selectedTile = null;
  TileTesterState.selectedTiles = null;

  // Set custom tile selection
  TileTesterState.selectedCustomTile = customTile;

  // Update palette selection visuals
  updateCustomTilePaletteSelection(customTile.id);
  updatePaletteSelection(); // Clear regular palette selection

  // Update cursor
  updateCursorPreview();
}

// Update visual selection in custom tiles palette
function updateCustomTilePaletteSelection(selectedId) {
  const items = document.querySelectorAll('.custom-tile-item');
  items.forEach(item => {
    if (item.dataset.customTileId === selectedId) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// Place custom tile at grid position
function placeCustomTileAt(gridX, gridY) {
  const customTile = TileTesterState.selectedCustomTile;
  if (!customTile) return;

  const layer = getActiveLayer();
  if (!layer) return;

  // Place all tiles from the custom tile
  customTile.tileRefs.forEach(ref => {
    const destX = gridX + ref.localX;
    const destY = gridY + ref.localY;

    // Check bounds
    if (destX < 0 || destX >= TileTesterState.gridWidth ||
        destY < 0 || destY >= TileTesterState.gridHeight) {
      return;
    }

    // Ensure row exists
    if (!layer.tiles[destY]) {
      layer.tiles[destY] = [];
    }

    // Place tile
    layer.tiles[destY][destX] = {
      row: ref.row,
      col: ref.col
    };
  });

  renderTileTesterMainCanvas();
  updateLayerThumbnail(layer.id);
}

// Initialize custom tiles functionality
function initCustomTiles() {
  // Add canvas selection state if not present
  if (TileTesterState.isCanvasSelecting === undefined) {
    TileTesterState.isCanvasSelecting = false;
  }
  if (TileTesterState.canvasSelectionStart === undefined) {
    TileTesterState.canvasSelectionStart = null;
  }
  if (TileTesterState.canvasSelection === undefined) {
    TileTesterState.canvasSelection = null;
  }

  // Setup the canvas selection events
  setupCanvasSelectionEvents();
}
