/* Editor Coordinates - Coordinate conversion functions */

// Convert normalized (0-1) coordinate to editor coordinate
function normalizedToEditor(value) {
  return EDITOR_MARGIN + value * EDITOR_SHAPE_SIZE;
}

// Convert normalized control point offset to editor scale
function normalizedControlToEditor(value) {
  return value * EDITOR_SHAPE_SIZE;
}

// Convert editor coordinate back to normalized (0-1) value
function editorToNormalized(value) {
  return (value - EDITOR_MARGIN) / EDITOR_SHAPE_SIZE;
}

// Convert editor control point offset back to normalized scale
function editorControlToNormalized(value) {
  return value / EDITOR_SHAPE_SIZE;
}

// Get absolute position of a vertex (accounting for path translation)
function getAbsolutePosition(vertex) {
  const currentPath = getCurrentPath();
  if (!currentPath) return { x: vertex.x, y: vertex.y };
  return {
    x: vertex.x + currentPath.translation.x,
    y: vertex.y + currentPath.translation.y
  };
}
