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

// Draw tiles for a specific layer
function drawLayerTiles(layer) {
  const ctx = TileTesterState.mainCtx;
  const tileSize = TileTesterState.tileSize;
  const sourceCanvas = document.getElementById('canvas'); // Original tileset without grid lines

  if (!ctx || !sourceCanvas) return;

  // Set layer opacity
  ctx.globalAlpha = layer.opacity;

  for (let y = 0; y < TileTesterState.gridHeight; y++) {
    for (let x = 0; x < TileTesterState.gridWidth; x++) {
      const tile = layer.tiles[y] && layer.tiles[y][x];

      if (tile) {
        // Get canvas coordinates - handles both semantic refs and old-style {row, col}
        const coords = getTileCanvasCoords(tile);
        if (!coords) continue; // Skip if tile not found in current tileset

        // Calculate source position from original tileset
        const srcX = coords.col * tileSize;
        const srcY = coords.row * tileSize;

        // Calculate destination position
        const destX = x * tileSize;
        const destY = y * tileSize;

        // Draw tile from original tileset canvas (not palette which has grid lines)
        ctx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );
      }
    }
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

// Place or toggle a tile at grid position on active layer
function placeTileAt(gridX, gridY) {
  const layer = getActiveLayer();
  if (!layer) return;

  // Handle multi-tile selection
  if (TileTesterState.selectedTiles) {
    placeMultiTilesAt(gridX, gridY);
    return;
  }

  // Check bounds
  if (gridX < 0 || gridX >= TileTesterState.gridWidth ||
      gridY < 0 || gridY >= TileTesterState.gridHeight) {
    return;
  }

  // Ensure row exists
  if (!layer.tiles[gridY]) {
    layer.tiles[gridY] = [];
  }

  const existingTile = layer.tiles[gridY][gridX];

  // Toggle behavior: if tile exists, remove it
  if (existingTile) {
    layer.tiles[gridY][gridX] = null;
  } else if (TileTesterState.selectedTile) {
    // Place new tile with semantic reference
    const tileRef = coordsToTileRef(TileTesterState.selectedTile.row, TileTesterState.selectedTile.col);
    if (tileRef) {
      layer.tiles[gridY][gridX] = tileRef;
    } else {
      layer.tiles[gridY][gridX] = {
        row: TileTesterState.selectedTile.row,
        col: TileTesterState.selectedTile.col
      };
    }
  }

  // Redraw canvas
  renderTileTesterMainCanvas();
}

// Place multi-tile selection at grid position
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

  // Place all tiles in the selection region
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const destX = gridX + dx;
      const destY = gridY + dy;

      // Check bounds
      if (destX < 0 || destX >= TileTesterState.gridWidth ||
          destY < 0 || destY >= TileTesterState.gridHeight) {
        continue;
      }

      // Ensure row exists
      if (!layer.tiles[destY]) {
        layer.tiles[destY] = [];
      }

      // Convert to semantic tile reference
      const srcRow = minRow + dy;
      const srcCol = minCol + dx;
      const tileRef = coordsToTileRef(srcRow, srcCol);

      if (tileRef) {
        layer.tiles[destY][destX] = tileRef;
      } else {
        // Fallback to old format
        layer.tiles[destY][destX] = { row: srcRow, col: srcCol };
      }
    }
  }

  // Redraw canvas
  renderTileTesterMainCanvas();
}

// Erase tile at grid position on active layer
function eraseTileAt(gridX, gridY) {
  const layer = getActiveLayer();
  if (!layer) return;

  // Check bounds
  if (gridX < 0 || gridX >= TileTesterState.gridWidth ||
      gridY < 0 || gridY >= TileTesterState.gridHeight) {
    return;
  }

  if (layer.tiles[gridY]) {
    layer.tiles[gridY][gridX] = null;
  }

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

      // Check bounds
      if (destX >= 0 && destX < TileTesterState.gridWidth * tileSize &&
          destY >= 0 && destY < TileTesterState.gridHeight * tileSize) {
        ctx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );
      }
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

        // Check bounds
        if (destX >= 0 && destX < TileTesterState.gridWidth * tileSize &&
            destY >= 0 && destY < TileTesterState.gridHeight * tileSize) {
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

  // Create a temporary canvas without grid lines
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = TileTesterState.gridWidth * tileSize;
  tempCanvas.height = TileTesterState.gridHeight * tileSize;
  const tempCtx = tempCanvas.getContext('2d');

  // Fill background
  tempCtx.fillStyle = TileTesterState.backgroundColor;
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw all layers
  if (sourceCanvas) {
    for (const layer of TileTesterState.layers) {
      if (!layer.visible) continue;

      tempCtx.globalAlpha = layer.opacity;

      for (let y = 0; y < TileTesterState.gridHeight; y++) {
        for (let x = 0; x < TileTesterState.gridWidth; x++) {
          const tile = layer.tiles[y] && layer.tiles[y][x];

          if (tile) {
            // Get canvas coordinates - handles both semantic refs and old-style {row, col}
            const coords = getTileCanvasCoords(tile);
            if (!coords) continue;

            const srcX = coords.col * tileSize;
            const srcY = coords.row * tileSize;
            const destX = x * tileSize;
            const destY = y * tileSize;

            tempCtx.drawImage(
              sourceCanvas,
              srcX, srcY, tileSize, tileSize,
              destX, destY, tileSize, tileSize
            );
          }
        }
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
