/* Shape Toolbar - Tools for reflecting, aligning, and boolean operations */

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

  // Upload/Download buttons
  const uploadBtn = document.getElementById('shapeUploadBtn');
  const uploadInput = document.getElementById('shapeUploadInput');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', handleShapeUpload);
  }

  const downloadBtn = document.getElementById('shapeDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadShape);
  }
}

// Close all tool submenus
function closeAllSubmenus() {
  document.querySelectorAll('.toolbar-tool.active').forEach(tool => {
    tool.classList.remove('active');
  });
}

// Execute a tool action
function executeToolAction(actionType) {
  console.log('executeToolAction called with:', actionType);
  switch (actionType) {
    case 'add-circle':
      addPrimitiveShape('circle');
      break;
    case 'add-square':
      addPrimitiveShape('square');
      break;
    case 'add-triangle':
      addPrimitiveShape('triangle');
      break;
    case 'add-hexagon':
      addPrimitiveShape('hexagon');
      break;
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
    case 'toggle-hole':
      toggleHole();
      break;
    case 'distribute-horizontal':
      distributePaths('horizontal');
      break;
    case 'distribute-vertical':
      distributePaths('vertical');
      break;
    case 'distribute-along-line':
      distributePaths('along-line');
      break;
  }
}

// Get list of paths to operate on (selected paths or current path)
function getSelectedPaths() {
  if (EditorState.selectedPathIndices.length > 0) {
    return EditorState.selectedPathIndices.map(i => EditorState.paths[i]).filter(p => p);
  }
  const current = getCurrentPath();
  return current ? [current] : [];
}

// ============================================
// ADD PRIMITIVE SHAPES
// ============================================

// Add a primitive shape at the center of the canvas
function addPrimitiveShape(shapeType) {
  const centerX = EDITOR_SIZE / 2;
  const centerY = EDITOR_SIZE / 2;
  const size = EDITOR_SHAPE_SIZE * 0.4; // 40% of the shape area

  let anchors = [];

  switch (shapeType) {
    case 'circle':
      // Circle using bezier curves (4 points)
      const bc = 0.552284749831 * size; // Bezier circle constant
      anchors = [
        new Two.Anchor(centerX, centerY - size, -bc, 0, bc, 0, Two.Commands.curve),
        new Two.Anchor(centerX + size, centerY, 0, -bc, 0, bc, Two.Commands.curve),
        new Two.Anchor(centerX, centerY + size, bc, 0, -bc, 0, Two.Commands.curve),
        new Two.Anchor(centerX - size, centerY, 0, bc, 0, -bc, Two.Commands.curve)
      ];
      break;

    case 'square':
      anchors = [
        new Two.Anchor(centerX - size, centerY - size, 0, 0, 0, 0, Two.Commands.move),
        new Two.Anchor(centerX + size, centerY - size, 0, 0, 0, 0, Two.Commands.line),
        new Two.Anchor(centerX + size, centerY + size, 0, 0, 0, 0, Two.Commands.line),
        new Two.Anchor(centerX - size, centerY + size, 0, 0, 0, 0, Two.Commands.line)
      ];
      break;

    case 'triangle':
      // Equilateral triangle pointing up
      const h = size * Math.sqrt(3); // Height of equilateral triangle
      anchors = [
        new Two.Anchor(centerX, centerY - h * 0.6, 0, 0, 0, 0, Two.Commands.move),
        new Two.Anchor(centerX + size, centerY + h * 0.4, 0, 0, 0, 0, Two.Commands.line),
        new Two.Anchor(centerX - size, centerY + h * 0.4, 0, 0, 0, 0, Two.Commands.line)
      ];
      break;

    case 'hexagon':
      // Regular hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
        const x = centerX + size * Math.cos(angle);
        const y = centerY + size * Math.sin(angle);
        const command = i === 0 ? Two.Commands.move : Two.Commands.line;
        anchors.push(new Two.Anchor(x, y, 0, 0, 0, 0, command));
      }
      break;
  }

  if (anchors.length === 0) return;

  // Create new path
  const path = new Two.Path(anchors);
  path.automatic = false;
  path.fill = 'rgba(0, 0, 0, 0.4)';
  path.stroke = '#666';
  path.linewidth = 2;
  path.closed = true;

  // Add to scene and paths array
  EditorState.paths.push(path);
  EditorState.two.add(path);

  // Select the new path
  EditorState.currentPathIndex = EditorState.paths.length - 1;
  updatePathStyles();
  createAnchorVisuals();
  EditorState.two.update();
}

// Toggle path selection (for shift+click)
function togglePathSelection(pathIndex) {
  const idx = EditorState.selectedPathIndices.indexOf(pathIndex);
  if (idx >= 0) {
    // Removing from selection
    EditorState.selectedPathIndices.splice(idx, 1);
  } else {
    // Adding to selection - also add current path if not already selected
    if (!EditorState.selectedPathIndices.includes(EditorState.currentPathIndex)) {
      EditorState.selectedPathIndices.push(EditorState.currentPathIndex);
    }
    EditorState.selectedPathIndices.push(pathIndex);
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
  const selIdx = EditorState.selectedPathIndices.indexOf(indexToDelete);
  if (selIdx >= 0) {
    EditorState.selectedPathIndices.splice(selIdx, 1);
  }
  // Adjust selection indices for paths after deleted one
  EditorState.selectedPathIndices = EditorState.selectedPathIndices.map(i => i > indexToDelete ? i - 1 : i);

  // Update holePathIndices - remove if deleted, adjust indices for paths after deleted one
  const holeIdx = EditorState.holePathIndices.indexOf(indexToDelete);
  if (holeIdx >= 0) {
    EditorState.holePathIndices.splice(holeIdx, 1);
  }
  EditorState.holePathIndices = EditorState.holePathIndices.map(i => i > indexToDelete ? i - 1 : i);

  // Clear fillRule if no more holes
  if (EditorState.holePathIndices.length === 0) {
    EditorState.fillRule = null;
  }

  // Update visuals
  updatePathStyles();
  createAnchorVisuals();
  updatePathSelectionVisuals();

  return true;
}

// Add path to selection
function addPathToSelection(pathIndex) {
  if (!EditorState.selectedPathIndices.includes(pathIndex)) {
    EditorState.selectedPathIndices.push(pathIndex);
    updatePathSelectionVisuals();
  }
}

// Clear path selection
function clearPathSelection() {
  EditorState.selectedPathIndices = [];
  updatePathSelectionVisuals();
}

// Update visual indication of selected paths
function updatePathSelectionVisuals() {
  // Guard against calls when editor is not active
  if (!EditorState.two || !EditorState.paths) return;

  EditorState.paths.forEach((path, index) => {
    const isSelected = EditorState.selectedPathIndices.includes(index);
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

      // Negate x component of control points (do NOT swap left/right)
      if (vertex.controls) {
        newCtrlLeft = { x: -vertex.controls.left.x, y: vertex.controls.left.y };
        newCtrlRight = { x: -vertex.controls.right.x, y: vertex.controls.right.y };
      }
    } else if (direction === 'vertical') {
      // Reflect y around horizontal center axis
      newY = 2 * bbox.centerY - absY;

      // Negate y component of control points (do NOT swap left/right)
      if (vertex.controls) {
        newCtrlLeft = { x: vertex.controls.left.x, y: -vertex.controls.left.y };
        newCtrlRight = { x: vertex.controls.right.x, y: -vertex.controls.right.y };
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

  if (EditorState.selectedPathIndices.length <= 1) {
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
  const paths = EditorState.selectedPathIndices.map(i => EditorState.paths[i]).filter(p => p);
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
// DISTRIBUTE OPERATIONS
// ============================================

// Distribute paths - requires 3+ selected paths (or all paths if 3+ exist)
function distributePaths(mode) {
  console.log('distributePaths called with mode:', mode);
  console.log('EditorState.paths.length:', EditorState.paths.length);
  console.log('EditorState.selectedPathIndices:', EditorState.selectedPathIndices);

  // First, determine which paths to distribute
  let pathIndices = [];

  // If we have 3+ explicitly selected paths, use those
  if (EditorState.selectedPathIndices.length >= 3) {
    pathIndices = [...EditorState.selectedPathIndices];
  }
  // Otherwise, if there are 3+ paths total, use all of them
  else if (EditorState.paths.length >= 3) {
    pathIndices = EditorState.paths.map((_, i) => i);
  }
  // Not enough paths to distribute
  else {
    console.log('Not enough paths, returning early');
    return;
  }

  console.log('pathIndices:', pathIndices);

  const paths = pathIndices.map(i => EditorState.paths[i]).filter(p => p);
  console.log('paths.length after filter:', paths.length);
  if (paths.length < 3) return;

  // Get bounding boxes for all selected paths
  const pathsWithBboxes = paths.map((path, i) => ({
    path,
    index: pathIndices[i],
    bbox: getPathBoundingBox(path)
  })).filter(p => p.bbox);

  console.log('pathsWithBboxes.length:', pathsWithBboxes.length);
  console.log('bboxes:', pathsWithBboxes.map(p => p.bbox));

  if (pathsWithBboxes.length < 3) return;

  switch (mode) {
    case 'horizontal':
      distributeHorizontally(pathsWithBboxes);
      break;
    case 'vertical':
      distributeVertically(pathsWithBboxes);
      break;
    case 'along-line':
      distributeAlongLine(pathsWithBboxes);
      break;
  }

  console.log('Distribution complete, updating visuals');
  updateAnchorVisuals();
  updateBoundingBox();
  EditorState.two.update();
}

// Distribute paths evenly along horizontal axis
function distributeHorizontally(pathsWithBboxes) {
  // Sort by center X position
  pathsWithBboxes.sort((a, b) => a.bbox.centerX - b.bbox.centerX);

  const leftmost = pathsWithBboxes[0];
  const rightmost = pathsWithBboxes[pathsWithBboxes.length - 1];

  // Calculate total span (from leftmost center to rightmost center)
  const totalSpan = rightmost.bbox.centerX - leftmost.bbox.centerX;
  const spacing = totalSpan / (pathsWithBboxes.length - 1);

  // Move intermediate paths
  for (let i = 1; i < pathsWithBboxes.length - 1; i++) {
    const item = pathsWithBboxes[i];
    const targetX = leftmost.bbox.centerX + spacing * i;
    const deltaX = targetX - item.bbox.centerX;

    item.path.vertices.forEach(vertex => {
      vertex.x += deltaX;
    });
  }
}

// Distribute paths evenly along vertical axis
function distributeVertically(pathsWithBboxes) {
  // Sort by center Y position
  pathsWithBboxes.sort((a, b) => a.bbox.centerY - b.bbox.centerY);

  const topmost = pathsWithBboxes[0];
  const bottommost = pathsWithBboxes[pathsWithBboxes.length - 1];

  // Calculate total span (from topmost center to bottommost center)
  const totalSpan = bottommost.bbox.centerY - topmost.bbox.centerY;
  const spacing = totalSpan / (pathsWithBboxes.length - 1);

  // Move intermediate paths
  for (let i = 1; i < pathsWithBboxes.length - 1; i++) {
    const item = pathsWithBboxes[i];
    const targetY = topmost.bbox.centerY + spacing * i;
    const deltaY = targetY - item.bbox.centerY;

    item.path.vertices.forEach(vertex => {
      vertex.y += deltaY;
    });
  }
}

// Distribute paths evenly along the line between the two farthest apart paths
function distributeAlongLine(pathsWithBboxes) {
  // Find the two paths that are farthest apart
  let maxDistance = 0;
  let endpoint1 = null;
  let endpoint2 = null;

  for (let i = 0; i < pathsWithBboxes.length; i++) {
    for (let j = i + 1; j < pathsWithBboxes.length; j++) {
      const dx = pathsWithBboxes[j].bbox.centerX - pathsWithBboxes[i].bbox.centerX;
      const dy = pathsWithBboxes[j].bbox.centerY - pathsWithBboxes[i].bbox.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > maxDistance) {
        maxDistance = distance;
        endpoint1 = pathsWithBboxes[i];
        endpoint2 = pathsWithBboxes[j];
      }
    }
  }

  if (!endpoint1 || !endpoint2 || maxDistance === 0) return;

  // Get all paths except the two endpoints
  const otherPaths = pathsWithBboxes.filter(p => p !== endpoint1 && p !== endpoint2);

  // Calculate the line direction vector
  const lineX = endpoint2.bbox.centerX - endpoint1.bbox.centerX;
  const lineY = endpoint2.bbox.centerY - endpoint1.bbox.centerY;

  // Project each path onto the line and calculate its position parameter (0-1)
  otherPaths.forEach(item => {
    const dx = item.bbox.centerX - endpoint1.bbox.centerX;
    const dy = item.bbox.centerY - endpoint1.bbox.centerY;
    // Project onto the line (dot product divided by line length squared)
    item.projectionT = (dx * lineX + dy * lineY) / (maxDistance * maxDistance);
  });

  // Sort by projection parameter
  otherPaths.sort((a, b) => a.projectionT - b.projectionT);

  // Calculate even spacing along the line
  const numSegments = otherPaths.length + 1;

  // Move each path to its evenly spaced position on the line
  otherPaths.forEach((item, i) => {
    const t = (i + 1) / numSegments;
    const targetX = endpoint1.bbox.centerX + t * lineX;
    const targetY = endpoint1.bbox.centerY + t * lineY;
    const deltaX = targetX - item.bbox.centerX;
    const deltaY = targetY - item.bbox.centerY;

    item.path.vertices.forEach(vertex => {
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

// ============================================
// TOGGLE HOLE OPERATION
// ============================================

// Toggle whether the current path is a hole-cutting shape
function toggleHole() {
  const currentIndex = EditorState.currentPathIndex;
  const currentPath = getCurrentPath();
  if (!currentPath) return;

  // Check if current path is already a hole
  const holeIndex = EditorState.holePathIndices.indexOf(currentIndex);
  const isCurrentlyHole = holeIndex >= 0;

  if (isCurrentlyHole) {
    // Remove from hole list - make it a normal shape
    EditorState.holePathIndices.splice(holeIndex, 1);

    // If no more holes, clear the fillRule
    if (EditorState.holePathIndices.length === 0) {
      EditorState.fillRule = null;
    }
  } else {
    // Make it a hole
    EditorState.holePathIndices.push(currentIndex);

    // Set fillRule to evenodd if not already set
    if (!EditorState.fillRule) {
      EditorState.fillRule = 'evenodd';
    }
  }

  // Update path visual styles
  updatePathStyles();
  EditorState.two.update();
}

// Get polygon points from a path, sampling bezier curves for smooth results
function getPathPolygon(path, samplesPerCurve = 8) {
  const points = [];
  const vertices = path.vertices;
  const tx = path.translation.x;
  const ty = path.translation.y;

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const nextV = vertices[(i + 1) % vertices.length];

    // Add current vertex
    points.push({ x: v.x + tx, y: v.y + ty });

    // Check if the segment to next vertex is a bezier curve
    const hasCtrlOut = v.controls && (v.controls.right.x !== 0 || v.controls.right.y !== 0);
    const hasCtrlIn = nextV.controls && (nextV.controls.left.x !== 0 || nextV.controls.left.y !== 0);

    if (hasCtrlOut || hasCtrlIn) {
      // Sample the bezier curve
      const p0 = { x: v.x + tx, y: v.y + ty };
      const p3 = { x: nextV.x + tx, y: nextV.y + ty };
      const p1 = hasCtrlOut
        ? { x: p0.x + v.controls.right.x, y: p0.y + v.controls.right.y }
        : p0;
      const p2 = hasCtrlIn
        ? { x: p3.x + nextV.controls.left.x, y: p3.y + nextV.controls.left.y }
        : p3;

      // Add intermediate points along the curve (skip t=0 and t=1 as they're the endpoints)
      for (let j = 1; j < samplesPerCurve; j++) {
        const t = j / samplesPerCurve;
        const point = cubicBezierPoint(p0, p1, p2, p3, t);
        points.push(point);
      }
    }
  }
  return points;
}

// Calculate a point on a cubic bezier curve at parameter t
function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  };
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

// ============================================
// CROP TO BOUNDS (Sutherland-Hodgman clipping)
// ============================================

// Check if crop checkbox is enabled
function isCropEnabled() {
  const checkbox = document.getElementById('cropToBoundsCheckbox');
  return checkbox && checkbox.checked;
}

// Clip normalized path data to 0-1 bounds
function clipPathDataToBounds(pathData) {
  if (!pathData.vertices || pathData.vertices.length < 3) {
    return pathData;
  }

  // First check if any vertex is actually outside the 0-1 bounds
  // If all vertices are within bounds, return original data (preserving control points)
  const needsClipping = pathData.vertices.some(v =>
    v.x < 0 || v.x > 1 || v.y < 0 || v.y > 1
  );

  if (!needsClipping) {
    return pathData; // All within bounds, preserve original with control points
  }

  // Convert vertices to simple polygon points
  const polygon = pathData.vertices.map(v => ({ x: v.x, y: v.y }));

  // Clip against unit square using Sutherland-Hodgman algorithm
  const clipped = sutherlandHodgmanClip(polygon, [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }
  ]);

  if (clipped.length < 3) {
    return pathData; // Keep original if clipping eliminates shape
  }

  // Convert back to pathData format (note: control points are lost when clipping occurs)
  return {
    vertices: clipped.map(p => ({ x: p.x, y: p.y })),
    closed: pathData.closed
  };
}

// Sutherland-Hodgman polygon clipping algorithm
function sutherlandHodgmanClip(polygon, clipPolygon) {
  let output = [...polygon];

  for (let i = 0; i < clipPolygon.length; i++) {
    if (output.length === 0) break;

    const input = output;
    output = [];

    const edgeStart = clipPolygon[i];
    const edgeEnd = clipPolygon[(i + 1) % clipPolygon.length];

    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const previous = input[(j + input.length - 1) % input.length];

      const currentInside = isInsideEdge(current, edgeStart, edgeEnd);
      const previousInside = isInsideEdge(previous, edgeStart, edgeEnd);

      if (currentInside) {
        if (!previousInside) {
          // Entering - add intersection point
          const intersection = lineIntersection(previous, current, edgeStart, edgeEnd);
          if (intersection) output.push(intersection);
        }
        output.push(current);
      } else if (previousInside) {
        // Leaving - add intersection point
        const intersection = lineIntersection(previous, current, edgeStart, edgeEnd);
        if (intersection) output.push(intersection);
      }
    }
  }

  return output;
}

// Check if point is inside (to the left of) the edge
function isInsideEdge(point, edgeStart, edgeEnd) {
  return (edgeEnd.x - edgeStart.x) * (point.y - edgeStart.y) -
         (edgeEnd.y - edgeStart.y) * (point.x - edgeStart.x) >= 0;
}

// Line intersection helper for clipping
function lineIntersection(p1, p2, p3, p4) {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;

  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;
  const t = (dx * d2y - dy * d2x) / cross;

  return {
    x: p1.x + t * d1x,
    y: p1.y + t * d1y
  };
}

// ============================================
// UPLOAD/DOWNLOAD SHAPE FUNCTIONS
// ============================================

// Download the current shape as an SVG file
function downloadShape() {
  if (!EditorState.paths || EditorState.paths.length === 0) return;

  // Convert editor paths to normalized path data
  const pathDataList = EditorState.paths.map(path => pathToNormalizedData(path));

  // Create SVG content
  const svgSize = 100; // Use 100x100 viewBox for clean coordinates
  let pathStrings = [];

  pathDataList.forEach((pathData, index) => {
    const d = pathDataToSVGPath(pathData, svgSize);
    const isHole = EditorState.holePathIndices.includes(index);
    // Mark holes with a data attribute for round-trip
    const holeAttr = isHole ? ' data-hole="true"' : '';
    pathStrings.push(`  <path d="${d}"${holeAttr} />`);
  });

  // Build SVG with metadata for round-trip
  const fillRule = EditorState.fillRule || 'nonzero';
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" fill-rule="${fillRule}">
${pathStrings.join('\n')}
</svg>`;

  // Download
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const link = document.createElement('a');
  link.download = 'shape.svg';
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Convert normalized path data to SVG path string
function pathDataToSVGPath(pathData, svgSize) {
  if (!pathData.vertices || pathData.vertices.length === 0) return '';

  const commands = [];
  const vertices = pathData.vertices;

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const x = (v.x * svgSize).toFixed(2);
    const y = (v.y * svgSize).toFixed(2);

    if (i === 0) {
      commands.push(`M ${x} ${y}`);
    } else {
      const prevV = vertices[i - 1];
      const hasCtrlOut = prevV.ctrlRight && (prevV.ctrlRight.x !== 0 || prevV.ctrlRight.y !== 0);
      const hasCtrlIn = v.ctrlLeft && (v.ctrlLeft.x !== 0 || v.ctrlLeft.y !== 0);

      if (hasCtrlOut || hasCtrlIn) {
        // Bezier curve
        const prevX = prevV.x * svgSize;
        const prevY = prevV.y * svgSize;
        const cp1x = hasCtrlOut ? (prevX + prevV.ctrlRight.x * svgSize).toFixed(2) : prevX.toFixed(2);
        const cp1y = hasCtrlOut ? (prevY + prevV.ctrlRight.y * svgSize).toFixed(2) : prevY.toFixed(2);
        const cp2x = hasCtrlIn ? (v.x * svgSize + v.ctrlLeft.x * svgSize).toFixed(2) : x;
        const cp2y = hasCtrlIn ? (v.y * svgSize + v.ctrlLeft.y * svgSize).toFixed(2) : y;
        commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`);
      } else {
        commands.push(`L ${x} ${y}`);
      }
    }
  }

  // Handle closing segment with potential curve
  if (pathData.closed !== false && vertices.length > 1) {
    const lastV = vertices[vertices.length - 1];
    const firstV = vertices[0];
    const hasCtrlOut = lastV.ctrlRight && (lastV.ctrlRight.x !== 0 || lastV.ctrlRight.y !== 0);
    const hasCtrlIn = firstV.ctrlLeft && (firstV.ctrlLeft.x !== 0 || firstV.ctrlLeft.y !== 0);

    if (hasCtrlOut || hasCtrlIn) {
      const lastX = lastV.x * svgSize;
      const lastY = lastV.y * svgSize;
      const firstX = (firstV.x * svgSize).toFixed(2);
      const firstY = (firstV.y * svgSize).toFixed(2);
      const cp1x = hasCtrlOut ? (lastX + lastV.ctrlRight.x * svgSize).toFixed(2) : lastX.toFixed(2);
      const cp1y = hasCtrlOut ? (lastY + lastV.ctrlRight.y * svgSize).toFixed(2) : lastY.toFixed(2);
      const cp2x = hasCtrlIn ? (firstV.x * svgSize + firstV.ctrlLeft.x * svgSize).toFixed(2) : firstX;
      const cp2y = hasCtrlIn ? (firstV.y * svgSize + firstV.ctrlLeft.y * svgSize).toFixed(2) : firstY;
      commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${firstX} ${firstY}`);
    }
    commands.push('Z');
  }

  return commands.join(' ');
}

// Handle SVG file upload
function handleShapeUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const svgContent = event.target.result;
    loadShapeFromSVG(svgContent);
  };
  reader.readAsText(file);

  // Reset input
  e.target.value = '';
}

// Load shape from SVG content
function loadShapeFromSVG(svgContent) {
  // Parse SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svg = doc.querySelector('svg');

  if (!svg) {
    console.warn('Invalid SVG file');
    return;
  }

  // Get viewBox for coordinate transformation
  const viewBox = svg.getAttribute('viewBox');
  let svgWidth = 100, svgHeight = 100;
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(parseFloat);
    if (parts.length >= 4) {
      svgWidth = parts[2];
      svgHeight = parts[3];
    }
  }

  // Get fill-rule from SVG root
  const fillRule = svg.getAttribute('fill-rule') || 'nonzero';

  // Find all path elements
  const pathElements = svg.querySelectorAll('path');
  if (pathElements.length === 0) {
    console.warn('No paths found in SVG');
    return;
  }

  // Clear existing paths
  EditorState.paths.forEach(path => EditorState.two.remove(path));
  EditorState.paths = [];
  EditorState.currentPathIndex = 0;
  EditorState.holePathIndices = [];
  EditorState.fillRule = fillRule === 'evenodd' ? 'evenodd' : null;

  // Parse each path
  pathElements.forEach((pathEl, index) => {
    const d = pathEl.getAttribute('d');
    if (!d) return;

    const pathData = parseSVGPathData(d, svgWidth, svgHeight);
    if (!pathData || !pathData.vertices || pathData.vertices.length < 2) return;

    // Check if this path is marked as a hole
    const isHole = pathEl.getAttribute('data-hole') === 'true';

    // Create Two.js path
    const isSelected = EditorState.paths.length === 0;
    const path = createPathFromData(pathData, isSelected, isHole);
    EditorState.paths.push(path);
    EditorState.two.add(path);

    if (isHole) {
      EditorState.holePathIndices.push(EditorState.paths.length - 1);
    }
  });

  // If we have holes but no fillRule set, set it
  if (EditorState.holePathIndices.length > 0 && !EditorState.fillRule) {
    EditorState.fillRule = 'evenodd';
  }

  // Update visuals
  createAnchorVisuals();
  EditorState.two.update();
}

// Parse SVG path data string to normalized path data
function parseSVGPathData(d, svgWidth, svgHeight) {
  const vertices = [];
  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;
  let lastCtrlX = null, lastCtrlY = null;
  let closed = false;

  // Tokenize path data
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g) || [];

  let i = 0;
  let currentCommand = '';

  while (i < tokens.length) {
    const token = tokens[i];

    // Check if it's a command
    if (/^[MmLlHhVvCcSsQqTtAaZz]$/.test(token)) {
      currentCommand = token;
      i++;
      continue;
    }

    // Parse based on current command
    switch (currentCommand) {
      case 'M': // Absolute moveto
        currentX = parseFloat(tokens[i]);
        currentY = parseFloat(tokens[i + 1]);
        startX = currentX;
        startY = currentY;
        vertices.push({
          x: currentX / svgWidth,
          y: currentY / svgHeight
        });
        currentCommand = 'L'; // Subsequent coordinates are lineto
        i += 2;
        break;

      case 'm': // Relative moveto
        currentX += parseFloat(tokens[i]);
        currentY += parseFloat(tokens[i + 1]);
        startX = currentX;
        startY = currentY;
        vertices.push({
          x: currentX / svgWidth,
          y: currentY / svgHeight
        });
        currentCommand = 'l';
        i += 2;
        break;

      case 'L': // Absolute lineto
        currentX = parseFloat(tokens[i]);
        currentY = parseFloat(tokens[i + 1]);
        vertices.push({
          x: currentX / svgWidth,
          y: currentY / svgHeight
        });
        i += 2;
        break;

      case 'l': // Relative lineto
        currentX += parseFloat(tokens[i]);
        currentY += parseFloat(tokens[i + 1]);
        vertices.push({
          x: currentX / svgWidth,
          y: currentY / svgHeight
        });
        i += 2;
        break;

      case 'H': // Absolute horizontal lineto
        currentX = parseFloat(tokens[i]);
        vertices.push({
          x: currentX / svgWidth,
          y: currentY / svgHeight
        });
        i += 1;
        break;

      case 'h': // Relative horizontal lineto
        currentX += parseFloat(tokens[i]);
        vertices.push({
          x: currentX / svgWidth,
          y: currentY / svgHeight
        });
        i += 1;
        break;

      case 'V': // Absolute vertical lineto
        currentY = parseFloat(tokens[i]);
        vertices.push({
          x: currentX / svgWidth,
          y: currentY / svgHeight
        });
        i += 1;
        break;

      case 'v': // Relative vertical lineto
        currentY += parseFloat(tokens[i]);
        vertices.push({
          x: currentX / svgWidth,
          y: currentY / svgHeight
        });
        i += 1;
        break;

      case 'C': // Absolute cubic bezier
        {
          const cp1x = parseFloat(tokens[i]);
          const cp1y = parseFloat(tokens[i + 1]);
          const cp2x = parseFloat(tokens[i + 2]);
          const cp2y = parseFloat(tokens[i + 3]);
          const x = parseFloat(tokens[i + 4]);
          const y = parseFloat(tokens[i + 5]);

          // Add control point to previous vertex (outgoing)
          if (vertices.length > 0) {
            const prevVertex = vertices[vertices.length - 1];
            prevVertex.ctrlRight = {
              x: (cp1x - currentX) / svgWidth,
              y: (cp1y - currentY) / svgHeight
            };
          }

          // Add new vertex with incoming control point
          vertices.push({
            x: x / svgWidth,
            y: y / svgHeight,
            ctrlLeft: {
              x: (cp2x - x) / svgWidth,
              y: (cp2y - y) / svgHeight
            }
          });

          lastCtrlX = cp2x;
          lastCtrlY = cp2y;
          currentX = x;
          currentY = y;
          i += 6;
        }
        break;

      case 'c': // Relative cubic bezier
        {
          const cp1x = currentX + parseFloat(tokens[i]);
          const cp1y = currentY + parseFloat(tokens[i + 1]);
          const cp2x = currentX + parseFloat(tokens[i + 2]);
          const cp2y = currentY + parseFloat(tokens[i + 3]);
          const x = currentX + parseFloat(tokens[i + 4]);
          const y = currentY + parseFloat(tokens[i + 5]);

          if (vertices.length > 0) {
            const prevVertex = vertices[vertices.length - 1];
            prevVertex.ctrlRight = {
              x: (cp1x - currentX) / svgWidth,
              y: (cp1y - currentY) / svgHeight
            };
          }

          vertices.push({
            x: x / svgWidth,
            y: y / svgHeight,
            ctrlLeft: {
              x: (cp2x - x) / svgWidth,
              y: (cp2y - y) / svgHeight
            }
          });

          lastCtrlX = cp2x;
          lastCtrlY = cp2y;
          currentX = x;
          currentY = y;
          i += 6;
        }
        break;

      case 'S': // Absolute smooth cubic bezier
        {
          // Reflect previous control point
          let cp1x = currentX;
          let cp1y = currentY;
          if (lastCtrlX !== null) {
            cp1x = 2 * currentX - lastCtrlX;
            cp1y = 2 * currentY - lastCtrlY;
          }

          const cp2x = parseFloat(tokens[i]);
          const cp2y = parseFloat(tokens[i + 1]);
          const x = parseFloat(tokens[i + 2]);
          const y = parseFloat(tokens[i + 3]);

          if (vertices.length > 0) {
            const prevVertex = vertices[vertices.length - 1];
            prevVertex.ctrlRight = {
              x: (cp1x - currentX) / svgWidth,
              y: (cp1y - currentY) / svgHeight
            };
          }

          vertices.push({
            x: x / svgWidth,
            y: y / svgHeight,
            ctrlLeft: {
              x: (cp2x - x) / svgWidth,
              y: (cp2y - y) / svgHeight
            }
          });

          lastCtrlX = cp2x;
          lastCtrlY = cp2y;
          currentX = x;
          currentY = y;
          i += 4;
        }
        break;

      case 's': // Relative smooth cubic bezier
        {
          let cp1x = currentX;
          let cp1y = currentY;
          if (lastCtrlX !== null) {
            cp1x = 2 * currentX - lastCtrlX;
            cp1y = 2 * currentY - lastCtrlY;
          }

          const cp2x = currentX + parseFloat(tokens[i]);
          const cp2y = currentY + parseFloat(tokens[i + 1]);
          const x = currentX + parseFloat(tokens[i + 2]);
          const y = currentY + parseFloat(tokens[i + 3]);

          if (vertices.length > 0) {
            const prevVertex = vertices[vertices.length - 1];
            prevVertex.ctrlRight = {
              x: (cp1x - currentX) / svgWidth,
              y: (cp1y - currentY) / svgHeight
            };
          }

          vertices.push({
            x: x / svgWidth,
            y: y / svgHeight,
            ctrlLeft: {
              x: (cp2x - x) / svgWidth,
              y: (cp2y - y) / svgHeight
            }
          });

          lastCtrlX = cp2x;
          lastCtrlY = cp2y;
          currentX = x;
          currentY = y;
          i += 4;
        }
        break;

      case 'Q': // Absolute quadratic bezier - convert to cubic
        {
          const qx = parseFloat(tokens[i]);
          const qy = parseFloat(tokens[i + 1]);
          const x = parseFloat(tokens[i + 2]);
          const y = parseFloat(tokens[i + 3]);

          // Convert quadratic to cubic control points
          const cp1x = currentX + 2/3 * (qx - currentX);
          const cp1y = currentY + 2/3 * (qy - currentY);
          const cp2x = x + 2/3 * (qx - x);
          const cp2y = y + 2/3 * (qy - y);

          if (vertices.length > 0) {
            const prevVertex = vertices[vertices.length - 1];
            prevVertex.ctrlRight = {
              x: (cp1x - currentX) / svgWidth,
              y: (cp1y - currentY) / svgHeight
            };
          }

          vertices.push({
            x: x / svgWidth,
            y: y / svgHeight,
            ctrlLeft: {
              x: (cp2x - x) / svgWidth,
              y: (cp2y - y) / svgHeight
            }
          });

          lastCtrlX = qx;
          lastCtrlY = qy;
          currentX = x;
          currentY = y;
          i += 4;
        }
        break;

      case 'q': // Relative quadratic bezier
        {
          const qx = currentX + parseFloat(tokens[i]);
          const qy = currentY + parseFloat(tokens[i + 1]);
          const x = currentX + parseFloat(tokens[i + 2]);
          const y = currentY + parseFloat(tokens[i + 3]);

          const cp1x = currentX + 2/3 * (qx - currentX);
          const cp1y = currentY + 2/3 * (qy - currentY);
          const cp2x = x + 2/3 * (qx - x);
          const cp2y = y + 2/3 * (qy - y);

          if (vertices.length > 0) {
            const prevVertex = vertices[vertices.length - 1];
            prevVertex.ctrlRight = {
              x: (cp1x - currentX) / svgWidth,
              y: (cp1y - currentY) / svgHeight
            };
          }

          vertices.push({
            x: x / svgWidth,
            y: y / svgHeight,
            ctrlLeft: {
              x: (cp2x - x) / svgWidth,
              y: (cp2y - y) / svgHeight
            }
          });

          lastCtrlX = qx;
          lastCtrlY = qy;
          currentX = x;
          currentY = y;
          i += 4;
        }
        break;

      case 'Z':
      case 'z':
        closed = true;
        currentX = startX;
        currentY = startY;
        i++;
        break;

      default:
        // Skip unknown commands
        i++;
        break;
    }

    // Reset last control point for non-curve commands
    if (!/[CcSsQqTt]/.test(currentCommand)) {
      lastCtrlX = null;
      lastCtrlY = null;
    }
  }

  return {
    vertices,
    closed
  };
}
