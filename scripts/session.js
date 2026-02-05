/* Session save/load functionality */

function getSessionData() {
  // Gather current session state
  const colorInput = document.getElementById('colorInput').value;
  const sizeInput = document.getElementById('sizeInput').value;

  // Get selected shape indices (to handle duplicates correctly)
  const selectedShapeIndices = [];
  document.querySelectorAll('.shapeCheckbox').forEach((cb, index) => {
    if (cb.checked) {
      selectedShapeIndices.push(index);
    }
  });

  // Get selected pattern indices
  const selectedPatternIndices = [];
  document.querySelectorAll('.patternCheckbox').forEach((cb, index) => {
    if (cb.checked) {
      selectedPatternIndices.push(index);
    }
  });

  // Get selected combination indices
  const selectedCombinationIndices = [];
  document.querySelectorAll('.combinationCheckbox').forEach((cb, index) => {
    if (cb.checked) {
      selectedCombinationIndices.push(index);
    }
  });

  // Get fit preview state
  const fitPreview = document.getElementById('fitPreview').checked;

  return {
    version: 6,
    colors: colorInput,
    tileSize: sizeInput,
    shapeOrder: [...shapeOrder], // Save full shape order (with duplicates and custom shapes)
    selectedIndices: selectedShapeIndices, // Save which shape indices are selected (keep name for backwards compat)
    patternOrder: [...patternOrder], // Save full pattern order
    selectedPatternIndices: selectedPatternIndices, // Save which pattern indices are selected
    combinationOrder: [...combinationOrder], // Save full combination order
    selectedCombinationIndices: selectedCombinationIndices, // Save which combination indices are selected
    fitPreview: fitPreview,
    customShapes: getCustomShapeData(), // Save custom shape path data
    customPatterns: getCustomPatternData(), // Save custom pattern pixel data
    customCombinations: getCustomCombinationData(), // Save custom combination data
    customBrush: typeof getCustomBrushDataForSession === 'function' ? getCustomBrushDataForSession() : null, // Save custom brush data
    tileTester: getTileTesterData() // Save tile tester state
  };
}

function applySessionData(data) {
  // Apply colors
  if (data.colors !== undefined) {
    document.getElementById('colorInput').value = data.colors;
  }

  // Apply tile size
  if (data.tileSize !== undefined) {
    document.getElementById('sizeInput').value = data.tileSize;
  }

  // Load custom shapes first (before rebuilding UI)
  if (data.customShapes) {
    loadCustomShapeData(data.customShapes);
  }

  // Load custom patterns first (before rebuilding UI)
  if (data.customPatterns) {
    loadCustomPatternData(data.customPatterns);
  }

  // Load custom combinations first (before rebuilding UI)
  if (data.customCombinations) {
    loadCustomCombinationData(data.customCombinations);
  }

  // Handle shape order and selection
  if (data.version >= 2 && data.shapeOrder !== undefined) {
    // Version 2+: Restore full shape order (with duplicates/deletions/custom shapes)
    shapeOrder = [...data.shapeOrder];

    // Rebuild the UI with new shape order
    createShapeSelectionHTML();
    addShapePreviews();
    addShapeCheckboxesListeners();
    addShapeButtonListeners();
    setupDragAndDrop();

    // Restore selected indices
    const checkboxes = document.querySelectorAll('.shapeCheckbox');
    checkboxes.forEach((cb, index) => {
      cb.checked = data.selectedIndices && data.selectedIndices.includes(index);
    });
  } else if (data.selectedShapes !== undefined) {
    // Version 1 (backwards compatibility): Just restore selected shapes
    document.querySelectorAll('.shapeCheckbox').forEach(cb => {
      cb.checked = data.selectedShapes.includes(cb.dataset.shape);
    });
  }

  // Handle pattern order and selection (version 4+)
  if (data.version >= 4 && data.patternOrder !== undefined) {
    patternOrder = [...data.patternOrder];

    // Rebuild the pattern UI
    createPatternSelectionHTML();
    addPatternPreviews();
    addPatternCheckboxesListeners();
    addPatternButtonListeners();
    setupPatternDragAndDrop();

    // Restore selected pattern indices
    const patternCheckboxes = document.querySelectorAll('.patternCheckbox');
    patternCheckboxes.forEach((cb, index) => {
      cb.checked = data.selectedPatternIndices && data.selectedPatternIndices.includes(index);
    });
  }

  // Handle combination order and selection (version 6+)
  if (data.version >= 6 && data.combinationOrder !== undefined) {
    combinationOrder = [...data.combinationOrder];

    // Rebuild the combination UI
    createCombinationSelectionHTML();
    addCombinationPreviews();
    addCombinationCheckboxesListeners();
    addCombinationButtonListeners();
    setupCombinationDragAndDrop();

    // Restore selected combination indices
    const combinationCheckboxes = document.querySelectorAll('.combinationCheckbox');
    combinationCheckboxes.forEach((cb, index) => {
      cb.checked = data.selectedCombinationIndices && data.selectedCombinationIndices.includes(index);
    });
  }

  // Apply fit preview state
  if (data.fitPreview !== undefined) {
    const fitCheckbox = document.getElementById('fitPreview');
    const previewBox = document.getElementById('previewBox');
    fitCheckbox.checked = data.fitPreview;
    if (data.fitPreview) {
      previewBox.classList.add('fit-mode');
    } else {
      previewBox.classList.remove('fit-mode');
    }
  }

  // Load tile tester state (version 5+)
  if (data.tileTester !== undefined) {
    loadTileTesterData(data.tileTester);
  }

  // Load custom brush data
  if (data.customBrush && typeof loadCustomBrushDataFromSession === 'function') {
    loadCustomBrushDataFromSession(data.customBrush);
  }

  // Update the UI
  updateColorsPreview();
  generateTileset();

  // Update custom tiles preview in main window
  if (typeof renderCustomTilesPreview === 'function') {
    renderCustomTilesPreview();
  }
}

function saveSession() {
  const sessionData = getSessionData();
  const json = JSON.stringify(sessionData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = 'tileset-session.json';
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function loadSession(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      applySessionData(data);
    } catch (error) {
      console.error('Error parsing session file:', error);
      alert('Invalid session file');
    }
  };
  reader.readAsText(file);
}

// Set up event listeners for session links
document.getElementById('saveSessionLink').addEventListener('click', function(e) {
  e.preventDefault();
  saveSession();
});

document.getElementById('loadSessionLink').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('loadSessionInput').click();
});

document.getElementById('loadSessionInput').addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    loadSession(e.target.files[0]);
    // Reset the input so the same file can be loaded again
    e.target.value = '';
  }
});
