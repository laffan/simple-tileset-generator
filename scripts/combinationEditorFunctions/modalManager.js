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
  state.selectedCell = { x: 0, y: 0 };

  // Show modal
  const modal = document.getElementById('combinationEditorModal');
  if (modal) {
    modal.classList.add('active');
  }

  // Initialize canvases
  initCombinationShapeCanvas();
  initCombinationPatternCanvas();
  initCombinationPreviewCanvas();

  // Setup components
  setupCombinationGridSelector();
  setupCombinationPalette();
  setupCombinationEditorEvents();

  // Set initial tab state
  switchCombinationEditorTab('shape');

  // Initial render
  renderCombinationEditor();
}

// Close the combination editor
function closeCombinationEditor() {
  const modal = document.getElementById('combinationEditorModal');
  if (modal) {
    modal.classList.remove('active');
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

  // Get the current combination name
  const currentCombinationName = combinationOrder[combinationIndex];

  // Update the registry with the edited data
  const savedData = copyCombinationData(state.combinationData);
  savedData.id = currentCombinationName; // Preserve the ID

  registerCustomCombination(currentCombinationName, savedData);

  // Close editor
  closeCombinationEditor();

  // Rebuild combination list and regenerate tileset
  rebuildCombinationList();
  generateTileset();
}

// Setup combination editor buttons
function setupCombinationEditorButtons() {
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
}
