/* Main application - initialization and event listeners */

function generateTileset() {
  const colorInput = document.getElementById('colorInput').value;
  const sizeInput = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  // Split by comma, then filter out empty strings and strings that only contain whitespace
  const colors = colorInput.split(',')
    .map(color => color.trim()) // Remove whitespace from both ends of each color string
    .filter(color => color); // Filter out empty strings after trim
  drawShapes(colors, sizeInput);
}


// Add event listeners to the "all" and "none" links for shapes
document.getElementById('selectAllShapes').addEventListener('click', selectAllShapes);
document.getElementById('deselectAllShapes').addEventListener('click', deselectAllShapes);

// Add event listeners to the "all" and "none" links for patterns
document.getElementById('selectAllPatterns').addEventListener('click', selectAllPatterns);
document.getElementById('deselectAllPatterns').addEventListener('click', deselectAllPatterns);

// Add event listeners to the "all" and "none" links for combinations
document.getElementById('selectAllCombinations').addEventListener('click', selectAllCombinations);
document.getElementById('deselectAllCombinations').addEventListener('click', deselectAllCombinations);


// Download dropdown handling for main tileset
(function() {
  const dropdown = document.getElementById('tilesetDownloadDropdown');
  const downloadBtn = document.getElementById('downloadBtn');

  if (!dropdown || !downloadBtn) return;

  // Toggle dropdown on button click
  downloadBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  // Handle download option selection
  dropdown.querySelectorAll('.download-option').forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const format = this.dataset.format;
      dropdown.classList.remove('active');

      if (format === 'svg') {
        downloadTilesetSVG();
      } else {
        downloadTilesetPNG();
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
})();

// Download tileset as PNG
function downloadTilesetPNG() {
  // Check if there are custom tiles to include
  const customTiles = TileTesterState && TileTesterState.customTiles ? TileTesterState.customTiles : [];

  if (customTiles.length === 0) {
    // No custom tiles, just download the main canvas
    const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const link = document.createElement('a');
    link.download = 'tileset.png';
    link.href = image;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Create a combined canvas with custom tiles appended
  const combinedCanvas = createCombinedTilesetCanvas();
  const image = combinedCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
  const link = document.createElement('a');
  link.download = 'tileset.png';
  link.href = image;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Create a combined canvas that includes both main tileset and custom tiles
function createCombinedTilesetCanvas() {
  const mainCanvas = document.getElementById('canvas');
  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  const customTiles = TileTesterState.customTiles;

  if (!mainCanvas || customTiles.length === 0) {
    return mainCanvas;
  }

  // Calculate the space needed for custom tiles
  // Pack vertically first, then create new columns
  const mainHeight = mainCanvas.height;
  const mainWidth = mainCanvas.width;

  // Calculate total width needed for custom tiles
  // Each custom tile has a width and height in tile units
  let customTileColumns = [];
  let currentColumn = [];
  let currentColumnHeight = 0;

  customTiles.forEach(ct => {
    const tileHeight = ct.height * tileSize;

    // If adding this tile would exceed main height, start new column
    if (currentColumnHeight + tileHeight > mainHeight && currentColumn.length > 0) {
      customTileColumns.push({
        tiles: currentColumn,
        height: currentColumnHeight,
        width: Math.max(...currentColumn.map(t => t.width)) * tileSize
      });
      currentColumn = [];
      currentColumnHeight = 0;
    }

    currentColumn.push(ct);
    currentColumnHeight += tileHeight;
  });

  // Push the last column
  if (currentColumn.length > 0) {
    customTileColumns.push({
      tiles: currentColumn,
      height: currentColumnHeight,
      width: Math.max(...currentColumn.map(t => t.width)) * tileSize
    });
  }

  // Calculate total custom tiles width
  const customTilesWidth = customTileColumns.reduce((sum, col) => sum + col.width, 0);

  // Create combined canvas
  const combinedCanvas = document.createElement('canvas');
  combinedCanvas.width = mainWidth + customTilesWidth;
  combinedCanvas.height = Math.max(mainHeight, ...customTileColumns.map(c => c.height));
  const ctx = combinedCanvas.getContext('2d');

  // Draw main tileset
  ctx.drawImage(mainCanvas, 0, 0);

  // Draw custom tiles
  let xOffset = mainWidth;

  customTileColumns.forEach(column => {
    let yOffset = 0;

    column.tiles.forEach(customTile => {
      // Sort refs by layer index to draw in correct order
      const sortedRefs = [...customTile.tileRefs].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

      // Draw each tile reference from the main canvas
      sortedRefs.forEach(ref => {
        // Get canvas coordinates - handles both semantic refs and old-style {row, col}
        const coords = getTileCanvasCoords(ref);
        if (!coords) return;

        const srcX = coords.col * tileSize;
        const srcY = coords.row * tileSize;
        const destX = xOffset + ref.localX * tileSize;
        const destY = yOffset + ref.localY * tileSize;

        ctx.drawImage(
          mainCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );
      });

      yOffset += customTile.height * tileSize;
    });

    xOffset += column.width;
  });

  return combinedCanvas;
}


// Initial update on page load
window.onload = function () {
  // Initialize shape order before creating HTML
  initializeShapeOrder();
  createShapeSelectionHTML();

  // Initialize pattern order before creating HTML
  initializePatternOrder();
  createPatternSelectionHTML();

  // Initialize combination order before creating HTML
  initializeCombinationOrder();
  createCombinationSelectionHTML();

  const defaultColors = document.getElementById('colorInput').value.split(',');
  const defaultSize = parseInt(document.getElementById('sizeInput').value, 10);

  // Draw initial shapes and generate initial palette
  drawShapes(defaultColors, defaultSize);
  generateColorPalette();

  // Shape listeners and previews
  addShapeCheckboxesListeners();
  addShapePreviews();
  addShapeButtonListeners();
  setupDragAndDrop();

  // Pattern listeners and previews
  addPatternCheckboxesListeners();
  addPatternPreviews();
  addPatternButtonListeners();
  setupPatternDragAndDrop();

  // Combination listeners and previews
  addCombinationCheckboxesListeners();
  addCombinationPreviews();
  addCombinationButtonListeners();
  setupCombinationDragAndDrop();

  // Update colors preview initially
  updateColorsPreview();
  sanitizeColorInput();

  // Initialize shape editor buttons
  setupEditorButtons();

  // Initialize pattern editor buttons
  setupPatternEditorButtons();

  // Initialize shape toolbar
  setupShapeToolbar();

  // Initialize combination editor buttons
  if (typeof setupCombinationEditorButtons === 'function') {
    setupCombinationEditorButtons();
  }

  // Initialize tile size controls and custom size modals
  setupTileSizeControls();
  setupCustomSizeModal();
  setupPatternSizeButtons();
  setupCustomPatternSizeModal();

  // Initialize color wheel (with safeguard)
  if (typeof initColorWheel === 'function') {
    initColorWheel();
  }

  // Initialize tile tester
  if (typeof initTileTester === 'function') {
    initTileTester();
  }
};


// Monitor changes in the color input textarea and update preview accordingly
document.getElementById('colorInput').addEventListener('input', () => {
  updateColorsPreview();
  generateTileset();
});

// Note: sizeInput is now controlled by tile size buttons in sizeControls.js

// Fit preview checkbox
document.getElementById('fitPreview').addEventListener('change', function() {
  const previewBox = document.getElementById('previewBox');
  if (this.checked) {
    previewBox.classList.add('fit-mode');
  } else {
    previewBox.classList.remove('fit-mode');
  }
});

// Render custom tiles from tile tester in the main preview section
function renderCustomTilesPreview() {
  const section = document.getElementById('customTilesPreviewSection');
  const container = document.getElementById('customTilesPreviewContainer');

  if (!section || !container) return;

  const customTiles = TileTesterState && TileTesterState.customTiles ? TileTesterState.customTiles : [];

  if (customTiles.length === 0) {
    section.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  // Show the section
  section.style.display = 'block';

  // Clear container
  container.innerHTML = '';

  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  const sourceCanvas = document.getElementById('canvas');

  // Render each custom tile
  customTiles.forEach((customTile) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-tile-preview-item';

    // Create canvas for preview
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = customTile.width * tileSize;
    previewCanvas.height = customTile.height * tileSize;
    const previewCtx = previewCanvas.getContext('2d');

    // Fill with checkerboard for transparency indication
    drawPreviewCheckerboard(previewCtx, previewCanvas.width, previewCanvas.height);

    // Draw the tile references
    if (sourceCanvas) {
      // Sort by layer index to draw in correct order (bottom to top)
      const sortedRefs = [...customTile.tileRefs].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

      sortedRefs.forEach(ref => {
        // Get canvas coordinates - handles both semantic refs and old-style {row, col}
        const coords = typeof getTileCanvasCoords === 'function' ? getTileCanvasCoords(ref) : null;
        if (!coords) {
          // Fallback for old-style refs
          if (ref.row !== undefined && ref.col !== undefined) {
            const srcX = ref.col * tileSize;
            const srcY = ref.row * tileSize;
            const destX = ref.localX * tileSize;
            const destY = ref.localY * tileSize;

            previewCtx.drawImage(
              sourceCanvas,
              srcX, srcY, tileSize, tileSize,
              destX, destY, tileSize, tileSize
            );
          }
          return;
        }

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

    // Scale down preview for display (max 80px)
    const maxPreviewSize = 80;
    const scale = Math.min(maxPreviewSize / previewCanvas.width, maxPreviewSize / previewCanvas.height, 1);

    previewCanvas.style.width = (previewCanvas.width * scale) + 'px';
    previewCanvas.style.height = (previewCanvas.height * scale) + 'px';

    wrapper.appendChild(previewCanvas);
    container.appendChild(wrapper);
  });
}

// Draw checkerboard pattern for transparency indication in preview
function drawPreviewCheckerboard(ctx, width, height) {
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


// Initial palette generation (will be overwritten by window.onload)
generateColorPalette();
