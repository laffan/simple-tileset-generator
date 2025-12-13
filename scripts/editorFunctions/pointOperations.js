/* Editor Point Operations - Add, delete, and toggle point operations */

// Add a new point to the current path
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

// Delete the selected point from the current path
function deleteSelectedPoint() {
  const currentPath = getCurrentPath();
  if (!EditorState.selectedAnchor || !currentPath) return;
  if (currentPath.vertices.length <= 3) {
    alert('Cannot delete: path must have at least 3 points');
    return;
  }

  const index = EditorState.selectedAnchor.index;
  currentPath.vertices.splice(index, 1);
  EditorState.selectedAnchor = null;
  createAnchorVisuals();
}

// Convert a point to/from bezier curve
function togglePointCurve() {
  if (!EditorState.selectedAnchor) return;

  const vertex = EditorState.selectedAnchor.vertex;

  if (vertex.controls.left.x === 0 && vertex.controls.left.y === 0 &&
      vertex.controls.right.x === 0 && vertex.controls.right.y === 0) {
    // Add curve handles
    vertex.controls.left.set(-30, 0);
    vertex.controls.right.set(30, 0);
    vertex.command = Two.Commands.curve;
  } else {
    // Remove curve handles
    vertex.controls.left.set(0, 0);
    vertex.controls.right.set(0, 0);
    vertex.command = Two.Commands.line;
  }

  createAnchorVisuals();
}
