/* Pattern Editor Brushes - brush types, rendering, and application */

// Brush state extension for PatternEditorState
const BrushState = {
  currentBrush: 'square',  // 'square', 'round', 'airbrush', 'custom'
  brushSize: 1,            // 1-16 pixels
  isErasing: false,        // Erase mode toggle
  customBrushData: null,   // Custom brush pixel data (2D array)
  airbrushDensity: 30,     // 10-100% density for airbrush
  hoverPixel: null         // Current hover pixel for ghost preview
};

// Brush type definitions
const BrushTypes = {
  // Square brush - fills a square area
  square: {
    name: 'Square',
    getPixels: function(centerRow, centerCol, size) {
      const pixels = [];
      const halfSize = Math.floor(size / 2);
      const startOffset = size % 2 === 0 ? -halfSize + 1 : -halfSize;
      const endOffset = halfSize;

      for (let dr = startOffset; dr <= endOffset; dr++) {
        for (let dc = startOffset; dc <= endOffset; dc++) {
          pixels.push({ row: centerRow + dr, col: centerCol + dc });
        }
      }
      return pixels;
    },
    renderPreview: function(ctx, size, isActive) {
      const canvasSize = ctx.canvas.width;
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Background
      ctx.fillStyle = isActive ? '#007bff' : '#fff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Draw square brush preview
      const padding = 3;
      const brushSize = canvasSize - padding * 2;
      ctx.fillStyle = isActive ? '#fff' : '#333';
      ctx.fillRect(padding, padding, brushSize, brushSize);
    }
  },

  // Round brush - fills a circular area
  round: {
    name: 'Round',
    getPixels: function(centerRow, centerCol, size) {
      const pixels = [];
      const radius = size / 2;
      const halfSize = Math.ceil(radius);

      for (let dr = -halfSize; dr <= halfSize; dr++) {
        for (let dc = -halfSize; dc <= halfSize; dc++) {
          // Check if pixel center is within radius
          const distance = Math.sqrt(dr * dr + dc * dc);
          if (distance <= radius) {
            pixels.push({ row: centerRow + dr, col: centerCol + dc });
          }
        }
      }
      return pixels;
    },
    renderPreview: function(ctx, size, isActive) {
      const canvasSize = ctx.canvas.width;
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Background
      ctx.fillStyle = isActive ? '#007bff' : '#fff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Draw circle brush preview
      const centerX = canvasSize / 2;
      const centerY = canvasSize / 2;
      const radius = (canvasSize - 6) / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#fff' : '#333';
      ctx.fill();
    }
  },

  // Airbrush - random spray pattern
  airbrush: {
    name: 'Airbrush',
    getPixels: function(centerRow, centerCol, size, customData, density) {
      const pixels = [];
      const radius = size / 2;

      // Use density from BrushState (10-100%)
      const densityPercent = density || BrushState.airbrushDensity;
      const sprayCount = Math.max(1, Math.floor(size * size * (densityPercent / 100)));

      for (let i = 0; i < sprayCount; i++) {
        // Random angle and distance from center (weighted towards center)
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * Math.random() * radius; // Squared random for center weighting

        const dr = Math.round(Math.sin(angle) * distance);
        const dc = Math.round(Math.cos(angle) * distance);

        const pixel = { row: centerRow + dr, col: centerCol + dc };

        // Avoid duplicates
        if (!pixels.some(p => p.row === pixel.row && p.col === pixel.col)) {
          pixels.push(pixel);
        }
      }

      // Always include the center pixel
      if (!pixels.some(p => p.row === centerRow && p.col === centerCol)) {
        pixels.push({ row: centerRow, col: centerCol });
      }

      return pixels;
    },
    renderPreview: function(ctx, size, isActive) {
      const canvasSize = ctx.canvas.width;
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Background
      ctx.fillStyle = isActive ? '#007bff' : '#fff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Draw spray pattern preview (deterministic for preview)
      const centerX = canvasSize / 2;
      const centerY = canvasSize / 2;
      const radius = (canvasSize - 6) / 2;

      ctx.fillStyle = isActive ? '#fff' : '#333';

      // Use fixed seed-like pattern for consistent preview
      const points = [
        [0, 0], [0.2, 0.1], [-0.15, 0.25], [0.3, -0.2], [-0.25, -0.15],
        [0.1, 0.35], [-0.35, 0.05], [0.15, -0.3], [-0.1, -0.35], [0.4, 0.2],
        [-0.2, 0.4], [0.35, -0.1], [-0.4, -0.2], [0.05, 0.5], [-0.3, -0.4]
      ];

      const pixelSize = Math.max(1, canvasSize / 12);
      points.forEach(([dx, dy]) => {
        const x = centerX + dx * radius;
        const y = centerY + dy * radius;
        ctx.fillRect(x - pixelSize/2, y - pixelSize/2, pixelSize, pixelSize);
      });
    }
  },

  // Custom brush - user-uploaded pattern
  custom: {
    name: 'Custom',
    getPixels: function(centerRow, centerCol, size, customData) {
      const pixels = [];
      if (!customData || !customData.length) {
        // Fall back to single pixel if no custom data
        return [{ row: centerRow, col: centerCol }];
      }

      const brushHeight = customData.length;
      const brushWidth = customData[0] ? customData[0].length : 0;

      // Scale factor based on brush size
      const scale = Math.max(1, Math.floor(size / Math.max(brushWidth, brushHeight)));

      const halfHeight = Math.floor((brushHeight * scale) / 2);
      const halfWidth = Math.floor((brushWidth * scale) / 2);

      for (let br = 0; br < brushHeight; br++) {
        for (let bc = 0; bc < brushWidth; bc++) {
          if (customData[br] && customData[br][bc] === 1) {
            // Apply scaling
            for (let sr = 0; sr < scale; sr++) {
              for (let sc = 0; sc < scale; sc++) {
                const dr = br * scale + sr - halfHeight;
                const dc = bc * scale + sc - halfWidth;
                pixels.push({ row: centerRow + dr, col: centerCol + dc });
              }
            }
          }
        }
      }

      return pixels;
    },
    renderPreview: function(ctx, size, isActive, customData) {
      const canvasSize = ctx.canvas.width;
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Background
      ctx.fillStyle = isActive ? '#007bff' : '#fff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      if (!customData || !customData.length) {
        return;
      }

      // Draw custom brush data
      const brushHeight = customData.length;
      const brushWidth = customData[0] ? customData[0].length : 0;
      const padding = 2;
      const availableSize = canvasSize - padding * 2;
      const pixelSize = Math.max(1, Math.floor(availableSize / Math.max(brushWidth, brushHeight)));

      const offsetX = padding + (availableSize - brushWidth * pixelSize) / 2;
      const offsetY = padding + (availableSize - brushHeight * pixelSize) / 2;

      ctx.fillStyle = isActive ? '#fff' : '#333';

      for (let row = 0; row < brushHeight; row++) {
        for (let col = 0; col < brushWidth; col++) {
          if (customData[row] && customData[row][col] === 1) {
            ctx.fillRect(
              offsetX + col * pixelSize,
              offsetY + row * pixelSize,
              pixelSize,
              pixelSize
            );
          }
        }
      }
    }
  }
};

// Initialize brush previews in the UI
function initBrushPreviews() {
  const brushButtons = document.querySelectorAll('.pattern-brush-btn');

  brushButtons.forEach(btn => {
    const brushType = btn.dataset.brush;
    const canvas = btn.querySelector('.brush-preview-canvas');
    if (!canvas || !brushType || !BrushTypes[brushType]) return;

    const ctx = canvas.getContext('2d');
    const isActive = btn.classList.contains('active');

    if (brushType === 'custom') {
      BrushTypes[brushType].renderPreview(ctx, 20, isActive, BrushState.customBrushData);
    } else {
      BrushTypes[brushType].renderPreview(ctx, 20, isActive);
    }
  });

  // Show custom brush button if we have custom data
  updateCustomBrushVisibility();

  // Update density slider visibility
  updateDensitySliderVisibility();
}

// Update all brush preview canvases (called when selection changes)
function updateBrushPreviews() {
  const brushButtons = document.querySelectorAll('.pattern-brush-btn');

  brushButtons.forEach(btn => {
    const brushType = btn.dataset.brush;
    const canvas = btn.querySelector('.brush-preview-canvas');
    if (!canvas || !brushType || !BrushTypes[brushType]) return;

    const ctx = canvas.getContext('2d');
    const isActive = btn.classList.contains('active');

    if (brushType === 'custom') {
      BrushTypes[brushType].renderPreview(ctx, 20, isActive, BrushState.customBrushData);
    } else {
      BrushTypes[brushType].renderPreview(ctx, 20, isActive);
    }
  });
}

// Show/hide custom brush button based on whether we have custom data
function updateCustomBrushVisibility() {
  const customBtn = document.querySelector('.pattern-brush-btn[data-brush="custom"]');
  if (customBtn) {
    customBtn.style.display = BrushState.customBrushData ? '' : 'none';
  }
}

// Show/hide density slider based on brush type
function updateDensitySliderVisibility() {
  const densityControl = document.getElementById('airbrushDensityControl');
  if (densityControl) {
    densityControl.style.display = BrushState.currentBrush === 'airbrush' ? '' : 'none';
  }
}

// Set current brush type
function setCurrentBrush(brushType) {
  if (!BrushTypes[brushType]) return;

  BrushState.currentBrush = brushType;

  // Update button states
  const brushButtons = document.querySelectorAll('.pattern-brush-btn');
  brushButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.brush === brushType);
  });

  // Update previews
  updateBrushPreviews();

  // Show/hide density slider
  updateDensitySliderVisibility();
}

// Set brush size
function setBrushSize(size) {
  BrushState.brushSize = Math.max(1, Math.min(16, parseInt(size) || 1));

  // Update display
  const display = document.getElementById('brushSizeDisplay');
  if (display) {
    display.textContent = BrushState.brushSize;
  }

  // Update slider
  const slider = document.getElementById('brushSizeSlider');
  if (slider && parseInt(slider.value) !== BrushState.brushSize) {
    slider.value = BrushState.brushSize;
  }
}

// Set airbrush density
function setAirbrushDensity(density) {
  BrushState.airbrushDensity = Math.max(3, Math.min(100, parseInt(density) || 30));

  // Update display
  const display = document.getElementById('brushDensityDisplay');
  if (display) {
    display.textContent = BrushState.airbrushDensity;
  }

  // Update slider
  const slider = document.getElementById('brushDensitySlider');
  if (slider && parseInt(slider.value) !== BrushState.airbrushDensity) {
    slider.value = BrushState.airbrushDensity;
  }
}

// Toggle erase mode
function toggleEraseMode(forceState) {
  if (typeof forceState === 'boolean') {
    BrushState.isErasing = forceState;
  } else {
    BrushState.isErasing = !BrushState.isErasing;
  }

  // Update button state
  const eraseBtn = document.getElementById('patternEraseToggle');
  if (eraseBtn) {
    eraseBtn.classList.toggle('active', BrushState.isErasing);
  }

  return BrushState.isErasing;
}

// Get pixels affected by current brush at given position
function getBrushPixels(centerRow, centerCol) {
  const brushType = BrushTypes[BrushState.currentBrush];
  if (!brushType) {
    return [{ row: centerRow, col: centerCol }];
  }

  if (BrushState.currentBrush === 'custom') {
    return brushType.getPixels(centerRow, centerCol, BrushState.brushSize, BrushState.customBrushData);
  }

  if (BrushState.currentBrush === 'airbrush') {
    return brushType.getPixels(centerRow, centerCol, BrushState.brushSize, null, BrushState.airbrushDensity);
  }

  return brushType.getPixels(centerRow, centerCol, BrushState.brushSize);
}

// Get pixels for ghost preview (non-random for airbrush)
function getBrushPixelsForPreview(centerRow, centerCol) {
  const brushType = BrushTypes[BrushState.currentBrush];
  if (!brushType) {
    return [{ row: centerRow, col: centerCol }];
  }

  // For airbrush, use round brush shape for preview to avoid random flickering
  if (BrushState.currentBrush === 'airbrush') {
    return BrushTypes.round.getPixels(centerRow, centerCol, BrushState.brushSize);
  }

  if (BrushState.currentBrush === 'custom') {
    return brushType.getPixels(centerRow, centerCol, BrushState.brushSize, BrushState.customBrushData);
  }

  return brushType.getPixels(centerRow, centerCol, BrushState.brushSize);
}

// Set hover pixel for ghost preview
function setHoverPixel(pixel) {
  BrushState.hoverPixel = pixel;
}

// Load custom brush from image
function loadCustomBrushFromImage(img) {
  // Create temporary canvas to read pixels
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  // Limit brush size to reasonable dimensions
  const maxBrushSize = 32;
  const size = Math.min(Math.max(img.width, img.height), maxBrushSize);
  tempCanvas.width = size;
  tempCanvas.height = size;

  // Draw image scaled to square
  tempCtx.drawImage(img, 0, 0, size, size);

  // Read pixel data
  const imageData = tempCtx.getImageData(0, 0, size, size);
  const pixels = imageData.data;

  // Convert to binary brush data (threshold at 50% brightness)
  const brushData = [];
  for (let row = 0; row < size; row++) {
    brushData[row] = [];
    for (let col = 0; col < size; col++) {
      const i = (row * size + col) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Consider both brightness and alpha
      const brightness = (r + g + b) / 3;
      brushData[row][col] = (brightness < 128 && a > 128) ? 1 : 0;
    }
  }

  // Store custom brush data
  BrushState.customBrushData = brushData;

  // Show and select the custom brush
  updateCustomBrushVisibility();
  setCurrentBrush('custom');

  // Update previews
  updateBrushPreviews();
}

// Setup brush event listeners
function setupBrushEvents() {
  // Brush selection buttons
  const brushButtons = document.querySelectorAll('.pattern-brush-btn');
  brushButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.disabled) return;
      const brushType = this.dataset.brush;
      if (brushType) {
        setCurrentBrush(brushType);
      }
    });
  });

  // Erase toggle
  const eraseToggle = document.getElementById('patternEraseToggle');
  if (eraseToggle) {
    eraseToggle.addEventListener('click', function() {
      toggleEraseMode();
    });
  }

  // Brush size slider
  const sizeSlider = document.getElementById('brushSizeSlider');
  if (sizeSlider) {
    sizeSlider.addEventListener('input', function() {
      setBrushSize(this.value);
    });
  }

  // Density slider
  const densitySlider = document.getElementById('brushDensitySlider');
  if (densitySlider) {
    densitySlider.addEventListener('input', function() {
      setAirbrushDensity(this.value);
    });
  }

  // Upload brush link
  const uploadLink = document.getElementById('uploadBrushLink');
  const uploadInput = document.getElementById('brushUploadInput');
  if (uploadLink && uploadInput) {
    uploadLink.addEventListener('click', (e) => {
      e.preventDefault();
      uploadInput.click();
    });
    uploadInput.addEventListener('change', handleBrushUpload);
  }

  // Custom brush delete button
  const deleteBtn = document.getElementById('customBrushDelete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent selecting the custom brush
      deleteCustomBrush();
    });
  }
}

// Delete custom brush with confirmation
function deleteCustomBrush() {
  if (!BrushState.customBrushData) return;

  if (confirm('Delete custom brush?')) {
    BrushState.customBrushData = null;

    // Hide the custom brush button
    updateCustomBrushVisibility();

    // Switch to square brush if custom was selected
    if (BrushState.currentBrush === 'custom') {
      setCurrentBrush('square');
    }

    updateBrushPreviews();
  }
}

// Handle brush upload
function handleBrushUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      loadCustomBrushFromImage(img);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);

  // Reset input
  e.target.value = '';
}

// Reset brush state (called when opening editor)
function resetBrushState() {
  BrushState.currentBrush = 'square';
  BrushState.brushSize = 1;
  BrushState.isErasing = false;
  BrushState.airbrushDensity = 30;
  BrushState.hoverPixel = null;
  // Keep custom brush data between sessions

  // Update UI
  setBrushSize(1);
  setAirbrushDensity(30);
  toggleEraseMode(false);
  setCurrentBrush('square');
  updateCustomBrushVisibility();
}

// Get custom brush data for session saving
function getCustomBrushDataForSession() {
  return BrushState.customBrushData;
}

// Load custom brush data from session
function loadCustomBrushDataFromSession(data) {
  if (data && Array.isArray(data) && data.length > 0) {
    BrushState.customBrushData = data;
    updateCustomBrushVisibility();
    updateBrushPreviews();
  }
}
