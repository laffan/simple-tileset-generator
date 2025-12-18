/* Pattern Editor Modal Manager - open/close/save pattern editor */

function openPatternEditor(patternIndex) {
  const state = PatternEditorState;
  state.currentEditingPatternIndex = patternIndex;

  // Get pattern data
  const patternName = patternOrder[patternIndex];
  const patternData = getPatternPixelData(patternName);

  // Initialize state with original pattern data
  const originalSize = patternData.size || patternData.pixels.length;
  state.patternSize = originalSize;
  state.pixelData = copyPatternPixels(patternData.pixels);

  // For built-in patterns, resize to default grid size (16px)
  // Custom patterns (user-saved) keep their saved size
  const defaultSize = 16;
  if (!isCustomPattern(patternName) && originalSize !== defaultSize) {
    const oldData = state.pixelData;
    const newData = [];
    for (let row = 0; row < defaultSize; row++) {
      newData[row] = [];
      for (let col = 0; col < defaultSize; col++) {
        if (defaultSize > originalSize && originalSize > 0) {
          // When increasing size, tile the existing pattern
          const srcRow = row % originalSize;
          const srcCol = col % originalSize;
          newData[row][col] = (oldData[srcRow] && oldData[srcRow][srcCol]) || 0;
        } else if (row < originalSize && col < originalSize && oldData[row]) {
          // When decreasing size, preserve existing data within bounds
          newData[row][col] = oldData[row][col] || 0;
        } else {
          newData[row][col] = 0;
        }
      }
    }
    state.patternSize = defaultSize;
    state.pixelData = newData;
  }

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

  // Clear undo history for fresh start
  if (typeof UndoRedoManager !== 'undefined') {
    UndoRedoManager.clearPatternHistory();
  }

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

  // Help modal
  document.getElementById('patternEditorHelpLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('patternEditorHelpModal').classList.add('active');
  });

  document.getElementById('closePatternHelpBtn').addEventListener('click', () => {
    document.getElementById('patternEditorHelpModal').classList.remove('active');
  });

  document.getElementById('patternEditorHelpModal').addEventListener('click', (e) => {
    if (e.target.id === 'patternEditorHelpModal') {
      document.getElementById('patternEditorHelpModal').classList.remove('active');
    }
  });
}
