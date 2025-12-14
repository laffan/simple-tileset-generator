/* Tile Tester Modal Manager - Open/close modal and initialization */

// Open the tile tester modal
function openTileTester() {
  const modal = document.getElementById('tileTesterModal');

  if (!modal) return;

  // Get current tile size
  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  TileTesterState.tileSize = tileSize;

  // Show modal
  modal.classList.add('active');

  // Prevent body scroll while modal is open
  document.body.style.overflow = 'hidden';

  // Setup components
  setupTileTesterPalette();
  setupTileTesterMainCanvas();
  setupTileTesterEvents();

  // Reset palette window position
  const paletteWindow = document.getElementById('tileTesterPaletteWindow');
  if (paletteWindow) {
    paletteWindow.style.left = '20px';
    paletteWindow.style.top = '20px';
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

  // Initialize grid with default size
  if (!TileTesterState.tiles || TileTesterState.tiles.length === 0) {
    initTileTesterGrid();
  }

  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('tileTesterModal');
      if (modal && modal.classList.contains('active')) {
        closeTileTester();
      }
    }
  });

  // Close when clicking outside the content area
  const modal = document.getElementById('tileTesterModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeTileTester();
      }
    });
  }
}
