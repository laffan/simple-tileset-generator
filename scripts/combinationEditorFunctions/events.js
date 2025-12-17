/* Combination Editor Events - mouse, keyboard, drag-drop handlers */

// Store bound handlers for cleanup
let combinationEditorEventHandlers = {
  shapeCanvasClick: null,
  shapeCanvasDragOver: null,
  shapeCanvasDrop: null,
  patternCanvasClick: null,
  tabClick: null,
  keyDown: null
};

// Setup all event handlers
function setupCombinationEditorEvents() {
  const state = CombinationEditorState;

  // Shape canvas click handler
  combinationEditorEventHandlers.shapeCanvasClick = function(e) {
    const rect = state.shapeCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellPos = getCellFromCanvasPosition(x, y);
    if (cellPos) {
      selectCombinationCell(cellPos.x, cellPos.y);
      renderCombinationEditor();

      // Update palette selection if in pattern mode
      if (state.activeTab === 'pattern') {
        renderCombinationPatternPalette();
      }
    }
  };

  // Shape canvas drag over handler
  combinationEditorEventHandlers.shapeCanvasDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Shape canvas drop handler
  combinationEditorEventHandlers.shapeCanvasDrop = function(e) {
    e.preventDefault();

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      if (data.type === 'shape') {
        const rect = state.shapeCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellPos = getCellFromCanvasPosition(x, y);
        if (cellPos) {
          const cell = getCombinationCell(cellPos.x, cellPos.y);
          if (cell && cell.enabled) {
            setCombinationCellShape(cellPos.x, cellPos.y, data.name);
            renderCombinationEditor();
          }
        }
      }
    } catch (err) {
      // Ignore invalid drag data
    }
  };

  // Pattern canvas click handler
  combinationEditorEventHandlers.patternCanvasClick = function(e) {
    // Same as shape canvas - select cell
    const rect = state.shapeCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellPos = getCellFromCanvasPosition(x, y);
    if (cellPos) {
      selectCombinationCell(cellPos.x, cellPos.y);
      renderCombinationEditor();
      renderCombinationPatternPalette();
    }
  };

  // Keyboard handler
  combinationEditorEventHandlers.keyDown = function(e) {
    const state = CombinationEditorState;
    const data = state.combinationData;
    if (!data) return;

    // Arrow key navigation for selected cell
    switch (e.key) {
      case 'ArrowLeft':
        if (state.selectedCell.x > 0) {
          state.selectedCell.x--;
          renderCombinationEditor();
          if (state.activeTab === 'pattern') {
            renderCombinationPatternPalette();
          }
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (state.selectedCell.x < data.gridWidth - 1) {
          state.selectedCell.x++;
          renderCombinationEditor();
          if (state.activeTab === 'pattern') {
            renderCombinationPatternPalette();
          }
        }
        e.preventDefault();
        break;
      case 'ArrowUp':
        if (state.selectedCell.y > 0) {
          state.selectedCell.y--;
          renderCombinationEditor();
          if (state.activeTab === 'pattern') {
            renderCombinationPatternPalette();
          }
        }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (state.selectedCell.y < data.gridHeight - 1) {
          state.selectedCell.y++;
          renderCombinationEditor();
          if (state.activeTab === 'pattern') {
            renderCombinationPatternPalette();
          }
        }
        e.preventDefault();
        break;
      case 'Delete':
      case 'Backspace':
        // Clear pattern from selected cell
        const cell = getSelectedCombinationCell();
        if (cell && cell.enabled && cell.pattern) {
          setCombinationCellPattern(state.selectedCell.x, state.selectedCell.y, null);
          renderCombinationEditor();
          renderCombinationPatternPalette();
        }
        break;
    }
  };

  // Attach handlers
  if (state.shapeCanvas) {
    state.shapeCanvas.addEventListener('click', combinationEditorEventHandlers.shapeCanvasClick);
    state.shapeCanvas.addEventListener('dragover', combinationEditorEventHandlers.shapeCanvasDragOver);
    state.shapeCanvas.addEventListener('drop', combinationEditorEventHandlers.shapeCanvasDrop);
  }

  document.addEventListener('keydown', combinationEditorEventHandlers.keyDown);

  // Tab switching
  setupCombinationEditorTabs();
}

// Remove all event handlers
function removeCombinationEditorEvents() {
  const state = CombinationEditorState;

  if (state.shapeCanvas && combinationEditorEventHandlers.shapeCanvasClick) {
    state.shapeCanvas.removeEventListener('click', combinationEditorEventHandlers.shapeCanvasClick);
    state.shapeCanvas.removeEventListener('dragover', combinationEditorEventHandlers.shapeCanvasDragOver);
    state.shapeCanvas.removeEventListener('drop', combinationEditorEventHandlers.shapeCanvasDrop);
  }

  if (combinationEditorEventHandlers.keyDown) {
    document.removeEventListener('keydown', combinationEditorEventHandlers.keyDown);
  }

  // Clear handlers
  combinationEditorEventHandlers = {
    shapeCanvasClick: null,
    shapeCanvasDragOver: null,
    shapeCanvasDrop: null,
    patternCanvasClick: null,
    tabClick: null,
    keyDown: null
  };
}

// Setup tab switching
function setupCombinationEditorTabs() {
  const shapeTab = document.getElementById('combinationTabShape');
  const patternTab = document.getElementById('combinationTabPattern');

  if (shapeTab) {
    shapeTab.addEventListener('click', function() {
      switchCombinationEditorTab('shape');
    });
  }

  if (patternTab) {
    patternTab.addEventListener('click', function() {
      switchCombinationEditorTab('pattern');
    });
  }
}

// Switch between tabs
function switchCombinationEditorTab(tabName) {
  const state = CombinationEditorState;
  state.activeTab = tabName;

  // Update tab buttons
  const shapeTab = document.getElementById('combinationTabShape');
  const patternTab = document.getElementById('combinationTabPattern');

  if (shapeTab) {
    shapeTab.classList.toggle('active', tabName === 'shape');
  }
  if (patternTab) {
    patternTab.classList.toggle('active', tabName === 'pattern');
  }

  // Update canvas visibility
  const shapeCanvasContainer = document.getElementById('combinationShapeCanvasContainer');
  const patternCanvasContainer = document.getElementById('combinationPatternCanvasContainer');

  if (shapeCanvasContainer) {
    shapeCanvasContainer.style.display = tabName === 'shape' ? 'block' : 'none';
  }
  if (patternCanvasContainer) {
    patternCanvasContainer.style.display = tabName === 'pattern' ? 'block' : 'none';
  }

  // Update palette
  renderCombinationPalette();

  // Render the appropriate canvas
  renderCombinationEditor();
}
