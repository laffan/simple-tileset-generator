/* Combination Pattern Editor - Canvas-based pattern editing for mask */

// Create empty pattern (all white = no mask applied)
function createEmptyCombPattern() {
  const state = CombinationEditorState;
  const size = state.patternSize;

  state.patternPixelData = [];
  for (let row = 0; row < size; row++) {
    state.patternPixelData[row] = [];
    for (let col = 0; col < size; col++) {
      state.patternPixelData[row][col] = 0; // 0 = white (transparent in mask)
    }
  }
}

// Load pattern data
function loadCombPatternData(patternData) {
  const state = CombinationEditorState;

  if (!patternData) {
    createEmptyCombPattern();
    return;
  }

  state.patternSize = patternData.size || 16;
  state.patternPixelData = [];

  // Copy pixel data
  const pixels = patternData.pixels || [];
  for (let row = 0; row < state.patternSize; row++) {
    state.patternPixelData[row] = [];
    for (let col = 0; col < state.patternSize; col++) {
      state.patternPixelData[row][col] = (pixels[row] && pixels[row][col]) ? 1 : 0;
    }
  }

  // Update size buttons
  updateCombPatternSizeButtons(state.patternSize);

  // Redraw
  drawCombPatternEditorCanvas();
}

// Get pattern data from editor
function getCombPatternData() {
  const state = CombinationEditorState;

  return {
    size: state.patternSize,
    pixels: state.patternPixelData.map(row => [...row])
  };
}

// Draw the pattern editor canvas
function drawCombPatternEditorCanvas() {
  const state = CombinationEditorState;
  if (!state.patternCanvas || !state.patternCtx) return;

  const ctx = state.patternCtx;
  const canvas = state.patternCanvas;
  const size = state.patternSize;

  // Calculate pixel size based on zoom
  const boundarySize = state.patternBoundarySize;
  const zoom = state.patternEditorZoom / 100;
  const pixelSize = Math.floor((boundarySize / size) * zoom);
  state.patternPixelSize = Math.max(1, pixelSize);

  // Calculate offsets to center the pattern
  const patternWidth = size * state.patternPixelSize;
  const patternHeight = size * state.patternPixelSize;
  state.patternBoundaryOffsetX = Math.floor((canvas.width - patternWidth) / 2);
  state.patternBoundaryOffsetY = Math.floor((canvas.height - patternHeight) / 2);

  // Clear canvas
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw pattern pixels
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const x = state.patternBoundaryOffsetX + col * state.patternPixelSize + state.patternOffsetX;
      const y = state.patternBoundaryOffsetY + row * state.patternPixelSize + state.patternOffsetY;

      const pixel = state.patternPixelData[row] && state.patternPixelData[row][col];
      ctx.fillStyle = pixel ? '#333' : '#fff';
      ctx.fillRect(x, y, state.patternPixelSize, state.patternPixelSize);
    }
  }

  // Draw grid lines
  ctx.strokeStyle = 'rgba(180, 180, 180, 0.5)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= size; i++) {
    const x = state.patternBoundaryOffsetX + i * state.patternPixelSize + state.patternOffsetX;
    const y = state.patternBoundaryOffsetY + i * state.patternPixelSize + state.patternOffsetY;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x + 0.5, state.patternBoundaryOffsetY + state.patternOffsetY);
    ctx.lineTo(x + 0.5, state.patternBoundaryOffsetY + patternHeight + state.patternOffsetY);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(state.patternBoundaryOffsetX + state.patternOffsetX, y + 0.5);
    ctx.lineTo(state.patternBoundaryOffsetX + patternWidth + state.patternOffsetX, y + 0.5);
    ctx.stroke();
  }

  // Draw red boundary
  ctx.strokeStyle = '#dc3545';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(
    state.patternBoundaryOffsetX + state.patternOffsetX,
    state.patternBoundaryOffsetY + state.patternOffsetY,
    patternWidth,
    patternHeight
  );
  ctx.setLineDash([]);

  // Update preview
  updateCombinationPreview();
}

// Get pixel coordinates from mouse event
function getCombPatternPixelFromMouse(e) {
  const state = CombinationEditorState;
  if (!state.patternCanvas) return null;

  const rect = state.patternCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left - state.patternBoundaryOffsetX - state.patternOffsetX;
  const y = e.clientY - rect.top - state.patternBoundaryOffsetY - state.patternOffsetY;

  const col = Math.floor(x / state.patternPixelSize);
  const row = Math.floor(y / state.patternPixelSize);

  if (row < 0 || row >= state.patternSize || col < 0 || col >= state.patternSize) {
    return null;
  }

  return { row, col };
}

// Set a pixel in the pattern
function setCombPatternPixel(row, col, value) {
  const state = CombinationEditorState;
  if (row < 0 || row >= state.patternSize || col < 0 || col >= state.patternSize) return;

  if (!state.patternPixelData[row]) {
    state.patternPixelData[row] = [];
  }
  state.patternPixelData[row][col] = value;
}

// Draw a line between two pixels (Bresenham's algorithm)
function drawCombPatternLine(r1, c1, r2, c2, value) {
  const dr = Math.abs(r2 - r1);
  const dc = Math.abs(c2 - c1);
  const sr = r1 < r2 ? 1 : -1;
  const sc = c1 < c2 ? 1 : -1;
  let err = dr - dc;

  let r = r1;
  let c = c1;

  while (true) {
    setCombPatternPixel(r, c, value);

    if (r === r2 && c === c2) break;

    const e2 = 2 * err;
    if (e2 > -dc) {
      err -= dc;
      r += sr;
    }
    if (e2 < dr) {
      err += dr;
      c += sc;
    }
  }
}

// Invert pattern
function invertCombPattern() {
  const state = CombinationEditorState;
  const size = state.patternSize;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (state.patternPixelData[row]) {
        state.patternPixelData[row][col] = state.patternPixelData[row][col] ? 0 : 1;
      }
    }
  }

  drawCombPatternEditorCanvas();
}

// Resize pattern
function resizeCombPattern(newSize) {
  const state = CombinationEditorState;
  const oldSize = state.patternSize;
  const oldData = state.patternPixelData;

  state.patternSize = newSize;
  state.patternPixelData = [];

  for (let row = 0; row < newSize; row++) {
    state.patternPixelData[row] = [];
    for (let col = 0; col < newSize; col++) {
      if (newSize > oldSize && oldSize > 0) {
        // Tile the existing pattern
        const srcRow = row % oldSize;
        const srcCol = col % oldSize;
        state.patternPixelData[row][col] = (oldData[srcRow] && oldData[srcRow][srcCol]) || 0;
      } else if (row < oldSize && col < oldSize && oldData[row]) {
        // Preserve existing data
        state.patternPixelData[row][col] = oldData[row][col] || 0;
      } else {
        state.patternPixelData[row][col] = 0;
      }
    }
  }

  // Update zoom to fit
  updateCombPatternZoomForSize(newSize);

  drawCombPatternEditorCanvas();
}

// Update zoom for pattern size
function updateCombPatternZoomForSize(size) {
  const state = CombinationEditorState;
  // Set zoom so pattern fills the boundary
  state.patternEditorZoom = 100;

  const zoomSlider = document.getElementById('combPatternEditorZoom');
  if (zoomSlider) {
    zoomSlider.value = state.patternEditorZoom;
  }

  updateCombPatternZoomDisplay();
}

// Update zoom display
function updateCombPatternZoomDisplay() {
  const state = CombinationEditorState;
  const display = document.getElementById('combPatternEditorZoomDisplay');
  if (!display) return;

  const zoom = state.patternEditorZoom / 100;
  if (zoom >= 1) {
    display.textContent = '1:1';
  } else if (zoom >= 0.5) {
    display.textContent = '1:2';
  } else if (zoom >= 0.25) {
    display.textContent = '1:4';
  } else {
    display.textContent = Math.round(zoom * 100) + '%';
  }
}

// Update pattern size buttons
function updateCombPatternSizeButtons(size) {
  document.querySelectorAll('.comb-pattern-size-btn').forEach(btn => {
    const btnSize = parseInt(btn.dataset.size, 10);
    btn.classList.toggle('active', btnSize === size);
  });

  const sizeInput = document.getElementById('combPatternSizeInput');
  if (sizeInput) {
    sizeInput.value = size;
  }
}

// Setup pattern toolbar buttons
function setupCombPatternToolbar() {
  // Size buttons
  document.querySelectorAll('.comb-pattern-size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const size = parseInt(this.dataset.size, 10);
      if (size) {
        resizeCombPattern(size);
        updateCombPatternSizeButtons(size);
      }
    });
  });

  // Invert button
  const invertBtn = document.getElementById('combPatternInvertBtn');
  if (invertBtn) {
    invertBtn.addEventListener('click', invertCombPattern);
  }

  // Zoom slider
  const zoomSlider = document.getElementById('combPatternEditorZoom');
  if (zoomSlider) {
    zoomSlider.addEventListener('input', function() {
      CombinationEditorState.patternEditorZoom = parseInt(this.value, 10);
      updateCombPatternZoomDisplay();
      drawCombPatternEditorCanvas();
    });
  }

  // Upload button
  const uploadBtn = document.getElementById('combPatternUploadBtn');
  const uploadInput = document.getElementById('combPatternUploadInput');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', handleCombPatternUpload);
  }

  // Download button
  const downloadBtn = document.getElementById('combPatternDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadCombPattern);
  }
}

function handleCombPatternUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      // Convert image to pattern
      const state = CombinationEditorState;
      const size = state.patternSize;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);

      for (let row = 0; row < size; row++) {
        state.patternPixelData[row] = [];
        for (let col = 0; col < size; col++) {
          const i = (row * size + col) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const brightness = (r + g + b) / 3;
          state.patternPixelData[row][col] = brightness < 128 ? 1 : 0;
        }
      }

      drawCombPatternEditorCanvas();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);

  e.target.value = '';
}

function downloadCombPattern() {
  const state = CombinationEditorState;
  const size = state.patternSize;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const pixel = state.patternPixelData[row] && state.patternPixelData[row][col];
      ctx.fillStyle = pixel ? '#333' : '#fff';
      ctx.fillRect(col, row, 1, 1);
    }
  }

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'combination-pattern.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
