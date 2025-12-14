/* Editor Point Operations - Add, delete, and toggle point operations */

// Insert a point on an edge at the given position
function insertPointAtEdge(edgeInfo, x, y) {
  const currentPath = getCurrentPath();
  if (!currentPath || !edgeInfo) return null;

  // Convert absolute position to relative (subtract path translation)
  const relX = x - currentPath.translation.x;
  const relY = y - currentPath.translation.y;

  const newAnchor = new Two.Anchor(
    relX,
    relY,
    0, 0,  // no control points initially (straight line)
    0, 0,
    Two.Commands.line
  );

  // Insert after the segment start vertex
  const insertIndex = edgeInfo.segmentIndex + 1;
  currentPath.vertices.splice(insertIndex, 0, newAnchor);
  createAnchorVisuals();

  // Select the new point
  const newAnchorData = EditorState.anchors[insertIndex];
  if (newAnchorData) {
    selectAnchor(newAnchorData);
  }

  return newAnchor;
}

// Add a new point to the current path (legacy function)
function addPointToPath() {
  const currentPath = getCurrentPath();
  if (!currentPath) return;

  // Add a point at the center, user can then drag it
  // Convert center position to relative vertex position
  const centerX = EDITOR_SIZE / 2 - currentPath.translation.x;
  const centerY = EDITOR_SIZE / 2 - currentPath.translation.y;

  const newAnchor = new Two.Anchor(
    centerX,
    centerY,
    -20, 0,  // control left
    20, 0,   // control right
    Two.Commands.curve
  );

  currentPath.vertices.push(newAnchor);
  createAnchorVisuals();
}

// Delete all selected points from the current path
function deleteSelectedPoints() {
  const currentPath = getCurrentPath();
  if (EditorState.selectedAnchors.length === 0 || !currentPath) return;

  // Check if we'd have enough points left
  const remainingCount = currentPath.vertices.length - EditorState.selectedAnchors.length;
  if (remainingCount < 3) {
    // Don't show alert, just don't delete
    return;
  }

  // Get indices to delete (sort in descending order to delete from end first)
  const indicesToDelete = EditorState.selectedAnchors
    .map(a => a.index)
    .sort((a, b) => b - a);

  // Delete vertices from highest index to lowest
  indicesToDelete.forEach(index => {
    currentPath.vertices.splice(index, 1);
  });

  EditorState.selectedAnchors = [];
  createAnchorVisuals();
}

// Delete the selected point from the current path (legacy, now calls deleteSelectedPoints)
function deleteSelectedPoint() {
  deleteSelectedPoints();
}

// Add a point for new shape creation (click on empty canvas)
function addNewShapePoint(x, y) {
  EditorState.newShapePoints.push({ x, y });

  // Visual feedback - draw temporary points
  updateNewShapeVisuals();

  // When we have 3 points, create the new shape
  if (EditorState.newShapePoints.length >= 3) {
    createNewShapeFromPoints();
  }
}

// Update visual feedback for points being created
function updateNewShapeVisuals() {
  // Remove existing temp visuals
  clearNewShapeVisuals();

  // Draw circles for each point
  EditorState.newShapePoints.forEach((pt, i) => {
    const circle = EditorState.two.makeCircle(pt.x, pt.y, 6);
    circle.fill = '#28a745';
    circle.stroke = '#fff';
    circle.linewidth = 2;
    circle._isNewShapeVisual = true;
  });

  // Draw lines connecting points
  for (let i = 1; i < EditorState.newShapePoints.length; i++) {
    const p1 = EditorState.newShapePoints[i - 1];
    const p2 = EditorState.newShapePoints[i];
    const line = EditorState.two.makeLine(p1.x, p1.y, p2.x, p2.y);
    line.stroke = '#28a745';
    line.linewidth = 2;
    line._isNewShapeVisual = true;
  }

  EditorState.two.update();
}

// Clear temporary new shape visuals
function clearNewShapeVisuals() {
  const toRemove = [];
  EditorState.two.scene.children.forEach(child => {
    if (child._isNewShapeVisual) {
      toRemove.push(child);
    }
  });
  toRemove.forEach(child => EditorState.two.remove(child));
}

// Create a new path from the collected points
function createNewShapeFromPoints() {
  if (EditorState.newShapePoints.length < 3) return;

  clearNewShapeVisuals();

  // Create anchors from the points
  const anchors = EditorState.newShapePoints.map((pt, index) => {
    // Points are in absolute coordinates, need to convert to relative
    // New shapes will be centered at their centroid
    return new Two.Anchor(
      pt.x,
      pt.y,
      0, 0,
      0, 0,
      index === 0 ? Two.Commands.move : Two.Commands.line
    );
  });

  // Create the new path
  const newPath = new Two.Path(anchors);
  newPath.automatic = false;
  newPath.fill = 'rgba(0, 0, 0, 0.8)';
  newPath.stroke = '#333';
  newPath.linewidth = 2;
  newPath.closed = true;

  // Add to paths array and scene
  EditorState.paths.push(newPath);
  EditorState.two.add(newPath);

  // Select the new path
  EditorState.currentPathIndex = EditorState.paths.length - 1;
  updatePathStyles();
  createAnchorVisuals();

  // Clear the temporary points
  EditorState.newShapePoints = [];
}

// Cancel new shape creation
function cancelNewShape() {
  clearNewShapeVisuals();
  EditorState.newShapePoints = [];
}

// Undo last point in new shape creation
function undoLastNewShapePoint() {
  if (EditorState.newShapePoints.length === 0) return;

  // Remove the last point
  EditorState.newShapePoints.pop();

  // Update visuals
  updateNewShapeVisuals();
}

// Convert selected points to/from bezier curves
function togglePointCurve() {
  if (EditorState.selectedAnchors.length === 0) return;

  const currentPath = getCurrentPath();
  if (!currentPath) return;

  EditorState.selectedAnchors.forEach(anchorData => {
    const vertex = anchorData.vertex;
    const index = anchorData.index;
    const vertices = currentPath.vertices;
    const numVertices = vertices.length;

    // Get the next vertex (wrapping around for closed paths)
    const nextIndex = (index + 1) % numVertices;
    const nextVertex = vertices[nextIndex];

    // Get the previous vertex (wrapping around for closed paths)
    const prevIndex = (index - 1 + numVertices) % numVertices;
    const prevVertex = vertices[prevIndex];

    if (vertex.controls.left.x === 0 && vertex.controls.left.y === 0 &&
        vertex.controls.right.x === 0 && vertex.controls.right.y === 0) {
      // Add curve handles
      vertex.controls.left.set(-30, 0);
      vertex.controls.right.set(30, 0);
      // Set this vertex's command to curve (for ctrlLeft to take effect on incoming segment)
      vertex.command = Two.Commands.curve;
      // Set the next vertex's command to curve (for ctrlRight to take effect on outgoing segment)
      if (nextVertex && nextIndex !== 0) {
        nextVertex.command = Two.Commands.curve;
      } else if (nextVertex && currentPath.closed) {
        // For closed paths, vertex 0's command affects the closing segment
        nextVertex.command = Two.Commands.curve;
      }
    } else {
      // Remove curve handles
      vertex.controls.left.set(0, 0);
      vertex.controls.right.set(0, 0);

      // Determine if this vertex should be line or curve based on previous vertex's ctrlRight
      const prevHasCtrlRight = prevVertex && prevVertex.controls &&
        (prevVertex.controls.right.x !== 0 || prevVertex.controls.right.y !== 0);
      vertex.command = prevHasCtrlRight ? Two.Commands.curve : Two.Commands.line;

      // Update next vertex's command based on whether this vertex now has ctrlRight
      if (nextVertex) {
        const thisHasCtrlRight = vertex.controls.right.x !== 0 || vertex.controls.right.y !== 0;
        const nextHasCtrlLeft = nextVertex.controls &&
          (nextVertex.controls.left.x !== 0 || nextVertex.controls.left.y !== 0);
        if (nextIndex !== 0 || currentPath.closed) {
          nextVertex.command = (thisHasCtrlRight || nextHasCtrlLeft) ? Two.Commands.curve : Two.Commands.line;
        }
      }
    }
  });

  createAnchorVisuals();
}
