/* Tile Tester Palette Window - Floating tilemap palette */

// Setup the palette window with tileset
function setupTileTesterPalette() {
  const paletteCanvas = document.getElementById('tileTesterPaletteCanvas');
  const paletteContainer = document.getElementById('tileTesterPaletteContainer');

  if (!paletteCanvas || !paletteContainer) return;

  TileTesterState.paletteCanvas = paletteCanvas;
  TileTesterState.paletteCtx = paletteCanvas.getContext('2d');

  // Copy current tileset to palette
  copyTilesetToPalette();

  // Setup zoom controls
  setupPaletteZoomControls();

  // Setup hide button
  setupPaletteHideButton();

  // Setup dragging for palette window
  setupPaletteWindowDrag();

  // Setup resize handles
  setupPaletteWindowResize();

  // Initial fit mode
  updatePaletteZoomMode('fit');
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

// Setup zoom controls
function setupPaletteZoomControls() {
  const zoomLinks = document.querySelectorAll('.tester-zoom-link');

  zoomLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const zoom = this.dataset.zoom;
      updatePaletteZoomMode(zoom);

      // Update active state
      zoomLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// Setup hide button
function setupPaletteHideButton() {
  const hideBtn = document.getElementById('tileTesterHideBtn');
  const paletteWindow = document.getElementById('tileTesterPaletteWindow');

  if (!hideBtn || !paletteWindow) return;

  hideBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const isHidden = paletteWindow.classList.toggle('content-hidden');
    this.textContent = isHidden ? 'Show' : 'Hide';
  });
}

// Update palette zoom mode
function updatePaletteZoomMode(zoom) {
  const paletteWrapper = document.getElementById('tileTesterPaletteWrapper');
  if (!paletteWrapper) return;

  // Remove all zoom classes
  paletteWrapper.classList.remove('fit-mode', 'zoom-1x', 'zoom-2x', 'zoom-3x', 'zoom-4x');

  if (zoom === 'fit') {
    paletteWrapper.classList.add('fit-mode');
    TileTesterState.paletteFitMode = true;
  } else {
    paletteWrapper.classList.add('zoom-' + zoom + 'x');
    TileTesterState.paletteFitMode = false;
  }

  TileTesterState.paletteZoom = zoom;
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

  // Draw selection highlight if a tile is selected
  if (TileTesterState.selectedTile) {
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
    TileTesterState.selectedTile = {
      row: tilePos.row,
      col: tilePos.col
    };
    updatePaletteSelection();
    updateCursorPreview();
  }
}

// Setup palette window dragging
function setupPaletteWindowDrag() {
  const paletteWindow = document.getElementById('tileTesterPaletteWindow');
  const header = document.getElementById('tileTesterPaletteHeader');

  if (!paletteWindow || !header) return;

  let isDragging = false;
  let startX, startY, startLeft, startTop;

  header.addEventListener('mousedown', function(e) {
    // Don't drag if clicking on controls
    if (e.target.closest('.tester-palette-controls')) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = paletteWindow.offsetLeft;
    startTop = paletteWindow.offsetTop;

    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    paletteWindow.style.left = (startLeft + dx) + 'px';
    paletteWindow.style.top = (startTop + dy) + 'px';
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
}

// Update cursor preview based on selected tile
function updateCursorPreview() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');

  if (!mainCanvas) return;

  if (TileTesterState.selectedTile) {
    mainCanvas.classList.add('painting-mode');
  } else {
    mainCanvas.classList.remove('painting-mode');
  }
}

// Setup resize handles for palette window
function setupPaletteWindowResize() {
  const paletteWindow = document.getElementById('tileTesterPaletteWindow');
  const resizeHandle = document.getElementById('tileTesterResizeHandle');
  const sectionDivider = document.getElementById('tileTesterSectionDivider');
  const paletteContainer = document.getElementById('tileTesterPaletteContainer');
  const layersSection = document.getElementById('tileTesterLayersSection');

  if (!paletteWindow || !resizeHandle || !sectionDivider) return;

  // Bottom resize handle - resizes entire window height
  let isResizingWindow = false;
  let startHeight, startMouseY;

  resizeHandle.addEventListener('mousedown', function(e) {
    isResizingWindow = true;
    startHeight = paletteWindow.offsetHeight;
    startMouseY = e.clientY;
    e.preventDefault();
  });

  // Section divider - resizes palette vs layers
  let isResizingSection = false;
  let startPaletteHeight, startLayersHeight, dividerStartY;

  sectionDivider.addEventListener('mousedown', function(e) {
    isResizingSection = true;
    startPaletteHeight = paletteContainer.offsetHeight;
    startLayersHeight = layersSection.offsetHeight;
    dividerStartY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (isResizingWindow) {
      const dy = e.clientY - startMouseY;
      const newHeight = Math.max(200, Math.min(window.innerHeight * 0.9, startHeight + dy));
      paletteWindow.style.height = newHeight + 'px';
    }

    if (isResizingSection && paletteContainer && layersSection) {
      const dy = e.clientY - dividerStartY;
      const newPaletteHeight = Math.max(80, startPaletteHeight + dy);
      const newLayersHeight = Math.max(60, startLayersHeight - dy);

      // Use flex-basis for controlled sizing
      paletteContainer.style.flex = 'none';
      paletteContainer.style.height = newPaletteHeight + 'px';
      layersSection.style.height = newLayersHeight + 'px';
    }
  });

  document.addEventListener('mouseup', function() {
    isResizingWindow = false;
    isResizingSection = false;
  });
}
