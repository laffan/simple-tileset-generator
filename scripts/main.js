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


// Download link handling for tilesets
(function() {
  document.querySelectorAll('.tileset-download-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const format = this.dataset.format;
      const target = this.dataset.target;

      if (target === 'main') {
        if (format === 'svg') {
          downloadMainTilesetSVG();
        } else {
          downloadMainTilesetPNG();
        }
      } else if (target === 'combined') {
        if (format === 'svg') {
          downloadCombinedTilesSVG();
        } else {
          downloadCombinedTilesPNG();
        }
      }
    });
  });
})();

// Download main tileset only as PNG
function downloadMainTilesetPNG() {
  const mainCanvas = document.getElementById('canvas');
  const image = mainCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
  const link = document.createElement('a');
  link.download = 'tiles.png';
  link.href = image;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download main tileset only as SVG
function downloadMainTilesetSVG() {
  downloadTilesetSVG();
}

// Download combined tiles only as PNG
function downloadCombinedTilesPNG() {
  const customTiles = TileTesterState && TileTesterState.customTiles ? TileTesterState.customTiles : [];

  if (customTiles.length === 0) {
    return; // No combined tiles to download
  }

  const combinedCanvas = createCombinedTilesOnlyCanvas();
  const image = combinedCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
  const link = document.createElement('a');
  link.download = 'combined-tiles.png';
  link.href = image;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download combined tiles only as SVG
function downloadCombinedTilesSVG() {
  const customTiles = TileTesterState && TileTesterState.customTiles ? TileTesterState.customTiles : [];

  if (customTiles.length === 0) {
    return; // No combined tiles to download
  }

  const svg = generateCombinedTilesSVG();
  downloadSVG(svg, 'combined-tiles.svg');
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

// Create a canvas that contains only the combined tiles (not the main tileset)
function createCombinedTilesOnlyCanvas() {
  const mainCanvas = document.getElementById('canvas');
  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  const customTiles = TileTesterState.customTiles;

  if (!mainCanvas || customTiles.length === 0) {
    return null;
  }

  // Calculate total dimensions for combined tiles
  // Pack vertically first, then create new columns
  const mainHeight = mainCanvas.height;

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

  // Calculate total dimensions
  const totalWidth = customTileColumns.reduce((sum, col) => sum + col.width, 0);
  const totalHeight = Math.max(...customTileColumns.map(c => c.height));

  // Create canvas for combined tiles only
  const combinedCanvas = document.createElement('canvas');
  combinedCanvas.width = totalWidth;
  combinedCanvas.height = totalHeight;
  const ctx = combinedCanvas.getContext('2d');

  // Draw combined tiles
  let xOffset = 0;

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

// Generate SVG for combined tiles only
function generateCombinedTilesSVG() {
  const customTiles = TileTesterState && TileTesterState.customTiles ? TileTesterState.customTiles : [];
  if (customTiles.length === 0) return '';

  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  const mainCanvas = document.getElementById('canvas');
  const mainHeight = mainCanvas.height;

  // Calculate layout (same as createCombinedTilesOnlyCanvas)
  let customTileColumns = [];
  let currentColumn = [];
  let currentColumnHeight = 0;

  customTiles.forEach(ct => {
    const tileHeight = ct.height * tileSize;

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

  if (currentColumn.length > 0) {
    customTileColumns.push({
      tiles: currentColumn,
      height: currentColumnHeight,
      width: Math.max(...currentColumn.map(t => t.width)) * tileSize
    });
  }

  const totalWidth = customTileColumns.reduce((sum, col) => sum + col.width, 0);
  const totalHeight = Math.max(...customTileColumns.map(c => c.height));

  // Generate SVG content
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">\n`;

  // Get color palette
  const colorInput = document.getElementById('colorInput').value;
  const colors = colorInput.split(',').map(c => c.trim()).filter(c => c);

  let xOffset = 0;

  customTileColumns.forEach(column => {
    let yOffset = 0;

    column.tiles.forEach(customTile => {
      const sortedRefs = [...customTile.tileRefs].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

      sortedRefs.forEach(ref => {
        const coords = getTileCanvasCoords(ref);
        if (!coords) return;

        const destX = xOffset + ref.localX * tileSize;
        const destY = yOffset + ref.localY * tileSize;
        const colorIndex = coords.col;
        const color = colors[colorIndex] || '#000000';

        // Generate tile SVG at this position
        const tileSvg = generateTileSVGAtPosition(coords.row, color, tileSize, destX, destY);
        svgContent += tileSvg;
      });

      yOffset += customTile.height * tileSize;
    });

    xOffset += column.width;
  });

  svgContent += '</svg>';
  return svgContent;
}

// Generate SVG for a single tile at a specific position
function generateTileSVGAtPosition(row, color, size, x, y) {
  const selectedShapes = getSelectedShapes();
  const selectedPatterns = getSelectedPatterns();
  const selectedCombinations = getSelectedCombinations();

  // Find what type of content is at this row
  let currentRow = 0;

  // Check shapes
  for (let i = 0; i < selectedShapes.length; i++) {
    if (currentRow === row) {
      const shapeName = selectedShapes[i];
      const pathData = shapePathData[shapeName];
      if (pathData) {
        return generateShapeSVGAtOffset(pathData, color, size, x, y);
      }
    }
    currentRow++;
  }

  // Check patterns
  for (let i = 0; i < selectedPatterns.length; i++) {
    if (currentRow === row) {
      const patternName = selectedPatterns[i];
      const pixelData = patternPixelData[patternName];
      if (pixelData) {
        return generatePatternSVGAtOffset(pixelData, color, size, x, y);
      }
    }
    currentRow++;
  }

  // Check combinations
  for (let i = 0; i < selectedCombinations.length; i++) {
    const combId = selectedCombinations[i];
    const combData = customCombinationRegistry[combId];
    if (combData) {
      const combRows = combData.tileRows || 1;
      const combCols = combData.tileCols || 1;
      for (let tr = 0; tr < combRows; tr++) {
        for (let tc = 0; tc < combCols; tc++) {
          if (currentRow === row) {
            return generateCombinationTileSVGAtOffset(combData, tr, tc, color, size, x, y);
          }
          currentRow++;
        }
      }
    }
  }

  return '';
}

// Generate shape SVG at specific offset
function generateShapeSVGAtOffset(pathData, color, size, offsetX, offsetY) {
  let svg = '';
  const paths = pathData.paths || [pathData];

  paths.forEach((path, pathIndex) => {
    const isHole = pathData.holePathIndices && pathData.holePathIndices.includes(pathIndex);
    if (isHole) return; // Skip holes for now, handled separately

    let d = '';
    const vertices = path.vertices || [];

    vertices.forEach((v, i) => {
      const x = offsetX + v.x * size;
      const y = offsetY + v.y * size;

      if (i === 0) {
        d += `M ${x} ${y} `;
      } else {
        const prev = vertices[i - 1];
        if (prev.ctrlRight || v.ctrlLeft) {
          const cp1x = offsetX + (prev.x + (prev.ctrlRight ? prev.ctrlRight.x : 0)) * size;
          const cp1y = offsetY + (prev.y + (prev.ctrlRight ? prev.ctrlRight.y : 0)) * size;
          const cp2x = offsetX + (v.x + (v.ctrlLeft ? v.ctrlLeft.x : 0)) * size;
          const cp2y = offsetY + (v.y + (v.ctrlLeft ? v.ctrlLeft.y : 0)) * size;
          d += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y} `;
        } else {
          d += `L ${x} ${y} `;
        }
      }
    });

    if (path.closed && vertices.length > 0) {
      const first = vertices[0];
      const last = vertices[vertices.length - 1];
      if (last.ctrlRight || first.ctrlLeft) {
        const cp1x = offsetX + (last.x + (last.ctrlRight ? last.ctrlRight.x : 0)) * size;
        const cp1y = offsetY + (last.y + (last.ctrlRight ? last.ctrlRight.y : 0)) * size;
        const cp2x = offsetX + (first.x + (first.ctrlLeft ? first.ctrlLeft.x : 0)) * size;
        const cp2y = offsetY + (first.y + (first.ctrlLeft ? first.ctrlLeft.y : 0)) * size;
        const x = offsetX + first.x * size;
        const y = offsetY + first.y * size;
        d += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y} `;
      }
      d += 'Z';
    }

    svg += `<path d="${d}" fill="${color}" />\n`;
  });

  return svg;
}

// Generate pattern SVG at specific offset
function generatePatternSVGAtOffset(pixelData, color, size, offsetX, offsetY) {
  let svg = '';
  const patternSize = pixelData.size;
  const pixelSize = size / patternSize;

  for (let py = 0; py < patternSize; py++) {
    for (let px = 0; px < patternSize; px++) {
      if (pixelData.pixels[py] && pixelData.pixels[py][px]) {
        const x = offsetX + px * pixelSize;
        const y = offsetY + py * pixelSize;
        svg += `<rect x="${x}" y="${y}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />\n`;
      }
    }
  }

  return svg;
}

// Generate combination tile SVG at specific offset
function generateCombinationTileSVGAtOffset(combData, tileRow, tileCol, color, size, offsetX, offsetY) {
  let svg = '';
  const combWidth = combData.tileCols * size;
  const combHeight = combData.tileRows * size;
  const shapeData = combData.shapeData;

  if (!shapeData) return svg;

  // Create clipping path for this tile
  const clipId = `clip-${Date.now()}-${tileRow}-${tileCol}`;
  svg += `<defs><clipPath id="${clipId}"><rect x="${offsetX}" y="${offsetY}" width="${size}" height="${size}" /></clipPath></defs>\n`;
  svg += `<g clip-path="url(#${clipId})">\n`;

  const paths = shapeData.paths || [shapeData];
  paths.forEach((path, pathIndex) => {
    const isHole = shapeData.holePathIndices && shapeData.holePathIndices.includes(pathIndex);
    if (isHole) return;

    let d = '';
    const vertices = path.vertices || [];

    vertices.forEach((v, i) => {
      // Map from 0-1 coordinates to combination size, then offset for tile position
      const x = offsetX + (v.x * combWidth) - (tileCol * size);
      const y = offsetY + (v.y * combHeight) - (tileRow * size);

      if (i === 0) {
        d += `M ${x} ${y} `;
      } else {
        const prev = vertices[i - 1];
        if (prev.ctrlRight || v.ctrlLeft) {
          const cp1x = offsetX + ((prev.x + (prev.ctrlRight ? prev.ctrlRight.x : 0)) * combWidth) - (tileCol * size);
          const cp1y = offsetY + ((prev.y + (prev.ctrlRight ? prev.ctrlRight.y : 0)) * combHeight) - (tileRow * size);
          const cp2x = offsetX + ((v.x + (v.ctrlLeft ? v.ctrlLeft.x : 0)) * combWidth) - (tileCol * size);
          const cp2y = offsetY + ((v.y + (v.ctrlLeft ? v.ctrlLeft.y : 0)) * combHeight) - (tileRow * size);
          d += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y} `;
        } else {
          d += `L ${x} ${y} `;
        }
      }
    });

    if (path.closed && vertices.length > 0) {
      const first = vertices[0];
      const last = vertices[vertices.length - 1];
      if (last.ctrlRight || first.ctrlLeft) {
        const cp1x = offsetX + ((last.x + (last.ctrlRight ? last.ctrlRight.x : 0)) * combWidth) - (tileCol * size);
        const cp1y = offsetY + ((last.y + (last.ctrlRight ? last.ctrlRight.y : 0)) * combHeight) - (tileRow * size);
        const cp2x = offsetX + ((first.x + (first.ctrlLeft ? first.ctrlLeft.x : 0)) * combWidth) - (tileCol * size);
        const cp2y = offsetY + ((first.y + (first.ctrlLeft ? first.ctrlLeft.y : 0)) * combHeight) - (tileRow * size);
        const x = offsetX + (first.x * combWidth) - (tileCol * size);
        const y = offsetY + (first.y * combHeight) - (tileRow * size);
        d += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y} `;
      }
      d += 'Z';
    }

    svg += `<path d="${d}" fill="${color}" />\n`;
  });

  svg += '</g>\n';
  return svg;
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

  const defaultColors = document.getElementById('colorInput').value.split(',')
    .map(color => color.trim())
    .filter(color => color);
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
