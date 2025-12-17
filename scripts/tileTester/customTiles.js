/* Custom Tiles - User-created composite tiles from canvas selections */

// Generate unique ID for custom tile
function generateCustomTileId() {
  return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Add a custom tile from current canvas selection
function addCustomTileFromSelection() {
  const state = TileTesterState;
  if (!state.dragSelectStart || !state.dragSelectEnd) return;

  const tileSize = state.tileSize;

  // Calculate grid bounds from pixel coordinates
  const startGridX = Math.floor(Math.min(state.dragSelectStart.x, state.dragSelectEnd.x) / tileSize);
  const startGridY = Math.floor(Math.min(state.dragSelectStart.y, state.dragSelectEnd.y) / tileSize);
  const endGridX = Math.floor(Math.max(state.dragSelectStart.x, state.dragSelectEnd.x) / tileSize);
  const endGridY = Math.floor(Math.max(state.dragSelectStart.y, state.dragSelectEnd.y) / tileSize);

  const width = endGridX - startGridX + 1;
  const height = endGridY - startGridY + 1;

  // Collect tile references from all visible layers (composite view)
  const tileRefs = [];

  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const gridX = startGridX + localX;
      const gridY = startGridY + localY;

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
  TileTesterState.isDragSelecting = false;
  TileTesterState.dragSelectStart = null;
  TileTesterState.dragSelectEnd = null;
  TileTesterState.showSelectionUI = false;
  hideSelectionUI();
  renderTileTesterMainCanvas();
}

// Store event handler references for cleanup
var customTileEventHandlers = {
  canvasMouseDown: null,
  documentMouseMove: null,
  documentMouseUp: null,
  documentMouseDown: null,
  documentKeyDown: null
};

// Setup drag selection events on main canvas
function setupCanvasDragSelection() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');

  if (!mainCanvas) return;

  // Cmd/Ctrl+drag for selection (to not conflict with paint/erase)
  customTileEventHandlers.canvasMouseDown = function(e) {
    // Only allow Cmd/Ctrl+left-click for selection
    if (e.button !== 0 || (!e.metaKey && !e.ctrlKey)) return;

    // Don't start selection if space panning
    if (TileTesterState.isSpacePanning) return;

    // Get position relative to canvas
    const pos = getCanvasPixelPosition(e);
    if (!pos) return;

    TileTesterState.isDragSelecting = true;
    TileTesterState.dragSelectStart = pos;
    TileTesterState.dragSelectEnd = pos;
    TileTesterState.showSelectionUI = false;
    hideSelectionUI();

    e.preventDefault();
    e.stopPropagation();
  };

  customTileEventHandlers.documentMouseMove = function(e) {
    if (!TileTesterState.isDragSelecting) return;

    const pos = getCanvasPixelPosition(e);
    if (pos) {
      TileTesterState.dragSelectEnd = pos;
      renderSelectionOverlay();
    }
  };

  customTileEventHandlers.documentMouseUp = function(e) {
    if (!TileTesterState.isDragSelecting) return;

    TileTesterState.isDragSelecting = false;

    // Check if we have a valid selection (more than a tiny drag)
    const start = TileTesterState.dragSelectStart;
    const end = TileTesterState.dragSelectEnd;

    if (start && end) {
      const dx = Math.abs(end.x - start.x);
      const dy = Math.abs(end.y - start.y);

      // Need at least some movement to create a selection
      if (dx > 5 || dy > 5) {
        TileTesterState.showSelectionUI = true;
        showSelectionUI();
      } else {
        clearCanvasSelection();
      }
    }
  };

  // Click anywhere else to clear selection
  customTileEventHandlers.documentMouseDown = function(e) {
    if (!TileTesterState.showSelectionUI) return;

    // Don't clear if clicking on selection UI elements
    if (e.target.closest('#customTileSelectionUI')) return;

    // Don't clear if Cmd/Ctrl+clicking on the canvas (starting new selection)
    if (e.target.closest('#tileTesterMainCanvas') && (e.metaKey || e.ctrlKey)) return;

    clearCanvasSelection();
  };

  // Escape key to clear selection
  customTileEventHandlers.documentKeyDown = function(e) {
    if (e.key === 'Escape' && TileTesterState.showSelectionUI) {
      clearCanvasSelection();
    }
  };

  mainCanvas.addEventListener('mousedown', customTileEventHandlers.canvasMouseDown);
  document.addEventListener('mousemove', customTileEventHandlers.documentMouseMove);
  document.addEventListener('mouseup', customTileEventHandlers.documentMouseUp);
  document.addEventListener('mousedown', customTileEventHandlers.documentMouseDown);
  document.addEventListener('keydown', customTileEventHandlers.documentKeyDown);
}

// Get pixel position relative to canvas (accounting for zoom/pan)
function getCanvasPixelPosition(e) {
  const canvas = TileTesterState.mainCanvas;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  // Clamp to canvas bounds
  return {
    x: Math.max(0, Math.min(canvas.width, x)),
    y: Math.max(0, Math.min(canvas.height, y))
  };
}

// Render selection rectangle overlay
function renderSelectionOverlay() {
  const state = TileTesterState;
  if (!state.dragSelectStart || !state.dragSelectEnd) return;

  // Render the main canvas first
  renderTileTesterMainCanvas();

  // Draw selection rectangle
  const ctx = state.mainCtx;
  const tileSize = state.tileSize;

  // Snap to tile grid
  const startGridX = Math.floor(Math.min(state.dragSelectStart.x, state.dragSelectEnd.x) / tileSize);
  const startGridY = Math.floor(Math.min(state.dragSelectStart.y, state.dragSelectEnd.y) / tileSize);
  const endGridX = Math.floor(Math.max(state.dragSelectStart.x, state.dragSelectEnd.x) / tileSize);
  const endGridY = Math.floor(Math.max(state.dragSelectStart.y, state.dragSelectEnd.y) / tileSize);

  const x = startGridX * tileSize;
  const y = startGridY * tileSize;
  const width = (endGridX - startGridX + 1) * tileSize;
  const height = (endGridY - startGridY + 1) * tileSize;

  // Draw semi-transparent fill
  ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
  ctx.fillRect(x, y, width, height);

  // Draw border
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
  ctx.setLineDash([]);
}

// Show the "Add to custom tile" button UI
function showSelectionUI() {
  const state = TileTesterState;
  if (!state.dragSelectStart || !state.dragSelectEnd) return;

  // Remove existing UI if any
  hideSelectionUI();

  const tileSize = state.tileSize;
  const zoom = state.canvasZoom || 1;

  // Calculate selection bounds in grid coordinates
  const startGridX = Math.floor(Math.min(state.dragSelectStart.x, state.dragSelectEnd.x) / tileSize);
  const startGridY = Math.floor(Math.min(state.dragSelectStart.y, state.dragSelectEnd.y) / tileSize);
  const endGridX = Math.floor(Math.max(state.dragSelectStart.x, state.dragSelectEnd.x) / tileSize);
  const endGridY = Math.floor(Math.max(state.dragSelectStart.y, state.dragSelectEnd.y) / tileSize);

  // Calculate center position for the button
  const selectionCenterX = ((startGridX + endGridX + 1) / 2) * tileSize * zoom;
  const selectionTop = startGridY * tileSize * zoom;

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
  ui.style.top = (canvasRect.top + selectionTop - 40) + 'px';
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

  // Also render the selection overlay
  renderSelectionOverlay();
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
  // Convert custom tile to multi-tile selection format
  // We need to set up the painting to place multiple tiles at once

  // Clear existing selections
  TileTesterState.selectedTile = null;

  // Create a special custom tile selection
  TileTesterState.selectedCustomTile = customTile;

  // Update palette selection visuals
  updateCustomTilePaletteSelection(customTile.id);
  updatePaletteSelection(); // Clear regular palette selection

  // Update cursor
  const mainCanvas = document.getElementById('tileTesterMainCanvas');
  if (mainCanvas) {
    mainCanvas.classList.add('painting-mode');
  }
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
  setupCanvasDragSelection();
}
