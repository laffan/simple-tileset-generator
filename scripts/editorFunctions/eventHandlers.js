/* Editor Event Handlers - Mouse and interaction event handlers */

// Set up mouse event handlers
function setupEditorEvents() {
  const container = document.getElementById('shapeEditorCanvas');
  const svg = container.querySelector('svg');
  if (!svg) return;

  let dragTarget = null;
  let lastMousePos = { x: 0, y: 0 };
  let isDraggingMultiple = false;

  svg.addEventListener('mousedown', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastMousePos = { x, y };

    // Cancel any new shape creation if we're clicking on something
    if (EditorState.newShapePoints.length > 0) {
      const anchorHit = findAnchorAtPosition(x, y);
      const pathHit = findPathAtPosition(x, y);
      if (anchorHit || pathHit) {
        cancelNewShape();
      }
    }

    // First check for anchor/control point hits (higher priority)
    const anchorHit = findAnchorAtPosition(x, y);
    if (anchorHit) {
      EditorState.isDragging = true;

      if (anchorHit.type === 'anchor') {
        // Handle shift+click for multi-select
        if (e.shiftKey) {
          toggleAnchorSelection(anchorHit.data);
          // If anchor is now selected, prepare for drag
          if (isAnchorSelected(anchorHit.data)) {
            isDraggingMultiple = true;
            dragTarget = { type: 'multiAnchor' };
          } else {
            EditorState.isDragging = false;
            dragTarget = null;
          }
        } else {
          // Normal click - if clicking on already selected anchor, drag all selected
          if (isAnchorSelected(anchorHit.data) && EditorState.selectedAnchors.length > 1) {
            isDraggingMultiple = true;
            dragTarget = { type: 'multiAnchor' };
          } else {
            // Select only this anchor
            selectAnchor(anchorHit.data);
            isDraggingMultiple = false;
            dragTarget = anchorHit;
          }
        }
      } else {
        // Control point hit - single drag only
        dragTarget = anchorHit;
        isDraggingMultiple = false;
      }
      return;
    }

    // If no anchor hit, check if clicking on any path shape
    const pathHit = findPathAtPosition(x, y);
    if (pathHit) {
      // If clicked on a different path, select it first
      if (pathHit.pathIndex !== EditorState.currentPathIndex) {
        selectPath(pathHit.pathIndex);
        updatePathIndicator();
      }

      // Option+drag duplicates the current path
      if (e.altKey) {
        const newPath = duplicateCurrentPath();
        if (newPath) {
          // The duplicated path is now selected, drag that instead
          dragTarget = { type: 'path', path: newPath, pathIndex: EditorState.currentPathIndex };
        } else {
          dragTarget = pathHit;
        }
      } else {
        dragTarget = pathHit;
      }

      EditorState.isDragging = true;
      isDraggingMultiple = false;
      clearAnchorSelection();  // Deselect anchors when grabbing path
      svg.style.cursor = 'grabbing';
      return;
    }

    // Check if clicking near an edge of the current path (to insert a point)
    const edgeHit = findClosestEdge(x, y);
    if (edgeHit) {
      insertPointAtEdge(edgeHit, edgeHit.point.x, edgeHit.point.y);
      return;
    }

    // Clicked on empty space - add point for new shape
    clearAnchorSelection();
    addNewShapePoint(x, y);
  });

  svg.addEventListener('mousemove', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update cursor based on what's under it
    if (!EditorState.isDragging) {
      const anchorHit = findAnchorAtPosition(x, y);
      if (anchorHit) {
        svg.style.cursor = 'pointer';
      } else {
        const pathHit = findPathAtPosition(x, y);
        if (pathHit) {
          svg.style.cursor = 'grab';
        } else {
          const edgeHit = findClosestEdge(x, y);
          svg.style.cursor = edgeHit ? 'cell' : 'crosshair';
        }
      }
    }

    if (!EditorState.isDragging || !dragTarget) return;

    const currentPath = getCurrentPath();
    const deltaX = x - lastMousePos.x;
    const deltaY = y - lastMousePos.y;

    if (dragTarget.type === 'multiAnchor' || (dragTarget.type === 'anchor' && isDraggingMultiple)) {
      // Move all selected anchors together
      EditorState.selectedAnchors.forEach(anchorData => {
        anchorData.vertex.x += deltaX;
        anchorData.vertex.y += deltaY;
      });
    } else if (dragTarget.type === 'anchor') {
      const vertex = dragTarget.data.vertex;
      // Convert mouse position to relative vertex position (subtract path translation)
      vertex.x = x - currentPath.translation.x;
      vertex.y = y - currentPath.translation.y;
    } else if (dragTarget.type === 'controlIn') {
      const vertex = dragTarget.data.vertex;
      // Control points are relative to the absolute vertex position
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.left.x = x - absPos.x;
      vertex.controls.left.y = y - absPos.y;
    } else if (dragTarget.type === 'controlOut') {
      const vertex = dragTarget.data.vertex;
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.right.x = x - absPos.x;
      vertex.controls.right.y = y - absPos.y;
    } else if (dragTarget.type === 'path') {
      // Move entire path by shifting all vertices
      currentPath.vertices.forEach(vertex => {
        vertex.x += deltaX;
        vertex.y += deltaY;
      });
    }

    lastMousePos = { x, y };
    updateAnchorVisuals();
  });

  svg.addEventListener('mouseup', () => {
    EditorState.isDragging = false;
    dragTarget = null;
    isDraggingMultiple = false;
    svg.style.cursor = 'default';
  });

  svg.addEventListener('mouseleave', () => {
    EditorState.isDragging = false;
    dragTarget = null;
    isDraggingMultiple = false;
    svg.style.cursor = 'default';
  });

  // Keyboard event handler for Delete key
  setupKeyboardEvents();
}

// Set up keyboard event handlers
function setupKeyboardEvents() {
  document.addEventListener('keydown', (e) => {
    // Only handle if the editor modal is visible
    const modal = document.getElementById('shapeEditorModal');
    if (!modal || modal.style.display === 'none') return;

    // Delete or Backspace to delete selected points
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Prevent browser back navigation on Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
      }
      deleteSelectedPoints();
    }

    // Escape to cancel new shape creation
    if (e.key === 'Escape') {
      if (EditorState.newShapePoints.length > 0) {
        cancelNewShape();
      }
    }
  });
}

// Set up editor button event listeners
function setupEditorButtons() {
  document.getElementById('closeEditorBtn').addEventListener('click', closeShapeEditor);
  document.getElementById('cancelEditorBtn').addEventListener('click', closeShapeEditor);
  document.getElementById('saveShapeBtn').addEventListener('click', saveEditedShape);

  // Close modal when clicking outside
  document.getElementById('shapeEditorModal').addEventListener('click', (e) => {
    if (e.target.id === 'shapeEditorModal') {
      closeShapeEditor();
    }
  });
}
