/* Tile Tester Palette Window - Floating tilemap palette */

// Track sidebar toggle initialization
var sidebarToggleInitialized = false;
var sidebarToggleHandler = null;

// Setup the palette window with tileset
function setupTileTesterPalette() {
  const paletteCanvas = document.getElementById('tileTesterPaletteCanvas');
  const paletteContainer = document.getElementById('tileTesterPaletteContainer');

  if (!paletteCanvas || !paletteContainer) return;

  TileTesterState.paletteCanvas = paletteCanvas;
  TileTesterState.paletteCtx = paletteCanvas.getContext('2d');

  // Copy current tileset to palette
  copyTilesetToPalette();

  // Setup fit checkbox
  const fitCheckbox = document.getElementById('tileTesterPaletteFit');
  if (fitCheckbox) {
    fitCheckbox.checked = TileTesterState.paletteFitMode;
    fitCheckbox.addEventListener('change', function() {
      TileTesterState.paletteFitMode = this.checked;
      updatePaletteFitMode();
    });
  }

  // Setup sidebar toggle
  setupSidebarToggle();

  // Initial fit mode
  updatePaletteFitMode();
}

// Copy the current tileset canvas to the palette
function copyTilesetToPalette() {
  const sourceCanvas = document.getElementById('canvas');
  const paletteCanvas = TileTesterState.paletteCanvas;

  if (!sourceCanvas || !paletteCanvas) return;

  // Get current tile size
  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  TileTesterState.tileSize = tileSize;

  // Copy dimensions
  paletteCanvas.width = sourceCanvas.width;
  paletteCanvas.height = sourceCanvas.height;

  // Copy image data
  const ctx = TileTesterState.paletteCtx;
  ctx.drawImage(sourceCanvas, 0, 0);

  // Store image data for later use
  TileTesterState.tilesetImageData = ctx.getImageData(0, 0, paletteCanvas.width, paletteCanvas.height);

  // Draw grid lines
  drawPaletteGridLines();
}

// Draw light gray grid lines on palette
function drawPaletteGridLines() {
  const canvas = TileTesterState.paletteCanvas;
  const ctx = TileTesterState.paletteCtx;
  const tileSize = TileTesterState.tileSize;

  if (!canvas || !ctx) return;

  ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)';
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

// Setup sidebar toggle button
function setupSidebarToggle() {
  // Guard against multiple initialization
  if (sidebarToggleInitialized) return;
  sidebarToggleInitialized = true;

  const toggleBtn = document.getElementById('tileTesterSidebarToggle');
  const paletteWindow = document.getElementById('tileTesterPaletteWindow');

  if (!toggleBtn || !paletteWindow) return;

  sidebarToggleHandler = function() {
    paletteWindow.classList.toggle('collapsed');
  };

  toggleBtn.addEventListener('click', sidebarToggleHandler);
}

// Remove sidebar toggle event listener
function removeSidebarToggleEvents() {
  const toggleBtn = document.getElementById('tileTesterSidebarToggle');

  if (toggleBtn && sidebarToggleHandler) {
    toggleBtn.removeEventListener('click', sidebarToggleHandler);
    sidebarToggleHandler = null;
  }

  sidebarToggleInitialized = false;
}

// Update palette fit mode
function updatePaletteFitMode() {
  const paletteWrapper = document.getElementById('tileTesterPaletteWrapper');
  if (!paletteWrapper) return;

  if (TileTesterState.paletteFitMode) {
    paletteWrapper.classList.add('fit-mode');
  } else {
    paletteWrapper.classList.remove('fit-mode');
  }
}

// Update selected tile highlight on palette
function updatePaletteSelection() {
  const canvas = TileTesterState.paletteCanvas;
  const ctx = TileTesterState.paletteCtx;
  const tileSize = TileTesterState.tileSize;

  if (!canvas || !ctx || !TileTesterState.tilesetImageData) return;

  // Redraw tileset from stored data
  ctx.putImageData(TileTesterState.tilesetImageData, 0, 0);

  // Redraw grid lines
  drawPaletteGridLines();

  // Draw selection highlight for multi-tile selection
  if (TileTesterState.selectedTiles) {
    const sel = TileTesterState.selectedTiles;
    const minRow = Math.min(sel.startRow, sel.endRow);
    const maxRow = Math.max(sel.startRow, sel.endRow);
    const minCol = Math.min(sel.startCol, sel.endCol);
    const maxCol = Math.max(sel.startCol, sel.endCol);

    const x = minCol * tileSize;
    const y = minRow * tileSize;
    const width = (maxCol - minCol + 1) * tileSize;
    const height = (maxRow - minRow + 1) * tileSize;

    // Semi-transparent fill
    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
  }
  // Draw selection highlight if a single tile is selected (backwards compatibility)
  else if (TileTesterState.selectedTile) {
    const { row, col } = TileTesterState.selectedTile;
    const x = col * tileSize;
    const y = row * tileSize;

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3);
  }
}

// Get tile position from palette click
function getTileFromPaletteClick(e) {
  const canvas = TileTesterState.paletteCanvas;
  const tileSize = TileTesterState.tileSize;

  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const col = Math.floor(x / tileSize);
  const row = Math.floor(y / tileSize);

  // Check bounds
  const maxCols = Math.floor(canvas.width / tileSize);
  const maxRows = Math.floor(canvas.height / tileSize);

  if (col < 0 || col >= maxCols || row < 0 || row >= maxRows) {
    return null;
  }

  return { row, col };
}

// Handle palette click to select tile
function handlePaletteClick(e) {
  const tilePos = getTileFromPaletteClick(e);

  if (tilePos) {
    // Start single tile selection (or start of drag selection)
    TileTesterState.selectedTile = {
      row: tilePos.row,
      col: tilePos.col
    };
    // Clear multi-tile selection when clicking
    TileTesterState.selectedTiles = null;
    TileTesterState.isSelectingMultiple = false;
    TileTesterState.selectionStart = { row: tilePos.row, col: tilePos.col };
    updatePaletteSelection();
    updateCursorPreview();
  }
}

// Handle palette mouse down for drag selection
function handlePaletteMouseDown(e) {
  const tilePos = getTileFromPaletteClick(e);

  if (tilePos) {
    TileTesterState.isSelectingMultiple = true;
    TileTesterState.selectionStart = { row: tilePos.row, col: tilePos.col };
    TileTesterState.selectedTiles = {
      startRow: tilePos.row,
      startCol: tilePos.col,
      endRow: tilePos.row,
      endCol: tilePos.col
    };
    TileTesterState.selectedTile = null; // Clear single selection
    TileTesterState.selectedCustomTile = null; // Clear custom tile selection
    // Update custom tiles palette to clear selection
    if (typeof updateCustomTilePaletteSelection === 'function') {
      updateCustomTilePaletteSelection(null);
    }
    updatePaletteSelection();
  }
}

// Handle palette mouse move for drag selection
function handlePaletteMouseMove(e) {
  if (!TileTesterState.isSelectingMultiple || !TileTesterState.selectionStart) return;

  const tilePos = getTileFromPaletteClick(e);

  if (tilePos) {
    TileTesterState.selectedTiles = {
      startRow: TileTesterState.selectionStart.row,
      startCol: TileTesterState.selectionStart.col,
      endRow: tilePos.row,
      endCol: tilePos.col
    };
    updatePaletteSelection();
  }
}

// Handle palette mouse up for drag selection
function handlePaletteMouseUp(e) {
  if (!TileTesterState.isSelectingMultiple) return;

  TileTesterState.isSelectingMultiple = false;

  // If only one tile was selected, treat as single selection
  if (TileTesterState.selectedTiles) {
    const sel = TileTesterState.selectedTiles;
    const isSingleTile = sel.startRow === sel.endRow && sel.startCol === sel.endCol;

    if (isSingleTile) {
      TileTesterState.selectedTile = { row: sel.startRow, col: sel.startCol };
      TileTesterState.selectedTiles = null;
    }
  }

  updatePaletteSelection();
  updateCursorPreview();
}


// Update cursor preview based on selected tile
function updateCursorPreview() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');

  if (!mainCanvas) return;

  if (TileTesterState.selectedTile || TileTesterState.selectedTiles || TileTesterState.selectedCustomTile) {
    mainCanvas.classList.add('painting-mode');
  } else {
    mainCanvas.classList.remove('painting-mode');
  }
}

