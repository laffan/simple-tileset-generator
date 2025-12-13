/* Editor Path Navigation - Multi-path navigation functions */

// Update path indicator display
function updatePathIndicator() {
  const indicator = document.getElementById('pathIndicator');
  if (indicator) {
    indicator.textContent = `${EditorState.currentPathIndex + 1}/${EditorState.paths.length}`;
  }
  // Enable/disable nav buttons based on path count
  const prevBtn = document.getElementById('prevPathBtn');
  const nextBtn = document.getElementById('nextPathBtn');
  if (prevBtn && nextBtn) {
    const multiPath = EditorState.paths.length > 1;
    prevBtn.disabled = !multiPath;
    nextBtn.disabled = !multiPath;
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
