/* Tile Tester Modal Manager - Open/close modal and initialization */

// Store resize handler reference
var tileTesterResizeHandler = null;

// Open the tile tester modal
function openTileTester() {
  const modal = document.getElementById('tileTesterModal');

  if (!modal) return;

  // Get current tile size
  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  TileTesterState.tileSize = tileSize;

  // Initialize layers if empty
  if (!TileTesterState.layers || TileTesterState.layers.length === 0) {
    initTileTesterLayers();
  }

  // Calculate grid size based on window and existing tiles
  calculateGridSize();

  // Check if we have a saved pan position (non-zero means user has panned)
  const hasSavedPanPosition = TileTesterState.canvasPan.x !== 0 || TileTesterState.canvasPan.y !== 0;

  // Show modal
  modal.classList.add('active');

  // Prevent body scroll while modal is open
  document.body.style.overflow = 'hidden';

  // Setup components
  setupTileTesterPalette();
  setupTileTesterMainCanvas();
  setupLayersPanel();
  setupTileTesterEvents();

  // Set container background to match canvas background for seamless panning
  const container = document.querySelector('.tester-canvas-container');
  if (container) {
    container.style.backgroundColor = TileTesterState.backgroundColor;
  }

  // Only center view on tiles if we don't have a saved pan position
  // This preserves the user's zoom/pan when reopening the modal
  if (!hasSavedPanPosition) {
    centerViewOnTiles();
  }
  updateCanvasTransform();

  // Initialize custom tiles functionality
  if (typeof initCustomTiles === 'function') {
    initCustomTiles();
  }

  // Render custom tiles in palette
  if (typeof renderCustomTilesInPalette === 'function') {
    renderCustomTilesInPalette();
  }

  // Reset palette window position
  const paletteWindow = document.getElementById('tileTesterPaletteWindow');
  if (paletteWindow) {
    paletteWindow.style.left = '0px';
    paletteWindow.style.top = '0px';
  }

  // Reset hide button state
  const hideBtn = document.getElementById('tileTesterHideBtn');
  if (hideBtn) {
    hideBtn.textContent = 'Hide';
  }
  if (paletteWindow) {
    paletteWindow.classList.remove('content-hidden');
  }

  // Reset section fold states
  const sections = document.querySelectorAll('.tester-sidebar-section');
  sections.forEach(section => {
    section.classList.remove('collapsed');
    const foldBtn = section.querySelector('.tester-section-fold');
    if (foldBtn) {
      foldBtn.title = 'Collapse section';
    }
  });

  // Setup window resize handler
  tileTesterResizeHandler = function() {
    // Recalculate minimum grid size based on window, but don't shrink existing grid
    const oldWidth = TileTesterState.gridWidth;
    const oldHeight = TileTesterState.gridHeight;
    calculateGridSize();
    // Ensure we don't lose tiles by shrinking the grid
    TileTesterState.gridWidth = Math.max(TileTesterState.gridWidth, oldWidth);
    TileTesterState.gridHeight = Math.max(TileTesterState.gridHeight, oldHeight);
    renderTileTesterMainCanvas();
    updateCanvasTransform();
  };
  window.addEventListener('resize', tileTesterResizeHandler);
}

// Close the tile tester modal
function closeTileTester() {
  const modal = document.getElementById('tileTesterModal');

  if (!modal) return;

  // Hide modal
  modal.classList.remove('active');

  // Restore body scroll
  document.body.style.overflow = '';

  // Remove resize handler
  if (tileTesterResizeHandler) {
    window.removeEventListener('resize', tileTesterResizeHandler);
    tileTesterResizeHandler = null;
  }

  // Clean up
  removeTileTesterEvents();
  resetTileTesterState();

  // Update custom tiles preview in main window
  if (typeof renderCustomTilesPreview === 'function') {
    renderCustomTilesPreview();
  }
}

// Setup the test button
function setupTileTesterButton() {
  const testBtn = document.getElementById('testTilesetBtn');

  if (testBtn) {
    testBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openTileTester();
    });
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
