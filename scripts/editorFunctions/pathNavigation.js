/* Editor Path Navigation - Multi-path navigation functions */

// Update path indicator display (no longer used - kept for compatibility)
function updatePathIndicator() {
  // Path indicator has been removed from UI
  // Paths are now selected by clicking on them directly
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
