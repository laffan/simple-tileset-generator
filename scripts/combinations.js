/* Combination-related functions */

// Track current combination order (will be modified by duplicate/delete/reorder)
let combinationOrder = [];

function initializeCombinationOrder() {
  combinationOrder = [...combinations];
}

function createCombinationSelectionHTML() {
  const combinationSelectionContainer = document.getElementById('combinationSelection');
  if (!combinationSelectionContainer) return;

  combinationSelectionContainer.innerHTML = ''; // Clear existing content

  const ul = document.createElement('ul');
  ul.style.listStyleType = 'none';
  ul.style.padding = '0';
  ul.id = 'combinationList';

  combinationOrder.forEach((combination, index) => {
    const li = createCombinationListItem(combination, index);
    ul.appendChild(li);
  });

  // Add "New Combination" button
  const addBtn = document.createElement('button');
  addBtn.className = 'addCombinationBtn';
  addBtn.textContent = '+ New Combination';
  addBtn.type = 'button';
  addBtn.addEventListener('click', function(e) {
    e.preventDefault();
    createNewCombination();
  });

  combinationSelectionContainer.appendChild(ul);
  combinationSelectionContainer.appendChild(addBtn);
}

function createCombinationListItem(combination, index) {
  const li = document.createElement('li');
  li.className = 'combinationItem';
  li.draggable = false;
  li.dataset.combination = combination;
  li.dataset.index = index;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'combinationCheckbox';
  checkbox.id = `combination-${index}`;
  checkbox.dataset.combination = combination;
  checkbox.checked = true; // Check by default

  // Create preview wrapper
  const previewWrapper = document.createElement('span');
  previewWrapper.className = 'combinationPreviewWrapper';

  const preview = document.createElement('span');
  preview.className = 'combinationPreview';

  // Create hover buttons overlay
  const hoverButtons = document.createElement('div');
  hoverButtons.className = 'combinationHoverButtons';

  const duplicateBtn = document.createElement('button');
  duplicateBtn.className = 'combinationBtn combinationDuplicateBtn';
  duplicateBtn.textContent = '+';
  duplicateBtn.title = 'Duplicate combination';
  duplicateBtn.type = 'button';

  const editBtn = document.createElement('button');
  editBtn.className = 'combinationBtn combinationEditBtn';
  editBtn.innerHTML = '&#9998;'; // Pencil icon
  editBtn.title = 'Edit combination';
  editBtn.type = 'button';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'combinationBtn combinationDeleteBtn';
  deleteBtn.textContent = '-';
  deleteBtn.title = 'Delete combination';
  deleteBtn.type = 'button';

  const dragHandle = document.createElement('span');
  dragHandle.className = 'combinationBtn combinationDragHandle';
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

function createCombinationPreview(combinationName) {
  const combinationData = getCombinationData(combinationName);
  if (!combinationData) return document.createElement('canvas');

  // Support both old and new data formats
  const tileCols = combinationData.tileCols || combinationData.gridWidth || 2;
  const tileRows = combinationData.tileRows || combinationData.gridHeight || 2;

  // Calculate preview size (fit into 40x40 or larger based on aspect ratio)
  const maxSize = 60;
  const aspectRatio = tileCols / tileRows;
  let previewWidth, previewHeight, tileSize;

  if (aspectRatio >= 1) {
    previewWidth = maxSize;
    tileSize = previewWidth / tileCols;
    previewHeight = tileSize * tileRows;
  } else {
    previewHeight = maxSize;
    tileSize = previewHeight / tileRows;
    previewWidth = tileSize * tileCols;
  }

  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = previewWidth;
  previewCanvas.height = previewHeight;
  const previewCtx = previewCanvas.getContext('2d');

  // Draw with black fill
  previewCtx.fillStyle = 'black';
  drawCombination(0, 0, tileSize, previewCtx, combinationData, 'black');

  return previewCanvas;
}

// Helper function to collect selected combinations
function getSelectedCombinations() {
  const selectedCombinations = [];
  const checkboxes = document.querySelectorAll('.combinationCheckbox');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedCombinations.push(checkbox.dataset.combination);
    }
  });
  return selectedCombinations;
}

// Function to select all combination checkboxes
function selectAllCombinations() {
  const combinationCheckboxes = document.querySelectorAll('.combinationCheckbox');
  combinationCheckboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  generateTileset();
}

// Function to deselect all combination checkboxes
function deselectAllCombinations() {
  const combinationCheckboxes = document.querySelectorAll('.combinationCheckbox');
  combinationCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  generateTileset();
}

// Function to add event listeners to combination checkboxes
function addCombinationCheckboxesListeners() {
  const combinationCheckboxes = document.querySelectorAll('.combinationCheckbox');
  combinationCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      generateTileset();
    });
  });
}

function addCombinationPreviews() {
  const combinationPreviewContainers = document.querySelectorAll('.combinationPreview');
  combinationPreviewContainers.forEach((container) => {
    const label = container.closest('label');
    const checkbox = label.querySelector('input');
    const combination = checkbox.dataset.combination;
    container.innerHTML = '';
    const previewCanvas = createCombinationPreview(combination);
    container.appendChild(previewCanvas);
  });
}

// Create a new combination
function createNewCombination() {
  const newCombination = createDefaultCombination();
  registerCustomCombination(newCombination.id, newCombination);
  combinationOrder.push(newCombination.id);

  rebuildCombinationList();

  // Open the editor for the new combination
  const newIndex = combinationOrder.length - 1;
  openCombinationEditor(newIndex);
}

// Duplicate a combination at the given index
function duplicateCombination(index) {
  const combination = combinationOrder[index];
  const originalData = getCombinationData(combination);
  if (!originalData) return;

  const wasChecked = document.querySelector(`.combinationCheckbox[data-combination="${combination}"]`)?.checked || false;

  // Deep copy the combination data
  const copiedData = copyCombinationData(originalData);
  copiedData.id = generateCombinationId();
  registerCustomCombination(copiedData.id, copiedData);

  // Insert duplicate after current position
  combinationOrder.splice(index + 1, 0, copiedData.id);

  // Rebuild the UI
  rebuildCombinationList();

  // Restore checked state
  const checkboxes = document.querySelectorAll('.combinationCheckbox');
  checkboxes.forEach((cb, i) => {
    if (i === index || i === index + 1) {
      cb.checked = wasChecked;
    }
  });

  generateTileset();
}

// Delete a combination at the given index
function deleteCombination(index) {
  const combination = combinationOrder[index];
  combinationOrder.splice(index, 1);
  unregisterCustomCombination(combination);
  rebuildCombinationList();
  generateTileset();
}

// Rebuild the combination list UI
function rebuildCombinationList() {
  const checkedCombinations = new Set();
  document.querySelectorAll('.combinationCheckbox:checked').forEach(cb => {
    checkedCombinations.add(cb.dataset.combination);
  });

  createCombinationSelectionHTML();
  addCombinationPreviews();
  addCombinationCheckboxesListeners();
  addCombinationButtonListeners();
  setupCombinationDragAndDrop();

  document.querySelectorAll('.combinationCheckbox').forEach(cb => {
    cb.checked = checkedCombinations.has(cb.dataset.combination);
  });
}

// Add event listeners for combination buttons
function addCombinationButtonListeners() {
  // Duplicate buttons
  document.querySelectorAll('.combinationDuplicateBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.combinationItem');
      const index = parseInt(li.dataset.index);
      duplicateCombination(index);
    });
  });

  // Delete buttons
  document.querySelectorAll('.combinationDeleteBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.combinationItem');
      const index = parseInt(li.dataset.index);
      deleteCombination(index);
    });
  });

  // Edit buttons
  document.querySelectorAll('.combinationEditBtn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const li = this.closest('.combinationItem');
      const index = parseInt(li.dataset.index);
      openCombinationEditor(index);
    });
  });
}

// Combination drag and drop
let draggedCombinationItem = null;
let draggedCombinationIndex = null;
let combinationDropPlaceholder = null;
let currentCombinationDropTarget = null;
let insertBeforeCombinationTarget = false;
let combinationDragHandlersAdded = false;

function createCombinationDropPlaceholder() {
  const placeholder = document.createElement('li');
  placeholder.className = 'dropZonePlaceholder';
  return placeholder;
}

function removeCombinationDropPlaceholder() {
  if (combinationDropPlaceholder && combinationDropPlaceholder.parentNode) {
    combinationDropPlaceholder.parentNode.removeChild(combinationDropPlaceholder);
  }
  combinationDropPlaceholder = null;
  currentCombinationDropTarget = null;
}

function performCombinationDrop() {
  if (!draggedCombinationItem || !currentCombinationDropTarget) return;

  let targetIndex = parseInt(currentCombinationDropTarget.dataset.index);

  if (!insertBeforeCombinationTarget && draggedCombinationIndex > targetIndex) {
    targetIndex += 1;
  } else if (insertBeforeCombinationTarget && draggedCombinationIndex < targetIndex) {
    targetIndex -= 1;
  }

  removeCombinationDropPlaceholder();

  const [movedCombination] = combinationOrder.splice(draggedCombinationIndex, 1);
  combinationOrder.splice(targetIndex, 0, movedCombination);

  draggedCombinationItem.classList.remove('dragging');
  draggedCombinationItem = null;
  draggedCombinationIndex = null;

  rebuildCombinationList();
  generateTileset();
}

function setupCombinationDragAndDrop() {
  const combinationItems = document.querySelectorAll('.combinationItem');

  if (!combinationDragHandlersAdded) {
    document.addEventListener('mouseup', function() {
      document.querySelectorAll('.combinationItem').forEach(item => {
        item.draggable = false;
      });
    });

    document.addEventListener('dragover', function(e) {
      if (combinationDropPlaceholder && (e.target === combinationDropPlaceholder || combinationDropPlaceholder.contains(e.target))) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    });

    document.addEventListener('drop', function(e) {
      if (combinationDropPlaceholder && (e.target === combinationDropPlaceholder || combinationDropPlaceholder.contains(e.target))) {
        e.preventDefault();
        performCombinationDrop();
      }
    });

    combinationDragHandlersAdded = true;
  }

  combinationItems.forEach(item => {
    const handle = item.querySelector('.combinationDragHandle');
    const preview = item.querySelector('.combinationPreviewWrapper .combinationPreview canvas');

    handle.addEventListener('mousedown', function(e) {
      item.draggable = true;
    });

    item.addEventListener('dragstart', function(e) {
      draggedCombinationItem = this;
      draggedCombinationIndex = parseInt(this.dataset.index);
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
      draggedCombinationItem = null;
      draggedCombinationIndex = null;
      removeCombinationDropPlaceholder();
    });

    item.addEventListener('dragover', function(e) {
      if ((typeof DragDropState !== 'undefined' && DragDropState.isDragging) || !draggedCombinationItem) {
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (this === draggedCombinationItem) return;

      const rect = this.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const isLeftHalf = cursorX < rect.width / 2;

      if (currentCombinationDropTarget === this && insertBeforeCombinationTarget === isLeftHalf) {
        return;
      }

      currentCombinationDropTarget = this;
      insertBeforeCombinationTarget = isLeftHalf;

      if (combinationDropPlaceholder && combinationDropPlaceholder.parentNode) {
        combinationDropPlaceholder.parentNode.removeChild(combinationDropPlaceholder);
      }

      combinationDropPlaceholder = createCombinationDropPlaceholder();

      if (insertBeforeCombinationTarget) {
        this.parentNode.insertBefore(combinationDropPlaceholder, this);
      } else {
        this.parentNode.insertBefore(combinationDropPlaceholder, this.nextSibling);
      }
    });

    item.addEventListener('dragleave', function(e) {
      // Don't remove placeholder
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      if (this === draggedCombinationItem) {
        removeCombinationDropPlaceholder();
        return;
      }
      performCombinationDrop();
    });
  });
}
