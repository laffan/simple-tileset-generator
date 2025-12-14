/* Pattern Editor Modal Manager - open/close/save pattern editor */

function openPatternEditor(patternIndex) {
  const state = PatternEditorState;
  state.currentEditingPatternIndex = patternIndex;

  // Get pattern data
  const patternName = patternOrder[patternIndex];
  const patternData = getPatternPixelData(patternName);

  // Initialize state
  state.patternSize = patternData.size || patternData.pixels.length;
  state.pixelData = copyPatternPixels(patternData.pixels);

  // Show modal
  const modal = document.getElementById('patternEditorModal');
  modal.classList.add('active');

  // Get canvas elements
  state.editorCanvas = document.getElementById('patternEditorCanvas');
  state.editorCtx = state.editorCanvas.getContext('2d');
  state.previewCanvas = document.getElementById('patternPreviewCanvas');
  state.previewCtx = state.previewCanvas.getContext('2d');

  // Update size input and buttons
  const sizeInput = document.getElementById('patternSizeInput');
  if (sizeInput) {
    sizeInput.value = state.patternSize;
  }

  // Sync size buttons with current pattern size
  if (typeof updatePatternSizeButtonsForEditor === 'function') {
    updatePatternSizeButtonsForEditor(state.patternSize);
  }

  // Set zoom so pattern fills the boundary
  updateZoomForPatternSize(state.patternSize);

  // Setup events
  setupPatternEditorEvents();

  // Initial render
  resizePatternEditorCanvas();
  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function closePatternEditor() {
  const state = PatternEditorState;

  // Hide modal
  const modal = document.getElementById('patternEditorModal');
  modal.classList.remove('active');

  // Cleanup
  removePatternEditorEvents();
  state.currentEditingPatternIndex = null;
  state.editorCanvas = null;
  state.editorCtx = null;
  state.previewCanvas = null;
  state.previewCtx = null;
  state.pixelData = [];
}

function saveEditedPattern() {
  const state = PatternEditorState;
  const patternIndex = state.currentEditingPatternIndex;

  if (patternIndex === null) return;

  // Create pattern data
  const newPatternData = {
    size: state.patternSize,
    pixels: copyPatternPixels(state.pixelData)
  };

  // Check if editing a built-in pattern or custom pattern
  const currentPatternName = patternOrder[patternIndex];

  if (isCustomPattern(currentPatternName)) {
    // Update existing custom pattern
    registerCustomPattern(currentPatternName, newPatternData);
  } else {
    // Create new custom pattern and replace in order
    const newPatternId = generateCustomPatternId();
    registerCustomPattern(newPatternId, newPatternData);
    patternOrder[patternIndex] = newPatternId;
  }

  // Close editor
  closePatternEditor();

  // Rebuild pattern list and regenerate tileset
  rebuildPatternList();
  generateTileset();
}

function setupPatternEditorButtons() {
  // Close button
  const closeBtn = document.getElementById('closePatternEditorBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePatternEditor);
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancelPatternEditorBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closePatternEditor);
  }

  // Save button
  const saveBtn = document.getElementById('savePatternBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveEditedPattern);
  }
}
