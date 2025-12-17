/* Combination Editor Palette - displays available shapes and patterns */

// Render the shape palette (for Edit Shape tab)
function renderCombinationShapePalette() {
  const container = document.getElementById('combinationShapePalette');
  if (!container) return;

  container.innerHTML = '';

  // Add all shapes from shapeOrder
  shapeOrder.forEach((shape, index) => {
    const item = createPaletteShapeItem(shape, index);
    container.appendChild(item);
  });
}

// Create a palette shape item
function createPaletteShapeItem(shapeName, index) {
  const item = document.createElement('div');
  item.className = 'combination-palette-item';
  item.dataset.shape = shapeName;
  item.dataset.index = index;
  item.draggable = true;
  item.title = shapeName;

  // Create preview canvas
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 32;
  previewCanvas.height = 32;
  const previewCtx = previewCanvas.getContext('2d');
  previewCtx.fillStyle = '#333333';
  drawShape(0, 0, 32, previewCtx, shapeName);

  item.appendChild(previewCanvas);

  // Drag start handler
  item.addEventListener('dragstart', function(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'shape',
      name: shapeName
    }));
    e.dataTransfer.effectAllowed = 'copy';
    item.classList.add('dragging');
  });

  item.addEventListener('dragend', function() {
    item.classList.remove('dragging');
  });

  // Click handler to apply to selected cell
  item.addEventListener('click', function() {
    const state = CombinationEditorState;
    const { x, y } = state.selectedCell;
    const cell = getCombinationCell(x, y);

    if (cell && cell.enabled) {
      setCombinationCellShape(x, y, shapeName);
      renderCombinationEditor();
    }
  });

  return item;
}

// Render the pattern palette (for Edit Pattern tab)
function renderCombinationPatternPalette() {
  const container = document.getElementById('combinationPatternPalette');
  if (!container) return;

  container.innerHTML = '';

  // Add "None" option first
  const noneItem = createPalettePatternItem(null, -1, 'None');
  container.appendChild(noneItem);

  // Add all patterns from patternOrder
  patternOrder.forEach((pattern, index) => {
    const item = createPalettePatternItem(pattern, index);
    container.appendChild(item);
  });
}

// Create a palette pattern item
function createPalettePatternItem(patternName, index, displayName) {
  const item = document.createElement('div');
  item.className = 'combination-palette-item';
  item.dataset.pattern = patternName || '';
  item.dataset.index = index;
  item.title = displayName || patternName || 'None';

  // Check if this pattern is selected for the current cell
  const state = CombinationEditorState;
  const { x, y } = state.selectedCell;
  const cell = getCombinationCell(x, y);
  if (cell) {
    const currentPattern = cell.pattern;
    if ((patternName === null && currentPattern === null) ||
        (patternName !== null && currentPattern === patternName)) {
      item.classList.add('selected');
    }
  }

  // Create preview canvas
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 32;
  previewCanvas.height = 32;
  const previewCtx = previewCanvas.getContext('2d');

  if (patternName) {
    previewCtx.fillStyle = '#333333';
    drawPattern(0, 0, 32, previewCtx, patternName);
  } else {
    // Draw "X" for none
    previewCtx.strokeStyle = '#999999';
    previewCtx.lineWidth = 2;
    previewCtx.beginPath();
    previewCtx.moveTo(4, 4);
    previewCtx.lineTo(28, 28);
    previewCtx.moveTo(28, 4);
    previewCtx.lineTo(4, 28);
    previewCtx.stroke();
  }

  item.appendChild(previewCanvas);

  // Click handler to apply pattern to selected cell
  item.addEventListener('click', function() {
    const state = CombinationEditorState;
    const { x, y } = state.selectedCell;
    const cell = getCombinationCell(x, y);

    if (cell && cell.enabled) {
      setCombinationCellPattern(x, y, patternName);
      renderCombinationPatternPalette(); // Update selection
      renderCombinationEditor();
    }
  });

  return item;
}

// Render the appropriate palette based on active tab
function renderCombinationPalette() {
  const state = CombinationEditorState;

  const shapePaletteContainer = document.getElementById('combinationShapePalette');
  const patternPaletteContainer = document.getElementById('combinationPatternPalette');

  if (state.activeTab === 'shape') {
    if (shapePaletteContainer) shapePaletteContainer.style.display = 'flex';
    if (patternPaletteContainer) patternPaletteContainer.style.display = 'none';
    renderCombinationShapePalette();
  } else {
    if (shapePaletteContainer) shapePaletteContainer.style.display = 'none';
    if (patternPaletteContainer) patternPaletteContainer.style.display = 'flex';
    renderCombinationPatternPalette();
  }
}

// Setup palette event handlers
function setupCombinationPalette() {
  renderCombinationPalette();
}
