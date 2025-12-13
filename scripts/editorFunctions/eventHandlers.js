/* Editor Event Handlers - Mouse and interaction event handlers */

// Set up mouse event handlers
function setupEditorEvents() {
  const container = document.getElementById('shapeEditorCanvas');
  const svg = container.querySelector('svg');
  if (!svg) return;

  let dragTarget = null;
  let lastMousePos = { x: 0, y: 0 };
  let isDraggingMultiple = false;
  let resizeStartBounds = null;
  let rotateStartAngle = 0;

  svg.addEventListener('mousedown', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastMousePos = { x, y };
    hideGhostPoint();

    // Cancel any new shape creation if we're clicking on something
    if (EditorState.newShapePoints.length > 0) {
      const anchorHit = findAnchorAtPosition(x, y);
      const pathHit = findPathAtPosition(x, y);
      const handleHit = findBoundingBoxHandle(x, y);
      if (anchorHit || pathHit || handleHit) {
        cancelNewShape();
      }
    }

    // Check for bounding box handle hits first
    const handleHit = findBoundingBoxHandle(x, y);
    if (handleHit) {
      EditorState.isDragging = true;
      if (handleHit.type === 'rotate') {
        const bbox = EditorState.boundingBox.bounds;
        rotateStartAngle = Math.atan2(y - bbox.centerY, x - bbox.centerX);
        dragTarget = { type: 'rotate', center: { x: bbox.centerX, y: bbox.centerY } };
      } else {
        resizeStartBounds = { ...EditorState.boundingBox.bounds };
        dragTarget = { type: 'resize', handleId: handleHit.handleId };
      }
      return;
    }

    // Check for anchor/control point hits
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
        createBoundingBox();
      }

      // Option+drag duplicates the current path
      if (e.altKey) {
        const newPath = duplicateCurrentPath();
        if (newPath) {
          // The duplicated path is now selected, drag that instead
          dragTarget = { type: 'path', path: newPath, pathIndex: EditorState.currentPathIndex };
          createBoundingBox();
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
      updateBoundingBox();
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

    // Update cursor and ghost point based on what's under it
    if (!EditorState.isDragging) {
      // Check bounding box handles first
      const handleHit = findBoundingBoxHandle(x, y);
      if (handleHit) {
        svg.style.cursor = handleHit.handle._cursor || 'pointer';
        hideGhostPoint();
      } else {
        const anchorHit = findAnchorAtPosition(x, y);
        if (anchorHit) {
          svg.style.cursor = 'pointer';
          hideGhostPoint();
        } else {
          const pathHit = findPathAtPosition(x, y);
          if (pathHit) {
            svg.style.cursor = 'grab';
            hideGhostPoint();
          } else {
            const edgeHit = findClosestEdge(x, y);
            if (edgeHit) {
              svg.style.cursor = 'default';
              showGhostPoint(edgeHit.point.x, edgeHit.point.y);
            } else {
              svg.style.cursor = 'crosshair';
              hideGhostPoint();
            }
          }
        }
      }
    }

    if (!EditorState.isDragging || !dragTarget) return;

    const currentPath = getCurrentPath();
    const deltaX = x - lastMousePos.x;
    const deltaY = y - lastMousePos.y;

    if (dragTarget.type === 'rotate') {
      // Rotate around center
      const center = dragTarget.center;
      const currentAngle = Math.atan2(y - center.y, x - center.x);
      const angleDelta = currentAngle - rotateStartAngle;
      rotateStartAngle = currentAngle;

      // Rotate all vertices around center
      currentPath.vertices.forEach(vertex => {
        const absPos = getAbsolutePosition(vertex);
        const dx = absPos.x - center.x;
        const dy = absPos.y - center.y;
        const cos = Math.cos(angleDelta);
        const sin = Math.sin(angleDelta);
        const newX = center.x + (dx * cos - dy * sin);
        const newY = center.y + (dx * sin + dy * cos);
        vertex.x = newX - currentPath.translation.x;
        vertex.y = newY - currentPath.translation.y;

        // Also rotate control points
        if (vertex.controls) {
          const ctrlLeftX = vertex.controls.left.x;
          const ctrlLeftY = vertex.controls.left.y;
          vertex.controls.left.x = ctrlLeftX * cos - ctrlLeftY * sin;
          vertex.controls.left.y = ctrlLeftX * sin + ctrlLeftY * cos;

          const ctrlRightX = vertex.controls.right.x;
          const ctrlRightY = vertex.controls.right.y;
          vertex.controls.right.x = ctrlRightX * cos - ctrlRightY * sin;
          vertex.controls.right.y = ctrlRightX * sin + ctrlRightY * cos;
        }
      });
      updateAnchorVisuals();
      updateBoundingBox();
    } else if (dragTarget.type === 'resize') {
      // Resize based on handle
      const handleId = dragTarget.handleId;
      const bounds = resizeStartBounds;
      const center = { x: bounds.centerX, y: bounds.centerY };

      let scaleX = 1, scaleY = 1;

      // Calculate scale based on which handle is being dragged
      if (handleId === 'se') {
        scaleX = (x - center.x) / (bounds.width / 2) || 1;
        scaleY = (y - center.y) / (bounds.height / 2) || 1;
      } else if (handleId === 'nw') {
        scaleX = (center.x - x) / (bounds.width / 2) || 1;
        scaleY = (center.y - y) / (bounds.height / 2) || 1;
      } else if (handleId === 'ne') {
        scaleX = (x - center.x) / (bounds.width / 2) || 1;
        scaleY = (center.y - y) / (bounds.height / 2) || 1;
      } else if (handleId === 'sw') {
        scaleX = (center.x - x) / (bounds.width / 2) || 1;
        scaleY = (y - center.y) / (bounds.height / 2) || 1;
      } else if (handleId === 'n') {
        scaleY = (center.y - y) / (bounds.height / 2) || 1;
      } else if (handleId === 's') {
        scaleY = (y - center.y) / (bounds.height / 2) || 1;
      } else if (handleId === 'e') {
        scaleX = (x - center.x) / (bounds.width / 2) || 1;
      } else if (handleId === 'w') {
        scaleX = (center.x - x) / (bounds.width / 2) || 1;
      }

      // Apply scale to vertices (relative to center)
      const originalBounds = resizeStartBounds;
      currentPath.vertices.forEach((vertex, i) => {
        const absPos = getAbsolutePosition(vertex);
        const relX = absPos.x - originalBounds.centerX;
        const relY = absPos.y - originalBounds.centerY;
        const newX = originalBounds.centerX + relX * scaleX;
        const newY = originalBounds.centerY + relY * scaleY;
        vertex.x = newX - currentPath.translation.x;
        vertex.y = newY - currentPath.translation.y;
      });
      updateAnchorVisuals();
      updateBoundingBox();
    } else if (dragTarget.type === 'multiAnchor' || (dragTarget.type === 'anchor' && isDraggingMultiple)) {
      // Move all selected anchors together
      EditorState.selectedAnchors.forEach(anchorData => {
        anchorData.vertex.x += deltaX;
        anchorData.vertex.y += deltaY;
      });
      updateAnchorVisuals();
      updateBoundingBox();
    } else if (dragTarget.type === 'anchor') {
      const vertex = dragTarget.data.vertex;
      // Convert mouse position to relative vertex position (subtract path translation)
      vertex.x = x - currentPath.translation.x;
      vertex.y = y - currentPath.translation.y;
      updateAnchorVisuals();
      updateBoundingBox();
    } else if (dragTarget.type === 'controlIn') {
      const vertex = dragTarget.data.vertex;
      // Control points are relative to the absolute vertex position
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.left.x = x - absPos.x;
      vertex.controls.left.y = y - absPos.y;
      updateAnchorVisuals();
    } else if (dragTarget.type === 'controlOut') {
      const vertex = dragTarget.data.vertex;
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.right.x = x - absPos.x;
      vertex.controls.right.y = y - absPos.y;
      updateAnchorVisuals();
    } else if (dragTarget.type === 'path') {
      // Move entire path by shifting all vertices
      currentPath.vertices.forEach(vertex => {
        vertex.x += deltaX;
        vertex.y += deltaY;
      });
      updateAnchorVisuals();
      updateBoundingBox();
    }

    lastMousePos = { x, y };
  });

  svg.addEventListener('mouseup', () => {
    EditorState.isDragging = false;
    dragTarget = null;
    isDraggingMultiple = false;
    resizeStartBounds = null;
    svg.style.cursor = 'default';
  });

  svg.addEventListener('mouseleave', () => {
    EditorState.isDragging = false;
    dragTarget = null;
    isDraggingMultiple = false;
    resizeStartBounds = null;
    svg.style.cursor = 'default';
    hideGhostPoint();
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
