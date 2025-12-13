/* Editor Event Handlers - Mouse and interaction event handlers */

// Set up mouse event handlers
function setupEditorEvents() {
  const container = document.getElementById('shapeEditorCanvas');
  const svg = container.querySelector('svg');
  if (!svg) return;

  let dragTarget = null;

  svg.addEventListener('mousedown', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = findAnchorAtPosition(x, y);
    if (hit) {
      EditorState.isDragging = true;
      dragTarget = hit;
      highlightAnchor(hit.data);
    } else {
      highlightAnchor(null);
    }
  });

  svg.addEventListener('mousemove', (e) => {
    if (!EditorState.isDragging || !dragTarget) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const vertex = dragTarget.data.vertex;
    const currentPath = getCurrentPath();

    if (dragTarget.type === 'anchor') {
      // Convert mouse position to relative vertex position (subtract path translation)
      vertex.x = x - currentPath.translation.x;
      vertex.y = y - currentPath.translation.y;
    } else if (dragTarget.type === 'controlIn') {
      // Control points are relative to the absolute vertex position
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.left.x = x - absPos.x;
      vertex.controls.left.y = y - absPos.y;
    } else if (dragTarget.type === 'controlOut') {
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.right.x = x - absPos.x;
      vertex.controls.right.y = y - absPos.y;
    }

    updateAnchorVisuals();
  });

  svg.addEventListener('mouseup', () => {
    EditorState.isDragging = false;
    dragTarget = null;
  });

  svg.addEventListener('mouseleave', () => {
    EditorState.isDragging = false;
    dragTarget = null;
  });
}

// Set up editor button event listeners
function setupEditorButtons() {
  document.getElementById('closeEditorBtn').addEventListener('click', closeShapeEditor);
  document.getElementById('cancelEditorBtn').addEventListener('click', closeShapeEditor);
  document.getElementById('saveShapeBtn').addEventListener('click', saveEditedShape);
  document.getElementById('addPointBtn').addEventListener('click', addPointToPath);
  document.getElementById('deletePointBtn').addEventListener('click', deleteSelectedPoint);
  document.getElementById('prevPathBtn').addEventListener('click', prevPath);
  document.getElementById('nextPathBtn').addEventListener('click', nextPath);

  // Close modal when clicking outside
  document.getElementById('shapeEditorModal').addEventListener('click', (e) => {
    if (e.target.id === 'shapeEditorModal') {
      closeShapeEditor();
    }
  });
}
