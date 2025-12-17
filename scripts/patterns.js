/* Pattern-related functions */

// Track current pattern order (will be modified by duplicate/delete/reorder)
let patternOrder = [];

function initializePatternOrder() {
  patternOrder = [...patterns];
}

function createPatternSelectionHTML() {
  const patternSelectionContainer = document.getElementById('patternSelection');
  patternSelectionContainer.innerHTML = ''; // Clear existing content

  const ul = document.createElement('ul');
  ul.style.listStyleType = 'none';
  ul.style.padding = '0';
  ul.id = 'patternList';

  patternOrder.forEach((pattern, index) => {
    const li = createPatternListItem(pattern, index);
    ul.appendChild(li);
  });

  patternSelectionContainer.appendChild(ul);
}

function createPatternListItem(pattern, index) {
  const li = document.createElement('li');
  li.className = 'patternItem';
  li.draggable = false;
  li.dataset.pattern = pattern;
  li.dataset.index = index;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'patternCheckbox';
  checkbox.id = `pattern-${index}`;
  checkbox.dataset.pattern = pattern;
  checkbox.checked = pattern === 'checkerboard'; // Check first pattern by default

  // Create preview wrapper
  const previewWrapper = document.createElement('span');
  previewWrapper.className = 'patternPreviewWrapper';

  const preview = document.createElement('span');
  preview.className = 'patternPreview';

  // Create hover buttons overlay
  const hoverButtons = document.createElement('div');
  hoverButtons.className = 'patternHoverButtons';

  const duplicateBtn = document.createElement('button');
  duplicateBtn.className = 'patternBtn patternDuplicateBtn';
  duplicateBtn.textContent = '+';
  duplicateBtn.title = 'Duplicate pattern';
  duplicateBtn.type = 'button';

  const editBtn = document.createElement('button');
  editBtn.className = 'patternBtn patternEditBtn';
  editBtn.innerHTML = '&#9998;'; // Pencil icon
  editBtn.title = 'Edit pattern';
  editBtn.type = 'button';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'patternBtn patternDeleteBtn';
  deleteBtn.textContent = '-';
  deleteBtn.title = 'Delete pattern';
  deleteBtn.type = 'button';

  const dragHandle = document.createElement('span');
  dragHandle.className = 'patternBtn patternDragHandle';
  dragHandle.innerHTML = '&#9776;'; // Hamburger icon
  dragHandle.title = 'Drag to reorder';

  hoverButtons.appendChild(duplicateBtn);
  hoverButtons.appendChild(editBtn);
  hoverButtons.appendChild(deleteBtn);
  hoverButtons.appendChild(dragHandle);

  previewWrapper.appendChild(preview);
  previewWrapper.appendChild(hoverButtons);

  const label = document.createElement('label');
  label.appendChild(checkbox);
  label.appendChild(previewWrapper);

  li.appendChild(label);

  return li;
}

function createPatternPreview(pattern) {
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 40;
  previewCanvas.height = 40;
  const previewCtx = previewCanvas.getContext('2d');
  previewCtx.fillStyle = 'black';

  const patternData = getPatternPixelData(pattern);
  const originalSize = patternData.size || patternData.pixels.length;

  // Custom patterns use their saved size, built-in patterns default to 16px
  const defaultSize = 16;
  const targetSize = isCustomPattern(pattern) ? originalSize : defaultSize;

  // Resize pattern data if needed
  let previewPixels;
  if (originalSize === targetSize) {
    previewPixels = patternData.pixels;
  } else {
    previewPixels = [];
    for (let row = 0; row < targetSize; row++) {
      previewPixels[row] = [];
      for (let col = 0; col < targetSize; col++) {
        if (targetSize > originalSize && originalSize > 0) {
          // Tile the existing pattern
          const srcRow = row % originalSize;
          const srcCol = col % originalSize;
          previewPixels[row][col] = (patternData.pixels[srcRow] && patternData.pixels[srcRow][srcCol]) || 0;
        } else if (row < originalSize && col < originalSize && patternData.pixels[row]) {
          // Crop for larger patterns
          previewPixels[row][col] = patternData.pixels[row][col] || 0;
        } else {
          previewPixels[row][col] = 0;
        }
      }
    }
  }

  // Draw the pattern scaled to 40px preview
  const pixelSize = 40 / targetSize;
  for (let row = 0; row < targetSize; row++) {
    for (let col = 0; col < targetSize; col++) {
      if (previewPixels[row] && previewPixels[row][col] === 1) {
        previewCtx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  return previewCanvas;
}

// Helper function to collect selected patterns
function getSelectedPatterns() {
  const selectedPatterns = [];
  const checkboxes = document.querySelectorAll('.patternCheckbox');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedPatterns.push(checkbox.dataset.pattern);
    }
  });
  return selectedPatterns;
}

// Draw a pattern using the registry
function drawPattern(x, y, size, ctx, pattern) {
  ctx.imageSmoothingEnabled = false;

  if (patternRenderers[pattern]) {
    patternRenderers[pattern](x, y, size, ctx);
  }
}

// Function to select all pattern checkboxes
function selectAllPatterns() {
  const patternCheckboxes = document.querySelectorAll('.patternCheckbox');
  patternCheckboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  generateTileset();
}

// Function to deselect all pattern checkboxes
function deselectAllPatterns() {
  const patternCheckboxes = document.querySelectorAll('.patternCheckbox');
  patternCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  generateTileset();
}

// Function to add event listeners to pattern checkboxes
function addPatternCheckboxesListeners() {
  const patternCheckboxes = document.querySelectorAll('.patternCheckbox');
  patternCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const colorInput = document.getElementById('colorInput').value;
      const sizeInput = parseInt(document.getElementById('sizeInput').value, 10) || 50;
      const colors = colorInput.split(',').map(color => color.trim()).filter(color => color);
      drawShapes(colors, sizeInput);
    });
  });
}

function addPatternPreviews() {
  const patternPreviewContainers = document.querySelectorAll('.patternPreview');
  patternPreviewContainers.forEach((container) => {
    const label = container.closest('label');
    const checkbox = label.querySelector('input');
    const pattern = checkbox.dataset.pattern;
    container.innerHTML = '';
    const previewCanvas = createPatternPreview(pattern);
    container.appendChild(previewCanvas);
  });
}

// Duplicate a pattern at the given index
function duplicatePattern(index) {
  const pattern = patternOrder[index];
  const wasChecked = document.querySelector(`.patternCheckbox[data-pattern="${pattern}"]`)?.checked || false;

  // Create an independent copy with new ID
  const originalData = getPatternPixelData(pattern);
  const copiedData = JSON.parse(JSON.stringify(originalData));
  const duplicatedPattern = generateCustomPatternId();
  registerCustomPattern(duplicatedPattern, copiedData);

  // Insert duplicate after current position
  patternOrder.splice(index + 1, 0, duplicatedPattern);

  // Rebuild the UI
  rebuildPatternList();

  // Restore checked state
  const checkboxes = document.querySelectorAll('.patternCheckbox');
  checkboxes.forEach((cb, i) => {
    if (i === index || i === index + 1) {
      cb.checked = wasChecked;
    }
  });

  generateTileset();
}

// Delete a pattern at the given index
function deletePattern(index) {
  if (patternOrder.length <= 1) {
    return;
  }

  patternOrder.splice(index, 1);
  rebuildPatternList();
  generateTileset();
}

// Rebuild the pattern list UI
function rebuildPatternList() {
  const checkedPatterns = new Set();
  document.querySelectorAll('.patternCheckbox:checked').forEach(cb => {
    checkedPatterns.add(cb.dataset.pattern);
  });

  createPatternSelectionHTML();
  addPatternPreviews();
  addPatternCheckboxesListeners();
  addPatternButtonListeners();
  setupPatternDragAndDrop();

  document.querySelectorAll('.patternCheckbox').forEach(cb => {
    cb.checked = checkedPatterns.has(cb.dataset.pattern);
  });
}

// Add event listeners for pattern buttons
function addPatternButtonListeners() {
  // Duplicate buttons
  document.querySelectorAll('.patternDuplicateBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.patternItem');
      const index = parseInt(li.dataset.index);
      duplicatePattern(index);
    });
  });

  // Delete buttons
  document.querySelectorAll('.patternDeleteBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.patternItem');
      const index = parseInt(li.dataset.index);
      deletePattern(index);
    });
  });

  // Edit buttons
  document.querySelectorAll('.patternEditBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.patternItem');
      const index = parseInt(li.dataset.index);
      openPatternEditor(index);
    });
  });
}

// Pattern drag and drop
let draggedPatternItem = null;
let draggedPatternIndex = null;
let patternDropPlaceholder = null;
let currentPatternDropTarget = null;
let insertBeforePatternTarget = false;
let patternDragHandlersAdded = false;

function createPatternDropPlaceholder() {
  const placeholder = document.createElement('li');
  placeholder.className = 'dropZonePlaceholder';
  return placeholder;
}

function removePatternDropPlaceholder() {
  if (patternDropPlaceholder && patternDropPlaceholder.parentNode) {
    patternDropPlaceholder.parentNode.removeChild(patternDropPlaceholder);
  }
  patternDropPlaceholder = null;
  currentPatternDropTarget = null;
}

function performPatternDrop() {
  if (!draggedPatternItem || !currentPatternDropTarget) return;

  let targetIndex = parseInt(currentPatternDropTarget.dataset.index);

  if (!insertBeforePatternTarget && draggedPatternIndex > targetIndex) {
    targetIndex += 1;
  } else if (insertBeforePatternTarget && draggedPatternIndex < targetIndex) {
    targetIndex -= 1;
  }

  removePatternDropPlaceholder();

  const [movedPattern] = patternOrder.splice(draggedPatternIndex, 1);
  patternOrder.splice(targetIndex, 0, movedPattern);

  draggedPatternItem.classList.remove('dragging');
  draggedPatternItem = null;
  draggedPatternIndex = null;

  rebuildPatternList();
  generateTileset();
}

function setupPatternDragAndDrop() {
  const patternItems = document.querySelectorAll('.patternItem');

  if (!patternDragHandlersAdded) {
    document.addEventListener('mouseup', function() {
      document.querySelectorAll('.patternItem').forEach(item => {
        item.draggable = false;
      });
    });

    document.addEventListener('dragover', function(e) {
      if (patternDropPlaceholder && (e.target === patternDropPlaceholder || patternDropPlaceholder.contains(e.target))) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    });

    document.addEventListener('drop', function(e) {
      if (patternDropPlaceholder && (e.target === patternDropPlaceholder || patternDropPlaceholder.contains(e.target))) {
        e.preventDefault();
        performPatternDrop();
      }
    });

    patternDragHandlersAdded = true;
  }

  patternItems.forEach(item => {
    const handle = item.querySelector('.patternDragHandle');
    const preview = item.querySelector('.patternPreviewWrapper .patternPreview canvas');

    handle.addEventListener('mousedown', function(e) {
      item.draggable = true;
    });

    item.addEventListener('dragstart', function(e) {
      draggedPatternItem = this;
      draggedPatternIndex = parseInt(this.dataset.index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');

      if (preview) {
        e.dataTransfer.setDragImage(preview, 20, 20);
      }

      setTimeout(() => {
        this.classList.add('dragging');
      }, 0);
    });

    item.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      this.draggable = false;
      draggedPatternItem = null;
      draggedPatternIndex = null;
      removePatternDropPlaceholder();
    });

    item.addEventListener('dragover', function(e) {
      // Skip reorder UI if file is being dragged or no internal drag is active
      if ((typeof DragDropState !== 'undefined' && DragDropState.isDragging) || !draggedPatternItem) {
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (this === draggedPatternItem) return;

      const rect = this.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const isLeftHalf = cursorX < rect.width / 2;

      if (currentPatternDropTarget === this && insertBeforePatternTarget === isLeftHalf) {
        return;
      }

      currentPatternDropTarget = this;
      insertBeforePatternTarget = isLeftHalf;

      if (patternDropPlaceholder && patternDropPlaceholder.parentNode) {
        patternDropPlaceholder.parentNode.removeChild(patternDropPlaceholder);
      }

      patternDropPlaceholder = createPatternDropPlaceholder();

      if (insertBeforePatternTarget) {
        this.parentNode.insertBefore(patternDropPlaceholder, this);
      } else {
        this.parentNode.insertBefore(patternDropPlaceholder, this.nextSibling);
      }
    });

    item.addEventListener('dragleave', function(e) {
      // Don't remove placeholder
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      if (this === draggedPatternItem) {
        removePatternDropPlaceholder();
        return;
      }
      performPatternDrop();
    });
  });
}
