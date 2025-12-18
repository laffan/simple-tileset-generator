/* Editor Path Management - Path creation, loading, and conversion */

// Create a Two.Path from single path data
function createPathFromData(singlePathData, isSelected, isHole) {
  const vertices = singlePathData.vertices;

  const anchors = vertices.map((v, index) => {
    const x = normalizedToEditor(v.x);
    const y = normalizedToEditor(v.y);

    // Control points (bezier handles) - relative offsets from anchor
    let ctrlLeftX = 0, ctrlLeftY = 0, ctrlRightX = 0, ctrlRightY = 0;

    if (v.ctrlLeft) {
      ctrlLeftX = normalizedControlToEditor(v.ctrlLeft.x);
      ctrlLeftY = normalizedControlToEditor(v.ctrlLeft.y);
    }

    if (v.ctrlRight) {
      ctrlRightX = normalizedControlToEditor(v.ctrlRight.x);
      ctrlRightY = normalizedControlToEditor(v.ctrlRight.y);
    }

    // Determine command type - curve if THIS segment (from prev to current) uses bezier
    // A segment is curved if prev has ctrlRight OR current has ctrlLeft
    let command;
    if (index === 0) {
      // For closed paths, vertex 0's command determines the closing segment type
      // Check if the closing segment (last -> first) should be curved
      const isClosed = singlePathData.closed !== false;
      if (isClosed && vertices.length > 1) {
        const lastV = vertices[vertices.length - 1];
        const lastHasCtrlRight = lastV.ctrlRight && (lastV.ctrlRight.x !== 0 || lastV.ctrlRight.y !== 0);
        const firstHasCtrlLeft = v.ctrlLeft && (v.ctrlLeft.x !== 0 || v.ctrlLeft.y !== 0);
        command = (lastHasCtrlRight || firstHasCtrlLeft) ? Two.Commands.curve : Two.Commands.move;
      } else {
        command = Two.Commands.move;
      }
    } else {
      const prevV = vertices[index - 1];
      const prevHasCtrlRight = prevV.ctrlRight && (prevV.ctrlRight.x !== 0 || prevV.ctrlRight.y !== 0);
      const currentHasCtrlLeft = v.ctrlLeft && (v.ctrlLeft.x !== 0 || v.ctrlLeft.y !== 0);
      command = (prevHasCtrlRight || currentHasCtrlLeft) ? Two.Commands.curve : Two.Commands.line;
    }

    return new Two.Anchor(x, y, ctrlLeftX, ctrlLeftY, ctrlRightX, ctrlRightY, command);
  });

  // Create path using Two.Path constructor directly
  const path = new Two.Path(anchors);
  path.automatic = false;

  // Style hole paths differently (red border, transparent fill)
  if (isHole) {
    path.fill = isSelected ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 100, 100, 0.15)';
    path.stroke = isSelected ? '#cc0000' : '#ff6666';
  } else {
    path.fill = isSelected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)';
    path.stroke = isSelected ? '#333' : '#666';
  }
  path.linewidth = 2;
  path.closed = singlePathData.closed !== false;

  return path;
}

// Load an existing shape into the editor
function loadShapeIntoEditor(shapeName) {
  // Get shape data from registry
  const shapeData = getShapePathData(shapeName);

  if (!shapeData) {
    console.warn('No shape data found for:', shapeName);
    return;
  }

  // Clear existing paths
  EditorState.paths = [];
  EditorState.currentPathIndex = 0;
  EditorState.fillRule = shapeData.fillRule || null;
  EditorState.holePathIndices = [];

  // Check if this is a multi-path shape
  if (shapeData.paths && Array.isArray(shapeData.paths)) {
    // Multi-path shape - check for explicit holePathIndices or fall back to legacy behavior
    const savedHoleIndices = shapeData.holePathIndices || null;

    shapeData.paths.forEach((singlePathData, index) => {
      const isSelected = index === EditorState.currentPathIndex;

      // Determine if this path is a hole:
      // 1. Use saved holePathIndices if available
      // 2. Fall back to legacy behavior (index > 0 when fillRule is evenodd)
      let isHole;
      if (savedHoleIndices) {
        isHole = savedHoleIndices.includes(index);
      } else {
        isHole = EditorState.fillRule === 'evenodd' && index > 0;
      }

      if (isHole) {
        EditorState.holePathIndices.push(index);
      }
      const path = createPathFromData(singlePathData, isSelected, isHole);
      EditorState.paths.push(path);
      EditorState.two.add(path);
    });
  } else if (shapeData.vertices && shapeData.vertices.length > 0) {
    // Single path shape
    const path = createPathFromData(shapeData, true, false);
    EditorState.paths.push(path);
    EditorState.two.add(path);
  } else {
    console.warn('Invalid shape data:', shapeName);
    return;
  }

  // Create visual anchor points for current path
  createAnchorVisuals();

  EditorState.two.update();
}

// Update path visual styles based on selection
function updatePathStyles() {
  EditorState.paths.forEach((path, index) => {
    const isSelected = index === EditorState.currentPathIndex;
    const isHole = EditorState.holePathIndices.includes(index);

    if (isHole) {
      path.fill = isSelected ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 100, 100, 0.15)';
      path.stroke = isSelected ? '#cc0000' : '#ff6666';
    } else {
      path.fill = isSelected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)';
      path.stroke = isSelected ? '#333' : '#666';
    }
  });
  EditorState.two.update();
}

// Select a path by index
function selectPath(index) {
  if (index >= 0 && index < EditorState.paths.length) {
    EditorState.currentPathIndex = index;
    updatePathStyles();
    createAnchorVisuals();
    clearBoundingBox();  // Clear bounding box when switching paths

    // In combination editor mode, update pattern palette to show this path's pattern
    if (EditorState.editorMode === 'combination' && typeof loadPathPatternInfo === 'function') {
      loadPathPatternInfo();
    }
  }
}

// Duplicate the current path and select the duplicate
function duplicateCurrentPath() {
  const currentPath = getCurrentPath();
  if (!currentPath) return null;

  const oldPathIndex = EditorState.currentPathIndex;

  // Clone the vertices with their control points
  const clonedAnchors = currentPath.vertices.map((vertex, index) => {
    const ctrlLeftX = vertex.controls ? vertex.controls.left.x : 0;
    const ctrlLeftY = vertex.controls ? vertex.controls.left.y : 0;
    const ctrlRightX = vertex.controls ? vertex.controls.right.x : 0;
    const ctrlRightY = vertex.controls ? vertex.controls.right.y : 0;

    // Use same command type as original
    const command = vertex.command || (index === 0 ? Two.Commands.move : Two.Commands.line);

    return new Two.Anchor(
      vertex.x,
      vertex.y,
      ctrlLeftX, ctrlLeftY,
      ctrlRightX, ctrlRightY,
      command
    );
  });

  // Create new path from cloned anchors
  const newPath = new Two.Path(clonedAnchors);
  newPath.automatic = false;
  newPath.fill = 'rgba(0, 0, 0, 0.8)';
  newPath.stroke = '#333';
  newPath.linewidth = 2;
  newPath.closed = currentPath.closed;

  // Copy the translation from original path
  newPath.translation.set(currentPath.translation.x, currentPath.translation.y);

  // Add to paths array and Two.js scene
  const newPathIndex = EditorState.paths.length;
  EditorState.paths.push(newPath);
  EditorState.two.add(newPath);

  // Copy pattern data if in combination mode
  if (EditorState.editorMode === 'combination' && typeof CombinationEditorState !== 'undefined') {
    const oldPatternData = CombinationEditorState.pathPatterns[oldPathIndex];
    if (oldPatternData) {
      CombinationEditorState.pathPatterns[newPathIndex] = { ...oldPatternData };
    }
  }

  // Select the new path
  EditorState.currentPathIndex = newPathIndex;
  updatePathStyles();
  createAnchorVisuals();

  return newPath;
}

// Duplicate all selected paths and return array of new path indices
// Explicitly global for cross-file access
window.duplicateSelectedPaths = function duplicateSelectedPaths() {
  const selectedIndices = EditorState.selectedPathIndices;
  if (selectedIndices.length === 0) return [];

  const newIndices = [];

  selectedIndices.forEach(pathIndex => {
    const sourcePath = EditorState.paths[pathIndex];
    if (!sourcePath) return;

    // Clone the vertices with their control points
    const clonedAnchors = sourcePath.vertices.map((vertex, index) => {
      const ctrlLeftX = vertex.controls ? vertex.controls.left.x : 0;
      const ctrlLeftY = vertex.controls ? vertex.controls.left.y : 0;
      const ctrlRightX = vertex.controls ? vertex.controls.right.x : 0;
      const ctrlRightY = vertex.controls ? vertex.controls.right.y : 0;

      // Use same command type as original
      const command = vertex.command || (index === 0 ? Two.Commands.move : Two.Commands.line);

      return new Two.Anchor(
        vertex.x,
        vertex.y,
        ctrlLeftX, ctrlLeftY,
        ctrlRightX, ctrlRightY,
        command
      );
    });

    // Create new path from cloned anchors
    const newPath = new Two.Path(clonedAnchors);
    newPath.automatic = false;
    newPath.fill = 'rgba(0, 0, 0, 0.4)';
    newPath.stroke = '#666';
    newPath.linewidth = 2;
    newPath.closed = sourcePath.closed;

    // Copy the translation from original path
    newPath.translation.set(sourcePath.translation.x, sourcePath.translation.y);

    // Add to paths array and Two.js scene
    const newIndex = EditorState.paths.length;
    EditorState.paths.push(newPath);
    EditorState.two.add(newPath);
    newIndices.push(newIndex);

    // Copy pattern data if in combination mode
    if (EditorState.editorMode === 'combination' && typeof CombinationEditorState !== 'undefined') {
      const oldPatternData = CombinationEditorState.pathPatterns[pathIndex];
      if (oldPatternData) {
        CombinationEditorState.pathPatterns[newIndex] = { ...oldPatternData };
      }
    }
  });

  EditorState.two.update();
  return newIndices;
};

// Convert a single path to normalized path data
function pathToNormalizedData(path) {
  const vertices = [];

  path.vertices.forEach(vertex => {
    // Get absolute position
    const absX = vertex.x + path.translation.x;
    const absY = vertex.y + path.translation.y;

    // Convert to normalized coordinates
    const v = {
      x: editorToNormalized(absX),
      y: editorToNormalized(absY)
    };

    // Add control points if they exist and are non-zero
    if (vertex.controls) {
      if (vertex.controls.left.x !== 0 || vertex.controls.left.y !== 0) {
        v.ctrlLeft = {
          x: editorControlToNormalized(vertex.controls.left.x),
          y: editorControlToNormalized(vertex.controls.left.y)
        };
      }
      if (vertex.controls.right.x !== 0 || vertex.controls.right.y !== 0) {
        v.ctrlRight = {
          x: editorControlToNormalized(vertex.controls.right.x),
          y: editorControlToNormalized(vertex.controls.right.y)
        };
      }
    }

    vertices.push(v);
  });

  return {
    vertices: vertices,
    closed: path.closed
  };
}
