/* Tile Tester Modal Manager - Open/close modal and initialization */

// Open the tile tester modal
function openTileTester() {
  const modal = document.getElementById('tileTesterModal');

  if (!modal) return;

  // Get current tile size
  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  TileTesterState.tileSize = tileSize;

  // Calculate grid size based on window
  calculateGridSize();

  // Initialize layers if empty
  if (!TileTesterState.layers || TileTesterState.layers.length === 0) {
    initTileTesterLayers();
  } else {
    // Ensure existing layers have proper grid size
    ensureLayerGridSize();
  }

  // Show modal
  modal.classList.add('active');

  // Prevent body scroll while modal is open
  document.body.style.overflow = 'hidden';

  // Setup components
  setupTileTesterPalette();
  setupTileTesterMainCanvas();
  setupLayersPanel();
  setupTileTesterEvents();

  // Reset palette window position
  const paletteWindow = document.getElementById('tileTesterPaletteWindow');
  if (paletteWindow) {
    paletteWindow.style.left = '20px';
    paletteWindow.style.top = '20px';
  }
}

// Ensure all layers have the correct grid size
function ensureLayerGridSize() {
  for (const layer of TileTesterState.layers) {
    // Expand grid if needed
    while (layer.tiles.length < TileTesterState.gridHeight) {
      layer.tiles.push([]);
    }
    for (let y = 0; y < TileTesterState.gridHeight; y++) {
      if (!layer.tiles[y]) {
        layer.tiles[y] = [];
      }
      while (layer.tiles[y].length < TileTesterState.gridWidth) {
        layer.tiles[y].push(null);
      }
    }
  }
}

// Close the tile tester modal
function closeTileTester() {
  const modal = document.getElementById('tileTesterModal');

  if (!modal) return;

  // Hide modal
  modal.classList.remove('active');

  // Restore body scroll
  document.body.style.overflow = '';

  // Clean up
  removeTileTesterEvents();
  resetTileTesterState();
}

// Setup the test button
function setupTileTesterButton() {
  const testBtn = document.getElementById('testTilesetBtn');

  if (testBtn) {
    testBtn.addEventListener('click', openTileTester);
  }
}

// Initialize tile tester (called on page load)
function initTileTester() {
  setupTileTesterButton();

  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('tileTesterModal');
      if (modal && modal.classList.contains('active')) {
        closeTileTester();
      }
    }
  });

  // Close when clicking outside the content area (on the dark overlay)
  const modal = document.getElementById('tileTesterModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      // Only close if clicking directly on the modal backdrop
      if (e.target === modal) {
        closeTileTester();
      }
    });
  }
}
