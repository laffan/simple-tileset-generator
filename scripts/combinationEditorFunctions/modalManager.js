/* Combination Editor Modal Manager
 * Uses the shared EditorState with mode='combination' to reuse shape editor functionality
 */

// Calculate the shape bounds for combination editor (always square tiles)
// Returns { startX, startY, width, height, tileSize }
function getCombinationShapeBounds() {
  const rows = EditorState.combinationTileRows || 2;
  const cols = EditorState.combinationTileCols || 2;

  // Calculate tile size based on fitting into the available space
  // Each tile must be square, so use the smaller dimension
  const maxDimension = Math.max(rows, cols);
  const tileSize = EDITOR_SHAPE_SIZE / maxDimension;

  // Calculate shape area dimensions (rectangular if rows != cols)
  const shapeWidth = tileSize * cols;
  const shapeHeight = tileSize * rows;

  // Center the shape area in the canvas
  const startX = (EDITOR_SIZE - shapeWidth) / 2;
  const startY = (EDITOR_SIZE - shapeHeight) / 2;

  return { startX, startY, width: shapeWidth, height: shapeHeight, tileSize, rows, cols };
}

// Convert normalized coordinates (0-1) to combination editor coordinates
function combinationNormalizedToEditor(normalizedX, normalizedY) {
  const bounds = getCombinationShapeBounds();
  return {
    x: bounds.startX + normalizedX * bounds.width,
    y: bounds.startY + normalizedY * bounds.height
  };
}

// Convert combination editor coordinates to normalized (0-1)
function combinationEditorToNormalized(editorX, editorY) {
  const bounds = getCombinationShapeBounds();
  return {
    x: (editorX - bounds.startX) / bounds.width,
    y: (editorY - bounds.startY) / bounds.height
  };
}

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

  // Also update CombinationEditorState
  CombinationEditorState.currentEditingCombinationIndex = combinationIndex;
  CombinationEditorState.combinationData = copyCombinationData(combinationData);
  CombinationEditorState.tileRows = EditorState.combinationTileRows;
  CombinationEditorState.tileCols = EditorState.combinationTileCols;

  // Initialize per-path pattern data from saved data
  CombinationEditorState.pathPatterns = combinationData.pathPatterns ? { ...combinationData.pathPatterns } : {};

  // Initialize current pattern selection (will be updated when path is selected)
  CombinationEditorState.selectedPatternName = null;
  CombinationEditorState.selectedPatternSize = 16;
  CombinationEditorState.selectedPatternInvert = false;

  // Show modal
  const modal = document.getElementById('combinationEditorModal');
  if (modal) {
    modal.classList.add('active');
  }

  // Update grid size displays
  updateGridSizeDisplay();

  // Initialize Two.js in the combination shape editor canvas
  initCombinationTwoEditor();

  // Draw editor grid (uses shared drawEditorGrid from shape editor)
  drawEditorGrid();

  // Draw tile division overlay
  drawCombinationTileGridOverlay();

  // Load shape data if exists (canvas starts empty otherwise)
  if (combinationData.shapeData) {
    loadCombinationShapeData(combinationData.shapeData);
  }
  // No default shape - canvas starts empty, user adds shapes from palette

  // Setup event handlers (shared with shape editor)
  setupEditorEvents();

  // Load pattern info for the initially selected path
  loadPathPatternInfo();

  // Initialize preview
  initCombinationPreviewCanvas();
  updateCombinationPreview();

  // Setup combination-specific UI events
  setupCombinationEditorUI();

  // Build palettes
  buildCombinationShapePalette();
  buildCombinationPatternPalette();
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

  // Get the rectangular bounds for this tile configuration
  const bounds = getCombinationShapeBounds();

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
      // Array of points - could be [x, y] arrays OR {x, y, ctrlLeft, ctrlRight} objects
      vertices = singlePathData.map(p => {
        if (Array.isArray(p)) {
          // Simple [x, y] format
          return { x: p[0] + 0.5, y: p[1] + 0.5 };
        } else {
          // Object format with potential control points
          const v = { x: p.x + 0.5, y: p.y + 0.5 };
          if (p.ctrlLeft) v.ctrlLeft = p.ctrlLeft;
          if (p.ctrlRight) v.ctrlRight = p.ctrlRight;
          return v;
        }
      });
    } else {
      return;
    }

    const anchors = vertices.map((v, i) => {
      // Convert from normalized (0-1) to editor coordinates using rectangular bounds
      const x = bounds.startX + v.x * bounds.width;
      const y = bounds.startY + v.y * bounds.height;

      let ctrlLeftX = 0, ctrlLeftY = 0, ctrlRightX = 0, ctrlRightY = 0;
      if (v.ctrlLeft) {
        ctrlLeftX = v.ctrlLeft.x * bounds.width;
        ctrlLeftY = v.ctrlLeft.y * bounds.height;
      }
      if (v.ctrlRight) {
        ctrlRightX = v.ctrlRight.x * bounds.width;
        ctrlRightY = v.ctrlRight.y * bounds.height;
      }

      // Determine command based on control points
      let command;
      if (i === 0) {
        // First vertex - check if last vertex has ctrlRight or this has ctrlLeft (for closed paths)
        const lastV = vertices[vertices.length - 1];
        const lastHasCtrlRight = lastV.ctrlRight && (lastV.ctrlRight.x !== 0 || lastV.ctrlRight.y !== 0);
        const firstHasCtrlLeft = v.ctrlLeft && (v.ctrlLeft.x !== 0 || v.ctrlLeft.y !== 0);
        command = (lastHasCtrlRight || firstHasCtrlLeft) ? Two.Commands.curve : Two.Commands.move;
      } else {
        // Other vertices - use curve if prev has ctrlRight or current has ctrlLeft
        const prevV = vertices[i - 1];
        const prevHasCtrlRight = prevV.ctrlRight && (prevV.ctrlRight.x !== 0 || prevV.ctrlRight.y !== 0);
        const currentHasCtrlLeft = v.ctrlLeft && (v.ctrlLeft.x !== 0 || v.ctrlLeft.y !== 0);
        command = (prevHasCtrlRight || currentHasCtrlLeft) ? Two.Commands.curve : Two.Commands.line;
      }

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

// Create default shape (rectangle filling the shape area based on tile dimensions)
function createDefaultCombinationShape() {
  if (!EditorState.two) return;

  // Get the rectangular bounds for this tile configuration
  const bounds = getCombinationShapeBounds();

  const anchors = [
    new Two.Anchor(bounds.startX, bounds.startY, 0, 0, 0, 0, Two.Commands.move),
    new Two.Anchor(bounds.startX + bounds.width, bounds.startY, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(bounds.startX + bounds.width, bounds.startY + bounds.height, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(bounds.startX, bounds.startY + bounds.height, 0, 0, 0, 0, Two.Commands.line)
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

// Convert a path to normalized coordinates using combination rectangular bounds
function combinationPathToNormalizedData(path) {
  const bounds = getCombinationShapeBounds();
  const tx = path.translation ? path.translation.x : 0;
  const ty = path.translation ? path.translation.y : 0;

  const vertices = path.vertices.map(v => {
    // Convert from editor coordinates to normalized (0-1) using rectangular bounds
    const absX = v.x + tx;
    const absY = v.y + ty;
    const normalizedX = (absX - bounds.startX) / bounds.width;
    const normalizedY = (absY - bounds.startY) / bounds.height;

    const vertex = { x: normalizedX, y: normalizedY };

    // Handle control points
    if (v.controls) {
      if (v.controls.left && (v.controls.left.x !== 0 || v.controls.left.y !== 0)) {
        vertex.ctrlLeft = {
          x: v.controls.left.x / bounds.width,
          y: v.controls.left.y / bounds.height
        };
      }
      if (v.controls.right && (v.controls.right.x !== 0 || v.controls.right.y !== 0)) {
        vertex.ctrlRight = {
          x: v.controls.right.x / bounds.width,
          y: v.controls.right.y / bounds.height
        };
      }
    }

    return vertex;
  });

  return { vertices, closed: path.closed };
}

// Get shape data from editor (converts to normalized format for saving)
// Preserves control points for bezier curves
function getCombinationShapeData() {
  if (!EditorState.paths || EditorState.paths.length === 0) return null;

  const shouldCrop = isCropEnabled();

  // Helper to convert vertex to save format (preserving control points)
  function vertexToSaveFormat(v) {
    const point = [v.x - 0.5, v.y - 0.5];
    // Add control points if they exist
    if (v.ctrlLeft || v.ctrlRight) {
      const vertexObj = { x: v.x - 0.5, y: v.y - 0.5 };
      if (v.ctrlLeft) {
        vertexObj.ctrlLeft = { x: v.ctrlLeft.x, y: v.ctrlLeft.y };
      }
      if (v.ctrlRight) {
        vertexObj.ctrlRight = { x: v.ctrlRight.x, y: v.ctrlRight.y };
      }
      return vertexObj;
    }
    return point;
  }

  // Check if any path has curves (control points)
  function pathHasCurves(pathData) {
    return pathData.vertices.some(v => v.ctrlLeft || v.ctrlRight);
  }

  if (EditorState.paths.length === 1) {
    const pathData = combinationPathToNormalizedData(EditorState.paths[0]);

    if (pathHasCurves(pathData)) {
      // Return vertices with control points preserved
      let vertices = pathData.vertices.map(vertexToSaveFormat);
      // Note: cropping bezier curves is complex, skip for now
      return vertices;
    } else {
      // Simple array format for non-curved shapes
      let points = pathData.vertices.map(v => [v.x - 0.5, v.y - 0.5]);
      if (shouldCrop) {
        points = clipPathDataToBounds(points);
      }
      return points;
    }
  } else {
    // Multi-path
    let hasCurves = false;
    let paths = EditorState.paths.map(path => {
      const pd = combinationPathToNormalizedData(path);
      if (pathHasCurves(pd)) {
        hasCurves = true;
        return pd.vertices.map(vertexToSaveFormat);
      }
      return pd.vertices.map(v => [v.x - 0.5, v.y - 0.5]);
    });

    if (shouldCrop && !hasCurves) {
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

// Draw red tile grid overlay showing divisions (with square tiles)
function drawCombinationTileGridOverlay() {
  const container = document.getElementById('combinationShapeEditorCanvas');
  if (!container) return;

  // Remove old overlay
  const oldOverlay = container.querySelector('.comb-tile-overlay');
  if (oldOverlay) {
    oldOverlay.remove();
  }

  // Get bounds with square tiles
  const bounds = getCombinationShapeBounds();
  const { startX, startY, width, height, tileSize, rows, cols } = bounds;

  // Create SVG overlay
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('comb-tile-overlay');
  svg.setAttribute('width', EDITOR_SIZE);
  svg.setAttribute('height', EDITOR_SIZE);
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'none';

  // Draw outer boundary rectangle (red dashed)
  const boundary = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  boundary.setAttribute('x', startX);
  boundary.setAttribute('y', startY);
  boundary.setAttribute('width', width);
  boundary.setAttribute('height', height);
  boundary.setAttribute('fill', 'none');
  boundary.setAttribute('stroke', '#dc3545');
  boundary.setAttribute('stroke-width', '2');
  boundary.setAttribute('stroke-dasharray', '8,4');
  svg.appendChild(boundary);

  // Draw vertical division lines (only if more than 1 column)
  for (let i = 1; i < cols; i++) {
    const x = startX + i * tileSize;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', x);
    line.setAttribute('y2', startY + height);
    line.setAttribute('stroke', '#dc3545');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6,4');
    svg.appendChild(line);
  }

  // Draw horizontal division lines (only if more than 1 row)
  for (let i = 1; i < rows; i++) {
    const y = startY + i * tileSize;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', y);
    line.setAttribute('x2', startX + width);
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

  // Get the current combination name
  const currentCombinationName = combinationOrder[combinationIndex];

  // Get per-path pattern data (copy the pathPatterns object)
  const pathPatterns = { ...CombinationEditorState.pathPatterns };

  // Create saved data
  const savedData = {
    id: currentCombinationName,
    name: CombinationEditorState.combinationData?.name || currentCombinationName,
    tileRows: EditorState.combinationTileRows,
    tileCols: EditorState.combinationTileCols,
    shapeData: shapeData,
    // Save per-path pattern info for re-editing
    pathPatterns: pathPatterns
  };

  // Update the registry
  registerCustomCombination(currentCombinationName, savedData);

  // Close editor
  closeCombinationEditor();

  // Rebuild combination list and regenerate tileset
  rebuildCombinationList();
  generateTileset();
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
  // Palette tab switching (Shapes / Patterns)
  const paletteTabs = document.querySelectorAll('.combination-palette-tab');
  paletteTabs.forEach(tab => {
    tab.onclick = function() {
      const tabName = this.dataset.paletteTab;
      switchCombinationPaletteTab(tabName);
    };
  });

  // Grid size +/- buttons
  const gridSizeButtons = document.querySelectorAll('.grid-size-btn');
  gridSizeButtons.forEach(btn => {
    btn.onclick = function() {
      const action = this.dataset.action;
      handleGridSizeChange(action);
    };
  });

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
}

// Update the grid size display values
function updateGridSizeDisplay() {
  const rowsDisplay = document.getElementById('combinationRowsDisplay');
  const colsDisplay = document.getElementById('combinationColsDisplay');
  if (rowsDisplay) rowsDisplay.textContent = EditorState.combinationTileRows;
  if (colsDisplay) colsDisplay.textContent = EditorState.combinationTileCols;
}

// Handle grid size +/- button clicks
function handleGridSizeChange(action) {
  let rows = EditorState.combinationTileRows;
  let cols = EditorState.combinationTileCols;

  switch (action) {
    case 'rows-inc':
      rows = Math.min(8, rows + 1);
      break;
    case 'rows-dec':
      rows = Math.max(1, rows - 1);
      break;
    case 'cols-inc':
      cols = Math.min(8, cols + 1);
      break;
    case 'cols-dec':
      cols = Math.max(1, cols - 1);
      break;
  }

  // Update state
  EditorState.combinationTileRows = rows;
  EditorState.combinationTileCols = cols;
  CombinationEditorState.tileRows = rows;
  CombinationEditorState.tileCols = cols;

  // Update display
  updateGridSizeDisplay();

  // Redraw tile grid overlay and preview
  drawCombinationTileGridOverlay();
  updateCombinationPreview();
}

// Switch between palette tabs (Shapes / Patterns)
function switchCombinationPaletteTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.combination-palette-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.paletteTab === tabName);
  });

  // Update content visibility
  const shapesContent = document.getElementById('combinationShapePaletteContent');
  const patternsContent = document.getElementById('combinationPatternPaletteContent');

  if (shapesContent) {
    shapesContent.classList.toggle('active', tabName === 'shapes');
  }
  if (patternsContent) {
    patternsContent.classList.toggle('active', tabName === 'patterns');
  }
}

// Setup combination shape toolbar
function setupCombinationShapeToolbar() {
  const toolbar = document.querySelector('.combination-shape-toolbar');
  if (!toolbar) return;

  // Handle tool clicks to toggle submenu
  toolbar.addEventListener('click', (e) => {
    const tool = e.target.closest('.toolbar-tool');
    const action = e.target.closest('.tool-action');

    if (action) {
      // Handle action click
      e.stopPropagation();
      const actionType = action.dataset.action;
      executeCombinationToolAction(actionType);
      closeCombinationSubmenus();
      return;
    }

    if (tool) {
      // Toggle submenu
      const wasActive = tool.classList.contains('active');
      closeCombinationSubmenus();
      if (!wasActive) {
        tool.classList.add('active');
      }
    }
  });

  // Close submenus when clicking outside
  const closeHandler = (e) => {
    if (!e.target.closest('.combination-shape-toolbar')) {
      closeCombinationSubmenus();
    }
  };
  document.addEventListener('click', closeHandler);

  // Store handler reference for cleanup
  toolbar._closeHandler = closeHandler;
}

// Close all combination toolbar submenus
function closeCombinationSubmenus() {
  document.querySelectorAll('.combination-shape-toolbar .toolbar-tool.active').forEach(tool => {
    tool.classList.remove('active');
  });
}

// Execute a combination toolbar action
function executeCombinationToolAction(actionType) {
  switch (actionType) {
    case 'comb-add-circle':
      addPrimitiveShape('circle');
      updateCombinationPreview();
      break;
    case 'comb-add-square':
      addPrimitiveShape('square');
      updateCombinationPreview();
      break;
    case 'comb-add-triangle':
      addPrimitiveShape('triangle');
      updateCombinationPreview();
      break;
    case 'comb-add-hexagon':
      addPrimitiveShape('hexagon');
      updateCombinationPreview();
      break;
    case 'comb-reflect-horizontal':
      reflectPath('horizontal');
      updateCombinationPreview();
      break;
    case 'comb-reflect-vertical':
      reflectPath('vertical');
      updateCombinationPreview();
      break;
    case 'comb-align-center':
      alignPaths('center');
      updateCombinationPreview();
      break;
    case 'comb-align-top':
      alignPaths('top');
      updateCombinationPreview();
      break;
    case 'comb-align-bottom':
      alignPaths('bottom');
      updateCombinationPreview();
      break;
    case 'comb-align-left':
      alignPaths('left');
      updateCombinationPreview();
      break;
    case 'comb-align-right':
      alignPaths('right');
      updateCombinationPreview();
      break;
    case 'comb-boolean-cut':
      booleanCut();
      updateCombinationPreview();
      break;
    case 'comb-toggle-hole':
      toggleHole();
      updateCombinationPreview();
      break;
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

// Load a shape from the palette into the combination editor (ADD, not replace)
function loadShapeIntoCombinationEditor(shapeName) {
  // Get shape data from registry
  const shapeData = getShapePathData(shapeName);
  if (!shapeData) {
    console.warn('No shape data found for:', shapeName);
    return;
  }

  // Deselect current path visually
  if (EditorState.paths[EditorState.currentPathIndex]) {
    const oldPath = EditorState.paths[EditorState.currentPathIndex];
    const wasHole = EditorState.holePathIndices.includes(EditorState.currentPathIndex);
    if (wasHole) {
      oldPath.fill = 'rgba(255, 100, 100, 0.15)';
      oldPath.stroke = '#ff6666';
    } else {
      oldPath.fill = 'rgba(0, 0, 0, 0.4)';
      oldPath.stroke = '#666';
    }
  }

  // Add paths from the shape (could be single or multi-path)
  const pathsToAdd = [];

  if (shapeData.paths && Array.isArray(shapeData.paths)) {
    // Multi-path shape
    shapeData.paths.forEach((singlePathData, idx) => {
      const isHole = shapeData.holePathIndices && shapeData.holePathIndices.includes(idx);
      const path = createPathFromData(singlePathData, false, isHole);
      pathsToAdd.push({ path, isHole });
    });
  } else if (shapeData.vertices && shapeData.vertices.length > 0) {
    // Single path shape
    const path = createPathFromData(shapeData, false, false);
    pathsToAdd.push({ path, isHole: false });
  }

  // Add to EditorState and Two.js
  const firstNewIndex = EditorState.paths.length;
  pathsToAdd.forEach(({ path, isHole }, i) => {
    EditorState.paths.push(path);
    EditorState.two.add(path);
    if (isHole) {
      EditorState.holePathIndices.push(firstNewIndex + i);
    }
  });

  // Select the first newly added path
  EditorState.currentPathIndex = firstNewIndex;

  // Update style of the new selected path
  if (EditorState.paths[EditorState.currentPathIndex]) {
    const newPath = EditorState.paths[EditorState.currentPathIndex];
    const isHole = EditorState.holePathIndices.includes(EditorState.currentPathIndex);
    if (isHole) {
      newPath.fill = 'rgba(255, 100, 100, 0.3)';
      newPath.stroke = '#cc0000';
    } else {
      newPath.fill = 'rgba(0, 0, 0, 0.8)';
      newPath.stroke = '#333';
    }
  }

  // Update anchor visuals for the new selected path
  createAnchorVisuals();
  EditorState.two.update();

  // Redraw tile overlay and preview
  drawCombinationTileGridOverlay();
  updateCombinationPreview();
}

// Build the pattern palette with patterns and grid size options
// Shows normal and inverted previews side by side
function buildCombinationPatternPalette() {
  const paletteContainer = document.getElementById('combinationPatternPalette');
  if (!paletteContainer) return;

  paletteContainer.innerHTML = '';

  // Add "No Pattern" option
  const noPatternItem = document.createElement('div');
  noPatternItem.className = 'combination-no-pattern';
  if (!CombinationEditorState.selectedPatternName) {
    noPatternItem.classList.add('selected');
  }
  noPatternItem.textContent = 'No Pattern';
  noPatternItem.onclick = function() {
    selectCombinationPattern(null, null, false);
  };
  paletteContainer.appendChild(noPatternItem);

  // Get all available patterns
  patternOrder.forEach((patternName) => {
    const patternData = getPatternPixelData(patternName);
    if (!patternData) return;

    const item = document.createElement('div');
    item.className = 'combination-pattern-item';
    item.dataset.pattern = patternName;

    const isSelected = CombinationEditorState.selectedPatternName === patternName;
    if (isSelected) {
      item.classList.add('selected');
    }

    // Previews row (normal + inverted side by side)
    const previewsRow = document.createElement('div');
    previewsRow.className = 'combination-pattern-previews-row';

    // Normal preview (clickable)
    const normalPreviewWrap = document.createElement('div');
    normalPreviewWrap.className = 'pattern-preview-wrap pattern-preview-normal';
    if (isSelected && !CombinationEditorState.selectedPatternInvert) {
      normalPreviewWrap.classList.add('selected');
    }
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 32;
    normalCanvas.height = 32;
    const normalCtx = normalCanvas.getContext('2d');
    renderPatternPreview(normalCtx, patternData, 32, 32, false);
    normalPreviewWrap.appendChild(normalCanvas);
    normalPreviewWrap.onclick = function(e) {
      e.stopPropagation();
      selectCombinationPattern(patternName, CombinationEditorState.selectedPatternSize || 16, false);
    };
    previewsRow.appendChild(normalPreviewWrap);

    // Inverted preview (clickable)
    const invertedPreviewWrap = document.createElement('div');
    invertedPreviewWrap.className = 'pattern-preview-wrap pattern-preview-inverted';
    if (isSelected && CombinationEditorState.selectedPatternInvert) {
      invertedPreviewWrap.classList.add('selected');
    }
    const invertedCanvas = document.createElement('canvas');
    invertedCanvas.width = 32;
    invertedCanvas.height = 32;
    const invertedCtx = invertedCanvas.getContext('2d');
    renderPatternPreview(invertedCtx, patternData, 32, 32, true);
    invertedPreviewWrap.appendChild(invertedCanvas);
    invertedPreviewWrap.onclick = function(e) {
      e.stopPropagation();
      selectCombinationPattern(patternName, CombinationEditorState.selectedPatternSize || 16, true);
    };
    previewsRow.appendChild(invertedPreviewWrap);

    item.appendChild(previewsRow);

    // Grid size buttons row
    const sizesRow = document.createElement('div');
    sizesRow.className = 'combination-pattern-sizes';

    [4, 8, 16, 32].forEach(size => {
      const sizeBtn = document.createElement('button');
      sizeBtn.className = 'combination-pattern-size-btn';
      sizeBtn.textContent = size;
      sizeBtn.dataset.size = size;

      // Mark active if this pattern and size are selected
      if (isSelected && CombinationEditorState.selectedPatternSize === size) {
        sizeBtn.classList.add('active');
      }

      sizeBtn.onclick = function(e) {
        e.stopPropagation();
        selectCombinationPattern(patternName, size, CombinationEditorState.selectedPatternInvert);
      };

      sizesRow.appendChild(sizeBtn);
    });

    item.appendChild(sizesRow);
    paletteContainer.appendChild(item);
  });
}

// Render a small preview of a pattern (with optional invert)
function renderPatternPreview(ctx, patternData, width, height, invert) {
  const size = patternData.size || 8;
  const pixels = patternData.pixels || [];
  const pixelW = width / size;
  const pixelH = height / size;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#333';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let pixelValue = (pixels[y] && pixels[y][x] === 1) ? 1 : 0;
      if (invert) {
        pixelValue = pixelValue === 1 ? 0 : 1;
      }
      if (pixelValue === 1) {
        ctx.fillRect(x * pixelW, y * pixelH, pixelW, pixelH);
      }
    }
  }
}

// Get the selected pattern data for preview rendering
// This replaces the old getCombPatternData() from patternEditor.js
function getCombPatternData() {
  const patternName = CombinationEditorState.selectedPatternName;
  if (!patternName) return null;

  const patternData = getPatternPixelData(patternName);
  if (!patternData) return null;

  const targetSize = CombinationEditorState.selectedPatternSize || 16;
  const sourceSize = patternData.size || 8;
  const shouldInvert = CombinationEditorState.selectedPatternInvert || false;

  // Scale pattern to target size
  const scaledPixels = [];
  for (let y = 0; y < targetSize; y++) {
    scaledPixels[y] = [];
    for (let x = 0; x < targetSize; x++) {
      // Map target coordinates to source coordinates
      const srcX = Math.floor(x * sourceSize / targetSize);
      const srcY = Math.floor(y * sourceSize / targetSize);
      let pixelValue = (patternData.pixels[srcY] && patternData.pixels[srcY][srcX]) ? 1 : 0;

      // Apply invert
      if (shouldInvert) {
        pixelValue = pixelValue === 1 ? 0 : 1;
      }

      scaledPixels[y][x] = pixelValue;
    }
  }

  return {
    size: targetSize,
    pixels: scaledPixels
  };
}

// Select a pattern for the combination (or null for no pattern)
// Now stores pattern per-path
function selectCombinationPattern(patternName, size, invert) {
  const pathIndex = EditorState.currentPathIndex;
  const shouldInvert = invert !== undefined ? invert : false;

  CombinationEditorState.selectedPatternName = patternName;
  CombinationEditorState.selectedPatternSize = size || 16;
  CombinationEditorState.selectedPatternInvert = shouldInvert;

  // Store per-path pattern data
  if (patternName) {
    CombinationEditorState.pathPatterns[pathIndex] = {
      patternName: patternName,
      patternSize: size || 16,
      patternInvert: shouldInvert
    };
  } else {
    // Clear pattern for this path
    delete CombinationEditorState.pathPatterns[pathIndex];
  }

  // Update the UI
  updatePatternPaletteSelection();

  // Update the preview with the selected pattern
  updateCombinationPreview();
}

// Update pattern palette UI to reflect current selection
function updatePatternPaletteSelection() {
  const paletteContainer = document.getElementById('combinationPatternPalette');
  if (!paletteContainer) return;

  const patternName = CombinationEditorState.selectedPatternName;
  const patternSize = CombinationEditorState.selectedPatternSize;
  const patternInvert = CombinationEditorState.selectedPatternInvert;

  // Update "No Pattern" selection
  const noPatternItem = paletteContainer.querySelector('.combination-no-pattern');
  if (noPatternItem) {
    noPatternItem.classList.toggle('selected', !patternName);
  }

  // Update pattern items selection
  paletteContainer.querySelectorAll('.combination-pattern-item').forEach(item => {
    const itemPattern = item.dataset.pattern;
    const isSelected = itemPattern === patternName;
    item.classList.toggle('selected', isSelected);

    // Update normal/inverted preview selection
    const normalPreview = item.querySelector('.pattern-preview-normal');
    const invertedPreview = item.querySelector('.pattern-preview-inverted');
    if (normalPreview) {
      normalPreview.classList.toggle('selected', isSelected && !patternInvert);
    }
    if (invertedPreview) {
      invertedPreview.classList.toggle('selected', isSelected && patternInvert);
    }

    // Update size buttons
    item.querySelectorAll('.combination-pattern-size-btn').forEach(btn => {
      const btnSize = parseInt(btn.dataset.size, 10);
      btn.classList.toggle('active', isSelected && btnSize === patternSize);
    });
  });
}

// Load pattern info for the currently selected path
function loadPathPatternInfo() {
  const pathIndex = EditorState.currentPathIndex;
  const pathPattern = CombinationEditorState.pathPatterns[pathIndex];

  if (pathPattern) {
    CombinationEditorState.selectedPatternName = pathPattern.patternName;
    CombinationEditorState.selectedPatternSize = pathPattern.patternSize;
    CombinationEditorState.selectedPatternInvert = pathPattern.patternInvert;
  } else {
    // No pattern for this path
    CombinationEditorState.selectedPatternName = null;
    CombinationEditorState.selectedPatternSize = 16;
    CombinationEditorState.selectedPatternInvert = false;
  }

  updatePatternPaletteSelection();
}

// Setup buttons (called from main.js)
function setupCombinationEditorButtons() {
  // This is called during initialization
  // Actual button setup happens in setupCombinationEditorUI when modal opens
}
