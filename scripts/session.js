/* Session save/load functionality */

function getSessionData() {
  // Gather current session state
  const colorInput = document.getElementById('colorInput').value;
  const sizeInput = document.getElementById('sizeInput').value;
  const paletteComplexity = document.getElementById('paletteComplexity').value;

  // Get selected shape indices (to handle duplicates correctly)
  const selectedIndices = [];
  document.querySelectorAll('.shapeCheckbox').forEach((cb, index) => {
    if (cb.checked) {
      selectedIndices.push(index);
    }
  });

  // Get fit preview state
  const fitPreview = document.getElementById('fitPreview').checked;

  return {
    version: 2,
    colors: colorInput,
    tileSize: sizeInput,
    paletteComplexity: paletteComplexity,
    shapeOrder: [...shapeOrder], // Save full shape order (with duplicates)
    selectedIndices: selectedIndices, // Save which indices are selected
    fitPreview: fitPreview
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

  // Apply palette complexity
  if (data.paletteComplexity !== undefined) {
    document.getElementById('paletteComplexity').value = data.paletteComplexity;
    generateColorPalette(parseInt(data.paletteComplexity));
  }

  // Handle shape order and selection
  if (data.version >= 2 && data.shapeOrder !== undefined) {
    // Version 2+: Restore full shape order (with duplicates/deletions)
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

  // Update the UI
  updateColorsPreview();
  generateTileset();
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

// Set up event listeners for session buttons
document.getElementById('saveSessionBtn').addEventListener('click', saveSession);

document.getElementById('loadSessionBtn').addEventListener('click', function() {
  document.getElementById('loadSessionInput').click();
});

document.getElementById('loadSessionInput').addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    loadSession(e.target.files[0]);
    // Reset the input so the same file can be loaded again
    e.target.value = '';
  }
});
