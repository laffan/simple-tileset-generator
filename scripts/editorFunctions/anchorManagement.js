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

// Hide anchor points (for transform mode)
function hideAnchorPoints() {
  if (!EditorState.two || !EditorState.anchors) return;

  EditorState.anchors.forEach(anchorData => {
    if (anchorData.circle) anchorData.circle.opacity = 0;
    if (anchorData.controlIn) anchorData.controlIn.opacity = 0;
    if (anchorData.controlOut) anchorData.controlOut.opacity = 0;
    if (anchorData.lineIn) anchorData.lineIn.opacity = 0;
    if (anchorData.lineOut) anchorData.lineOut.opacity = 0;
  });

  EditorState.two.update();
}

// Show anchor points (exit transform mode)
function showAnchorPoints() {
  if (!EditorState.two || !EditorState.anchors) return;

  EditorState.anchors.forEach(anchorData => {
    if (anchorData.circle) anchorData.circle.opacity = 1;
    if (anchorData.controlIn) anchorData.controlIn.opacity = 1;
    if (anchorData.controlOut) anchorData.controlOut.opacity = 1;
    if (anchorData.lineIn) anchorData.lineIn.opacity = 1;
    if (anchorData.lineOut) anchorData.lineOut.opacity = 1;
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

// Show ghost point preview at position
function showGhostPoint(x, y) {
  hideGhostPoint();  // Remove existing ghost point

  const circle = EditorState.two.makeCircle(x, y, ANCHOR_RADIUS);
  circle.fill = 'rgba(23, 162, 184, 0.4)';  // Semi-transparent anchor color
  circle.stroke = 'rgba(255, 255, 255, 0.6)';
  circle.linewidth = 2;

  EditorState.ghostPoint = circle;
  EditorState.two.update();
}

// Hide ghost point preview
function hideGhostPoint() {
  if (EditorState.ghostPoint) {
    EditorState.two.remove(EditorState.ghostPoint);
    EditorState.ghostPoint = null;
    EditorState.two.update();
  }
}

// Calculate bounding box for a path (uses path's own translation, not current path)
function getPathBoundingBox(path) {
  if (!path || !path.vertices || path.vertices.length === 0) return null;

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  // Use the path's own translation, not getCurrentPath()
  const tx = path.translation ? path.translation.x : 0;
  const ty = path.translation ? path.translation.y : 0;

  path.vertices.forEach(vertex => {
    const absX = vertex.x + tx;
    const absY = vertex.y + ty;
    minX = Math.min(minX, absX);
    minY = Math.min(minY, absY);
    maxX = Math.max(maxX, absX);
    maxY = Math.max(maxY, absY);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

// Create bounding box visuals for selected paths (or current path if no multi-selection)
function createBoundingBox() {
  clearBoundingBox();

  // Determine which paths to include in the bounding box
  let pathsToInclude = [];
  if (EditorState.selectedPathIndices && EditorState.selectedPathIndices.length > 1) {
    // Multiple paths selected - include all of them
    pathsToInclude = EditorState.selectedPathIndices.map(i => EditorState.paths[i]).filter(p => p);
  } else {
    // Single path or no selection - use current path
    const currentPath = getCurrentPath();
    if (currentPath) {
      pathsToInclude = [currentPath];
    }
  }

  if (pathsToInclude.length === 0) return;

  // Calculate combined bounding box for all paths
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  pathsToInclude.forEach(path => {
    const pathBbox = getPathBoundingBox(path);
    if (pathBbox) {
      minX = Math.min(minX, pathBbox.x);
      minY = Math.min(minY, pathBbox.y);
      maxX = Math.max(maxX, pathBbox.x + pathBbox.width);
      maxY = Math.max(maxY, pathBbox.y + pathBbox.height);
    }
  });

  if (minX === Infinity) return;

  const bbox = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };

  if (bbox.width === 0 && bbox.height === 0) return;

  const padding = 10;  // Padding around the shape
  const x = bbox.x - padding;
  const y = bbox.y - padding;
  const w = bbox.width + padding * 2;
  const h = bbox.height + padding * 2;

  const bb = {
    bounds: bbox,
    pathsToTransform: pathsToInclude,  // Store which paths to transform
    isMultiSelect: pathsToInclude.length > 1
  };

  // Dashed border rectangle
  const border = EditorState.two.makeRectangle(x + w/2, y + h/2, w, h);
  border.fill = 'transparent';
  border.stroke = '#666';
  border.linewidth = 1;
  border.dashes = [4, 4];
  bb.border = border;

  // Corner handles (for resize)
  const corners = [
    { id: 'nw', x: x, y: y, cursor: 'nwse-resize' },
    { id: 'ne', x: x + w, y: y, cursor: 'nesw-resize' },
    { id: 'se', x: x + w, y: y + h, cursor: 'nwse-resize' },
    { id: 'sw', x: x, y: y + h, cursor: 'nesw-resize' }
  ];

  bb.handles = [];
  corners.forEach(corner => {
    const handle = EditorState.two.makeRectangle(corner.x, corner.y, HANDLE_SIZE * 2, HANDLE_SIZE * 2);
    handle.fill = '#fff';
    handle.stroke = '#666';
    handle.linewidth = 1;
    handle._handleId = corner.id;
    handle._cursor = corner.cursor;
    bb.handles.push(handle);
  });

  // Edge handles (for resize in one direction)
  const edges = [
    { id: 'n', x: x + w/2, y: y, cursor: 'ns-resize' },
    { id: 'e', x: x + w, y: y + h/2, cursor: 'ew-resize' },
    { id: 's', x: x + w/2, y: y + h, cursor: 'ns-resize' },
    { id: 'w', x: x, y: y + h/2, cursor: 'ew-resize' }
  ];

  edges.forEach(edge => {
    const handle = EditorState.two.makeRectangle(edge.x, edge.y, HANDLE_SIZE * 1.5, HANDLE_SIZE * 1.5);
    handle.fill = '#fff';
    handle.stroke = '#666';
    handle.linewidth = 1;
    handle._handleId = edge.id;
    handle._cursor = edge.cursor;
    bb.handles.push(handle);
  });

  // Rotation handle (at top)
  const rotateHandle = EditorState.two.makeCircle(x + w/2, y - 20, HANDLE_SIZE);
  rotateHandle.fill = '#fff';
  rotateHandle.stroke = '#666';
  rotateHandle.linewidth = 1;
  rotateHandle._handleId = 'rotate';
  rotateHandle._cursor = 'crosshair';
  bb.rotateHandle = rotateHandle;

  // Line connecting rotation handle to box
  const rotateLine = EditorState.two.makeLine(x + w/2, y, x + w/2, y - 20);
  rotateLine.stroke = '#666';
  rotateLine.linewidth = 1;
  rotateLine.dashes = [2, 2];
  bb.rotateLine = rotateLine;

  EditorState.boundingBox = bb;
  EditorState.two.update();
}

// Update bounding box position (call after moving/resizing)
function updateBoundingBox() {
  if (EditorState.boundingBox) {
    createBoundingBox();  // Recreate with new positions
  }
}

// Clear bounding box visuals
function clearBoundingBox() {
  if (EditorState.boundingBox) {
    const bb = EditorState.boundingBox;
    if (bb.border) EditorState.two.remove(bb.border);
    if (bb.handles) {
      bb.handles.forEach(h => EditorState.two.remove(h));
    }
    if (bb.rotateHandle) EditorState.two.remove(bb.rotateHandle);
    if (bb.rotateLine) EditorState.two.remove(bb.rotateLine);
    EditorState.boundingBox = null;
  }
}

// Find if clicking on a bounding box handle
function findBoundingBoxHandle(x, y) {
  if (!EditorState.boundingBox) return null;

  const bb = EditorState.boundingBox;

  // Check rotation handle first
  if (bb.rotateHandle) {
    const pos = bb.rotateHandle.position;
    const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
    if (dist <= HANDLE_SIZE + 4) {
      return { type: 'rotate', handle: bb.rotateHandle };
    }
  }

  // Check corner and edge handles
  if (bb.handles) {
    for (const handle of bb.handles) {
      const pos = handle.position;
      const halfSize = HANDLE_SIZE + 2;
      if (x >= pos.x - halfSize && x <= pos.x + halfSize &&
          y >= pos.y - halfSize && y <= pos.y + halfSize) {
        return { type: 'resize', handleId: handle._handleId, handle: handle };
      }
    }
  }

  return null;
}
