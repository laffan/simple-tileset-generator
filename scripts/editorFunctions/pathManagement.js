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

  // Update path navigation indicator
  updatePathIndicator();

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
  }
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
