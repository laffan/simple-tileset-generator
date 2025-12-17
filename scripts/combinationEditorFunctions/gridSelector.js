/* Combination Editor Grid Selector - 5x5 grid for selecting combination size and enabled cells */

// Render the grid selector
function renderCombinationGridSelector() {
  const container = document.getElementById('combinationGridSelector');
  if (!container) return;

  const state = CombinationEditorState;
  const data = state.combinationData;
  const maxSize = state.maxGridSize;

  container.innerHTML = '';

  // Create 5x5 grid of toggle buttons
  const grid = document.createElement('div');
  grid.className = 'combination-grid-selector';

  for (let row = 0; row < maxSize; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'combination-grid-row';

    for (let col = 0; col < maxSize; col++) {
      const cell = document.createElement('button');
      cell.className = 'combination-grid-cell';
      cell.type = 'button';
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Determine cell state
      const isInBounds = data && col < data.gridWidth && row < data.gridHeight;
      const cellData = isInBounds && data.cells[row] && data.cells[row][col];
      const isEnabled = cellData && cellData.enabled;

      if (isInBounds) {
        cell.classList.add('in-bounds');
        if (isEnabled) {
          cell.classList.add('enabled');
        }
      }

      cell.addEventListener('click', function() {
        handleGridSelectorClick(parseInt(this.dataset.col), parseInt(this.dataset.row));
      });

      rowDiv.appendChild(cell);
    }

    grid.appendChild(rowDiv);
  }

  container.appendChild(grid);
}

// Handle click on grid selector cell
function handleGridSelectorClick(col, row) {
  const state = CombinationEditorState;
  const data = state.combinationData;

  if (!data) return;

  const currentWidth = data.gridWidth;
  const currentHeight = data.gridHeight;

  // Calculate new dimensions
  // Clicking outside current bounds expands to include that cell
  // Clicking inside toggles the cell
  let newWidth = currentWidth;
  let newHeight = currentHeight;

  const clickedInBounds = col < currentWidth && row < currentHeight;

  if (clickedInBounds) {
    // Toggle the cell's enabled state
    const cell = data.cells[row] && data.cells[row][col];
    if (cell) {
      cell.enabled = !cell.enabled;
    }
  } else {
    // Expand grid to include this cell
    newWidth = Math.max(currentWidth, col + 1);
    newHeight = Math.max(currentHeight, row + 1);
    resizeCombinationGrid(newWidth, newHeight);

    // Enable the newly clicked cell
    const cell = data.cells[row] && data.cells[row][col];
    if (cell) {
      cell.enabled = true;
    }
  }

  // Shrink grid if possible (remove empty rows/cols from edges)
  shrinkCombinationGridIfNeeded();

  // Re-render everything
  renderCombinationGridSelector();
  renderCombinationEditor();
}

// Shrink the grid by removing empty rows/columns from the edges
function shrinkCombinationGridIfNeeded() {
  const state = CombinationEditorState;
  const data = state.combinationData;

  if (!data) return;

  // Find the actual bounds of enabled cells
  let minCol = data.gridWidth;
  let maxCol = -1;
  let minRow = data.gridHeight;
  let maxRow = -1;

  for (let row = 0; row < data.gridHeight; row++) {
    for (let col = 0; col < data.gridWidth; col++) {
      const cell = data.cells[row] && data.cells[row][col];
      if (cell && cell.enabled) {
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
      }
    }
  }

  // If no enabled cells, keep at least 1x1
  if (maxCol < 0 || maxRow < 0) {
    if (data.gridWidth > 1 || data.gridHeight > 1) {
      resizeCombinationGrid(1, 1);
      // Enable the single cell
      if (data.cells[0] && data.cells[0][0]) {
        data.cells[0][0].enabled = true;
      }
    }
    return;
  }

  // Only shrink if we can
  // For simplicity, we only shrink from the right and bottom edges
  const newWidth = maxCol + 1;
  const newHeight = maxRow + 1;

  if (newWidth < data.gridWidth || newHeight < data.gridHeight) {
    resizeCombinationGrid(newWidth, newHeight);
  }
}

// Setup grid selector
function setupCombinationGridSelector() {
  renderCombinationGridSelector();
}
