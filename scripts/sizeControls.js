/* Size controls - tile size and pattern size buttons with custom modals */

// Preset sizes for tiles and patterns
const PRESET_TILE_SIZES = [8, 16, 32, 64, 128, 256];
const PRESET_PATTERN_SIZES = [8, 16, 32, 64, 128, 256];

// Track if current size is custom
let isCustomTileSize = false;
let isCustomPatternSize = false;

// Initialize tile size button controls
function setupTileSizeControls() {
  const buttons = document.querySelectorAll('.tile-size-btn[data-size]');
  const customBtn = document.getElementById('tileSizeCustomBtn');
  const sizeInput = document.getElementById('sizeInput');

  // Handle preset buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', function() {
      const size = parseInt(this.dataset.size);
      setTileSize(size, false);
    });
  });

  // Handle custom button
  customBtn.addEventListener('click', function() {
    openCustomSizeModal();
  });
}

// Set tile size and update UI
function setTileSize(size, isCustom) {
  const sizeInput = document.getElementById('sizeInput');
  const buttons = document.querySelectorAll('.tile-size-btn');
  const customBtn = document.getElementById('tileSizeCustomBtn');

  // Update hidden input
  sizeInput.value = size;

  // Remove active from all buttons
  buttons.forEach(btn => btn.classList.remove('active'));

  if (isCustom) {
    // Custom size
    isCustomTileSize = true;
    customBtn.textContent = size;
    customBtn.classList.add('has-value', 'active');
  } else {
    // Preset size
    isCustomTileSize = false;
    customBtn.textContent = 'Custom';
    customBtn.classList.remove('has-value');

    // Activate the matching preset button
    const matchingBtn = document.querySelector(`.tile-size-btn[data-size="${size}"]`);
    if (matchingBtn) {
      matchingBtn.classList.add('active');
    }
  }

  // Regenerate tileset
  generateTileset();
}

// Open custom tile size modal
function openCustomSizeModal() {
  const modal = document.getElementById('customSizeModal');
  const input = document.getElementById('customSizeValue');
  const sizeInput = document.getElementById('sizeInput');

  // Set current value
  input.value = sizeInput.value;

  modal.classList.add('active');
  input.focus();
  input.select();
}

// Close custom tile size modal
function closeCustomSizeModal() {
  const modal = document.getElementById('customSizeModal');
  modal.classList.remove('active');
}

// Apply custom tile size
function applyCustomTileSize() {
  const input = document.getElementById('customSizeValue');
  const size = parseInt(input.value);

  if (size && size > 0 && size <= 512) {
    // Check if this matches a preset
    const isPreset = PRESET_TILE_SIZES.includes(size);
    setTileSize(size, !isPreset);
    closeCustomSizeModal();
  }
}

// Setup custom tile size modal buttons
function setupCustomSizeModal() {
  const closeBtn = document.getElementById('closeCustomSizeBtn');
  const cancelBtn = document.getElementById('cancelCustomSizeBtn');
  const applyBtn = document.getElementById('applyCustomSizeBtn');
  const input = document.getElementById('customSizeValue');

  closeBtn.addEventListener('click', closeCustomSizeModal);
  cancelBtn.addEventListener('click', closeCustomSizeModal);
  applyBtn.addEventListener('click', applyCustomTileSize);

  // Enter key to apply
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      applyCustomTileSize();
    } else if (e.key === 'Escape') {
      closeCustomSizeModal();
    }
  });
}

// =============================================
// PATTERN SIZE CONTROLS (for pattern editor)
// =============================================

// Setup pattern size button controls in editor
function setupPatternSizeButtons() {
  const buttons = document.querySelectorAll('.pattern-size-btn[data-size]');
  const customBtn = document.getElementById('patternSizeCustomBtn');

  // Handle preset buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', function() {
      const size = parseInt(this.dataset.size);
      setPatternEditorSize(size, false);
    });
  });

  // Handle custom button
  if (customBtn) {
    customBtn.addEventListener('click', function() {
      openCustomPatternSizeModal();
    });
  }
}

// Set pattern editor size and update UI
function setPatternEditorSize(size, isCustom) {
  const buttons = document.querySelectorAll('.pattern-size-btn');
  const customBtn = document.getElementById('patternSizeCustomBtn');
  const sizeInput = document.getElementById('patternSizeInput');

  // Update hidden input
  if (sizeInput) {
    sizeInput.value = size;
  }

  // Remove active from all buttons
  buttons.forEach(btn => btn.classList.remove('active'));

  if (isCustom) {
    isCustomPatternSize = true;
    if (customBtn) {
      customBtn.textContent = size;
      customBtn.classList.add('has-value', 'active');
    }
  } else {
    isCustomPatternSize = false;
    if (customBtn) {
      customBtn.textContent = 'Custom';
      customBtn.classList.remove('has-value');
    }

    // Activate the matching preset button
    const matchingBtn = document.querySelector(`.pattern-size-btn[data-size="${size}"]`);
    if (matchingBtn) {
      matchingBtn.classList.add('active');
    }
  }

  // Update editor if open
  if (PatternEditorState && PatternEditorState.editorCanvas) {
    resizePatternGrid(size);
  }
}

// Open custom pattern size modal
function openCustomPatternSizeModal() {
  const modal = document.getElementById('customPatternSizeModal');
  const input = document.getElementById('customPatternSizeValue');

  // Set current value
  input.value = PatternEditorState ? PatternEditorState.patternSize : 8;

  modal.classList.add('active');
  input.focus();
  input.select();
}

// Close custom pattern size modal
function closeCustomPatternSizeModal() {
  const modal = document.getElementById('customPatternSizeModal');
  modal.classList.remove('active');
}

// Apply custom pattern size
function applyCustomPatternSize() {
  const input = document.getElementById('customPatternSizeValue');
  const size = parseInt(input.value);

  if (size && size >= 2 && size <= 64) {
    // Check if this matches a preset
    const isPreset = PRESET_PATTERN_SIZES.includes(size);
    setPatternEditorSize(size, !isPreset);
    closeCustomPatternSizeModal();
  }
}

// Setup custom pattern size modal buttons
function setupCustomPatternSizeModal() {
  const closeBtn = document.getElementById('closeCustomPatternSizeBtn');
  const cancelBtn = document.getElementById('cancelCustomPatternSizeBtn');
  const applyBtn = document.getElementById('applyCustomPatternSizeBtn');
  const input = document.getElementById('customPatternSizeValue');

  if (closeBtn) closeBtn.addEventListener('click', closeCustomPatternSizeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeCustomPatternSizeModal);
  if (applyBtn) applyBtn.addEventListener('click', applyCustomPatternSize);

  // Enter key to apply
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        applyCustomPatternSize();
      } else if (e.key === 'Escape') {
        closeCustomPatternSizeModal();
      }
    });
  }
}

// Update pattern size buttons when opening editor (to reflect current pattern size)
function updatePatternSizeButtonsForEditor(size) {
  const buttons = document.querySelectorAll('.pattern-size-btn');
  const customBtn = document.getElementById('patternSizeCustomBtn');

  // Remove active from all buttons
  buttons.forEach(btn => btn.classList.remove('active'));

  // Check if it's a preset size
  const isPreset = PRESET_PATTERN_SIZES.includes(size);

  if (isPreset) {
    isCustomPatternSize = false;
    if (customBtn) {
      customBtn.textContent = 'Custom';
      customBtn.classList.remove('has-value');
    }
    const matchingBtn = document.querySelector(`.pattern-size-btn[data-size="${size}"]`);
    if (matchingBtn) {
      matchingBtn.classList.add('active');
    }
  } else {
    isCustomPatternSize = true;
    if (customBtn) {
      customBtn.textContent = size;
      customBtn.classList.add('has-value', 'active');
    }
  }
}
