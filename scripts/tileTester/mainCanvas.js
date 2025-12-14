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

  // Draw grid lines (inside each cell)
  drawMainCanvasGridLines();
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
        // Calculate source position from original tileset
        const srcX = tile.col * tileSize;
        const srcY = tile.row * tileSize;

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

// Draw grid lines inside each cell (inset borders)
function drawMainCanvasGridLines() {
  const canvas = TileTesterState.mainCanvas;
  const ctx = TileTesterState.mainCtx;
  const tileSize = TileTesterState.tileSize;

  if (!canvas || !ctx) return;

  ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
  ctx.lineWidth = 1;

  // Draw inset grid for each cell
  for (let y = 0; y < TileTesterState.gridHeight; y++) {
    for (let x = 0; x < TileTesterState.gridWidth; x++) {
      const cellX = x * tileSize;
      const cellY = y * tileSize;

      // Draw inset rectangle (1px from edges)
      ctx.strokeRect(cellX + 0.5, cellY + 0.5, tileSize - 1, tileSize - 1);
    }
  }
}

// Place or toggle a tile at grid position on active layer
function placeTileAt(gridX, gridY) {
  const layer = getActiveLayer();
  if (!layer) return;

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
    // Place new tile
    layer.tiles[gridY][gridX] = {
      row: TileTesterState.selectedTile.row,
      col: TileTesterState.selectedTile.col
    };
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
            const srcX = tile.col * tileSize;
            const srcY = tile.row * tileSize;
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
