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
  const preview = document.createElement('span');
  checkbox.type = 'checkbox';
  checkbox.className = 'shapeCheckbox';
  checkbox.id = `shape-${index}`;
  checkbox.dataset.shape = shape;
  checkbox.checked = shape === 'square'; // Check 'square' by default
  preview.className = 'shapePreview';

  const label = document.createElement('label');
  label.appendChild(checkbox);
  label.appendChild(preview);

  // Create hover buttons overlay
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

  li.appendChild(label);
  li.appendChild(hoverButtons);

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

  // Look up the renderer in the registry and call it
  if (shapeRenderers[shape]) {
    shapeRenderers[shape](x, y, size, ctx);
  }
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
    const checkbox = container.parentElement.querySelector('input');
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

  // Insert duplicate after current position
  shapeOrder.splice(index + 1, 0, shape);

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

// Add event listeners for duplicate/delete buttons
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
}

// Setup drag and drop for reordering
let draggedItem = null;
let draggedIndex = null;
let dropPlaceholder = null;
let currentDropTarget = null;

// Global mouseup handler to reset draggable (added once)
let dragMouseUpHandlerAdded = false;

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

function setupDragAndDrop() {
  const shapeItems = document.querySelectorAll('.shapeItem');

  // Add global mouseup handler only once
  if (!dragMouseUpHandlerAdded) {
    document.addEventListener('mouseup', function() {
      document.querySelectorAll('.shapeItem').forEach(item => {
        item.draggable = false;
      });
    });
    dragMouseUpHandlerAdded = true;
  }

  shapeItems.forEach(item => {
    const handle = item.querySelector('.shapeDragHandle');

    // Enable dragging only when mousedown on handle
    handle.addEventListener('mousedown', function(e) {
      item.draggable = true;
    });

    item.addEventListener('dragstart', function(e) {
      draggedItem = this;
      draggedIndex = parseInt(this.dataset.index);
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      // Set drag data (required for Firefox)
      e.dataTransfer.setData('text/plain', '');
    });

    item.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      this.draggable = false;
      draggedItem = null;
      draggedIndex = null;
      removeDropPlaceholder();
    });

    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (this === draggedItem) return;
      if (this === currentDropTarget) return; // Already showing placeholder here

      const targetIndex = parseInt(this.dataset.index);
      currentDropTarget = this;

      // Remove existing placeholder
      removeDropPlaceholder();

      // Create and insert placeholder
      dropPlaceholder = createDropPlaceholder();

      // Insert before or after based on drag direction
      if (draggedIndex < targetIndex) {
        // Dragging forward - insert after target
        this.parentNode.insertBefore(dropPlaceholder, this.nextSibling);
      } else {
        // Dragging backward - insert before target
        this.parentNode.insertBefore(dropPlaceholder, this);
      }
    });

    item.addEventListener('dragleave', function(e) {
      // Only remove if we're actually leaving this item (not entering a child)
      if (!this.contains(e.relatedTarget) && e.relatedTarget !== dropPlaceholder) {
        if (currentDropTarget === this) {
          // Don't remove placeholder immediately - let dragover on next item handle it
        }
      }
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      removeDropPlaceholder();

      if (this === draggedItem) return;

      const targetIndex = parseInt(this.dataset.index);

      // Reorder the shapeOrder array
      const [movedShape] = shapeOrder.splice(draggedIndex, 1);
      shapeOrder.splice(targetIndex, 0, movedShape);

      // Rebuild the list
      rebuildShapeList();
      generateTileset();
    });
  });

  // Also handle drop on the placeholder itself
  document.addEventListener('dragover', function(e) {
    if (dropPlaceholder && e.target === dropPlaceholder) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  document.addEventListener('drop', function(e) {
    if (dropPlaceholder && e.target === dropPlaceholder && currentDropTarget) {
      e.preventDefault();
      const targetIndex = parseInt(currentDropTarget.dataset.index);
      removeDropPlaceholder();

      if (draggedItem) {
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
    }
  });
}
