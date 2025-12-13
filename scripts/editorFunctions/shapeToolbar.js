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
}

// Close all tool submenus
function closeAllSubmenus() {
  document.querySelectorAll('.toolbar-tool.active').forEach(tool => {
    tool.classList.remove('active');
  });
}

// Execute a tool action
function executeToolAction(actionType) {
  const currentPath = getCurrentPath();
  if (!currentPath) return;

  switch (actionType) {
    case 'reflect-horizontal':
      reflectPath('horizontal');
      break;
    case 'reflect-vertical':
      reflectPath('vertical');
      break;
    case 'align-center':
      alignPath('center');
      break;
    case 'align-top':
      alignPath('top');
      break;
    case 'align-bottom':
      alignPath('bottom');
      break;
    case 'align-left':
      alignPath('left');
      break;
    case 'align-right':
      alignPath('right');
      break;
    case 'boolean-cut':
      booleanCut();
      break;
  }
}

// Reflect the current path horizontally or vertically
function reflectPath(direction) {
  const currentPath = getCurrentPath();
  if (!currentPath) return;

  // Get bounding box to find center for reflection
  const bbox = getPathBoundingBox(currentPath);
  if (!bbox) return;

  currentPath.vertices.forEach(vertex => {
    const absPos = getAbsolutePosition(vertex);

    if (direction === 'horizontal') {
      // Reflect around vertical center axis
      const newX = bbox.centerX - (absPos.x - bbox.centerX);
      vertex.x = newX - currentPath.translation.x;

      // Also flip control points horizontally
      if (vertex.controls) {
        const tempLeftX = vertex.controls.left.x;
        vertex.controls.left.x = -vertex.controls.right.x;
        vertex.controls.right.x = -tempLeftX;
      }
    } else if (direction === 'vertical') {
      // Reflect around horizontal center axis
      const newY = bbox.centerY - (absPos.y - bbox.centerY);
      vertex.y = newY - currentPath.translation.y;

      // Also flip control points vertically
      if (vertex.controls) {
        const tempLeftY = vertex.controls.left.y;
        vertex.controls.left.y = -vertex.controls.right.y;
        vertex.controls.right.y = -tempLeftY;
      }
    }
  });

  // Reverse vertex order to maintain correct winding
  const reversedVertices = [...currentPath.vertices].reverse();
  // Update vertex positions
  reversedVertices.forEach((v, i) => {
    currentPath.vertices[i].x = v.x;
    currentPath.vertices[i].y = v.y;
    if (v.controls) {
      currentPath.vertices[i].controls = v.controls;
    }
  });

  updateAnchorVisuals();
  updateBoundingBox();
}

// Align the current path to the editor workspace
function alignPath(alignment) {
  const currentPath = getCurrentPath();
  if (!currentPath) return;

  // Get bounding box of current path
  const bbox = getPathBoundingBox(currentPath);
  if (!bbox) return;

  // Editor workspace bounds (with margin)
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

  // Apply delta to all vertices
  currentPath.vertices.forEach(vertex => {
    vertex.x += deltaX;
    vertex.y += deltaY;
  });

  updateAnchorVisuals();
  updateBoundingBox();
}

// Boolean cut operation - subtract current path from overlapping paths
function booleanCut() {
  if (EditorState.paths.length < 2) {
    console.log('Boolean cut requires at least 2 paths');
    return;
  }

  const currentPath = getCurrentPath();
  const currentIndex = EditorState.currentPathIndex;

  // Get polygon points for the cutting shape
  const cuttingPolygon = getPathPolygon(currentPath);
  if (cuttingPolygon.length < 3) return;

  // Check each other path for overlap
  for (let i = 0; i < EditorState.paths.length; i++) {
    if (i === currentIndex) continue;

    const targetPath = EditorState.paths[i];
    const targetPolygon = getPathPolygon(targetPath);
    if (targetPolygon.length < 3) continue;

    // Check if polygons overlap
    if (polygonsOverlap(cuttingPolygon, targetPolygon)) {
      // Perform boolean subtraction
      const result = subtractPolygon(targetPolygon, cuttingPolygon);
      if (result && result.length >= 3) {
        // Update target path with result
        updatePathFromPolygon(targetPath, result);
      }
    }
  }

  updateAnchorVisuals();
  EditorState.two.update();
}

// Get polygon points from a path (ignores bezier curves, uses anchor points)
function getPathPolygon(path) {
  const points = [];
  path.vertices.forEach(vertex => {
    const absPos = {
      x: vertex.x + path.translation.x,
      y: vertex.y + path.translation.y
    };
    points.push(absPos);
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
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

// Check if a point is inside a polygon (ray casting algorithm)
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

// Check if two line segments intersect
function segmentsIntersect(a1, a2, b1, b2) {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

// Cross product direction helper
function direction(p1, p2, p3) {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

// Get intersection point of two line segments
function getSegmentIntersection(a1, a2, b1, b2) {
  const denom = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
  if (Math.abs(denom) < 1e-10) return null;

  const ua = ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / denom;
  const ub = ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: a1.x + ua * (a2.x - a1.x),
      y: a1.y + ua * (a2.y - a1.y)
    };
  }
  return null;
}

// Subtract polygon B from polygon A (Sutherland-Hodgman style clipping)
// This creates a new polygon that is A with the overlapping part of B removed
function subtractPolygon(subjectPoly, clipPoly) {
  // Find all intersection points and build the result polygon
  const result = [];
  const intersections = [];

  // Find all intersection points between the polygons
  for (let i = 0; i < subjectPoly.length; i++) {
    const a1 = subjectPoly[i];
    const a2 = subjectPoly[(i + 1) % subjectPoly.length];

    for (let j = 0; j < clipPoly.length; j++) {
      const b1 = clipPoly[j];
      const b2 = clipPoly[(j + 1) % clipPoly.length];

      const intersection = getSegmentIntersection(a1, a2, b1, b2);
      if (intersection) {
        intersections.push({
          point: intersection,
          subjectEdge: i,
          clipEdge: j,
          t: getParameterOnSegment(a1, a2, intersection)
        });
      }
    }
  }

  if (intersections.length < 2) {
    // No intersection or only touching - return original or empty
    // Check if subject is entirely inside clip
    if (pointInPolygon(subjectPoly[0], clipPoly)) {
      return []; // Completely inside, return empty
    }
    return subjectPoly; // No overlap, return original
  }

  // Build result by walking around subject polygon, switching at intersections
  // This is a simplified approach - walk the subject, add intersection points, skip parts inside clip
  const sortedIntersections = [...intersections].sort((a, b) => {
    if (a.subjectEdge !== b.subjectEdge) return a.subjectEdge - b.subjectEdge;
    return a.t - b.t;
  });

  let resultPoints = [];
  let currentIntersectionIndex = 0;

  for (let i = 0; i < subjectPoly.length; i++) {
    const currentPoint = subjectPoly[i];
    const nextPoint = subjectPoly[(i + 1) % subjectPoly.length];
    const isCurrentInside = pointInPolygon(currentPoint, clipPoly);

    // Add current point if outside clip polygon
    if (!isCurrentInside) {
      resultPoints.push({ ...currentPoint });
    }

    // Add any intersection points on this edge
    while (currentIntersectionIndex < sortedIntersections.length &&
           sortedIntersections[currentIntersectionIndex].subjectEdge === i) {
      const intersection = sortedIntersections[currentIntersectionIndex];
      resultPoints.push({ ...intersection.point });

      // Walk along clip polygon edge in the direction that stays outside subject
      const clipEdge = intersection.clipEdge;
      const wasInside = isCurrentInside;

      // If entering clip region, we need to walk along clip boundary
      if (!wasInside) {
        // Find the next intersection to know where to rejoin
        let nextIntersection = null;
        for (let k = currentIntersectionIndex + 1; k < sortedIntersections.length; k++) {
          nextIntersection = sortedIntersections[k];
          break;
        }
        if (!nextIntersection && sortedIntersections.length > currentIntersectionIndex + 1) {
          nextIntersection = sortedIntersections[0];
        }

        if (nextIntersection) {
          // Walk along clip polygon from current clip edge to next intersection's clip edge
          let walkEdge = clipEdge;
          const targetEdge = nextIntersection.clipEdge;
          const clipLen = clipPoly.length;

          // Determine direction to walk (clockwise or counter-clockwise)
          // We want to walk along the boundary that's outside the subject
          let stepsForward = (targetEdge - walkEdge + clipLen) % clipLen;
          let stepsBackward = (walkEdge - targetEdge + clipLen) % clipLen;

          if (stepsForward <= stepsBackward) {
            // Walk forward
            for (let step = 1; step < stepsForward; step++) {
              const edgeIdx = (walkEdge + step) % clipLen;
              const clipPoint = clipPoly[(edgeIdx + 1) % clipLen];
              if (!pointInPolygon(clipPoint, subjectPoly)) {
                resultPoints.push({ ...clipPoint });
              }
            }
          } else {
            // Walk backward
            for (let step = 1; step < stepsBackward; step++) {
              const edgeIdx = (walkEdge - step + clipLen) % clipLen;
              const clipPoint = clipPoly[edgeIdx];
              if (!pointInPolygon(clipPoint, subjectPoly)) {
                resultPoints.push({ ...clipPoint });
              }
            }
          }
        }
      }

      currentIntersectionIndex++;
    }
  }

  // Remove duplicate points
  const finalResult = [];
  for (const p of resultPoints) {
    if (finalResult.length === 0 ||
        Math.abs(p.x - finalResult[finalResult.length - 1].x) > 0.1 ||
        Math.abs(p.y - finalResult[finalResult.length - 1].y) > 0.1) {
      finalResult.push(p);
    }
  }

  // Check if first and last are duplicates
  if (finalResult.length > 1) {
    const first = finalResult[0];
    const last = finalResult[finalResult.length - 1];
    if (Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1) {
      finalResult.pop();
    }
  }

  return finalResult.length >= 3 ? finalResult : subjectPoly;
}

// Get parameter t (0-1) of a point on a segment
function getParameterOnSegment(a, b, p) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-10) return 0;
  const px = p.x - a.x;
  const py = p.y - a.y;
  return (px * dx + py * dy) / (len * len);
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
