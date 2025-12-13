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

  // Preview zoom slider
  const previewZoomSlider = document.getElementById('patternPreviewZoom');
  if (previewZoomSlider) {
    previewZoomSlider.addEventListener('input', function(e) {
      state.previewZoom = parseInt(e.target.value);
      updatePatternPreviewCanvas();
      updatePreviewZoomDisplay();
    });
  }

  // Size controls
  const sizeDecrement = document.getElementById('patternSizeDecrement');
  const sizeIncrement = document.getElementById('patternSizeIncrement');
  const sizeInput = document.getElementById('patternSizeInput');

  if (sizeDecrement) {
    sizeDecrement.addEventListener('click', () => changePatternSize(-1));
  }
  if (sizeIncrement) {
    sizeIncrement.addEventListener('click', () => changePatternSize(1));
  }
  if (sizeInput) {
    sizeInput.addEventListener('change', function(e) {
      const newSize = parseInt(e.target.value);
      if (newSize >= state.MIN_PATTERN_SIZE && newSize <= state.MAX_PATTERN_SIZE) {
        resizePatternGrid(newSize);
      } else {
        e.target.value = state.patternSize;
      }
    });
  }

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

  const col = Math.floor(x / state.pixelSize);
  const row = Math.floor(y / state.pixelSize);

  return { row, col };
}

function isPixelInBounds(pixel) {
  const state = PatternEditorState;
  return pixel.row >= 0 && pixel.row < state.patternSize &&
         pixel.col >= 0 && pixel.col < state.patternSize;
}

function updateEditorZoomDisplay() {
  const display = document.getElementById('patternEditorZoomDisplay');
  if (display) {
    display.textContent = `1:${PatternEditorState.editorZoom}`;
  }
}

function updatePreviewZoomDisplay() {
  const display = document.getElementById('patternPreviewZoomDisplay');
  if (display) {
    display.textContent = `1:${PatternEditorState.previewZoom}`;
  }
}

function changePatternSize(delta) {
  const state = PatternEditorState;
  const newSize = state.patternSize + delta;

  if (newSize >= state.MIN_PATTERN_SIZE && newSize <= state.MAX_PATTERN_SIZE) {
    resizePatternGrid(newSize);
  }
}

function resizePatternGrid(newSize) {
  const state = PatternEditorState;
  const oldSize = state.patternSize;
  const oldData = state.pixelData;

  // Create new grid
  const newData = [];
  for (let row = 0; row < newSize; row++) {
    newData[row] = [];
    for (let col = 0; col < newSize; col++) {
      // Preserve existing data if within bounds
      if (row < oldSize && col < oldSize && oldData[row]) {
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
