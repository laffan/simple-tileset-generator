/* Editor Path Navigation - Multi-path navigation functions */

// Update path indicator display
function updatePathIndicator() {
  const indicator = document.getElementById('pathIndicator');
  if (indicator) {
    // Only show indicator when there are multiple paths
    if (EditorState.paths.length > 1) {
      indicator.textContent = `Path ${EditorState.currentPathIndex + 1} of ${EditorState.paths.length}`;
    } else {
      indicator.textContent = '';
    }
  }
}

// Navigate to previous path
function prevPath() {
  if (EditorState.paths.length > 1) {
    EditorState.currentPathIndex = (EditorState.currentPathIndex - 1 + EditorState.paths.length) % EditorState.paths.length;
    updatePathStyles();
    createAnchorVisuals();
    updatePathIndicator();
  }
}

// Navigate to next path
function nextPath() {
  if (EditorState.paths.length > 1) {
    EditorState.currentPathIndex = (EditorState.currentPathIndex + 1) % EditorState.paths.length;
    updatePathStyles();
    createAnchorVisuals();
    updatePathIndicator();
  }
}
