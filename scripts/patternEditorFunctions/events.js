/* Pattern Editor Events - event handling functions */

function setupPatternEditorEvents() {
  const state = PatternEditorState;

  // Editor canvas events
  state.editorCanvas.addEventListener('mousedown', startPatternDrawing);
  state.editorCanvas.addEventListener('mousemove', handlePatternMouseMove);
  state.editorCanvas.addEventListener('mouseup', stopPatternDrawing);
  state.editorCanvas.addEventListener('mouseleave', stopPatternDrawing);

  // Touch events
  state.editorCanvas.addEventListener('touchstart', handlePatternTouchStart);
  state.editorCanvas.addEventListener('touchmove', handlePatternTouchMove);
  state.editorCanvas.addEventListener('touchend', handlePatternTouchEnd);

  // Editor zoom slider
  const editorZoomSlider = document.getElementById('patternEditorZoom');
  if (editorZoomSlider) {
    editorZoomSlider.addEventListener('input', function(e) {
      state.editorZoom = parseInt(e.target.value);
      resizePatternEditorCanvas();
      drawPatternEditorCanvas();
      updateEditorZoomDisplay();
    });
  }

  // Note: Pattern size buttons are handled by sizeControls.js
  // Note: Preview zoom removed - preview now uses main tile size

  // Toolbar buttons
  const invertBtn = document.getElementById('patternInvertBtn');
  if (invertBtn) {
    invertBtn.addEventListener('click', invertPatternEditorPixels);
  }

  const uploadBtn = document.getElementById('patternUploadBtn');
  const uploadInput = document.getElementById('patternUploadInput');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', handlePatternUpload);
  }

  const downloadBtn = document.getElementById('patternDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadPattern);
  }
}

function removePatternEditorEvents() {
  const state = PatternEditorState;

  if (state.editorCanvas) {
    state.editorCanvas.removeEventListener('mousedown', startPatternDrawing);
    state.editorCanvas.removeEventListener('mousemove', handlePatternMouseMove);
    state.editorCanvas.removeEventListener('mouseup', stopPatternDrawing);
    state.editorCanvas.removeEventListener('mouseleave', stopPatternDrawing);
    state.editorCanvas.removeEventListener('touchstart', handlePatternTouchStart);
    state.editorCanvas.removeEventListener('touchmove', handlePatternTouchMove);
    state.editorCanvas.removeEventListener('touchend', handlePatternTouchEnd);
  }
}

function handlePatternTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  startPatternDrawing(mouseEvent);
}

function handlePatternTouchMove(e) {
  e.preventDefault();
  if (!PatternEditorState.isDrawing) return;
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  handlePatternMouseMove(mouseEvent);
}

function handlePatternTouchEnd(e) {
  e.preventDefault();
  stopPatternDrawing();
}

function getPixelFromEvent(e) {
  const state = PatternEditorState;
  const rect = state.editorCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Calculate the primary tile position (same logic as in drawPatternEditorCanvas)
  const patternPixelSize = state.patternSize * state.pixelSize;
  const primaryTileX = state.boundaryOffsetX + (state.BOUNDARY_SIZE - patternPixelSize) / 2;
  const primaryTileY = state.boundaryOffsetY + (state.BOUNDARY_SIZE - patternPixelSize) / 2;

  // Calculate which pixel was clicked relative to the primary tile
  const col = Math.floor((x - primaryTileX) / state.pixelSize);
  const row = Math.floor((y - primaryTileY) / state.pixelSize);

  // Wrap to pattern bounds (so clicking on tiled copies still works)
  const wrappedCol = ((col % state.patternSize) + state.patternSize) % state.patternSize;
  const wrappedRow = ((row % state.patternSize) + state.patternSize) % state.patternSize;

  return { row: wrappedRow, col: wrappedCol };
}

function isPixelInBounds(pixel) {
  const state = PatternEditorState;
  return pixel.row >= 0 && pixel.row < state.patternSize &&
         pixel.col >= 0 && pixel.col < state.patternSize;
}

function updateEditorZoomDisplay() {
  const display = document.getElementById('patternEditorZoomDisplay');
  if (display) {
    // Convert slider value to actual zoom and display it
    const zoom = sliderToZoom(PatternEditorState.editorZoom);
    if (zoom < 1) {
      display.textContent = `1:${zoom.toFixed(2)}`;
    } else {
      display.textContent = `1:${Math.round(zoom)}`;
    }
  }
}

// Note: changePatternSize() removed - pattern size is now controlled by sizeControls.js

function resizePatternGrid(newSize) {
  const state = PatternEditorState;
  const oldSize = state.patternSize;
  const oldData = state.pixelData;

  // Create new grid
  const newData = [];
  for (let row = 0; row < newSize; row++) {
    newData[row] = [];
    for (let col = 0; col < newSize; col++) {
      if (newSize > oldSize && oldSize > 0) {
        // When increasing size, tile the existing pattern
        const srcRow = row % oldSize;
        const srcCol = col % oldSize;
        newData[row][col] = (oldData[srcRow] && oldData[srcRow][srcCol]) || 0;
      } else if (row < oldSize && col < oldSize && oldData[row]) {
        // When decreasing size, preserve existing data within bounds
        newData[row][col] = oldData[row][col] || 0;
      } else {
        newData[row][col] = 0;
      }
    }
  }

  state.patternSize = newSize;
  state.pixelData = newData;

  // Update size input
  const sizeInput = document.getElementById('patternSizeInput');
  if (sizeInput) {
    sizeInput.value = newSize;
  }

  // Reset zoom so pattern fills the boundary
  updateZoomForPatternSize(newSize);

  resizePatternEditorCanvas();
  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function handlePatternUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      loadPatternFromImage(img);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);

  // Reset input
  e.target.value = '';
}

function loadPatternFromImage(img) {
  const state = PatternEditorState;

  // Create temporary canvas to read pixels
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  // Use image size (clamped to max)
  const size = Math.min(Math.max(img.width, img.height), state.MAX_PATTERN_SIZE);
  tempCanvas.width = size;
  tempCanvas.height = size;

  // Draw image scaled to square
  tempCtx.drawImage(img, 0, 0, size, size);

  // Read pixel data
  const imageData = tempCtx.getImageData(0, 0, size, size);
  const pixels = imageData.data;

  // Convert to binary pattern (threshold at 50% brightness)
  const newData = [];
  for (let row = 0; row < size; row++) {
    newData[row] = [];
    for (let col = 0; col < size; col++) {
      const i = (row * size + col) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const brightness = (r + g + b) / 3;
      newData[row][col] = brightness < 128 ? 1 : 0;
    }
  }

  state.patternSize = size;
  state.pixelData = newData;

  // Update size input
  const sizeInput = document.getElementById('patternSizeInput');
  if (sizeInput) {
    sizeInput.value = size;
  }

  // Update size buttons
  if (typeof updatePatternSizeButtonsForEditor === 'function') {
    updatePatternSizeButtonsForEditor(size);
  }

  // Reset zoom so pattern fills the boundary
  updateZoomForPatternSize(size);

  resizePatternEditorCanvas();
  drawPatternEditorCanvas();
  updatePatternPreviewCanvas();
}

function downloadPattern() {
  const state = PatternEditorState;

  // Create download canvas at 1:1 pixel size
  const downloadCanvas = document.createElement('canvas');
  downloadCanvas.width = state.patternSize;
  downloadCanvas.height = state.patternSize;
  const downloadCtx = downloadCanvas.getContext('2d');

  // Fill white background
  downloadCtx.fillStyle = '#ffffff';
  downloadCtx.fillRect(0, 0, state.patternSize, state.patternSize);

  // Draw black pixels
  downloadCtx.fillStyle = '#000000';
  for (let row = 0; row < state.patternSize; row++) {
    for (let col = 0; col < state.patternSize; col++) {
      if (state.pixelData[row] && state.pixelData[row][col] === 1) {
        downloadCtx.fillRect(col, row, 1, 1);
      }
    }
  }

  // Download
  const link = document.createElement('a');
  link.download = 'pattern.png';
  link.href = downloadCanvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
