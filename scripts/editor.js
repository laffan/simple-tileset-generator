/* Shape Editor using Two.js */

let editorTwo = null;
let editorPath = null;
let editorAnchors = [];
let selectedAnchor = null;
let currentEditingShapeIndex = null;
let isDragging = false;

const EDITOR_SIZE = 400;
const ANCHOR_RADIUS = 8;
const CONTROL_RADIUS = 6;

// Initialize the editor
function initEditor() {
  const container = document.getElementById('shapeEditorCanvas');
  container.innerHTML = ''; // Clear any existing content

  editorTwo = new Two({
    width: EDITOR_SIZE,
    height: EDITOR_SIZE,
    type: Two.Types.svg
  }).appendTo(container);

  // Add grid lines for reference
  drawEditorGrid();

  // Set up mouse event handlers
  setupEditorEvents();
}

// Draw a reference grid
function drawEditorGrid() {
  const gridGroup = editorTwo.makeGroup();
  const gridSize = 40;
  const gridColor = '#e0e0e0';

  for (let i = 0; i <= EDITOR_SIZE; i += gridSize) {
    const vLine = editorTwo.makeLine(i, 0, i, EDITOR_SIZE);
    vLine.stroke = gridColor;
    vLine.linewidth = 1;
    gridGroup.add(vLine);

    const hLine = editorTwo.makeLine(0, i, EDITOR_SIZE, i);
    hLine.stroke = gridColor;
    hLine.linewidth = 1;
    gridGroup.add(hLine);
  }

  // Draw center lines
  const centerV = editorTwo.makeLine(EDITOR_SIZE / 2, 0, EDITOR_SIZE / 2, EDITOR_SIZE);
  centerV.stroke = '#ccc';
  centerV.linewidth = 2;
  gridGroup.add(centerV);

  const centerH = editorTwo.makeLine(0, EDITOR_SIZE / 2, EDITOR_SIZE, EDITOR_SIZE / 2);
  centerH.stroke = '#ccc';
  centerH.linewidth = 2;
  gridGroup.add(centerH);

  // Draw red boundary showing the save area
  const boundary = editorTwo.makeRectangle(
    EDITOR_SIZE / 2,  // center x
    EDITOR_SIZE / 2,  // center y
    EDITOR_SHAPE_SIZE,  // width
    EDITOR_SHAPE_SIZE   // height
  );
  boundary.fill = 'transparent';
  boundary.stroke = '#dc3545';
  boundary.linewidth = 2;
  boundary.dashes = [8, 4];
  gridGroup.add(boundary);
}

// Editor margin and scale settings
const EDITOR_MARGIN = 40;
const EDITOR_SHAPE_SIZE = EDITOR_SIZE - EDITOR_MARGIN * 2;

// Convert normalized (0-1) coordinate to editor coordinate
function normalizedToEditor(value) {
  return EDITOR_MARGIN + value * EDITOR_SHAPE_SIZE;
}

// Convert normalized control point offset to editor scale
function normalizedControlToEditor(value) {
  return value * EDITOR_SHAPE_SIZE;
}

// Load an existing shape into the editor
function loadShapeIntoEditor(shapeName) {
  // Get shape data from registry
  const shapeData = getShapePathData(shapeName);

  if (!shapeData || !shapeData.vertices || shapeData.vertices.length === 0) {
    console.warn('No shape data found for:', shapeName);
    return;
  }

  // Convert normalized coordinates to editor coordinates
  const anchors = shapeData.vertices.map((v, index) => {
    const x = normalizedToEditor(v.x);
    const y = normalizedToEditor(v.y);

    // Control points (bezier handles)
    let ctrlLeftX = 0, ctrlLeftY = 0, ctrlRightX = 0, ctrlRightY = 0;
    let command = index === 0 ? Two.Commands.move : Two.Commands.line;

    if (v.ctrlLeft) {
      ctrlLeftX = normalizedControlToEditor(v.ctrlLeft.x);
      ctrlLeftY = normalizedControlToEditor(v.ctrlLeft.y);
      command = Two.Commands.curve;
    }

    if (v.ctrlRight) {
      ctrlRightX = normalizedControlToEditor(v.ctrlRight.x);
      ctrlRightY = normalizedControlToEditor(v.ctrlRight.y);
      command = Two.Commands.curve;
    }

    return new Two.Anchor(x, y, ctrlLeftX, ctrlLeftY, ctrlRightX, ctrlRightY, command);
  });

  // Create the path
  editorPath = editorTwo.makePath(anchors);
  editorPath.fill = 'rgba(0, 0, 0, 0.8)';
  editorPath.stroke = '#333';
  editorPath.linewidth = 2;
  editorPath.closed = shapeData.closed !== false;

  // Create visual anchor points
  createAnchorVisuals();

  editorTwo.update();
}

// Get absolute position of a vertex (accounting for path translation)
function getAbsolutePosition(vertex) {
  return {
    x: vertex.x + editorPath.translation.x,
    y: vertex.y + editorPath.translation.y
  };
}

// Create visual representations of anchor points
function createAnchorVisuals() {
  // Clear existing anchors
  editorAnchors.forEach(a => {
    if (a.circle) editorTwo.remove(a.circle);
    if (a.controlIn) editorTwo.remove(a.controlIn);
    if (a.controlOut) editorTwo.remove(a.controlOut);
    if (a.lineIn) editorTwo.remove(a.lineIn);
    if (a.lineOut) editorTwo.remove(a.lineOut);
  });
  editorAnchors = [];

  if (!editorPath) return;

  editorPath.vertices.forEach((vertex, index) => {
    const anchorData = {
      vertex: vertex,
      index: index
    };

    // Get absolute position (Two.js auto-centers paths, so vertices are relative to center)
    const absPos = getAbsolutePosition(vertex);

    // Main anchor point
    const circle = editorTwo.makeCircle(absPos.x, absPos.y, ANCHOR_RADIUS);
    circle.fill = '#17a2b8';
    circle.stroke = '#fff';
    circle.linewidth = 2;
    anchorData.circle = circle;

    // Control point handles (for bezier curves)
    if (vertex.controls && (vertex.controls.left.x !== 0 || vertex.controls.left.y !== 0)) {
      const ctrlInX = absPos.x + vertex.controls.left.x;
      const ctrlInY = absPos.y + vertex.controls.left.y;

      const lineIn = editorTwo.makeLine(absPos.x, absPos.y, ctrlInX, ctrlInY);
      lineIn.stroke = '#999';
      lineIn.linewidth = 1;
      anchorData.lineIn = lineIn;

      const controlIn = editorTwo.makeCircle(ctrlInX, ctrlInY, CONTROL_RADIUS);
      controlIn.fill = '#6f42c1';
      controlIn.stroke = '#fff';
      controlIn.linewidth = 1;
      anchorData.controlIn = controlIn;
    }

    if (vertex.controls && (vertex.controls.right.x !== 0 || vertex.controls.right.y !== 0)) {
      const ctrlOutX = absPos.x + vertex.controls.right.x;
      const ctrlOutY = absPos.y + vertex.controls.right.y;

      const lineOut = editorTwo.makeLine(absPos.x, absPos.y, ctrlOutX, ctrlOutY);
      lineOut.stroke = '#999';
      lineOut.linewidth = 1;
      anchorData.lineOut = lineOut;

      const controlOut = editorTwo.makeCircle(ctrlOutX, ctrlOutY, CONTROL_RADIUS);
      controlOut.fill = '#6f42c1';
      controlOut.stroke = '#fff';
      controlOut.linewidth = 1;
      anchorData.controlOut = controlOut;
    }

    editorAnchors.push(anchorData);
  });

  editorTwo.update();
}

// Update anchor visual positions
function updateAnchorVisuals() {
  editorAnchors.forEach(anchorData => {
    const vertex = anchorData.vertex;
    const absPos = getAbsolutePosition(vertex);

    if (anchorData.circle) {
      anchorData.circle.position.set(absPos.x, absPos.y);
    }

    if (anchorData.controlIn) {
      const ctrlInX = absPos.x + vertex.controls.left.x;
      const ctrlInY = absPos.y + vertex.controls.left.y;
      anchorData.controlIn.position.set(ctrlInX, ctrlInY);
      if (anchorData.lineIn) {
        anchorData.lineIn.vertices[0].set(absPos.x, absPos.y);
        anchorData.lineIn.vertices[1].set(ctrlInX, ctrlInY);
      }
    }

    if (anchorData.controlOut) {
      const ctrlOutX = absPos.x + vertex.controls.right.x;
      const ctrlOutY = absPos.y + vertex.controls.right.y;
      anchorData.controlOut.position.set(ctrlOutX, ctrlOutY);
      if (anchorData.lineOut) {
        anchorData.lineOut.vertices[0].set(absPos.x, absPos.y);
        anchorData.lineOut.vertices[1].set(ctrlOutX, ctrlOutY);
      }
    }
  });

  editorTwo.update();
}

// Highlight selected anchor
function highlightAnchor(anchorData) {
  // Reset all anchors
  editorAnchors.forEach(a => {
    if (a.circle) {
      a.circle.fill = '#17a2b8';
      a.circle.radius = ANCHOR_RADIUS;
    }
  });

  // Highlight selected
  if (anchorData && anchorData.circle) {
    anchorData.circle.fill = '#dc3545';
    anchorData.circle.radius = ANCHOR_RADIUS + 2;
  }

  selectedAnchor = anchorData;
  editorTwo.update();
}

// Find anchor at position
function findAnchorAtPosition(x, y) {
  for (let i = editorAnchors.length - 1; i >= 0; i--) {
    const anchorData = editorAnchors[i];
    const vertex = anchorData.vertex;
    const absPos = getAbsolutePosition(vertex);
    const dist = Math.sqrt(Math.pow(x - absPos.x, 2) + Math.pow(y - absPos.y, 2));
    if (dist <= ANCHOR_RADIUS + 4) {
      return { type: 'anchor', data: anchorData };
    }

    // Check control points
    if (anchorData.controlIn) {
      const ctrlInX = absPos.x + vertex.controls.left.x;
      const ctrlInY = absPos.y + vertex.controls.left.y;
      const distIn = Math.sqrt(Math.pow(x - ctrlInX, 2) + Math.pow(y - ctrlInY, 2));
      if (distIn <= CONTROL_RADIUS + 4) {
        return { type: 'controlIn', data: anchorData };
      }
    }

    if (anchorData.controlOut) {
      const ctrlOutX = absPos.x + vertex.controls.right.x;
      const ctrlOutY = absPos.y + vertex.controls.right.y;
      const distOut = Math.sqrt(Math.pow(x - ctrlOutX, 2) + Math.pow(y - ctrlOutY, 2));
      if (distOut <= CONTROL_RADIUS + 4) {
        return { type: 'controlOut', data: anchorData };
      }
    }
  }
  return null;
}

// Set up mouse event handlers
function setupEditorEvents() {
  const container = document.getElementById('shapeEditorCanvas');
  const svg = container.querySelector('svg');
  if (!svg) return;

  let dragTarget = null;

  svg.addEventListener('mousedown', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = findAnchorAtPosition(x, y);
    if (hit) {
      isDragging = true;
      dragTarget = hit;
      highlightAnchor(hit.data);
    } else {
      highlightAnchor(null);
    }
  });

  svg.addEventListener('mousemove', (e) => {
    if (!isDragging || !dragTarget) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const vertex = dragTarget.data.vertex;

    if (dragTarget.type === 'anchor') {
      // Convert mouse position to relative vertex position (subtract path translation)
      vertex.x = x - editorPath.translation.x;
      vertex.y = y - editorPath.translation.y;
    } else if (dragTarget.type === 'controlIn') {
      // Control points are relative to the absolute vertex position
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.left.x = x - absPos.x;
      vertex.controls.left.y = y - absPos.y;
    } else if (dragTarget.type === 'controlOut') {
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.right.x = x - absPos.x;
      vertex.controls.right.y = y - absPos.y;
    }

    updateAnchorVisuals();
  });

  svg.addEventListener('mouseup', () => {
    isDragging = false;
    dragTarget = null;
  });

  svg.addEventListener('mouseleave', () => {
    isDragging = false;
    dragTarget = null;
  });
}

// Add a new point to the path
function addPointToPath() {
  if (!editorPath) return;

  // Add a point at the center, user can then drag it
  // Convert center position to relative vertex position
  const centerX = EDITOR_SIZE / 2 - editorPath.translation.x;
  const centerY = EDITOR_SIZE / 2 - editorPath.translation.y;

  const newAnchor = new Two.Anchor(
    centerX,
    centerY,
    -20, 0,  // control left
    20, 0,   // control right
    Two.Commands.curve
  );

  editorPath.vertices.push(newAnchor);
  createAnchorVisuals();
}

// Delete the selected point
function deleteSelectedPoint() {
  if (!selectedAnchor || !editorPath) return;
  if (editorPath.vertices.length <= 3) {
    alert('Cannot delete: path must have at least 3 points');
    return;
  }

  const index = selectedAnchor.index;
  editorPath.vertices.splice(index, 1);
  selectedAnchor = null;
  createAnchorVisuals();
}

// Convert a point to/from bezier curve
function togglePointCurve() {
  if (!selectedAnchor) return;

  const vertex = selectedAnchor.vertex;

  if (vertex.controls.left.x === 0 && vertex.controls.left.y === 0 &&
      vertex.controls.right.x === 0 && vertex.controls.right.y === 0) {
    // Add curve handles
    vertex.controls.left.set(-30, 0);
    vertex.controls.right.set(30, 0);
    vertex.command = Two.Commands.curve;
  } else {
    // Remove curve handles
    vertex.controls.left.set(0, 0);
    vertex.controls.right.set(0, 0);
    vertex.command = Two.Commands.line;
  }

  createAnchorVisuals();
}

// Open the editor modal
function openShapeEditor(shapeIndex) {
  currentEditingShapeIndex = shapeIndex;

  const modal = document.getElementById('shapeEditorModal');
  modal.classList.add('active');

  // Initialize editor if needed
  if (!editorTwo) {
    initEditor();
  }

  // Load the shape
  const shapeName = shapeOrder[shapeIndex];
  loadShapeIntoEditor(shapeName);
}

// Close the editor modal
function closeShapeEditor() {
  const modal = document.getElementById('shapeEditorModal');
  modal.classList.remove('active');

  // Clean up
  if (editorTwo) {
    editorTwo.clear();
    editorTwo = null;
  }
  editorPath = null;
  editorAnchors = [];
  selectedAnchor = null;
  currentEditingShapeIndex = null;
}

// Convert editor coordinate back to normalized (0-1) value
function editorToNormalized(value) {
  return (value - EDITOR_MARGIN) / EDITOR_SHAPE_SIZE;
}

// Convert editor control point offset back to normalized scale
function editorControlToNormalized(value) {
  return value / EDITOR_SHAPE_SIZE;
}

// Save the edited shape
function saveEditedShape() {
  if (!editorPath || currentEditingShapeIndex === null) {
    closeShapeEditor();
    return;
  }

  // Convert editor path to normalized path data
  const vertices = [];

  editorPath.vertices.forEach(vertex => {
    // Get absolute position
    const absX = vertex.x + editorPath.translation.x;
    const absY = vertex.y + editorPath.translation.y;

    // Convert to normalized coordinates
    const v = {
      x: editorToNormalized(absX),
      y: editorToNormalized(absY)
    };

    // Add control points if they exist and are non-zero
    if (vertex.controls) {
      if (vertex.controls.left.x !== 0 || vertex.controls.left.y !== 0) {
        v.ctrlLeft = {
          x: editorControlToNormalized(vertex.controls.left.x),
          y: editorControlToNormalized(vertex.controls.left.y)
        };
      }
      if (vertex.controls.right.x !== 0 || vertex.controls.right.y !== 0) {
        v.ctrlRight = {
          x: editorControlToNormalized(vertex.controls.right.x),
          y: editorControlToNormalized(vertex.controls.right.y)
        };
      }
    }

    vertices.push(v);
  });

  const pathData = {
    vertices: vertices,
    closed: editorPath.closed
  };

  // Get the current shape name
  const currentShapeName = shapeOrder[currentEditingShapeIndex];

  // Generate a new custom shape ID (or reuse if already custom)
  let customId;
  if (isCustomShape(currentShapeName)) {
    // Update existing custom shape
    customId = currentShapeName;
  } else {
    // Create new custom shape
    customId = generateCustomShapeId();
  }

  // Register the custom shape (updates both shapePathData and shapeRenderers)
  registerCustomShape(customId, pathData);

  // Update shapeOrder to use the custom shape ID
  shapeOrder[currentEditingShapeIndex] = customId;

  // Close the editor
  closeShapeEditor();

  // Rebuild the shape list and regenerate tileset
  rebuildShapeList();
  generateTileset();
}

// Set up editor button event listeners
function setupEditorButtons() {
  document.getElementById('closeEditorBtn').addEventListener('click', closeShapeEditor);
  document.getElementById('cancelEditorBtn').addEventListener('click', closeShapeEditor);
  document.getElementById('saveShapeBtn').addEventListener('click', saveEditedShape);
  document.getElementById('addPointBtn').addEventListener('click', addPointToPath);
  document.getElementById('deletePointBtn').addEventListener('click', deleteSelectedPoint);

  // Close modal when clicking outside
  document.getElementById('shapeEditorModal').addEventListener('click', (e) => {
    if (e.target.id === 'shapeEditorModal') {
      closeShapeEditor();
    }
  });
}
