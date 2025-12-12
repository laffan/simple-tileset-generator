/* Session save/load functionality */

function getSessionData() {
  // Gather current session state
  const colorInput = document.getElementById('colorInput').value;
  const sizeInput = document.getElementById('sizeInput').value;
  const paletteComplexity = document.getElementById('paletteComplexity').value;

  // Get selected shapes
  const selectedShapes = [];
  shapes.forEach(shape => {
    if (document.getElementById(shape).checked) {
      selectedShapes.push(shape);
    }
  });

  return {
    version: 1,
    colors: colorInput,
    tileSize: sizeInput,
    paletteComplexity: paletteComplexity,
    selectedShapes: selectedShapes
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

  // Apply selected shapes
  if (data.selectedShapes !== undefined) {
    // First uncheck all
    shapes.forEach(shape => {
      document.getElementById(shape).checked = false;
    });
    // Then check the saved ones
    data.selectedShapes.forEach(shape => {
      const checkbox = document.getElementById(shape);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
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
