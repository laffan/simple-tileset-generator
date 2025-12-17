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


// Function to trigger download
document.getElementById('downloadBtn').onclick = function () {
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
};

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
  const complexitySlider = document.getElementById('paletteComplexity');

  // Function to invert slider value (so right = more colors)
  // Slider range is 14-128, where lower step = more colors
  function getInvertedComplexity(slider) {
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const value = parseInt(slider.value);
    return max - value + min; // Invert: left=128 (few), right=14 (many)
  }

  // Draw initial shapes and generate initial palette
  drawShapes(defaultColors, defaultSize);
  generateColorPalette(getInvertedComplexity(complexitySlider));

  // Function to update slider fill
  function updateSliderFill(slider) {
    const min = slider.min || 0;
    const max = slider.max || 100;
    const value = slider.value;
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.setProperty('--slider-fill', percentage + '%');
  }

  // Initialize slider fill
  updateSliderFill(complexitySlider);

  // Add listener to the complexity slider to regenerate palette on change
  complexitySlider.addEventListener('input', function () {
    generateColorPalette(getInvertedComplexity(this));
    updateSliderFill(this);
  });

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


// Initial palette generation (will be overwritten by window.onload)
generateColorPalette(40);
