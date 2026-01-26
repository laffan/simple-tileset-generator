/* Shape-related functions */

// Track current shape order (will be modified by duplicate/delete/reorder)
let shapeOrder = [];

function initializeShapeOrder() {
  shapeOrder = [...shapes];
}

function createShapeSelectionHTML() {
  const shapeSelectionContainer = document.getElementById('shapeSelection');
  shapeSelectionContainer.innerHTML = ''; // Clear existing content

  const ul = document.createElement('ul');
  ul.style.listStyleType = 'none';
  ul.style.padding = '0';
  ul.id = 'shapeList';

  shapeOrder.forEach((shape, index) => {
    const li = createShapeListItem(shape, index);
    ul.appendChild(li);
  });

  shapeSelectionContainer.appendChild(ul);
}

function createShapeListItem(shape, index) {
  const li = document.createElement('li');
  li.className = 'shapeItem';
  li.draggable = false; // Only enable when dragging from handle
  li.dataset.shape = shape;
  li.dataset.index = index;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'shapeCheckbox';
  checkbox.id = `shape-${index}`;
  checkbox.dataset.shape = shape;
  checkbox.checked = shape === 'square'; // Check 'square' by default

  // Create preview wrapper that will contain both preview and hover buttons
  const previewWrapper = document.createElement('span');
  previewWrapper.className = 'shapePreviewWrapper';

  const preview = document.createElement('span');
  preview.className = 'shapePreview';

  // Create hover buttons overlay (inside preview wrapper)
  const hoverButtons = document.createElement('div');
  hoverButtons.className = 'shapeHoverButtons';

  const duplicateBtn = document.createElement('button');
  duplicateBtn.className = 'shapeBtn shapeDuplicateBtn';
  duplicateBtn.textContent = '+';
  duplicateBtn.title = 'Duplicate shape';
  duplicateBtn.type = 'button';

  const editBtn = document.createElement('button');
  editBtn.className = 'shapeBtn shapeEditBtn';
  editBtn.innerHTML = '&#9998;'; // Pencil icon
  editBtn.title = 'Edit shape';
  editBtn.type = 'button';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'shapeBtn shapeDeleteBtn';
  deleteBtn.textContent = '-';
  deleteBtn.title = 'Delete shape';
  deleteBtn.type = 'button';

  const dragHandle = document.createElement('span');
  dragHandle.className = 'shapeBtn shapeDragHandle';
  dragHandle.innerHTML = '&#9776;'; // Hamburger icon (☰)
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


function createShapePreview(shape) {
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 40;
  previewCanvas.height = 40;
  const previewCtx = previewCanvas.getContext('2d');
  previewCtx.fillStyle = 'black';
  drawShape(0, 0, 40, previewCtx, shape);
  return previewCanvas;
}


// Helper function to collect selected shapes (in current order)
function getSelectedShapes() {
  const selectedShapes = [];
  const checkboxes = document.querySelectorAll('.shapeCheckbox');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedShapes.push(checkbox.dataset.shape);
    }
  });
  return selectedShapes;
}


// Draw a shape using the registry
function drawShape(x, y, size, ctx, shape) {
  ctx.imageSmoothingEnabled = true;
  ctx.mozImageSmoothingEnabled = true;
  ctx.webkitImageSmoothingEnabled = true;
  ctx.msImageSmoothingEnabled = true;

  // Clip to tile bounds so shapes extending outside are cropped cleanly
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();

  // Look up the renderer in the registry and call it
  if (shapeRenderers[shape]) {
    shapeRenderers[shape](x, y, size, ctx);
  }

  ctx.restore();
}

// Function to select all shape checkboxes
function selectAllShapes() {
  const shapeCheckboxes = document.querySelectorAll('.shapeCheckbox');
  shapeCheckboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  generateTileset();
}

// Function to deselect all shape checkboxes
function deselectAllShapes() {
  const shapeCheckboxes = document.querySelectorAll('.shapeCheckbox');
  shapeCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  generateTileset();
}

// Function to add event listeners to shape checkboxes
function addShapeCheckboxesListeners() {
  const shapeCheckboxes = document.querySelectorAll('.shapeCheckbox');
  shapeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {

      // Grab the current color selections and size
      const colorInput = document.getElementById('colorInput').value;
      const sizeInput = parseInt(document.getElementById('sizeInput').value, 10) || 50;

      const colors = colorInput.split(',').map(color => color.trim()).filter(color => color);

      // Redraw the shapes based on selected colors, size, and shapes
      drawShapes(colors, sizeInput);

    });
  });
}


function addShapePreviews() {
  const shapePreviewContainers = document.querySelectorAll('.shapePreview');
  shapePreviewContainers.forEach((container) => {
    // Go up to label to find the checkbox (preview -> wrapper -> label)
    const label = container.closest('label');
    const checkbox = label.querySelector('input');
    const shape = checkbox.dataset.shape;
    container.innerHTML = ''; // Clear existing preview
    const previewCanvas = createShapePreview(shape);
    container.appendChild(previewCanvas);
  });
}

// Duplicate a shape at the given index
function duplicateShape(index) {
  const shape = shapeOrder[index];
  const wasChecked = document.querySelector(`.shapeCheckbox[data-shape="${shape}"]`)?.checked || false;

  // For custom shapes, create an independent copy with new ID
  let duplicatedShape = shape;
  if (isCustomShape(shape)) {
    const originalData = getShapePathData(shape);
    // Deep copy the path data
    const copiedData = JSON.parse(JSON.stringify(originalData));
    duplicatedShape = generateCustomShapeId();
    registerCustomShape(duplicatedShape, copiedData);
  }

  // Insert duplicate after current position
  shapeOrder.splice(index + 1, 0, duplicatedShape);

  // Rebuild the UI
  rebuildShapeList();

  // Restore checked state for original and check the duplicate
  const checkboxes = document.querySelectorAll('.shapeCheckbox');
  checkboxes.forEach((cb, i) => {
    if (i === index || i === index + 1) {
      cb.checked = wasChecked;
    }
  });

  generateTileset();
}

// Delete a shape at the given index
function deleteShape(index) {
  if (shapeOrder.length <= 1) {
    return; // Don't allow deleting the last shape
  }

  shapeOrder.splice(index, 1);
  rebuildShapeList();
  generateTileset();
}

// Rebuild the shape list UI (preserving checkbox states)
function rebuildShapeList() {
  // Save current checkbox states by shape name (collect all checked shapes)
  const checkedShapes = new Set();
  document.querySelectorAll('.shapeCheckbox:checked').forEach(cb => {
    checkedShapes.add(cb.dataset.shape);
  });

  // Rebuild HTML
  createShapeSelectionHTML();
  addShapePreviews();
  addShapeCheckboxesListeners();
  addShapeButtonListeners();
  setupDragAndDrop();

  // Restore checkbox states
  document.querySelectorAll('.shapeCheckbox').forEach(cb => {
    cb.checked = checkedShapes.has(cb.dataset.shape);
  });
}

// Add event listeners for duplicate/delete/edit buttons
function addShapeButtonListeners() {
  // Duplicate buttons
  document.querySelectorAll('.shapeDuplicateBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.shapeItem');
      const index = parseInt(li.dataset.index);
      duplicateShape(index);
    });
  });

  // Delete buttons
  document.querySelectorAll('.shapeDeleteBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.shapeItem');
      const index = parseInt(li.dataset.index);
      deleteShape(index);
    });
  });

  // Edit buttons
  document.querySelectorAll('.shapeEditBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.shapeItem');
      const index = parseInt(li.dataset.index);
      openShapeEditor(index);
    });
  });
}

// Setup drag and drop for reordering
let draggedItem = null;
let draggedIndex = null;
let dropPlaceholder = null;
let currentDropTarget = null;
let insertBeforeTarget = false;

// Global handlers (added once)
let dragHandlersAdded = false;

function createDropPlaceholder() {
  const placeholder = document.createElement('li');
  placeholder.className = 'dropZonePlaceholder';
  return placeholder;
}

function removeDropPlaceholder() {
  if (dropPlaceholder && dropPlaceholder.parentNode) {
    dropPlaceholder.parentNode.removeChild(dropPlaceholder);
  }
  dropPlaceholder = null;
  currentDropTarget = null;
}

function performDrop() {
  if (!draggedItem || !currentDropTarget) return;

  let targetIndex = parseInt(currentDropTarget.dataset.index);

  // Adjust target index based on cursor position and drag direction
  if (!insertBeforeTarget && draggedIndex > targetIndex) {
    targetIndex += 1;
  } else if (insertBeforeTarget && draggedIndex < targetIndex) {
    targetIndex -= 1;
  }

  removeDropPlaceholder();

  // Reorder the shapeOrder array
  const [movedShape] = shapeOrder.splice(draggedIndex, 1);
  shapeOrder.splice(targetIndex, 0, movedShape);

  draggedItem.classList.remove('dragging');
  draggedItem = null;
  draggedIndex = null;

  // Rebuild the list
  rebuildShapeList();
  generateTileset();
}

function setupDragAndDrop() {
  const shapeItems = document.querySelectorAll('.shapeItem');

  // Add global handlers only once
  if (!dragHandlersAdded) {
    document.addEventListener('mouseup', function() {
      document.querySelectorAll('.shapeItem').forEach(item => {
        item.draggable = false;
      });
    });

    // Handle dragover on placeholder
    document.addEventListener('dragover', function(e) {
      if (dropPlaceholder && (e.target === dropPlaceholder || dropPlaceholder.contains(e.target))) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    });

    // Handle drop on placeholder
    document.addEventListener('drop', function(e) {
      if (dropPlaceholder && (e.target === dropPlaceholder || dropPlaceholder.contains(e.target))) {
        e.preventDefault();
        performDrop();
      }
    });

    dragHandlersAdded = true;
  }

  shapeItems.forEach(item => {
    const handle = item.querySelector('.shapeDragHandle');
    const preview = item.querySelector('.shapePreviewWrapper .shapePreview canvas');

    // Enable dragging only when mousedown on handle
    handle.addEventListener('mousedown', function(e) {
      item.draggable = true;
    });

    item.addEventListener('dragstart', function(e) {
      draggedItem = this;
      draggedIndex = parseInt(this.dataset.index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');

      // Set custom drag image to just the shape preview (no checkbox)
      if (preview) {
        e.dataTransfer.setDragImage(preview, 20, 20);
      }

      // Delay hiding the element so the drag can initialize first
      setTimeout(() => {
        this.classList.add('dragging');
      }, 0);
    });

    item.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      this.draggable = false;
      draggedItem = null;
      draggedIndex = null;
      removeDropPlaceholder();
    });

    item.addEventListener('dragover', function(e) {
      // Skip reorder UI if file is being dragged or no internal drag is active
      if ((typeof DragDropState !== 'undefined' && DragDropState.isDragging) || !draggedItem) {
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (this === draggedItem) return;

      // Determine if cursor is in left or right half of the element
      const rect = this.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const isLeftHalf = cursorX < rect.width / 2;

      // Check if we need to update placeholder position
      if (currentDropTarget === this && insertBeforeTarget === isLeftHalf) {
        return; // Already showing placeholder in correct position
      }

      currentDropTarget = this;
      insertBeforeTarget = isLeftHalf;

      // Remove existing placeholder
      if (dropPlaceholder && dropPlaceholder.parentNode) {
        dropPlaceholder.parentNode.removeChild(dropPlaceholder);
      }

      // Create and insert placeholder based on cursor position
      dropPlaceholder = createDropPlaceholder();

      if (insertBeforeTarget) {
        this.parentNode.insertBefore(dropPlaceholder, this);
      } else {
        this.parentNode.insertBefore(dropPlaceholder, this.nextSibling);
      }
    });

    item.addEventListener('dragleave', function(e) {
      // Don't remove placeholder - let dragover on next item handle it
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      if (this === draggedItem) {
        removeDropPlaceholder();
        return;
      }
      performDrop();
    });
  });
}
