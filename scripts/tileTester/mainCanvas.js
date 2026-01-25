/* Tile Tester Main Canvas - Tilemap painting area */

// Setup the main canvas
function setupTileTesterMainCanvas() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');

  if (!mainCanvas) return;

  TileTesterState.mainCanvas = mainCanvas;
  TileTesterState.mainCtx = mainCanvas.getContext('2d');

  // Calculate grid size based on window
  calculateGridSize();

  // Initialize layers if empty
  if (!TileTesterState.layers || TileTesterState.layers.length === 0) {
    initTileTesterLayers();
  }

  // Render the canvas
  renderTileTesterMainCanvas();
}

// Render the main canvas with all layers and grid
function renderTileTesterMainCanvas() {
  const canvas = TileTesterState.mainCanvas;
  const ctx = TileTesterState.mainCtx;
  const tileSize = TileTesterState.tileSize;

  if (!canvas || !ctx) return;

  // Set canvas size based on grid
  canvas.width = TileTesterState.gridWidth * tileSize;
  canvas.height = TileTesterState.gridHeight * tileSize;

  // Fill background
  ctx.fillStyle = TileTesterState.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw all layers from bottom to top
  for (const layer of TileTesterState.layers) {
    if (layer.visible) {
      drawLayerTiles(layer);
    }
  }

  // Draw ghost preview if hovering with a selection
  drawGhostPreview();

  // Draw canvas selection overlay if present (for custom tile creation)
  if (TileTesterState.canvasSelection) {
    renderCanvasSelection();
  }

  // Update grid overlay
  updateGridOverlay();
}

// Draw tiles for a specific layer (sparse format)
function drawLayerTiles(layer) {
  const ctx = TileTesterState.mainCtx;
  const tileSize = TileTesterState.tileSize;
  const sourceCanvas = document.getElementById('canvas'); // Original tileset without grid lines
  const origin = TileTesterState.gridOrigin;

  if (!ctx || !sourceCanvas) return;
  if (!layer.tiles || !Array.isArray(layer.tiles)) return;

  // Set layer opacity
  ctx.globalAlpha = layer.opacity;

  // Iterate through sparse tile array
  for (const entry of layer.tiles) {
    const tile = entry.tile;
    const tileX = entry.x;
    const tileY = entry.y;

    // Get canvas coordinates - handles both semantic refs and old-style {row, col}
    const coords = getTileCanvasCoords(tile);
    if (!coords) continue; // Skip if tile not found in current tileset

    // Calculate source position from original tileset
    const srcX = coords.col * tileSize;
    const srcY = coords.row * tileSize;

    // Convert tile coordinates to internal grid coordinates for rendering
    const internalX = tileX + origin.x;
    const internalY = tileY + origin.y;

    // Calculate destination position
    const destX = internalX * tileSize;
    const destY = internalY * tileSize;

    // Draw tile from original tileset canvas (not palette which has grid lines)
    ctx.drawImage(
      sourceCanvas,
      srcX, srcY, tileSize, tileSize,
      destX, destY, tileSize, tileSize
    );
  }

  // Reset opacity
  ctx.globalAlpha = 1;
}

// Update grid overlay to match canvas size and zoom
function updateGridOverlay() {
  const canvas = TileTesterState.mainCanvas;
  const overlay = document.getElementById('tileTesterGridOverlay');
  const tileSize = TileTesterState.tileSize;
  const zoom = TileTesterState.canvasZoom || 1;

  if (!canvas || !overlay) return;

  const scaledTileSize = tileSize * zoom;
  const width = canvas.width * zoom;
  const height = canvas.height * zoom;

  overlay.style.width = width + 'px';
  overlay.style.height = height + 'px';

  // Use CSS background for 1px grid lines
  overlay.style.backgroundSize = scaledTileSize + 'px ' + scaledTileSize + 'px';
  overlay.style.backgroundImage = `
    linear-gradient(to right, rgba(100, 100, 100, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(100, 100, 100, 0.3) 1px, transparent 1px)
  `;
  overlay.style.backgroundPosition = '0 0';
}

// Place or toggle a tile at grid position on active layer (sparse format)
function placeTileAt(gridX, gridY) {
  const layer = getActiveLayer();
  if (!layer) return;

  // Handle multi-tile selection
  if (TileTesterState.selectedTiles) {
    placeMultiTilesAt(gridX, gridY);
    return;
  }

  // Convert internal grid position to tile coordinates
  const tileCoords = internalToTileCoords(gridX, gridY);
  const tileX = tileCoords.x;
  const tileY = tileCoords.y;

  const existingTile = getTileAtPosition(layer, tileX, tileY);

  // Toggle behavior: if tile exists, remove it
  if (existingTile) {
    removeTileAtPosition(layer, tileX, tileY);
  } else if (TileTesterState.selectedTile) {
    // Place new tile with semantic reference
    const tileRef = coordsToTileRef(TileTesterState.selectedTile.row, TileTesterState.selectedTile.col);
    const newTile = tileRef || {
      row: TileTesterState.selectedTile.row,
      col: TileTesterState.selectedTile.col
    };
    setTileAtPosition(layer, tileX, tileY, newTile);

    // Auto-expand grid if needed (ensure 5 squares margin)
    if (ensureGridForPosition(tileX, tileY, 5)) {
      updateCanvasTransform();
    }
  }

  // Redraw canvas
  renderTileTesterMainCanvas();
}

// Place multi-tile selection at grid position (sparse format)
function placeMultiTilesAt(gridX, gridY) {
  const layer = getActiveLayer();
  if (!layer) return;

  const sel = TileTesterState.selectedTiles;
  if (!sel) return;

  const minRow = Math.min(sel.startRow, sel.endRow);
  const maxRow = Math.max(sel.startRow, sel.endRow);
  const minCol = Math.min(sel.startCol, sel.endCol);
  const maxCol = Math.max(sel.startCol, sel.endCol);

  const height = maxRow - minRow + 1;
  const width = maxCol - minCol + 1;

  let gridExpanded = false;

  // Place all tiles in the selection region
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const destInternalX = gridX + dx;
      const destInternalY = gridY + dy;

      // Convert to tile coordinates
      const destCoords = internalToTileCoords(destInternalX, destInternalY);
      const destTileX = destCoords.x;
      const destTileY = destCoords.y;

      // Convert to semantic tile reference
      const srcRow = minRow + dy;
      const srcCol = minCol + dx;
      const tileRef = coordsToTileRef(srcRow, srcCol);

      const newTile = tileRef || { row: srcRow, col: srcCol };
      setTileAtPosition(layer, destTileX, destTileY, newTile);

      // Auto-expand grid if needed
      if (ensureGridForPosition(destTileX, destTileY, 5)) {
        gridExpanded = true;
      }
    }
  }

  if (gridExpanded) {
    updateCanvasTransform();
  }

  // Redraw canvas
  renderTileTesterMainCanvas();
}

// Erase tile at grid position on active layer (sparse format)
function eraseTileAt(gridX, gridY) {
  const layer = getActiveLayer();
  if (!layer) return;

  // Convert internal grid position to tile coordinates
  const tileCoords = internalToTileCoords(gridX, gridY);
  removeTileAtPosition(layer, tileCoords.x, tileCoords.y);

  // Redraw canvas
  renderTileTesterMainCanvas();
  updateLayerThumbnail(layer.id);
}

// Get grid position from canvas coordinates
function getGridPositionFromCanvasClick(e) {
  const canvas = TileTesterState.mainCanvas;
  const tileSize = TileTesterState.tileSize;

  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const gridX = Math.floor(x / tileSize);
  const gridY = Math.floor(y / tileSize);

  return { gridX, gridY };
}

// Draw ghost preview of selected tile(s) at hover position
function drawGhostPreview() {
  const hoverPos = TileTesterState.hoverPosition;
  if (!hoverPos) return;

  const ctx = TileTesterState.mainCtx;
  const tileSize = TileTesterState.tileSize;
  const sourceCanvas = document.getElementById('canvas');

  if (!ctx || !sourceCanvas) return;

  // Set ghost opacity
  ctx.globalAlpha = 0.5;

  // Handle custom tile selection
  if (TileTesterState.selectedCustomTile) {
    const customTile = TileTesterState.selectedCustomTile;
    const sortedRefs = [...customTile.tileRefs].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

    sortedRefs.forEach(ref => {
      const coords = getTileCanvasCoords(ref);
      if (!coords) return;

      const srcX = coords.col * tileSize;
      const srcY = coords.row * tileSize;
      const destX = (hoverPos.gridX + ref.localX) * tileSize;
      const destY = (hoverPos.gridY + ref.localY) * tileSize;

      ctx.drawImage(
        sourceCanvas,
        srcX, srcY, tileSize, tileSize,
        destX, destY, tileSize, tileSize
      );
    });
  }
  // Handle multi-tile selection
  else if (TileTesterState.selectedTiles) {
    const sel = TileTesterState.selectedTiles;
    const minRow = Math.min(sel.startRow, sel.endRow);
    const maxRow = Math.max(sel.startRow, sel.endRow);
    const minCol = Math.min(sel.startCol, sel.endCol);
    const maxCol = Math.max(sel.startCol, sel.endCol);

    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const srcRow = minRow + dy;
        const srcCol = minCol + dx;
        const destX = (hoverPos.gridX + dx) * tileSize;
        const destY = (hoverPos.gridY + dy) * tileSize;

        const srcX = srcCol * tileSize;
        const srcY = srcRow * tileSize;

        ctx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );
      }
    }
  }
  // Handle single tile selection
  else if (TileTesterState.selectedTile) {
    const { row, col } = TileTesterState.selectedTile;
    const srcX = col * tileSize;
    const srcY = row * tileSize;
    const destX = hoverPos.gridX * tileSize;
    const destY = hoverPos.gridY * tileSize;

    ctx.drawImage(
      sourceCanvas,
      srcX, srcY, tileSize, tileSize,
      destX, destY, tileSize, tileSize
    );
  }

  // Reset opacity
  ctx.globalAlpha = 1;
}

// Download the canvas as an image (without grid lines)
function downloadTileTesterCanvas() {
  const tileSize = TileTesterState.tileSize;
  const sourceCanvas = document.getElementById('canvas');
  const origin = TileTesterState.gridOrigin;

  // Get bounds of all tiles to determine export size
  const bounds = getTileBounds();

  // If no tiles, export the current visible grid
  let exportWidth, exportHeight, offsetX, offsetY;
  if (!bounds.hasTiles) {
    exportWidth = TileTesterState.gridWidth * tileSize;
    exportHeight = TileTesterState.gridHeight * tileSize;
    offsetX = 0;
    offsetY = 0;
  } else {
    // Calculate export dimensions based on tile bounds
    const tileWidth = bounds.maxX - bounds.minX + 1;
    const tileHeight = bounds.maxY - bounds.minY + 1;
    exportWidth = tileWidth * tileSize;
    exportHeight = tileHeight * tileSize;
    offsetX = bounds.minX;
    offsetY = bounds.minY;
  }

  // Create a temporary canvas without grid lines
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = exportWidth;
  tempCanvas.height = exportHeight;
  const tempCtx = tempCanvas.getContext('2d');

  // Fill background only if a custom color has been set (not the default)
  const defaultBg = '#d0d0d0';
  if (TileTesterState.backgroundColor !== defaultBg) {
    tempCtx.fillStyle = TileTesterState.backgroundColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  }
  // If using default background, leave canvas transparent for PNG export

  // Draw all layers (sparse format)
  if (sourceCanvas) {
    for (const layer of TileTesterState.layers) {
      if (!layer.visible) continue;
      if (!layer.tiles || !Array.isArray(layer.tiles)) continue;

      tempCtx.globalAlpha = layer.opacity;

      for (const entry of layer.tiles) {
        const tile = entry.tile;
        const tileX = entry.x;
        const tileY = entry.y;

        // Get canvas coordinates - handles both semantic refs and old-style {row, col}
        const coords = getTileCanvasCoords(tile);
        if (!coords) continue;

        const srcX = coords.col * tileSize;
        const srcY = coords.row * tileSize;
        const destX = (tileX - offsetX) * tileSize;
        const destY = (tileY - offsetY) * tileSize;

        tempCtx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );
      }
    }
  }

  tempCtx.globalAlpha = 1;

  // Download
  const image = tempCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'tilemap.png';
  link.href = image;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
