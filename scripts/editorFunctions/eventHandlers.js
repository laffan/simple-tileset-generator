/* Editor Event Handlers - Mouse and interaction event handlers */

// Set up mouse event handlers
function setupEditorEvents() {
  const container = document.getElementById('shapeEditorCanvas');
  const svg = container.querySelector('svg');
  if (!svg) return;

  let dragTarget = null;
  let lastMousePos = { x: 0, y: 0 };

  svg.addEventListener('mousedown', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastMousePos = { x, y };

    // First check for anchor/control point hits (higher priority)
    const anchorHit = findAnchorAtPosition(x, y);
    if (anchorHit) {
      EditorState.isDragging = true;
      dragTarget = anchorHit;
      highlightAnchor(anchorHit.data);
      return;
    }

    // If no anchor hit, check if clicking on the path shape itself
    const pathHit = findPathAtPosition(x, y);
    if (pathHit) {
      EditorState.isDragging = true;
      dragTarget = pathHit;
      highlightAnchor(null);  // Deselect any anchor when grabbing path
      svg.style.cursor = 'grabbing';
      return;
    }

    // Clicked on empty space
    highlightAnchor(null);
  });

  svg.addEventListener('mousemove', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update cursor based on what's under it
    if (!EditorState.isDragging) {
      const anchorHit = findAnchorAtPosition(x, y);
      if (anchorHit) {
        svg.style.cursor = 'pointer';
      } else {
        const pathHit = findPathAtPosition(x, y);
        svg.style.cursor = pathHit ? 'grab' : 'default';
      }
    }

    if (!EditorState.isDragging || !dragTarget) return;

    const currentPath = getCurrentPath();

    if (dragTarget.type === 'anchor') {
      const vertex = dragTarget.data.vertex;
      // Convert mouse position to relative vertex position (subtract path translation)
      vertex.x = x - currentPath.translation.x;
      vertex.y = y - currentPath.translation.y;
    } else if (dragTarget.type === 'controlIn') {
      const vertex = dragTarget.data.vertex;
      // Control points are relative to the absolute vertex position
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.left.x = x - absPos.x;
      vertex.controls.left.y = y - absPos.y;
    } else if (dragTarget.type === 'controlOut') {
      const vertex = dragTarget.data.vertex;
      const absPos = getAbsolutePosition(vertex);
      vertex.controls.right.x = x - absPos.x;
      vertex.controls.right.y = y - absPos.y;
    } else if (dragTarget.type === 'path') {
      // Move entire path by shifting all vertices
      const deltaX = x - lastMousePos.x;
      const deltaY = y - lastMousePos.y;

      currentPath.vertices.forEach(vertex => {
        vertex.x += deltaX;
        vertex.y += deltaY;
      });
    }

    lastMousePos = { x, y };
    updateAnchorVisuals();
  });

  svg.addEventListener('mouseup', () => {
    EditorState.isDragging = false;
    dragTarget = null;
    svg.style.cursor = 'default';
  });

  svg.addEventListener('mouseleave', () => {
    EditorState.isDragging = false;
    dragTarget = null;
    svg.style.cursor = 'default';
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
