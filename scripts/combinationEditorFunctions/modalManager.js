/* Combination Editor Modal Manager
 * Uses the shared EditorState with mode='combination' to reuse shape editor functionality
 */

// Open the combination editor
function openCombinationEditor(combinationIndex) {
  // Set editor mode to combination
  EditorState.editorMode = 'combination';
  EditorState.combinationIndex = combinationIndex;

  // Reset shared editor state
  resetEditorState();

  // Get combination data
  const combinationName = combinationOrder[combinationIndex];
  const combinationData = getCombinationData(combinationName);

  if (!combinationData) {
    console.error('Combination data not found:', combinationName);
    EditorState.editorMode = 'shape';
    return;
  }

  // Store combination-specific state in EditorState
  EditorState.combinationTileRows = combinationData.tileRows || 2;
  EditorState.combinationTileCols = combinationData.tileCols || 2;
  EditorState.combinationPatternData = combinationData.patternData || null;

  // Also update CombinationEditorState for pattern tab
  CombinationEditorState.currentEditingCombinationIndex = combinationIndex;
  CombinationEditorState.combinationData = copyCombinationData(combinationData);
  CombinationEditorState.activeTab = 'shape';
  CombinationEditorState.tileRows = EditorState.combinationTileRows;
  CombinationEditorState.tileCols = EditorState.combinationTileCols;

  // Show modal
  const modal = document.getElementById('combinationEditorModal');
  if (modal) {
    modal.classList.add('active');
  }

  // Update tile size inputs
  const rowsInput = document.getElementById('combinationTileRows');
  const colsInput = document.getElementById('combinationTileCols');
  if (rowsInput) rowsInput.value = EditorState.combinationTileRows;
  if (colsInput) colsInput.value = EditorState.combinationTileCols;

  // Initialize Two.js in the combination shape editor canvas
  initCombinationTwoEditor();

  // Draw editor grid (uses shared drawEditorGrid from shape editor)
  drawEditorGrid();

  // Draw tile division overlay
  drawCombinationTileGridOverlay();

  // Load shape data if exists
  if (combinationData.shapeData) {
    loadCombinationShapeData(combinationData.shapeData);
  } else {
    // Create default shape (square)
    createDefaultCombinationShape();
  }

  // Setup event handlers (shared with shape editor)
  setupEditorEvents();

  // Initialize pattern editor
  initCombinationPatternEditor();

  // Load pattern data if exists
  if (combinationData.patternData) {
    loadCombPatternData(combinationData.patternData);
  } else {
    createEmptyCombPattern();
  }

  // Initialize preview
  initCombinationPreviewCanvas();
  updateCombinationPreview();

  // Setup combination-specific UI events
  setupCombinationEditorUI();

  // Build shape palette
  buildCombinationShapePalette();

  // Ensure shape tab is active
  switchCombinationEditorTab('shape');
}

// Initialize Two.js in the combination editor canvas
function initCombinationTwoEditor() {
  const container = document.getElementById('combinationShapeEditorCanvas');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Create Two.js instance in shared EditorState
  EditorState.two = new Two({
    width: EDITOR_SIZE,
    height: EDITOR_SIZE,
    type: Two.Types.svg
  }).appendTo(container);
}

// Load shape data into the editor (uses shared EditorState like shape editor)
function loadCombinationShapeData(shapeData) {
  if (!EditorState.two) return;

  // Clear existing paths
  EditorState.paths = [];
  EditorState.currentPathIndex = 0;
  EditorState.fillRule = shapeData.fillRule || null;
  EditorState.holePathIndices = [];

  // Handle both simple array format [[x,y], ...] and complex object format
  let pathsData;
  if (shapeData.paths && Array.isArray(shapeData.paths)) {
    pathsData = shapeData.paths;
  } else if (Array.isArray(shapeData) && shapeData.length > 0 && Array.isArray(shapeData[0])) {
    // Simple array of points format [[x,y], [x,y], ...]
    pathsData = [{ vertices: shapeData.map(p => ({ x: p[0] + 0.5, y: p[1] + 0.5 })), closed: true }];
  } else if (shapeData.vertices) {
    pathsData = [shapeData];
  } else {
    console.warn('Unknown shape data format:', shapeData);
    createDefaultCombinationShape();
    return;
  }

  // Load hole indices if present
  if (shapeData.holePathIndices) {
    EditorState.holePathIndices = [...shapeData.holePathIndices];
  }

  pathsData.forEach((singlePathData, index) => {
    const isSelected = index === EditorState.currentPathIndex;
    const isHole = EditorState.holePathIndices.includes(index);

    // Convert from normalized format if needed
    let vertices;
    if (singlePathData.vertices) {
      vertices = singlePathData.vertices;
    } else if (Array.isArray(singlePathData)) {
      // Array of [x, y] points (normalized -0.5 to 0.5)
      vertices = singlePathData.map(p => ({ x: p[0] + 0.5, y: p[1] + 0.5 }));
    } else {
      return;
    }

    const anchors = vertices.map((v, i) => {
      // Convert from normalized (0-1) to editor coordinates
      const x = normalizedToEditor(v.x);
      const y = normalizedToEditor(v.y);

      let ctrlLeftX = 0, ctrlLeftY = 0, ctrlRightX = 0, ctrlRightY = 0;
      if (v.ctrlLeft) {
        ctrlLeftX = normalizedControlToEditor(v.ctrlLeft.x);
        ctrlLeftY = normalizedControlToEditor(v.ctrlLeft.y);
      }
      if (v.ctrlRight) {
        ctrlRightX = normalizedControlToEditor(v.ctrlRight.x);
        ctrlRightY = normalizedControlToEditor(v.ctrlRight.y);
      }

      const command = i === 0 ? Two.Commands.move : Two.Commands.line;
      return new Two.Anchor(x, y, ctrlLeftX, ctrlLeftY, ctrlRightX, ctrlRightY, command);
    });

    const path = new Two.Path(anchors);
    path.automatic = false;

    if (isHole) {
      path.fill = isSelected ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 100, 100, 0.15)';
      path.stroke = isSelected ? '#cc0000' : '#ff6666';
    } else {
      path.fill = isSelected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)';
      path.stroke = isSelected ? '#333' : '#666';
    }
    path.linewidth = 2;
    path.closed = singlePathData.closed !== false;

    EditorState.paths.push(path);
    EditorState.two.add(path);
  });

  // Create anchor visuals (shared function)
  createAnchorVisuals();

  EditorState.two.update();
}

// Create default shape (square filling the shape area)
function createDefaultCombinationShape() {
  if (!EditorState.two) return;

  const halfSize = EDITOR_SHAPE_SIZE / 2;
  const centerX = EDITOR_SIZE / 2;
  const centerY = EDITOR_SIZE / 2;

  const anchors = [
    new Two.Anchor(centerX - halfSize, centerY - halfSize, 0, 0, 0, 0, Two.Commands.move),
    new Two.Anchor(centerX + halfSize, centerY - halfSize, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(centerX + halfSize, centerY + halfSize, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(centerX - halfSize, centerY + halfSize, 0, 0, 0, 0, Two.Commands.line)
  ];

  const path = new Two.Path(anchors);
  path.automatic = false;
  path.fill = 'rgba(0, 0, 0, 0.8)';
  path.stroke = '#333';
  path.linewidth = 2;
  path.closed = true;

  EditorState.paths = [path];
  EditorState.currentPathIndex = 0;
  EditorState.two.add(path);

  createAnchorVisuals();
  EditorState.two.update();
}

// Get shape data from editor (converts to normalized format for saving)
function getCombinationShapeData() {
  if (!EditorState.paths || EditorState.paths.length === 0) return null;

  const shouldCrop = isCropEnabled();

  if (EditorState.paths.length === 1) {
    const pathData = pathToNormalizedData(EditorState.paths[0]);
    // Convert to simple array format [x - 0.5, y - 0.5] for combination storage
    let points = pathData.vertices.map(v => [v.x - 0.5, v.y - 0.5]);
    if (shouldCrop) {
      points = clipPathDataToBounds(points);
    }
    return points;
  } else {
    // Multi-path
    let paths = EditorState.paths.map(path => {
      const pd = pathToNormalizedData(path);
      return pd.vertices.map(v => [v.x - 0.5, v.y - 0.5]);
    });
    if (shouldCrop) {
      paths = paths.map(p => clipPathDataToBounds(p));
    }
    const result = { paths };
    if (EditorState.fillRule) {
      result.fillRule = EditorState.fillRule;
    }
    if (EditorState.holePathIndices && EditorState.holePathIndices.length > 0) {
      result.holePathIndices = [...EditorState.holePathIndices];
    }
    return result;
  }
}

// Draw red tile grid overlay showing divisions
function drawCombinationTileGridOverlay() {
  const container = document.getElementById('combinationShapeEditorCanvas');
  if (!container) return;

  // Remove old overlay
  const oldOverlay = container.querySelector('.comb-tile-overlay');
  if (oldOverlay) {
    oldOverlay.remove();
  }

  const rows = EditorState.combinationTileRows;
  const cols = EditorState.combinationTileCols;

  if (rows <= 1 && cols <= 1) return; // No divisions needed

  // Create SVG overlay
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('comb-tile-overlay');
  svg.setAttribute('width', EDITOR_SIZE);
  svg.setAttribute('height', EDITOR_SIZE);
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'none';

  const tileWidth = EDITOR_SHAPE_SIZE / cols;
  const tileHeight = EDITOR_SHAPE_SIZE / rows;
  const startX = EDITOR_MARGIN;
  const startY = EDITOR_MARGIN;

  // Draw vertical division lines
  for (let i = 1; i < cols; i++) {
    const x = startX + i * tileWidth;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', x);
    line.setAttribute('y2', startY + EDITOR_SHAPE_SIZE);
    line.setAttribute('stroke', '#dc3545');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6,4');
    svg.appendChild(line);
  }

  // Draw horizontal division lines
  for (let i = 1; i < rows; i++) {
    const y = startY + i * tileHeight;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', y);
    line.setAttribute('x2', startX + EDITOR_SHAPE_SIZE);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#dc3545');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6,4');
    svg.appendChild(line);
  }

  container.appendChild(svg);
}

// Close the combination editor
function closeCombinationEditor() {
  const modal = document.getElementById('combinationEditorModal');
  if (modal) {
    modal.classList.remove('active');
  }

  // Cleanup Two.js from shared state
  if (EditorState.two) {
    EditorState.two.clear();
    EditorState.two = null;
  }

  // Reset mode back to shape
  EditorState.editorMode = 'shape';
  EditorState.combinationIndex = null;

  // Reset combination state
  resetCombinationEditorState();
}

// Save the edited combination
function saveCombinationEditor() {
  const combinationIndex = EditorState.combinationIndex;

  if (combinationIndex === null) {
    closeCombinationEditor();
    return;
  }

  // Get shape data from editor
  const shapeData = getCombinationShapeData();

  // Get pattern data
  const patternData = getCombPatternData();

  // Get the current combination name
  const currentCombinationName = combinationOrder[combinationIndex];

  // Create saved data
  const savedData = {
    id: currentCombinationName,
    name: CombinationEditorState.combinationData?.name || currentCombinationName,
    tileRows: EditorState.combinationTileRows,
    tileCols: EditorState.combinationTileCols,
    shapeData: shapeData,
    patternData: patternData
  };

  // Update the registry
  registerCustomCombination(currentCombinationName, savedData);

  // Close editor
  closeCombinationEditor();

  // Rebuild combination list and regenerate tileset
  rebuildCombinationList();
  generateTileset();
}

// Initialize pattern editor
function initCombinationPatternEditor() {
  const state = CombinationEditorState;

  state.patternCanvas = document.getElementById('combinationPatternEditorCanvas');
  if (!state.patternCanvas) return;

  state.patternCtx = state.patternCanvas.getContext('2d');

  // Set canvas size
  state.patternCanvas.width = 512;
  state.patternCanvas.height = 512;
}

// Initialize preview canvas
function initCombinationPreviewCanvas() {
  const state = CombinationEditorState;

  state.previewCanvas = document.getElementById('combinationPreviewCanvas');
  if (!state.previewCanvas) return;

  state.previewCtx = state.previewCanvas.getContext('2d');
}

// Setup combination-specific UI events
function setupCombinationEditorUI() {
  // Tab buttons
  const shapeTab = document.getElementById('combinationTabShape');
  const patternTab = document.getElementById('combinationTabPattern');

  if (shapeTab) {
    shapeTab.onclick = () => switchCombinationEditorTab('shape');
  }
  if (patternTab) {
    patternTab.onclick = () => switchCombinationEditorTab('pattern');
  }

  // Tile size inputs
  const rowsInput = document.getElementById('combinationTileRows');
  const colsInput = document.getElementById('combinationTileCols');

  if (rowsInput) {
    rowsInput.onchange = function() {
      const rows = parseInt(this.value, 10) || 2;
      EditorState.combinationTileRows = Math.max(1, Math.min(8, rows));
      CombinationEditorState.tileRows = EditorState.combinationTileRows;
      this.value = EditorState.combinationTileRows;
      drawCombinationTileGridOverlay();
      updateCombinationPreview();
    };
  }
  if (colsInput) {
    colsInput.onchange = function() {
      const cols = parseInt(this.value, 10) || 2;
      EditorState.combinationTileCols = Math.max(1, Math.min(8, cols));
      CombinationEditorState.tileCols = EditorState.combinationTileCols;
      this.value = EditorState.combinationTileCols;
      drawCombinationTileGridOverlay();
      updateCombinationPreview();
    };
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancelCombinationEditorBtn');
  if (cancelBtn) {
    cancelBtn.onclick = closeCombinationEditor;
  }

  // Save button
  const saveBtn = document.getElementById('saveCombinationBtn');
  if (saveBtn) {
    saveBtn.onclick = saveCombinationEditor;
  }

  // Help modal
  const helpLink = document.getElementById('combinationEditorHelpLink');
  if (helpLink) {
    helpLink.onclick = function(e) {
      e.preventDefault();
      const helpModal = document.getElementById('combinationEditorHelpModal');
      if (helpModal) helpModal.classList.add('active');
    };
  }

  const closeHelpBtn = document.getElementById('closeCombinationHelpBtn');
  if (closeHelpBtn) {
    closeHelpBtn.onclick = function() {
      const helpModal = document.getElementById('combinationEditorHelpModal');
      if (helpModal) helpModal.classList.remove('active');
    };
  }

  // Setup toolbar buttons (uses shape editor toolbar functions)
  setupCombinationShapeToolbar();

  // Setup pattern toolbar
  setupCombPatternToolbar();
}

// Setup combination shape toolbar
function setupCombinationShapeToolbar() {
  // The toolbar actions use the same functions as the shape editor
  document.querySelectorAll('.combination-shape-toolbar .tool-action').forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      const action = this.dataset.action;

      switch (action) {
        case 'comb-add-circle':
          addCircleShape();
          updateCombinationPreview();
          break;
        case 'comb-add-square':
          addSquareShape();
          updateCombinationPreview();
          break;
        case 'comb-add-triangle':
          addTriangleShape();
          updateCombinationPreview();
          break;
        case 'comb-add-hexagon':
          addHexagonShape();
          updateCombinationPreview();
          break;
        case 'comb-reflect-horizontal':
          reflectHorizontal();
          updateCombinationPreview();
          break;
        case 'comb-reflect-vertical':
          reflectVertical();
          updateCombinationPreview();
          break;
        case 'comb-align-center':
          alignCenter();
          updateCombinationPreview();
          break;
        case 'comb-align-top':
          alignTop();
          updateCombinationPreview();
          break;
        case 'comb-align-bottom':
          alignBottom();
          updateCombinationPreview();
          break;
        case 'comb-align-left':
          alignLeft();
          updateCombinationPreview();
          break;
        case 'comb-align-right':
          alignRight();
          updateCombinationPreview();
          break;
        case 'comb-boolean-cut':
          booleanCut();
          updateCombinationPreview();
          break;
        case 'comb-toggle-hole':
          toggleHolePath();
          updateCombinationPreview();
          break;
      }
    };
  });
}

// Switch between tabs
function switchCombinationEditorTab(tabName) {
  CombinationEditorState.activeTab = tabName;

  // Update tab buttons
  const shapeTab = document.getElementById('combinationTabShape');
  const patternTab = document.getElementById('combinationTabPattern');

  if (shapeTab) shapeTab.classList.toggle('active', tabName === 'shape');
  if (patternTab) patternTab.classList.toggle('active', tabName === 'pattern');

  // Update tab content visibility
  const shapeContent = document.getElementById('combinationShapeTab');
  const patternContent = document.getElementById('combinationPatternTab');

  if (shapeContent) {
    shapeContent.style.display = tabName === 'shape' ? 'flex' : 'none';
  }
  if (patternContent) {
    patternContent.style.display = tabName === 'pattern' ? 'flex' : 'none';
  }

  // Redraw pattern canvas if switching to pattern tab
  if (tabName === 'pattern') {
    drawCombPatternEditorCanvas();
  }
}

// Build shape palette for drag-drop
function buildCombinationShapePalette() {
  const paletteContainer = document.getElementById('combinationShapePalette');
  if (!paletteContainer) return;

  paletteContainer.innerHTML = '';

  // Get all available shapes
  shapeOrder.forEach((shapeName) => {
    const item = document.createElement('div');
    item.className = 'combination-palette-item';
    item.draggable = true;
    item.dataset.shape = shapeName;
    item.title = shapeName;

    // Create preview canvas
    const previewCanvas = createShapePreview(shapeName);
    item.appendChild(previewCanvas);

    // Drag events
    item.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'shape',
        name: shapeName
      }));
      e.dataTransfer.effectAllowed = 'copy';
      this.classList.add('dragging');
    });

    item.addEventListener('dragend', function() {
      this.classList.remove('dragging');
    });

    // Click to load shape into editor
    item.addEventListener('click', function() {
      loadShapeIntoCombinationEditor(shapeName);
    });

    paletteContainer.appendChild(item);
  });
}

// Load a shape from the palette into the combination editor
function loadShapeIntoCombinationEditor(shapeName) {
  // Clear existing paths
  EditorState.paths.forEach(p => EditorState.two.remove(p));
  EditorState.paths = [];
  EditorState.currentPathIndex = 0;
  EditorState.holePathIndices = [];

  // Load the shape using the shared function
  loadShapeIntoEditor(shapeName);

  // Redraw tile overlay and preview
  drawCombinationTileGridOverlay();
  updateCombinationPreview();
}

// Setup buttons (called from main.js)
function setupCombinationEditorButtons() {
  // This is called during initialization
  // Actual button setup happens in setupCombinationEditorUI when modal opens
}
