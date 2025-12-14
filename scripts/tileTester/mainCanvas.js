/* Tile Tester Main Canvas - Tilemap painting area */

// Setup the main canvas
function setupTileTesterMainCanvas() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');

  if (!mainCanvas) return;

  TileTesterState.mainCanvas = mainCanvas;
  TileTesterState.mainCtx = mainCanvas.getContext('2d');

  // Initialize grid if empty
  if (!TileTesterState.tiles || TileTesterState.tiles.length === 0) {
    initTileTesterGrid();
  }

  // Render the canvas
  renderTileTesterMainCanvas();
}

// Render the main canvas with tiles and grid
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

  // Draw placed tiles
  drawPlacedTiles();

  // Draw grid lines
  drawMainCanvasGridLines();
}

// Draw all placed tiles
function drawPlacedTiles() {
  const ctx = TileTesterState.mainCtx;
  const tileSize = TileTesterState.tileSize;
  const paletteCanvas = TileTesterState.paletteCanvas;

  if (!ctx || !paletteCanvas) return;

  for (let y = 0; y < TileTesterState.gridHeight; y++) {
    for (let x = 0; x < TileTesterState.gridWidth; x++) {
      const tile = TileTesterState.tiles[y] && TileTesterState.tiles[y][x];

      if (tile) {
        // Calculate source position from palette
        const srcX = tile.col * tileSize;
        const srcY = tile.row * tileSize;

        // Calculate destination position
        const destX = x * tileSize;
        const destY = y * tileSize;

        // Draw tile from palette
        ctx.drawImage(
          paletteCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );
      }
    }
  }
}

// Draw grid lines on main canvas
function drawMainCanvasGridLines() {
  const canvas = TileTesterState.mainCanvas;
  const ctx = TileTesterState.mainCtx;
  const tileSize = TileTesterState.tileSize;

  if (!canvas || !ctx) return;

  ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x <= canvas.width; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= canvas.height; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
    ctx.stroke();
  }
}

// Place a tile at grid position
function placeTileAt(gridX, gridY) {
  if (!TileTesterState.selectedTile) return;

  // Check bounds
  if (gridX < 0 || gridX >= TileTesterState.gridWidth ||
      gridY < 0 || gridY >= TileTesterState.gridHeight) {
    return;
  }

  // Ensure row exists
  if (!TileTesterState.tiles[gridY]) {
    TileTesterState.tiles[gridY] = [];
  }

  // Store the tile reference
  TileTesterState.tiles[gridY][gridX] = {
    row: TileTesterState.selectedTile.row,
    col: TileTesterState.selectedTile.col
  };

  // Redraw canvas
  renderTileTesterMainCanvas();
}

// Erase tile at grid position
function eraseTileAt(gridX, gridY) {
  // Check bounds
  if (gridX < 0 || gridX >= TileTesterState.gridWidth ||
      gridY < 0 || gridY >= TileTesterState.gridHeight) {
    return;
  }

  if (TileTesterState.tiles[gridY]) {
    TileTesterState.tiles[gridY][gridX] = null;
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

// Download the canvas as an image
function downloadTileTesterCanvas() {
  const canvas = TileTesterState.mainCanvas;

  if (!canvas) return;

  // Create a temporary canvas without grid lines
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Fill background
  tempCtx.fillStyle = TileTesterState.backgroundColor;
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw placed tiles (without grid)
  const tileSize = TileTesterState.tileSize;
  const paletteCanvas = TileTesterState.paletteCanvas;

  if (paletteCanvas) {
    for (let y = 0; y < TileTesterState.gridHeight; y++) {
      for (let x = 0; x < TileTesterState.gridWidth; x++) {
        const tile = TileTesterState.tiles[y] && TileTesterState.tiles[y][x];

        if (tile) {
          const srcX = tile.col * tileSize;
          const srcY = tile.row * tileSize;
          const destX = x * tileSize;
          const destY = y * tileSize;

          tempCtx.drawImage(
            paletteCanvas,
            srcX, srcY, tileSize, tileSize,
            destX, destY, tileSize, tileSize
          );
        }
      }
    }
  }

  // Download
  const image = tempCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'tilemap.png';
  link.href = image;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
