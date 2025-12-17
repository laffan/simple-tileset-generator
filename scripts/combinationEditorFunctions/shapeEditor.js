/* Combination Shape Editor - Two.js based shape editing with tile grid overlay */

// Draw the editor grid (same as shape editor but with tile grid overlay)
function drawCombEditorGrid() {
  const state = CombinationEditorState;
  if (!state.two) return;

  const gridGroup = state.two.makeGroup();
  const gridSize = 40;
  const gridColor = '#e0e0e0';

  // Draw light gray grid
  for (let i = 0; i <= COMB_EDITOR_SIZE; i += gridSize) {
    const vLine = state.two.makeLine(i, 0, i, COMB_EDITOR_SIZE);
    vLine.stroke = gridColor;
    vLine.linewidth = 1;
    gridGroup.add(vLine);

    const hLine = state.two.makeLine(0, i, COMB_EDITOR_SIZE, i);
    hLine.stroke = gridColor;
    hLine.linewidth = 1;
    gridGroup.add(hLine);
  }

  // Draw center lines
  const centerV = state.two.makeLine(COMB_EDITOR_SIZE / 2, 0, COMB_EDITOR_SIZE / 2, COMB_EDITOR_SIZE);
  centerV.stroke = '#ccc';
  centerV.linewidth = 2;
  gridGroup.add(centerV);

  const centerH = state.two.makeLine(0, COMB_EDITOR_SIZE / 2, COMB_EDITOR_SIZE, COMB_EDITOR_SIZE / 2);
  centerH.stroke = '#ccc';
  centerH.linewidth = 2;
  gridGroup.add(centerH);

  // Draw red boundary showing the save area
  const boundary = state.two.makeRectangle(
    COMB_EDITOR_SIZE / 2,
    COMB_EDITOR_SIZE / 2,
    COMB_EDITOR_SHAPE_SIZE,
    COMB_EDITOR_SHAPE_SIZE
  );
  boundary.fill = 'transparent';
  boundary.stroke = '#dc3545';
  boundary.linewidth = 2;
  boundary.dashes = [8, 4];
  gridGroup.add(boundary);

  state.two.update();
}

// Note: drawCombinationTileGridOverlay is defined in modalManager.js
// It handles the rectangular bounds calculation for non-square tile grids

// Create default shape (square filling the shape area)
function createDefaultCombShape() {
  const state = CombinationEditorState;
  if (!state.two) return;

  // Create a square path
  const halfSize = COMB_EDITOR_SHAPE_SIZE / 2;
  const centerX = COMB_EDITOR_SIZE / 2;
  const centerY = COMB_EDITOR_SIZE / 2;

  const path = state.two.makePath([
    new Two.Anchor(centerX - halfSize, centerY - halfSize, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(centerX + halfSize, centerY - halfSize, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(centerX + halfSize, centerY + halfSize, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(centerX - halfSize, centerY + halfSize, 0, 0, 0, 0, Two.Commands.line)
  ], true);

  path.fill = '#333';
  path.stroke = '#000';
  path.linewidth = 2;

  state.paths = [path];
  state.currentPathIndex = 0;

  // Create anchor visuals
  createCombAnchorVisuals();

  state.two.update();
}

// Load shape data into the editor
function loadCombShapeData(shapeData) {
  const state = CombinationEditorState;
  if (!state.two) return;

  // Clear existing paths
  state.paths.forEach(p => p.remove());
  state.paths = [];
  state.anchors.forEach(a => a.remove());
  state.anchors = [];

  // Handle multi-path shapes
  const pathsData = shapeData.paths || [shapeData];

  pathsData.forEach((pathData, index) => {
    const vertices = pathData.map(point => {
      // Convert from normalized (-0.5 to 0.5) to editor coordinates
      const x = COMB_EDITOR_SIZE / 2 + point[0] * COMB_EDITOR_SHAPE_SIZE;
      const y = COMB_EDITOR_SIZE / 2 + point[1] * COMB_EDITOR_SHAPE_SIZE;
      return new Two.Anchor(x, y, 0, 0, 0, 0, Two.Commands.line);
    });

    const path = state.two.makePath(vertices, true);
    path.fill = '#333';
    path.stroke = '#000';
    path.linewidth = 2;

    state.paths.push(path);
  });

  // Handle fill rule and holes
  if (shapeData.fillRule) {
    state.fillRule = shapeData.fillRule;
  }
  if (shapeData.holePathIndices) {
    state.holePathIndices = [...shapeData.holePathIndices];
  }

  state.currentPathIndex = 0;

  // Create anchor visuals for current path
  createCombAnchorVisuals();

  state.two.update();
}

// Get shape data from the editor
// Uses shared EditorState when in combination mode (for shared editor functionality)
function getCombShapeData() {
  // When using shared EditorState (new approach)
  if (EditorState.editorMode === 'combination' && EditorState.paths && EditorState.paths.length > 0) {
    // Use the getCombinationShapeData() from modalManager.js which reads from EditorState
    if (typeof getCombinationShapeData === 'function') {
      return getCombinationShapeData();
    }
  }

  // Fallback to CombinationEditorState (legacy approach)
  const state = CombinationEditorState;
  if (!state.paths || state.paths.length === 0) return null;

  // Check if cropping is enabled
  const shouldCrop = isCombCropEnabled();

  if (state.paths.length === 1) {
    // Single path shape
    let pathData = combPathToNormalizedData(state.paths[0]);
    if (shouldCrop) {
      pathData = clipPathDataToBounds(pathData);
    }
    return pathData;
  } else {
    // Multi-path shape
    let paths = state.paths.map(path => combPathToNormalizedData(path));
    if (shouldCrop) {
      paths = paths.map(p => clipPathDataToBounds(p));
    }
    const result = { paths };

    if (state.fillRule) {
      result.fillRule = state.fillRule;
    }
    if (state.holePathIndices && state.holePathIndices.length > 0) {
      result.holePathIndices = [...state.holePathIndices];
    }
    return result;
  }
}

// Convert a Two.js path to normalized coordinates
function combPathToNormalizedData(path) {
  const vertices = path.vertices;
  return vertices.map(v => {
    // Convert from editor coordinates to normalized (-0.5 to 0.5)
    const normalX = (v.x - COMB_EDITOR_SIZE / 2) / COMB_EDITOR_SHAPE_SIZE;
    const normalY = (v.y - COMB_EDITOR_SIZE / 2) / COMB_EDITOR_SHAPE_SIZE;
    return [normalX, normalY];
  });
}

// Create anchor visuals for the current path
function createCombAnchorVisuals() {
  const state = CombinationEditorState;
  if (!state.two) return;

  // Remove existing anchors
  state.anchors.forEach(a => a.remove());
  state.anchors = [];
  state.selectedAnchors = [];

  const currentPath = state.paths[state.currentPathIndex];
  if (!currentPath) return;

  currentPath.vertices.forEach((vertex, index) => {
    const anchor = state.two.makeCircle(vertex.x, vertex.y, COMB_ANCHOR_RADIUS);
    anchor.fill = '#fff';
    anchor.stroke = '#007bff';
    anchor.linewidth = 2;
    anchor.vertexIndex = index;
    state.anchors.push(anchor);
  });

  state.two.update();
}

// Update anchor positions from path vertices
function updateCombAnchorPositions() {
  const state = CombinationEditorState;
  const currentPath = state.paths[state.currentPathIndex];
  if (!currentPath) return;

  state.anchors.forEach((anchor, index) => {
    if (currentPath.vertices[index]) {
      anchor.translation.set(currentPath.vertices[index].x, currentPath.vertices[index].y);
    }
  });

  state.two.update();
}

// Select an anchor
function selectCombAnchor(anchorIndex, addToSelection = false) {
  const state = CombinationEditorState;

  if (!addToSelection) {
    // Deselect all first
    state.selectedAnchors.forEach(idx => {
      if (state.anchors[idx]) {
        state.anchors[idx].fill = '#fff';
      }
    });
    state.selectedAnchors = [];
  }

  if (anchorIndex >= 0 && anchorIndex < state.anchors.length) {
    if (!state.selectedAnchors.includes(anchorIndex)) {
      state.selectedAnchors.push(anchorIndex);
      state.anchors[anchorIndex].fill = '#007bff';
    }
  }

  state.two.update();
}

// Deselect all anchors
function deselectAllCombAnchors() {
  const state = CombinationEditorState;
  state.selectedAnchors.forEach(idx => {
    if (state.anchors[idx]) {
      state.anchors[idx].fill = '#fff';
    }
  });
  state.selectedAnchors = [];
  state.two.update();
}

// Move selected anchors
function moveCombSelectedAnchors(dx, dy) {
  const state = CombinationEditorState;
  const currentPath = state.paths[state.currentPathIndex];
  if (!currentPath) return;

  state.selectedAnchors.forEach(idx => {
    if (currentPath.vertices[idx]) {
      currentPath.vertices[idx].x += dx;
      currentPath.vertices[idx].y += dy;
    }
  });

  updateCombAnchorPositions();
  updateCombinationPreview();
}

// Delete selected anchors
function deleteCombSelectedAnchors() {
  const state = CombinationEditorState;
  const currentPath = state.paths[state.currentPathIndex];
  if (!currentPath || state.selectedAnchors.length === 0) return;

  // Need at least 3 vertices
  if (currentPath.vertices.length - state.selectedAnchors.length < 3) {
    return;
  }

  // Sort indices in descending order to remove from end first
  const sortedIndices = [...state.selectedAnchors].sort((a, b) => b - a);

  sortedIndices.forEach(idx => {
    currentPath.vertices.splice(idx, 1);
  });

  state.selectedAnchors = [];
  createCombAnchorVisuals();
  updateCombinationPreview();
}

// Add shape functions (circle, square, triangle, hexagon)
function addCombCircle() {
  const state = CombinationEditorState;
  if (!state.two) return;

  const centerX = COMB_EDITOR_SIZE / 2;
  const centerY = COMB_EDITOR_SIZE / 2;
  const radius = COMB_EDITOR_SHAPE_SIZE / 3;

  const circle = state.two.makeCircle(centerX, centerY, radius);
  circle.fill = '#333';
  circle.stroke = '#000';
  circle.linewidth = 2;

  // Convert to path with vertices
  const numPoints = 32;
  const vertices = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    vertices.push(new Two.Anchor(x, y, 0, 0, 0, 0, Two.Commands.line));
  }

  circle.remove();
  const path = state.two.makePath(vertices, true);
  path.fill = '#333';
  path.stroke = '#000';
  path.linewidth = 2;

  state.paths.push(path);
  state.currentPathIndex = state.paths.length - 1;
  createCombAnchorVisuals();
  updateCombinationPreview();
}

function addCombSquare() {
  const state = CombinationEditorState;
  if (!state.two) return;

  const centerX = COMB_EDITOR_SIZE / 2;
  const centerY = COMB_EDITOR_SIZE / 2;
  const halfSize = COMB_EDITOR_SHAPE_SIZE / 3;

  const path = state.two.makePath([
    new Two.Anchor(centerX - halfSize, centerY - halfSize, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(centerX + halfSize, centerY - halfSize, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(centerX + halfSize, centerY + halfSize, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(centerX - halfSize, centerY + halfSize, 0, 0, 0, 0, Two.Commands.line)
  ], true);

  path.fill = '#333';
  path.stroke = '#000';
  path.linewidth = 2;

  state.paths.push(path);
  state.currentPathIndex = state.paths.length - 1;
  createCombAnchorVisuals();
  updateCombinationPreview();
}

function addCombTriangle() {
  const state = CombinationEditorState;
  if (!state.two) return;

  const centerX = COMB_EDITOR_SIZE / 2;
  const centerY = COMB_EDITOR_SIZE / 2;
  const radius = COMB_EDITOR_SHAPE_SIZE / 3;

  const vertices = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    vertices.push(new Two.Anchor(x, y, 0, 0, 0, 0, Two.Commands.line));
  }

  const path = state.two.makePath(vertices, true);
  path.fill = '#333';
  path.stroke = '#000';
  path.linewidth = 2;

  state.paths.push(path);
  state.currentPathIndex = state.paths.length - 1;
  createCombAnchorVisuals();
  updateCombinationPreview();
}

function addCombHexagon() {
  const state = CombinationEditorState;
  if (!state.two) return;

  const centerX = COMB_EDITOR_SIZE / 2;
  const centerY = COMB_EDITOR_SIZE / 2;
  const radius = COMB_EDITOR_SHAPE_SIZE / 3;

  const vertices = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    vertices.push(new Two.Anchor(x, y, 0, 0, 0, 0, Two.Commands.line));
  }

  const path = state.two.makePath(vertices, true);
  path.fill = '#333';
  path.stroke = '#000';
  path.linewidth = 2;

  state.paths.push(path);
  state.currentPathIndex = state.paths.length - 1;
  createCombAnchorVisuals();
  updateCombinationPreview();
}

// Reflect shape horizontally
function reflectCombHorizontal() {
  const state = CombinationEditorState;
  const currentPath = state.paths[state.currentPathIndex];
  if (!currentPath) return;

  const centerX = COMB_EDITOR_SIZE / 2;

  currentPath.vertices.forEach(v => {
    v.x = centerX - (v.x - centerX);
  });

  updateCombAnchorPositions();
  updateCombinationPreview();
}

// Reflect shape vertically
function reflectCombVertical() {
  const state = CombinationEditorState;
  const currentPath = state.paths[state.currentPathIndex];
  if (!currentPath) return;

  const centerY = COMB_EDITOR_SIZE / 2;

  currentPath.vertices.forEach(v => {
    v.y = centerY - (v.y - centerY);
  });

  updateCombAnchorPositions();
  updateCombinationPreview();
}

// Setup shape toolbar buttons
function setupCombShapeToolbar() {
  // Add shape buttons
  document.querySelectorAll('.combination-shape-toolbar .tool-action').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const action = this.dataset.action;
      switch (action) {
        case 'comb-add-circle': addCombCircle(); break;
        case 'comb-add-square': addCombSquare(); break;
        case 'comb-add-triangle': addCombTriangle(); break;
        case 'comb-add-hexagon': addCombHexagon(); break;
        case 'comb-reflect-horizontal': reflectCombHorizontal(); break;
        case 'comb-reflect-vertical': reflectCombVertical(); break;
        case 'comb-align-center': alignCombCenter(); break;
        case 'comb-align-top': alignCombTop(); break;
        case 'comb-align-bottom': alignCombBottom(); break;
        case 'comb-align-left': alignCombLeft(); break;
        case 'comb-align-right': alignCombRight(); break;
        case 'comb-boolean-cut': combBooleanCut(); break;
        // comb-toggle-hole handled by executeCombinationToolAction in modalManager.js
        // using the shape editor's toggleHole() which already works with EditorState
      }
    });
  });

  // Upload SVG button
  const uploadBtn = document.getElementById('combShapeUploadBtn');
  const uploadInput = document.getElementById('combShapeUploadInput');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', handleCombSvgUpload);
  }

  // Download SVG button
  const downloadBtn = document.getElementById('combShapeDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadCombSvg);
  }
}

// Align functions (stub implementations - can be expanded)
function alignCombCenter() {
  // Center all selected anchors or current path
  updateCombinationPreview();
}

function alignCombTop() {
  updateCombinationPreview();
}

function alignCombBottom() {
  updateCombinationPreview();
}

function alignCombLeft() {
  updateCombinationPreview();
}

function alignCombRight() {
  updateCombinationPreview();
}

function combBooleanCut() {
  // Boolean cut operation
  updateCombinationPreview();
}

function combToggleHole() {
  // Toggle hole for evenodd fill
  // Use EditorState when in combination mode (for consistency with save/load)
  const state = EditorState.editorMode === 'combination' ? EditorState : CombinationEditorState;
  const pathIndex = state.currentPathIndex;

  if (!state.holePathIndices) state.holePathIndices = [];

  const idx = state.holePathIndices.indexOf(pathIndex);
  if (idx >= 0) {
    state.holePathIndices.splice(idx, 1);
  } else {
    state.holePathIndices.push(pathIndex);
    state.fillRule = 'evenodd';
  }

  // Update path visual to show hole styling
  if (state.paths && state.paths[pathIndex]) {
    const path = state.paths[pathIndex];
    const isHole = state.holePathIndices.includes(pathIndex);
    const isSelected = pathIndex === state.currentPathIndex;
    if (isHole) {
      path.fill = isSelected ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 100, 100, 0.15)';
      path.stroke = isSelected ? '#cc0000' : '#ff6666';
    } else {
      path.fill = isSelected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)';
      path.stroke = isSelected ? '#333' : '#666';
    }
    if (state.two) state.two.update();
  }

  updateCombinationPreview();
}

function handleCombSvgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    // Parse SVG and load into editor
    // This is a simplified implementation
    console.log('SVG upload:', event.target.result);
  };
  reader.readAsText(file);

  e.target.value = '';
}

function downloadCombSvg() {
  // Download current shape as SVG
  const state = CombinationEditorState;
  if (!state.two) return;

  const svg = state.two.renderer.domElement.outerHTML;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'combination-shape.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
