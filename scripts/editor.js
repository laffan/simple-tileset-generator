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
}

// Create a default shape (square) for editing
function createDefaultPath() {
  const margin = 40;
  const size = EDITOR_SIZE - margin * 2;

  // Create a simple square path with bezier anchors
  const anchors = [
    new Two.Anchor(margin, margin, 0, 0, 0, 0, Two.Commands.move),
    new Two.Anchor(margin + size, margin, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(margin + size, margin + size, 0, 0, 0, 0, Two.Commands.line),
    new Two.Anchor(margin, margin + size, 0, 0, 0, 0, Two.Commands.line)
  ];

  editorPath = editorTwo.makePath(anchors);
  editorPath.fill = 'rgba(0, 0, 0, 0.8)';
  editorPath.stroke = '#333';
  editorPath.linewidth = 2;
  editorPath.closed = true;

  // Create visual anchor points
  createAnchorVisuals();

  editorTwo.update();
}

// Load an existing shape into the editor
function loadShapeIntoEditor(shapeName) {
  // For now, create a default path
  // In the future, this would load the actual shape data
  createDefaultPath();
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

    // Main anchor point
    const circle = editorTwo.makeCircle(vertex.x, vertex.y, ANCHOR_RADIUS);
    circle.fill = '#17a2b8';
    circle.stroke = '#fff';
    circle.linewidth = 2;
    anchorData.circle = circle;

    // Control point handles (for bezier curves)
    if (vertex.controls && (vertex.controls.left.x !== 0 || vertex.controls.left.y !== 0)) {
      const ctrlInX = vertex.x + vertex.controls.left.x;
      const ctrlInY = vertex.y + vertex.controls.left.y;

      const lineIn = editorTwo.makeLine(vertex.x, vertex.y, ctrlInX, ctrlInY);
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
      const ctrlOutX = vertex.x + vertex.controls.right.x;
      const ctrlOutY = vertex.y + vertex.controls.right.y;

      const lineOut = editorTwo.makeLine(vertex.x, vertex.y, ctrlOutX, ctrlOutY);
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

    if (anchorData.circle) {
      anchorData.circle.position.set(vertex.x, vertex.y);
    }

    if (anchorData.controlIn) {
      const ctrlInX = vertex.x + vertex.controls.left.x;
      const ctrlInY = vertex.y + vertex.controls.left.y;
      anchorData.controlIn.position.set(ctrlInX, ctrlInY);
      if (anchorData.lineIn) {
        anchorData.lineIn.vertices[0].set(vertex.x, vertex.y);
        anchorData.lineIn.vertices[1].set(ctrlInX, ctrlInY);
      }
    }

    if (anchorData.controlOut) {
      const ctrlOutX = vertex.x + vertex.controls.right.x;
      const ctrlOutY = vertex.y + vertex.controls.right.y;
      anchorData.controlOut.position.set(ctrlOutX, ctrlOutY);
      if (anchorData.lineOut) {
        anchorData.lineOut.vertices[0].set(vertex.x, vertex.y);
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
    const dist = Math.sqrt(Math.pow(x - vertex.x, 2) + Math.pow(y - vertex.y, 2));
    if (dist <= ANCHOR_RADIUS + 4) {
      return { type: 'anchor', data: anchorData };
    }

    // Check control points
    if (anchorData.controlIn) {
      const ctrlInX = vertex.x + vertex.controls.left.x;
      const ctrlInY = vertex.y + vertex.controls.left.y;
      const distIn = Math.sqrt(Math.pow(x - ctrlInX, 2) + Math.pow(y - ctrlInY, 2));
      if (distIn <= CONTROL_RADIUS + 4) {
        return { type: 'controlIn', data: anchorData };
      }
    }

    if (anchorData.controlOut) {
      const ctrlOutX = vertex.x + vertex.controls.right.x;
      const ctrlOutY = vertex.y + vertex.controls.right.y;
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
      vertex.x = x;
      vertex.y = y;
    } else if (dragTarget.type === 'controlIn') {
      vertex.controls.left.x = x - vertex.x;
      vertex.controls.left.y = y - vertex.y;
    } else if (dragTarget.type === 'controlOut') {
      vertex.controls.right.x = x - vertex.x;
      vertex.controls.right.y = y - vertex.y;
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
  const newAnchor = new Two.Anchor(
    EDITOR_SIZE / 2,
    EDITOR_SIZE / 2,
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

// Save the edited shape
function saveEditedShape() {
  // For now, just close the modal
  // In the future, this would save the shape data and update the preview
  console.log('Shape saved (not yet implemented)');
  closeShapeEditor();
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
