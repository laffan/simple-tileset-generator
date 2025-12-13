/* Editor Path Management - Path creation, loading, and conversion */

// Create a Two.Path from single path data
function createPathFromData(singlePathData, isSelected) {
  const anchors = singlePathData.vertices.map((v, index) => {
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

    // Determine command type - curve if has control points
    let command;
    if (index === 0) {
      command = Two.Commands.move;
    } else if (v.ctrlLeft || v.ctrlRight) {
      command = Two.Commands.curve;
    } else {
      command = Two.Commands.line;
    }

    return new Two.Anchor(x, y, ctrlLeftX, ctrlLeftY, ctrlRightX, ctrlRightY, command);
  });

  // Create path using Two.Path constructor directly
  const path = new Two.Path(anchors);
  path.automatic = false;
  path.fill = isSelected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)';
  path.stroke = isSelected ? '#333' : '#666';
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

  // Check if this is a multi-path shape
  if (shapeData.paths && Array.isArray(shapeData.paths)) {
    // Multi-path shape
    shapeData.paths.forEach((singlePathData, index) => {
      const path = createPathFromData(singlePathData, index === EditorState.currentPathIndex);
      EditorState.paths.push(path);
      EditorState.two.add(path);
    });
  } else if (shapeData.vertices && shapeData.vertices.length > 0) {
    // Single path shape
    const path = createPathFromData(shapeData, true);
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
    if (index === EditorState.currentPathIndex) {
      path.fill = 'rgba(0, 0, 0, 0.8)';
      path.stroke = '#333';
    } else {
      path.fill = 'rgba(0, 0, 0, 0.4)';
      path.stroke = '#666';
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
  }
}

// Duplicate the current path and select the duplicate
function duplicateCurrentPath() {
  const currentPath = getCurrentPath();
  if (!currentPath) return null;

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
  EditorState.paths.push(newPath);
  EditorState.two.add(newPath);

  // Select the new path
  EditorState.currentPathIndex = EditorState.paths.length - 1;
  updatePathStyles();
  createAnchorVisuals();

  return newPath;
}

// Duplicate all selected paths and return array of new path indices
function duplicateSelectedPaths() {
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
  });

  EditorState.two.update();
  return newIndices;
}

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
