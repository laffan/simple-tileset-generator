/* Editor Modal Manager - Modal open, close, and save operations */

// Initialize the editor
function initEditor() {
  const container = document.getElementById('shapeEditorCanvas');
  container.innerHTML = ''; // Clear any existing content

  EditorState.two = new Two({
    width: EDITOR_SIZE,
    height: EDITOR_SIZE,
    type: Two.Types.svg
  }).appendTo(container);

  // Add grid lines for reference
  drawEditorGrid();

  // Set up mouse event handlers
  setupEditorEvents();
}

// Open the editor modal
function openShapeEditor(shapeIndex) {
  EditorState.currentEditingShapeIndex = shapeIndex;

  const modal = document.getElementById('shapeEditorModal');
  modal.classList.add('active');

  // Initialize editor if needed
  if (!EditorState.two) {
    initEditor();
  }

  // Load the shape
  const shapeName = shapeOrder[shapeIndex];
  loadShapeIntoEditor(shapeName);
}

// Close the editor modal
function closeShapeEditor() {
  const modal = document.getElementById('shapeEditorModal');
  modal.classList.remove('active');

  // Clean up
  if (EditorState.two) {
    EditorState.two.clear();
    EditorState.two = null;
  }
  resetEditorState();
  clearPathSelection();
}

// Save the edited shape
function saveEditedShape() {
  if (EditorState.paths.length === 0 || EditorState.currentEditingShapeIndex === null) {
    closeShapeEditor();
    return;
  }

  // Convert editor paths to normalized path data
  let pathData;

  if (EditorState.paths.length === 1) {
    // Single path shape
    pathData = pathToNormalizedData(EditorState.paths[0]);
  } else {
    // Multi-path shape
    pathData = {
      paths: EditorState.paths.map(path => pathToNormalizedData(path))
    };
  }

  // Get the current shape name
  const currentShapeName = shapeOrder[EditorState.currentEditingShapeIndex];

  // Generate a new custom shape ID (or reuse if already custom)
  let customId;
  if (isCustomShape(currentShapeName)) {
    // Update existing custom shape
    customId = currentShapeName;
  } else {
    // Create new custom shape
    customId = generateCustomShapeId();
  }

  // Register the custom shape (updates both shapePathData and shapeRenderers)
  registerCustomShape(customId, pathData);

  // Update shapeOrder to use the custom shape ID
  shapeOrder[EditorState.currentEditingShapeIndex] = customId;

  // Close the editor
  closeShapeEditor();

  // Rebuild the shape list and regenerate tileset
  rebuildShapeList();
  generateTileset();
}
