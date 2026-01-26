/* Custom Tiles - User-created composite tiles from canvas selections */

// Generate unique ID for custom tile
function generateCustomTileId() {
  return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Add a custom tile from current canvas selection (sparse format)
function addCustomTileFromSelection() {
  const state = TileTesterState;
  if (!state.canvasSelection) return;

  const sel = state.canvasSelection;

  // Calculate grid bounds (these are internal grid coordinates)
  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Collect tile references from ALL visible layers (composite view)
  // Each position can have multiple tiles from different layers
  const tileRefs = [];

  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const internalX = minGridX + localX;
      const internalY = minGridY + localY;

      // Convert to tile coordinates for sparse lookup
      const tileCoords = internalToTileCoords(internalX, internalY);

      // Collect tiles from ALL visible layers at this position (bottom to top)
      for (let i = 0; i < state.layers.length; i++) {
        const layer = state.layers[i];
        if (!layer.visible) continue;

        const tile = getTileAtPosition(layer, tileCoords.x, tileCoords.y);
        if (tile) {
          // Convert to semantic reference if it's not already
          let tileRef;
          if (tile.type && tile.name) {
            // Already a semantic reference
            tileRef = { ...tile };
          } else if (tile.row !== undefined && tile.col !== undefined) {
            // Old-style {row, col} - convert to semantic reference
            tileRef = coordsToTileRef(tile.row, tile.col);
            if (!tileRef) {
              // Fallback to old format if conversion fails
              tileRef = { row: tile.row, col: tile.col };
            }
          }

          if (tileRef) {
            tileRefs.push({
              ...tileRef,
              localX: localX,
              localY: localY,
              layerIndex: i  // Track which layer this came from (for proper ordering)
            });
          }
        }
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

  // Update main preview window custom tiles
  if (typeof renderCustomTilesPreview === 'function') {
    renderCustomTilesPreview();
  }
}

// Remove a custom tile by ID
function removeCustomTile(tileId) {
  const index = TileTesterState.customTiles.findIndex(t => t.id === tileId);
  if (index !== -1) {
    TileTesterState.customTiles.splice(index, 1);
    renderCustomTilesInPalette();

    // Update main preview window custom tiles
    if (typeof renderCustomTilesPreview === 'function') {
      renderCustomTilesPreview();
    }
  }
}

// Clear the canvas drag selection
function clearCanvasSelection() {
  TileTesterState.isCanvasSelecting = false;
  TileTesterState.isCanvasSelectionFinalized = false;
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
      TileTesterState.isCanvasSelectionFinalized = false;
      TileTesterState.canvasSelectionStart = { row: pos.gridY, col: pos.gridX };
      TileTesterState.canvasSelection = {
        startRow: pos.gridY,
        startCol: pos.gridX,
        endRow: pos.gridY,
        endCol: pos.gridX
      };

      hideSelectionUI();
      renderTileTesterMainCanvas();
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
        renderTileTesterMainCanvas();
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
        // Mark selection as finalized to show dashed border
        TileTesterState.isCanvasSelectionFinalized = true;
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

  // Check if selection is finalized (after mouseup) or active (during drag)
  const isFinalized = TileTesterState.isCanvasSelectionFinalized;

  if (isFinalized) {
    // Finalized selection: dashed blue border only, no fill
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);  // Dashed line pattern
    ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
    ctx.setLineDash([]);  // Reset to solid line
  } else {
    // Active selection (during drag): semi-transparent fill with solid border
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
  }
}

// Show the selection popup menu UI
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

  // Calculate center position for the menu
  const selectionCenterX = ((minCol + maxCol + 1) / 2) * tileSize * zoom;
  const selectionTop = minRow * tileSize * zoom;

  // Get canvas position
  const canvas = document.getElementById('tileTesterMainCanvas');
  const canvasRect = canvas.getBoundingClientRect();

  // Create UI container (now a menu)
  const ui = document.createElement('div');
  ui.id = 'customTileSelectionUI';
  ui.className = 'custom-tile-selection-ui custom-tile-selection-menu';

  // Position above the selection
  ui.style.position = 'fixed';
  ui.style.left = (canvasRect.left + selectionCenterX) + 'px';
  ui.style.top = (canvasRect.top + selectionTop - 10) + 'px';
  ui.style.transform = 'translate(-50%, -100%)';
  ui.style.zIndex = '1000';

  // Menu items
  const menuItems = [
    { label: 'Add to Custom Tiles', action: addCustomTileFromSelection },
    { label: 'Save Selection (PNG)', action: saveSelectionAsPNG },
    { label: 'Save Selection (SVG)', action: saveSelectionAsSVG }
  ];

  menuItems.forEach((item, index) => {
    const menuItem = document.createElement('button');
    menuItem.className = 'custom-tile-menu-item';
    menuItem.textContent = item.label;
    menuItem.onclick = function(e) {
      e.stopPropagation();
      item.action();
    };
    ui.appendChild(menuItem);
  });

  document.body.appendChild(ui);

  // Trigger a re-render to show the finalized selection
  renderTileTesterMainCanvas();
}

// Save selection as PNG
function saveSelectionAsPNG() {
  const sel = TileTesterState.canvasSelection;
  if (!sel) return;

  const tileSize = TileTesterState.tileSize;
  const sourceCanvas = document.getElementById('canvas');
  if (!sourceCanvas) return;

  // Calculate grid bounds (these are internal grid coordinates)
  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Create temporary canvas for export
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width * tileSize;
  tempCanvas.height = height * tileSize;
  const tempCtx = tempCanvas.getContext('2d');

  // Draw tiles from all visible layers (bottom to top)
  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const internalX = minGridX + localX;
      const internalY = minGridY + localY;

      // Convert to tile coordinates for sparse lookup
      const tileCoords = internalToTileCoords(internalX, internalY);

      // Draw tiles from all visible layers at this position
      for (const layer of TileTesterState.layers) {
        if (!layer.visible) continue;

        const tile = getTileAtPosition(layer, tileCoords.x, tileCoords.y);
        if (tile) {
          const coords = getTileCanvasCoords(tile);
          if (!coords) continue;

          const srcX = coords.col * tileSize;
          const srcY = coords.row * tileSize;
          const destX = localX * tileSize;
          const destY = localY * tileSize;

          tempCtx.globalAlpha = layer.opacity;
          tempCtx.drawImage(
            sourceCanvas,
            srcX, srcY, tileSize, tileSize,
            destX, destY, tileSize, tileSize
          );
        }
      }
    }
  }

  tempCtx.globalAlpha = 1;

  // Download
  const image = tempCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'custom-tile.png';
  link.href = image;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clear selection after save
  clearCanvasSelection();
}

// Save selection as SVG (vector paths)
function saveSelectionAsSVG() {
  const sel = TileTesterState.canvasSelection;
  if (!sel) return;

  const tileSize = TileTesterState.tileSize;

  // Calculate grid bounds (these are internal grid coordinates)
  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  const svgWidth = width * tileSize;
  const svgHeight = height * tileSize;

  const defs = [];
  const content = [];

  // Process each visible layer (bottom to top)
  for (const layer of TileTesterState.layers) {
    if (!layer.visible) continue;
    if (!layer.tiles || !Array.isArray(layer.tiles)) continue;

    const opacity = layer.opacity;
    const layerContent = [];

    // Iterate through the selection area
    for (let localY = 0; localY < height; localY++) {
      for (let localX = 0; localX < width; localX++) {
        const internalX = minGridX + localX;
        const internalY = minGridY + localY;

        // Convert to tile coordinates for sparse lookup
        const tileCoords = internalToTileCoords(internalX, internalY);

        const tile = getTileAtPosition(layer, tileCoords.x, tileCoords.y);
        if (!tile) continue;

        // Get the tile's canvas coordinates
        const coords = getTileCanvasCoords(tile);
        if (!coords) continue;

        // Calculate destination position in the SVG
        const destX = localX * tileSize;
        const destY = localY * tileSize;

        // Generate SVG elements for this tile using the existing SVG exporter
        const tileElements = generateTileSVGFromCoords(coords, tileSize, destX, destY);

        tileElements.forEach(el => {
          if (el.type === 'mask' || el.type === 'clipPath') {
            defs.push(el.content);
          } else {
            layerContent.push(el.content);
          }
        });
      }
    }

    // Wrap layer content with opacity if not 1
    if (layerContent.length > 0) {
      if (opacity < 1) {
        content.push(`  <g opacity="${opacity}">`);
        layerContent.forEach(c => content.push('  ' + c));
        content.push(`  </g>`);
      } else {
        layerContent.forEach(c => content.push(c));
      }
    }
  }

  // Build final SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">\n`;

  if (defs.length > 0) {
    svg += `  <defs>\n`;
    svg += defs.join('\n') + '\n';
    svg += `  </defs>\n`;
  }

  svg += content.join('\n') + '\n';
  svg += `</svg>`;

  // Download as SVG
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'custom-tile.svg';
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Clear selection after save
  clearCanvasSelection();
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

    // Draw the tile references (sorted by layer index to maintain proper ordering)
    if (sourceCanvas) {
      // Sort by layer index to draw in correct order (bottom to top)
      const sortedRefs = [...customTile.tileRefs].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

      sortedRefs.forEach(ref => {
        // Get canvas coordinates - handles both semantic refs and old-style {row, col}
        const coords = getTileCanvasCoords(ref);
        if (!coords) return;

        const srcX = coords.col * tileSize;
        const srcY = coords.row * tileSize;
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

// Place custom tile at grid position (sparse format)
function placeCustomTileAt(gridX, gridY) {
  const customTile = TileTesterState.selectedCustomTile;
  if (!customTile) return;

  const layer = getActiveLayer();
  if (!layer) return;

  // Sort refs by layer index to place in correct order (though all go to current layer)
  const sortedRefs = [...customTile.tileRefs].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

  // FIRST: expand grid to fit all tiles (may shift origin)
  // Find bounds of custom tile
  let minLocalX = 0, maxLocalX = 0, minLocalY = 0, maxLocalY = 0;
  sortedRefs.forEach(ref => {
    minLocalX = Math.min(minLocalX, ref.localX);
    maxLocalX = Math.max(maxLocalX, ref.localX);
    minLocalY = Math.min(minLocalY, ref.localY);
    maxLocalY = Math.max(maxLocalY, ref.localY);
  });
  // Expand for all corners
  ensureGridForInternalPosition(gridX + minLocalX, gridY + minLocalY, 1);
  ensureGridForInternalPosition(gridX + maxLocalX, gridY + maxLocalY, 1);

  // NOW place all tiles using the updated origin
  sortedRefs.forEach(ref => {
    const destInternalX = gridX + ref.localX;
    const destInternalY = gridY + ref.localY;

    // Convert to tile coordinates using updated origin
    const destCoords = internalToTileCoords(destInternalX, destInternalY);
    const destTileX = destCoords.x;
    const destTileY = destCoords.y;

    // Place tile - preserve semantic reference if present
    let newTile;
    if (ref.type && ref.name) {
      // Semantic reference - copy it (without localX/localY/layerIndex)
      newTile = {
        type: ref.type,
        name: ref.name,
        colorIndex: ref.colorIndex,
        tileRow: ref.tileRow,
        tileCol: ref.tileCol
      };
    } else if (ref.row !== undefined && ref.col !== undefined) {
      // Old-style {row, col} - convert to semantic ref
      const tileRef = coordsToTileRef(ref.row, ref.col);
      newTile = tileRef || { row: ref.row, col: ref.col };
    }

    if (newTile) {
      setTileAtPosition(layer, destTileX, destTileY, newTile);
    }
  });

  // Render and update transform
  renderTileTesterMainCanvas();
  updateCanvasTransform();
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
