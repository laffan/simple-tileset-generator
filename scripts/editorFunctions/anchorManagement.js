/* Editor Anchor Management - Anchor point visual management */

// Create visual representations of anchor points
function createAnchorVisuals() {
  // Clear existing anchors
  EditorState.anchors.forEach(a => {
    if (a.circle) EditorState.two.remove(a.circle);
    if (a.controlIn) EditorState.two.remove(a.controlIn);
    if (a.controlOut) EditorState.two.remove(a.controlOut);
    if (a.lineIn) EditorState.two.remove(a.lineIn);
    if (a.lineOut) EditorState.two.remove(a.lineOut);
  });
  EditorState.anchors = [];

  const currentPath = getCurrentPath();
  if (!currentPath) return;

  currentPath.vertices.forEach((vertex, index) => {
    const anchorData = {
      vertex: vertex,
      index: index
    };

    // Get absolute position (Two.js auto-centers paths, so vertices are relative to center)
    const absPos = getAbsolutePosition(vertex);

    // Main anchor point
    const circle = EditorState.two.makeCircle(absPos.x, absPos.y, ANCHOR_RADIUS);
    circle.fill = '#17a2b8';
    circle.stroke = '#fff';
    circle.linewidth = 2;
    anchorData.circle = circle;

    // Control point handles (for bezier curves)
    if (vertex.controls && (vertex.controls.left.x !== 0 || vertex.controls.left.y !== 0)) {
      const ctrlInX = absPos.x + vertex.controls.left.x;
      const ctrlInY = absPos.y + vertex.controls.left.y;

      const lineIn = EditorState.two.makeLine(absPos.x, absPos.y, ctrlInX, ctrlInY);
      lineIn.stroke = '#999';
      lineIn.linewidth = 1;
      anchorData.lineIn = lineIn;

      const controlIn = EditorState.two.makeCircle(ctrlInX, ctrlInY, CONTROL_RADIUS);
      controlIn.fill = '#6f42c1';
      controlIn.stroke = '#fff';
      controlIn.linewidth = 1;
      anchorData.controlIn = controlIn;
    }

    if (vertex.controls && (vertex.controls.right.x !== 0 || vertex.controls.right.y !== 0)) {
      const ctrlOutX = absPos.x + vertex.controls.right.x;
      const ctrlOutY = absPos.y + vertex.controls.right.y;

      const lineOut = EditorState.two.makeLine(absPos.x, absPos.y, ctrlOutX, ctrlOutY);
      lineOut.stroke = '#999';
      lineOut.linewidth = 1;
      anchorData.lineOut = lineOut;

      const controlOut = EditorState.two.makeCircle(ctrlOutX, ctrlOutY, CONTROL_RADIUS);
      controlOut.fill = '#6f42c1';
      controlOut.stroke = '#fff';
      controlOut.linewidth = 1;
      anchorData.controlOut = controlOut;
    }

    EditorState.anchors.push(anchorData);
  });

  EditorState.two.update();
}

// Update anchor visual positions
function updateAnchorVisuals() {
  EditorState.anchors.forEach(anchorData => {
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

  EditorState.two.update();
}

// Update visual highlighting based on selectedAnchors array
function updateAnchorHighlights() {
  // Reset all anchors to default style
  EditorState.anchors.forEach(a => {
    if (a.circle) {
      a.circle.fill = '#17a2b8';
      a.circle.radius = ANCHOR_RADIUS;
    }
  });

  // Highlight all selected anchors
  EditorState.selectedAnchors.forEach(anchorData => {
    if (anchorData && anchorData.circle) {
      anchorData.circle.fill = '#dc3545';
      anchorData.circle.radius = ANCHOR_RADIUS + 2;
    }
  });

  EditorState.two.update();
}

// Check if an anchor is currently selected
function isAnchorSelected(anchorData) {
  return EditorState.selectedAnchors.some(a => a.vertex === anchorData.vertex);
}

// Select a single anchor (clears other selections)
function selectAnchor(anchorData) {
  EditorState.selectedAnchors = anchorData ? [anchorData] : [];
  updateAnchorHighlights();
}

// Toggle anchor selection (for shift+click)
function toggleAnchorSelection(anchorData) {
  if (!anchorData) return;

  const index = EditorState.selectedAnchors.findIndex(a => a.vertex === anchorData.vertex);
  if (index >= 0) {
    // Already selected, remove it
    EditorState.selectedAnchors.splice(index, 1);
  } else {
    // Not selected, add it
    EditorState.selectedAnchors.push(anchorData);
  }
  updateAnchorHighlights();
}

// Add anchor to selection (without removing others)
function addToSelection(anchorData) {
  if (!anchorData || isAnchorSelected(anchorData)) return;
  EditorState.selectedAnchors.push(anchorData);
  updateAnchorHighlights();
}

// Clear all anchor selections
function clearAnchorSelection() {
  EditorState.selectedAnchors = [];
  updateAnchorHighlights();
}

// Legacy function for compatibility - now uses multi-select
function highlightAnchor(anchorData) {
  selectAnchor(anchorData);
}

// Find anchor at position
function findAnchorAtPosition(x, y) {
  for (let i = EditorState.anchors.length - 1; i >= 0; i--) {
    const anchorData = EditorState.anchors[i];
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

// Check if a point is inside a path using SVG's native hit testing
function isPointInPath(path, x, y) {
  if (!path || !path._renderer || !path._renderer.elem) return false;

  const svgPath = path._renderer.elem;
  const point = svgPath.ownerSVGElement.createSVGPoint();
  point.x = x;
  point.y = y;

  // Check if point is in fill or on stroke
  return svgPath.isPointInFill(point) || svgPath.isPointInStroke(point);
}

// Find the closest edge of the current path to a point
// Returns { segmentIndex, t, distance, point } or null
function findClosestEdge(x, y, maxDistance = 15) {
  const currentPath = getCurrentPath();
  if (!currentPath || currentPath.vertices.length < 2) return null;

  let closest = null;
  let minDist = maxDistance;

  const vertices = currentPath.vertices;
  const numSegments = currentPath.closed ? vertices.length : vertices.length - 1;

  for (let i = 0; i < numSegments; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];

    const p1 = getAbsolutePosition(v1);
    const p2 = getAbsolutePosition(v2);

    // Find closest point on line segment
    const result = closestPointOnSegment(x, y, p1.x, p1.y, p2.x, p2.y);

    if (result.distance < minDist) {
      minDist = result.distance;
      closest = {
        segmentIndex: i,
        t: result.t,
        distance: result.distance,
        point: { x: result.x, y: result.y }
      };
    }
  }

  return closest;
}

// Helper: find closest point on a line segment
function closestPointOnSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  let t = 0;
  if (lengthSq > 0) {
    t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  }

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

  return { x: closestX, y: closestY, t, distance };
}

// Find if click is on a path shape (not on anchors/controls)
// Checks all paths and returns the clicked one (prioritizing current path)
function findPathAtPosition(x, y) {
  // First check the current path (give it priority)
  const currentPath = getCurrentPath();
  if (currentPath && isPointInPath(currentPath, x, y)) {
    return { type: 'path', path: currentPath, pathIndex: EditorState.currentPathIndex };
  }

  // Then check all other paths
  for (let i = 0; i < EditorState.paths.length; i++) {
    if (i === EditorState.currentPathIndex) continue; // Already checked
    const path = EditorState.paths[i];
    if (isPointInPath(path, x, y)) {
      return { type: 'path', path: path, pathIndex: i };
    }
  }
  return null;
}
