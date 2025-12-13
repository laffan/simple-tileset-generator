/* Editor Event Handlers - Mouse and interaction event handlers */

// Set up mouse event handlers
function setupEditorEvents() {
  const container = document.getElementById('shapeEditorCanvas');
  const svg = container.querySelector('svg');
  if (!svg) return;

  let dragTarget = null;
  let lastMousePos = { x: 0, y: 0 };
  let dragStartPos = { x: 0, y: 0 };  // For axis constraint
  let isDraggingMultiple = false;
  let resizeStartData = null;  // Stores bounds AND original vertex positions
  let rotateStartAngle = 0;
  let constrainedAxis = null;  // 'x' or 'y' for shift+drag

  // Track CMD key for showing/hiding bounding box
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey) {
      if (EditorState.paths.length > 0 && !EditorState.boundingBox) {
        createBoundingBox();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    // Check if the released key is Meta or Control
    if (e.key === 'Meta' || e.key === 'Control') {
      // Only hide if not currently dragging a handle
      if (!dragTarget || (dragTarget.type !== 'resize' && dragTarget.type !== 'rotate')) {
        clearBoundingBox();
      }
    }
  });

  console.log('setupEditorEvents: attaching to SVG', svg);

  svg.addEventListener('mousedown', (e) => {
    console.log('mousedown event fired, shiftKey:', e.shiftKey);
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastMousePos = { x, y };
    dragStartPos = { x, y };
    constrainedAxis = null;
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

    // Check for bounding box handle hits first (only if CMD is held)
    if (e.metaKey || e.ctrlKey) {
      const handleHit = findBoundingBoxHandle(x, y);
      if (handleHit) {
        EditorState.isDragging = true;
        if (handleHit.type === 'rotate') {
          const bbox = EditorState.boundingBox.bounds;
          rotateStartAngle = Math.atan2(y - bbox.centerY, x - bbox.centerX);
          dragTarget = { type: 'rotate', center: { x: bbox.centerX, y: bbox.centerY } };
        } else {
          // Store bounds AND original vertex positions for resize
          const currentPath = getCurrentPath();
          const bounds = { ...EditorState.boundingBox.bounds };
          const originalVertices = currentPath.vertices.map(v => {
            const absPos = getAbsolutePosition(v);
            return {
              x: absPos.x,
              y: absPos.y,
              ctrlLeftX: v.controls ? v.controls.left.x : 0,
              ctrlLeftY: v.controls ? v.controls.left.y : 0,
              ctrlRightX: v.controls ? v.controls.right.x : 0,
              ctrlRightY: v.controls ? v.controls.right.y : 0
            };
          });
          resizeStartData = { bounds, originalVertices };
          dragTarget = { type: 'resize', handleId: handleHit.handleId };
        }
        return;
      }
    }

    // Shift+click on paths for multi-path selection (check BEFORE anchors)
    if (e.shiftKey) {
      console.log('Shift key detected, checking for path hit at', x, y);
      const pathHit = findPathAtPosition(x, y);
      console.log('Path hit result:', pathHit);
      if (pathHit) {
        console.log('Calling togglePathSelection with index:', pathHit.pathIndex);
        togglePathSelection(pathHit.pathIndex);
        return;
      }
    }

    // Check for anchor/control point hits
    const anchorHit = findAnchorAtPosition(x, y);
    if (anchorHit) {
      if (anchorHit.type === 'anchor') {
        // Handle shift+click for multi-select
        if (e.shiftKey) {
          toggleAnchorSelection(anchorHit.data);
          // If anchor is now selected, prepare for drag
          if (isAnchorSelected(anchorHit.data)) {
            EditorState.isDragging = true;
            isDraggingMultiple = true;
            dragTarget = { type: 'multiAnchor' };
          } else {
            // Deselected - don't start drag
            EditorState.isDragging = false;
            dragTarget = null;
          }
        } else {
          // Normal click - if clicking on already selected anchor, drag all selected
          EditorState.isDragging = true;
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
        EditorState.isDragging = true;
        dragTarget = anchorHit;
        isDraggingMultiple = false;
      }
      return;
    }

    // If no anchor hit, check if clicking on any path shape
    const pathHit = findPathAtPosition(x, y);
    if (pathHit) {
      // Clear multi-path selection on regular click
      clearPathSelection();

      // If clicked on a different path, select it first
      if (pathHit.pathIndex !== EditorState.currentPathIndex) {
        selectPath(pathHit.pathIndex);
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

    // Clicked on empty space
    // If anything is selected, deselect first
    if (EditorState.selectedAnchors.length > 0) {
      clearAnchorSelection();
      return;
    }

    // Nothing selected - add point for new shape
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
      let currentAngle = Math.atan2(y - center.y, x - center.x);

      // Shift+rotate snaps to 45° increments
      if (e.shiftKey) {
        const snapAngle = Math.PI / 4;  // 45 degrees
        currentAngle = Math.round(currentAngle / snapAngle) * snapAngle;
      }

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
    } else if (dragTarget.type === 'resize' && resizeStartData) {
      // Resize based on handle - use original positions
      const handleId = dragTarget.handleId;
      const bounds = resizeStartData.bounds;
      const center = { x: bounds.centerX, y: bounds.centerY };
      const halfWidth = bounds.width / 2;
      const halfHeight = bounds.height / 2;

      let scaleX = 1, scaleY = 1;

      // Calculate scale based on mouse position relative to center and original bounds
      if (handleId === 'se') {
        scaleX = halfWidth > 0 ? (x - center.x) / halfWidth : 1;
        scaleY = halfHeight > 0 ? (y - center.y) / halfHeight : 1;
      } else if (handleId === 'nw') {
        scaleX = halfWidth > 0 ? (center.x - x) / halfWidth : 1;
        scaleY = halfHeight > 0 ? (center.y - y) / halfHeight : 1;
      } else if (handleId === 'ne') {
        scaleX = halfWidth > 0 ? (x - center.x) / halfWidth : 1;
        scaleY = halfHeight > 0 ? (center.y - y) / halfHeight : 1;
      } else if (handleId === 'sw') {
        scaleX = halfWidth > 0 ? (center.x - x) / halfWidth : 1;
        scaleY = halfHeight > 0 ? (y - center.y) / halfHeight : 1;
      } else if (handleId === 'n') {
        scaleY = halfHeight > 0 ? (center.y - y) / halfHeight : 1;
      } else if (handleId === 's') {
        scaleY = halfHeight > 0 ? (y - center.y) / halfHeight : 1;
      } else if (handleId === 'e') {
        scaleX = halfWidth > 0 ? (x - center.x) / halfWidth : 1;
      } else if (handleId === 'w') {
        scaleX = halfWidth > 0 ? (center.x - x) / halfWidth : 1;
      }

      // Shift+resize maintains aspect ratio (proportional scaling)
      if (e.shiftKey) {
        // For corner handles, use the larger scale for both axes
        if (['nw', 'ne', 'se', 'sw'].includes(handleId)) {
          const uniformScale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
          // Preserve the sign of each scale
          scaleX = uniformScale * Math.sign(scaleX || 1);
          scaleY = uniformScale * Math.sign(scaleY || 1);
        }
        // Edge handles remain single-axis (no aspect ratio to maintain)
      }

      // Apply scale to ORIGINAL vertex positions
      resizeStartData.originalVertices.forEach((orig, i) => {
        const vertex = currentPath.vertices[i];
        const relX = orig.x - center.x;
        const relY = orig.y - center.y;
        const newX = center.x + relX * scaleX;
        const newY = center.y + relY * scaleY;
        vertex.x = newX - currentPath.translation.x;
        vertex.y = newY - currentPath.translation.y;

        // Scale control points too
        if (vertex.controls) {
          vertex.controls.left.x = orig.ctrlLeftX * scaleX;
          vertex.controls.left.y = orig.ctrlLeftY * scaleY;
          vertex.controls.right.x = orig.ctrlRightX * scaleX;
          vertex.controls.right.y = orig.ctrlRightY * scaleY;
        }
      });
      updateAnchorVisuals();
      updateBoundingBox();
    } else if (dragTarget.type === 'multiAnchor' || (dragTarget.type === 'anchor' && isDraggingMultiple)) {
      // Move all selected anchors together
      let effectiveDeltaX = deltaX;
      let effectiveDeltaY = deltaY;

      // Shift+drag constrains to axis
      if (e.shiftKey) {
        if (!constrainedAxis) {
          const totalDeltaX = Math.abs(x - dragStartPos.x);
          const totalDeltaY = Math.abs(y - dragStartPos.y);
          if (totalDeltaX > 5 || totalDeltaY > 5) {
            constrainedAxis = totalDeltaX > totalDeltaY ? 'x' : 'y';
          }
        }
        if (constrainedAxis === 'x') {
          effectiveDeltaY = 0;
        } else if (constrainedAxis === 'y') {
          effectiveDeltaX = 0;
        }
      } else {
        constrainedAxis = null;
      }

      EditorState.selectedAnchors.forEach(anchorData => {
        anchorData.vertex.x += effectiveDeltaX;
        anchorData.vertex.y += effectiveDeltaY;
      });
      updateAnchorVisuals();
      updateBoundingBox();
    } else if (dragTarget.type === 'anchor') {
      const vertex = dragTarget.data.vertex;

      // Shift+drag constrains to axis
      if (e.shiftKey) {
        if (!constrainedAxis) {
          const totalDeltaX = Math.abs(x - dragStartPos.x);
          const totalDeltaY = Math.abs(y - dragStartPos.y);
          if (totalDeltaX > 5 || totalDeltaY > 5) {
            constrainedAxis = totalDeltaX > totalDeltaY ? 'x' : 'y';
          }
        }
        // Constrain position based on start position
        if (constrainedAxis === 'x') {
          vertex.x = x - currentPath.translation.x;
          vertex.y = dragStartPos.y - currentPath.translation.y;
        } else if (constrainedAxis === 'y') {
          vertex.x = dragStartPos.x - currentPath.translation.x;
          vertex.y = y - currentPath.translation.y;
        } else {
          vertex.x = x - currentPath.translation.x;
          vertex.y = y - currentPath.translation.y;
        }
      } else {
        constrainedAxis = null;
        vertex.x = x - currentPath.translation.x;
        vertex.y = y - currentPath.translation.y;
      }
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
      let effectiveDeltaX = deltaX;
      let effectiveDeltaY = deltaY;

      // Shift+drag constrains to axis
      if (e.shiftKey) {
        // Determine axis on first significant movement
        if (!constrainedAxis) {
          const totalDeltaX = Math.abs(x - dragStartPos.x);
          const totalDeltaY = Math.abs(y - dragStartPos.y);
          if (totalDeltaX > 5 || totalDeltaY > 5) {
            constrainedAxis = totalDeltaX > totalDeltaY ? 'x' : 'y';
          }
        }
        // Apply constraint
        if (constrainedAxis === 'x') {
          effectiveDeltaY = 0;
        } else if (constrainedAxis === 'y') {
          effectiveDeltaX = 0;
        }
      } else {
        constrainedAxis = null;  // Reset if shift released
      }

      currentPath.vertices.forEach(vertex => {
        vertex.x += effectiveDeltaX;
        vertex.y += effectiveDeltaY;
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
    resizeStartData = null;
    constrainedAxis = null;
    svg.style.cursor = 'default';
  });

  svg.addEventListener('mouseleave', () => {
    EditorState.isDragging = false;
    dragTarget = null;
    isDraggingMultiple = false;
    resizeStartData = null;
    constrainedAxis = null;
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
    if (!modal || !modal.classList.contains('active')) return;

    // Delete or Backspace to delete selected points or current path
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Prevent browser back navigation on Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
      }

      // If anchors are selected, delete those points
      if (EditorState.selectedAnchors && EditorState.selectedAnchors.length > 0) {
        deleteSelectedPoints();
      } else if (EditorState.paths.length > 1) {
        // No anchors selected - delete current path (if more than one)
        deleteSelectedPath();
      }
    }

    // Escape to undo last point in new shape creation
    if (e.key === 'Escape') {
      if (EditorState.newShapePoints.length > 0) {
        undoLastNewShapePoint();
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
