/* Combination Editor Modal Manager - open/close/save combination editor */

// Open the combination editor
function openCombinationEditor(combinationIndex) {
  const state = CombinationEditorState;
  state.currentEditingCombinationIndex = combinationIndex;

  // Get combination data
  const combinationName = combinationOrder[combinationIndex];
  const combinationData = getCombinationData(combinationName);

  if (!combinationData) {
    console.error('Combination data not found:', combinationName);
    return;
  }

  // Make a working copy
  state.combinationData = copyCombinationData(combinationData);
  state.activeTab = 'shape';

  // Set tile dimensions from combination data
  state.tileRows = combinationData.tileRows || 2;
  state.tileCols = combinationData.tileCols || 2;

  // Show modal
  const modal = document.getElementById('combinationEditorModal');
  if (modal) {
    modal.classList.add('active');
  }

  // Update tile size inputs
  const rowsInput = document.getElementById('combinationTileRows');
  const colsInput = document.getElementById('combinationTileCols');
  if (rowsInput) rowsInput.value = state.tileRows;
  if (colsInput) colsInput.value = state.tileCols;

  // Initialize shape editor (Two.js)
  initCombinationShapeEditor();

  // Initialize pattern editor
  initCombinationPatternEditor();

  // Initialize preview canvas
  initCombinationPreviewCanvas();

  // Setup events
  setupCombinationEditorEvents();

  // Set initial tab state
  switchCombinationEditorTab('shape');

  // Load shape data if exists
  if (combinationData.shapeData) {
    loadCombShapeData(combinationData.shapeData);
  } else {
    // Create default shape (square)
    createDefaultCombShape();
  }

  // Load pattern data if exists
  if (combinationData.patternData) {
    loadCombPatternData(combinationData.patternData);
  } else {
    // Create empty pattern (all white = no mask)
    createEmptyCombPattern();
  }

  // Draw tile grid overlay
  drawCombinationTileGridOverlay();

  // Update preview
  updateCombinationPreview();
}

// Close the combination editor
function closeCombinationEditor() {
  const modal = document.getElementById('combinationEditorModal');
  if (modal) {
    modal.classList.remove('active');
  }

  // Cleanup Two.js
  if (CombinationEditorState.two) {
    CombinationEditorState.two.clear();
    CombinationEditorState.two = null;
  }

  // Cleanup events
  removeCombinationEditorEvents();

  // Reset state
  resetCombinationEditorState();
}

// Save the edited combination
function saveCombinationEditor() {
  const state = CombinationEditorState;
  const combinationIndex = state.currentEditingCombinationIndex;

  if (combinationIndex === null || !state.combinationData) {
    closeCombinationEditor();
    return;
  }

  // Get shape data from editor paths
  const shapeData = getCombShapeData();

  // Get pattern data
  const patternData = getCombPatternData();

  // Get the current combination name
  const currentCombinationName = combinationOrder[combinationIndex];

  // Create saved data
  const savedData = {
    id: currentCombinationName,
    name: state.combinationData.name || currentCombinationName,
    tileRows: state.tileRows,
    tileCols: state.tileCols,
    shapeData: shapeData,
    patternData: patternData
  };

  // Update the registry
  registerCustomCombination(currentCombinationName, savedData);

  // Close editor
  closeCombinationEditor();

  // Rebuild combination list and regenerate tileset
  rebuildCombinationList();
  generateTileset();
}

// Initialize the combination shape editor (Two.js)
function initCombinationShapeEditor() {
  const container = document.getElementById('combinationShapeEditorCanvas');
  if (!container) return;

  container.innerHTML = '';

  CombinationEditorState.two = new Two({
    width: COMB_EDITOR_SIZE,
    height: COMB_EDITOR_SIZE,
    type: Two.Types.svg
  }).appendTo(container);

  // Draw grid
  drawCombEditorGrid();
}

// Initialize the combination pattern editor
function initCombinationPatternEditor() {
  const state = CombinationEditorState;

  state.patternCanvas = document.getElementById('combinationPatternEditorCanvas');
  if (!state.patternCanvas) return;

  state.patternCtx = state.patternCanvas.getContext('2d');

  // Set canvas size
  state.patternCanvas.width = 512;
  state.patternCanvas.height = 512;

  // Initialize pattern pixel data
  createEmptyCombPattern();
}

// Initialize preview canvas
function initCombinationPreviewCanvas() {
  const state = CombinationEditorState;

  state.previewCanvas = document.getElementById('combinationPreviewCanvas');
  if (!state.previewCanvas) return;

  state.previewCtx = state.previewCanvas.getContext('2d');
}

// Switch between tabs
function switchCombinationEditorTab(tabName) {
  CombinationEditorState.activeTab = tabName;

  // Update tab buttons
  const shapeTab = document.getElementById('combinationTabShape');
  const patternTab = document.getElementById('combinationTabPattern');

  if (shapeTab) shapeTab.classList.toggle('active', tabName === 'shape');
  if (patternTab) patternTab.classList.toggle('active', tabName === 'pattern');

  // Update tab content visibility
  const shapeContent = document.getElementById('combinationShapeTab');
  const patternContent = document.getElementById('combinationPatternTab');

  if (shapeContent) {
    shapeContent.style.display = tabName === 'shape' ? 'flex' : 'none';
    shapeContent.classList.toggle('active', tabName === 'shape');
  }
  if (patternContent) {
    patternContent.style.display = tabName === 'pattern' ? 'flex' : 'none';
    patternContent.classList.toggle('active', tabName === 'pattern');
  }

  // Redraw the active editor
  if (tabName === 'shape') {
    drawCombinationTileGridOverlay();
  } else {
    drawCombPatternEditorCanvas();
  }
}

// Setup combination editor buttons
function setupCombinationEditorButtons() {
  // Tab buttons
  const shapeTab = document.getElementById('combinationTabShape');
  const patternTab = document.getElementById('combinationTabPattern');

  if (shapeTab) {
    shapeTab.addEventListener('click', () => switchCombinationEditorTab('shape'));
  }
  if (patternTab) {
    patternTab.addEventListener('click', () => switchCombinationEditorTab('pattern'));
  }

  // Tile size inputs
  const rowsInput = document.getElementById('combinationTileRows');
  const colsInput = document.getElementById('combinationTileCols');

  if (rowsInput) {
    rowsInput.addEventListener('change', function() {
      const rows = parseInt(this.value, 10) || 2;
      setCombinationTileSize(rows, CombinationEditorState.tileCols);
    });
  }
  if (colsInput) {
    colsInput.addEventListener('change', function() {
      const cols = parseInt(this.value, 10) || 2;
      setCombinationTileSize(CombinationEditorState.tileRows, cols);
    });
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancelCombinationEditorBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeCombinationEditor);
  }

  // Save button
  const saveBtn = document.getElementById('saveCombinationBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveCombinationEditor);
  }

  // Help modal
  const helpLink = document.getElementById('combinationEditorHelpLink');
  if (helpLink) {
    helpLink.addEventListener('click', function(e) {
      e.preventDefault();
      const helpModal = document.getElementById('combinationEditorHelpModal');
      if (helpModal) {
        helpModal.classList.add('active');
      }
    });
  }

  const closeHelpBtn = document.getElementById('closeCombinationHelpBtn');
  if (closeHelpBtn) {
    closeHelpBtn.addEventListener('click', function() {
      const helpModal = document.getElementById('combinationEditorHelpModal');
      if (helpModal) {
        helpModal.classList.remove('active');
      }
    });
  }

  const helpModal = document.getElementById('combinationEditorHelpModal');
  if (helpModal) {
    helpModal.addEventListener('click', function(e) {
      if (e.target.id === 'combinationEditorHelpModal') {
        this.classList.remove('active');
      }
    });
  }

  // Setup toolbar buttons for shape editor
  setupCombShapeToolbar();

  // Setup toolbar buttons for pattern editor
  setupCombPatternToolbar();
}
