/* Shape Toolbar - Tools for reflecting, aligning, and boolean operations */

// Track selected paths for multi-path operations
let selectedPathIndices = [];

// Set up toolbar event listeners
function setupShapeToolbar() {
  const toolbar = document.querySelector('.shape-toolbar');
  if (!toolbar) return;

  // Handle tool clicks to toggle submenu
  toolbar.addEventListener('click', (e) => {
    const tool = e.target.closest('.toolbar-tool');
    const action = e.target.closest('.tool-action');

    if (action) {
      // Handle action click
      e.stopPropagation();
      const actionType = action.dataset.action;
      executeToolAction(actionType);
      closeAllSubmenus();
      return;
    }

    if (tool) {
      // Toggle submenu
      const wasActive = tool.classList.contains('active');
      closeAllSubmenus();
      if (!wasActive) {
        tool.classList.add('active');
      }
    }
  });

  // Close submenus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.shape-toolbar')) {
      closeAllSubmenus();
    }
  });
}

// Close all tool submenus
function closeAllSubmenus() {
  document.querySelectorAll('.toolbar-tool.active').forEach(tool => {
    tool.classList.remove('active');
  });
}

// Execute a tool action
function executeToolAction(actionType) {
  switch (actionType) {
    case 'reflect-horizontal':
      reflectPath('horizontal');
      break;
    case 'reflect-vertical':
      reflectPath('vertical');
      break;
    case 'align-center':
      alignPaths('center');
      break;
    case 'align-top':
      alignPaths('top');
      break;
    case 'align-bottom':
      alignPaths('bottom');
      break;
    case 'align-left':
      alignPaths('left');
      break;
    case 'align-right':
      alignPaths('right');
      break;
    case 'boolean-cut':
      booleanCut();
      break;
  }
}

// Get list of paths to operate on (selected paths or current path)
function getSelectedPaths() {
  if (selectedPathIndices.length > 0) {
    return selectedPathIndices.map(i => EditorState.paths[i]).filter(p => p);
  }
  const current = getCurrentPath();
  return current ? [current] : [];
}

// Toggle path selection (for shift+click)
function togglePathSelection(pathIndex) {
  const idx = selectedPathIndices.indexOf(pathIndex);
  if (idx >= 0) {
    selectedPathIndices.splice(idx, 1);
  } else {
    selectedPathIndices.push(pathIndex);
  }
  updatePathSelectionVisuals();
}

// Delete selected path (if not the last one)
function deleteSelectedPath() {
  // Need at least 2 paths to delete one
  if (EditorState.paths.length < 2) {
    return false;
  }

  // Delete current path
  const indexToDelete = EditorState.currentPathIndex;
  const pathToDelete = EditorState.paths[indexToDelete];

  // Remove from Two.js scene
  EditorState.two.remove(pathToDelete);

  // Remove from paths array
  EditorState.paths.splice(indexToDelete, 1);

  // Update current path index
  if (EditorState.currentPathIndex >= EditorState.paths.length) {
    EditorState.currentPathIndex = EditorState.paths.length - 1;
  }

  // Clear from selection if it was selected
  const selIdx = selectedPathIndices.indexOf(indexToDelete);
  if (selIdx >= 0) {
    selectedPathIndices.splice(selIdx, 1);
  }
  // Adjust selection indices for paths after deleted one
  selectedPathIndices = selectedPathIndices.map(i => i > indexToDelete ? i - 1 : i);

  // Update visuals
  updatePathStyles();
  createAnchorVisuals();
  updatePathSelectionVisuals();

  return true;
}

// Add path to selection
function addPathToSelection(pathIndex) {
  if (!selectedPathIndices.includes(pathIndex)) {
    selectedPathIndices.push(pathIndex);
    updatePathSelectionVisuals();
  }
}

// Clear path selection
function clearPathSelection() {
  selectedPathIndices = [];
  updatePathSelectionVisuals();
}

// Update visual indication of selected paths
function updatePathSelectionVisuals() {
  // Guard against calls when editor is not active
  if (!EditorState.two || !EditorState.paths) return;

  EditorState.paths.forEach((path, index) => {
    const isSelected = selectedPathIndices.includes(index);
    const isCurrent = index === EditorState.currentPathIndex;

    if (isSelected) {
      path.stroke = '#e83e8c'; // Pink for multi-selected
      path.linewidth = 3;
    } else if (isCurrent) {
      path.stroke = '#333';
      path.linewidth = 2;
    } else {
      path.stroke = '#666';
      path.linewidth = 2;
    }
  });
  EditorState.two.update();
}

// Reflect the current path horizontally or vertically
function reflectPath(direction) {
  const currentPath = getCurrentPath();
  if (!currentPath) return;

  // Get bounding box to find center for reflection
  const bbox = getPathBoundingBox(currentPath);
  if (!bbox) return;

  // Store new positions first, then apply
  const newPositions = currentPath.vertices.map(vertex => {
    const absX = vertex.x + currentPath.translation.x;
    const absY = vertex.y + currentPath.translation.y;

    let newX = absX;
    let newY = absY;
    let newCtrlLeft = vertex.controls ? { x: vertex.controls.left.x, y: vertex.controls.left.y } : null;
    let newCtrlRight = vertex.controls ? { x: vertex.controls.right.x, y: vertex.controls.right.y } : null;

    if (direction === 'horizontal') {
      // Reflect x around vertical center axis
      newX = 2 * bbox.centerX - absX;

      // Flip and swap control points
      if (vertex.controls) {
        newCtrlLeft = { x: -vertex.controls.right.x, y: vertex.controls.right.y };
        newCtrlRight = { x: -vertex.controls.left.x, y: vertex.controls.left.y };
      }
    } else if (direction === 'vertical') {
      // Reflect y around horizontal center axis
      newY = 2 * bbox.centerY - absY;

      // Flip and swap control points
      if (vertex.controls) {
        newCtrlLeft = { x: vertex.controls.right.x, y: -vertex.controls.right.y };
        newCtrlRight = { x: vertex.controls.left.x, y: -vertex.controls.left.y };
      }
    }

    return {
      x: newX - currentPath.translation.x,
      y: newY - currentPath.translation.y,
      ctrlLeft: newCtrlLeft,
      ctrlRight: newCtrlRight
    };
  });

  // Apply new positions
  newPositions.forEach((pos, i) => {
    currentPath.vertices[i].x = pos.x;
    currentPath.vertices[i].y = pos.y;
    if (pos.ctrlLeft && currentPath.vertices[i].controls) {
      currentPath.vertices[i].controls.left.x = pos.ctrlLeft.x;
      currentPath.vertices[i].controls.left.y = pos.ctrlLeft.y;
      currentPath.vertices[i].controls.right.x = pos.ctrlRight.x;
      currentPath.vertices[i].controls.right.y = pos.ctrlRight.y;
    }
  });

  updateAnchorVisuals();
  updateBoundingBox();
}

// Align paths - if multiple selected, align to each other; otherwise align to workspace
function alignPaths(alignment) {
  const paths = getSelectedPaths();
  if (paths.length === 0) return;

  if (selectedPathIndices.length <= 1) {
    // Single path or no multi-selection - align to workspace
    alignPathToWorkspace(paths[0], alignment);
  } else {
    // Multiple paths - align to each other
    alignPathsToEachOther(alignment);
  }

  updateAnchorVisuals();
  updateBoundingBox();
  EditorState.two.update();
}

// Align a single path to workspace bounds
function alignPathToWorkspace(path, alignment) {
  const bbox = getPathBoundingBox(path);
  if (!bbox) return;

  const workspaceMin = EDITOR_MARGIN;
  const workspaceMax = EDITOR_SIZE - EDITOR_MARGIN;
  const workspaceCenter = EDITOR_SIZE / 2;

  let deltaX = 0;
  let deltaY = 0;

  switch (alignment) {
    case 'center':
      deltaX = workspaceCenter - bbox.centerX;
      deltaY = workspaceCenter - bbox.centerY;
      break;
    case 'top':
      deltaY = workspaceMin - bbox.y;
      break;
    case 'bottom':
      deltaY = workspaceMax - (bbox.y + bbox.height);
      break;
    case 'left':
      deltaX = workspaceMin - bbox.x;
      break;
    case 'right':
      deltaX = workspaceMax - (bbox.x + bbox.width);
      break;
  }

  path.vertices.forEach(vertex => {
    vertex.x += deltaX;
    vertex.y += deltaY;
  });
}

// Align multiple paths to each other
function alignPathsToEachOther(alignment) {
  const paths = selectedPathIndices.map(i => EditorState.paths[i]).filter(p => p);
  if (paths.length < 2) return;

  // Get bounding boxes for all selected paths
  const bboxes = paths.map(p => getPathBoundingBox(p));

  // Calculate the combined bounding box
  let combinedMinX = Infinity, combinedMinY = Infinity;
  let combinedMaxX = -Infinity, combinedMaxY = -Infinity;

  bboxes.forEach(bbox => {
    if (!bbox) return;
    combinedMinX = Math.min(combinedMinX, bbox.x);
    combinedMinY = Math.min(combinedMinY, bbox.y);
    combinedMaxX = Math.max(combinedMaxX, bbox.x + bbox.width);
    combinedMaxY = Math.max(combinedMaxY, bbox.y + bbox.height);
  });

  const combinedCenterX = (combinedMinX + combinedMaxX) / 2;
  const combinedCenterY = (combinedMinY + combinedMaxY) / 2;

  // Align each path
  paths.forEach((path, i) => {
    const bbox = bboxes[i];
    if (!bbox) return;

    let deltaX = 0;
    let deltaY = 0;

    switch (alignment) {
      case 'center':
        deltaX = combinedCenterX - bbox.centerX;
        deltaY = combinedCenterY - bbox.centerY;
        break;
      case 'top':
        deltaY = combinedMinY - bbox.y;
        break;
      case 'bottom':
        deltaY = combinedMaxY - (bbox.y + bbox.height);
        break;
      case 'left':
        deltaX = combinedMinX - bbox.x;
        break;
      case 'right':
        deltaX = combinedMaxX - (bbox.x + bbox.width);
        break;
    }

    path.vertices.forEach(vertex => {
      vertex.x += deltaX;
      vertex.y += deltaY;
    });
  });
}

// ============================================
// BOOLEAN CUT OPERATION
// ============================================

// Boolean cut operation - subtract current path from overlapping paths
function booleanCut() {
  if (EditorState.paths.length < 2) {
    return;
  }

  const currentPath = getCurrentPath();
  const currentIndex = EditorState.currentPathIndex;

  // Get polygon points for the cutting shape
  const cuttingPolygon = getPathPolygon(currentPath);
  if (cuttingPolygon.length < 3) return;

  // Process each other path
  for (let i = 0; i < EditorState.paths.length; i++) {
    if (i === currentIndex) continue;

    const targetPath = EditorState.paths[i];
    const targetPolygon = getPathPolygon(targetPath);
    if (targetPolygon.length < 3) continue;

    // Check if polygons overlap
    if (polygonsOverlap(cuttingPolygon, targetPolygon)) {
      // Perform boolean subtraction using Weiler-Atherton algorithm
      const result = weilerAthertonDifference(targetPolygon, cuttingPolygon);
      if (result && result.length >= 3) {
        updatePathFromPolygon(targetPath, result);
      }
    }
  }

  createAnchorVisuals();
  EditorState.two.update();
}

// Get polygon points from a path
function getPathPolygon(path) {
  const points = [];
  path.vertices.forEach(vertex => {
    points.push({
      x: vertex.x + path.translation.x,
      y: vertex.y + path.translation.y
    });
  });
  return points;
}

// Check if two polygons overlap
function polygonsOverlap(poly1, poly2) {
  // Check if any point of poly1 is inside poly2
  for (const p of poly1) {
    if (pointInPolygon(p, poly2)) return true;
  }
  // Check if any point of poly2 is inside poly1
  for (const p of poly2) {
    if (pointInPolygon(p, poly1)) return true;
  }
  // Check if any edges intersect
  for (let i = 0; i < poly1.length; i++) {
    const a1 = poly1[i];
    const a2 = poly1[(i + 1) % poly1.length];
    for (let j = 0; j < poly2.length; j++) {
      const b1 = poly2[j];
      const b2 = poly2[(j + 1) % poly2.length];
      if (getLineIntersection(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

// Point in polygon test (ray casting)
function pointInPolygon(point, polygon) {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Get intersection point of two line segments
function getLineIntersection(p1, p2, p3, p4) {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;

  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;

  const t1 = (dx * d2y - dy * d2x) / cross;
  const t2 = (dx * d1y - dy * d1x) / cross;

  if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
    return {
      x: p1.x + t1 * d1x,
      y: p1.y + t1 * d1y,
      t1: t1,
      t2: t2
    };
  }
  return null;
}

// Weiler-Atherton polygon difference (subject - clip)
function weilerAthertonDifference(subject, clip) {
  // Build vertex lists with intersection points
  const subjectList = buildVertexList(subject, clip, true);
  const clipList = buildVertexList(clip, subject, false);

  if (subjectList.intersections === 0) {
    // No intersections - check containment
    if (pointInPolygon(subject[0], clip)) {
      return []; // Subject entirely inside clip - nothing left
    }
    return subject; // No overlap
  }

  // Trace the result polygon
  const result = traceResultPolygon(subjectList.vertices, clipList.vertices, clip);

  return result;
}

// Build vertex list with intersection points inserted
function buildVertexList(poly, otherPoly, isSubject) {
  const vertices = [];
  let intersectionCount = 0;

  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];

    // Add current vertex
    vertices.push({
      x: p1.x,
      y: p1.y,
      isIntersection: false,
      isEntering: false,
      originalIndex: i,
      processed: false
    });

    // Find intersections on this edge
    const edgeIntersections = [];
    for (let j = 0; j < otherPoly.length; j++) {
      const q1 = otherPoly[j];
      const q2 = otherPoly[(j + 1) % otherPoly.length];

      const intersection = getLineIntersection(p1, p2, q1, q2);
      if (intersection && intersection.t1 > 0.001 && intersection.t1 < 0.999) {
        edgeIntersections.push({
          x: intersection.x,
          y: intersection.y,
          t: intersection.t1,
          otherEdge: j,
          otherT: intersection.t2,
          isIntersection: true,
          processed: false
        });
        intersectionCount++;
      }
    }

    // Sort intersections by t and add them
    edgeIntersections.sort((a, b) => a.t - b.t);
    for (const inter of edgeIntersections) {
      // Determine if entering or leaving the other polygon
      // For difference: we want to keep parts of subject that are OUTSIDE clip
      const midPoint = {
        x: inter.x + 0.001 * (p2.x - p1.x),
        y: inter.y + 0.001 * (p2.y - p1.y)
      };
      inter.isEntering = isSubject ? pointInPolygon(midPoint, otherPoly) : !pointInPolygon(midPoint, otherPoly);
      vertices.push(inter);
    }
  }

  return { vertices, intersections: intersectionCount };
}

// Trace the result polygon for difference operation
function traceResultPolygon(subjectVerts, clipVerts, clipPoly) {
  const result = [];

  // Find first vertex of subject that's outside clip
  let startIdx = -1;
  for (let i = 0; i < subjectVerts.length; i++) {
    const v = subjectVerts[i];
    if (!v.isIntersection && !pointInPolygon(v, clipPoly)) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    // All subject vertices inside clip - find entry point
    for (let i = 0; i < subjectVerts.length; i++) {
      if (subjectVerts[i].isIntersection && !subjectVerts[i].isEntering) {
        startIdx = i;
        break;
      }
    }
  }

  if (startIdx === -1) return [];

  // Trace the polygon
  let currentList = subjectVerts;
  let currentIdx = startIdx;
  let onSubject = true;
  let maxIterations = subjectVerts.length + clipVerts.length + 10;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    const v = currentList[currentIdx];

    // Add vertex if not already at this position
    if (result.length === 0 ||
        Math.abs(v.x - result[result.length - 1].x) > 0.5 ||
        Math.abs(v.y - result[result.length - 1].y) > 0.5) {
      result.push({ x: v.x, y: v.y });
    }

    // Check if we've completed the loop
    if (result.length > 2) {
      const first = result[0];
      if (Math.abs(v.x - first.x) < 1 && Math.abs(v.y - first.y) < 1) {
        break;
      }
    }

    // If this is an intersection, switch lists
    if (v.isIntersection && !v.processed) {
      v.processed = true;

      if (onSubject && v.isEntering) {
        // Entering clip - switch to walking clip boundary (backwards for difference)
        onSubject = false;
        currentList = clipVerts;
        currentIdx = findMatchingIntersection(clipVerts, v);
        if (currentIdx === -1) break;
        // Walk backwards on clip
        currentIdx = (currentIdx - 1 + clipVerts.length) % clipVerts.length;
        continue;
      } else if (!onSubject) {
        // On clip, at intersection - switch back to subject
        onSubject = true;
        currentList = subjectVerts;
        currentIdx = findMatchingIntersection(subjectVerts, v);
        if (currentIdx === -1) break;
      }
    }

    // Move to next vertex
    if (onSubject) {
      currentIdx = (currentIdx + 1) % subjectVerts.length;
    } else {
      // Walk backwards on clip for difference
      currentIdx = (currentIdx - 1 + clipVerts.length) % clipVerts.length;
    }

    // Safety check
    if (currentIdx === startIdx && onSubject && result.length > 2) {
      break;
    }
  }

  // Remove duplicate end point if present
  if (result.length > 1) {
    const first = result[0];
    const last = result[result.length - 1];
    if (Math.abs(first.x - last.x) < 1 && Math.abs(first.y - last.y) < 1) {
      result.pop();
    }
  }

  return result.length >= 3 ? result : [];
}

// Find matching intersection point in another vertex list
function findMatchingIntersection(vertices, target) {
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    if (v.isIntersection &&
        Math.abs(v.x - target.x) < 1 &&
        Math.abs(v.y - target.y) < 1) {
      return i;
    }
  }
  return -1;
}

// Update a Two.js path from polygon points
function updatePathFromPolygon(path, polygon) {
  // Clear existing vertices
  while (path.vertices.length > 0) {
    path.vertices.pop();
  }

  // Add new vertices
  polygon.forEach((point, index) => {
    const localX = point.x - path.translation.x;
    const localY = point.y - path.translation.y;

    const command = index === 0 ? Two.Commands.move : Two.Commands.line;
    const anchor = new Two.Anchor(localX, localY, 0, 0, 0, 0, command);
    path.vertices.push(anchor);
  });

  path.closed = true;
  path.automatic = false;
}
