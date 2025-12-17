/* Combination Editor Canvas - rendering functions */

// Initialize the shape editor canvas
function initCombinationShapeCanvas() {
  const state = CombinationEditorState;
  const canvas = document.getElementById('combinationShapeCanvas');
  if (!canvas) return;

  state.shapeCanvas = canvas;
  state.shapeCtx = canvas.getContext('2d');

  // Set canvas size
  canvas.width = state.editorSize;
  canvas.height = state.editorSize;
}

// Initialize the pattern editor canvas (for combination pattern tab)
function initCombinationPatternCanvas() {
  const state = CombinationEditorState;
  const canvas = document.getElementById('combinationPatternCanvas');
  if (!canvas) return;

  state.patternCanvas = canvas;
  state.patternCtx = canvas.getContext('2d');

  // Set canvas size
  canvas.width = state.editorSize;
  canvas.height = state.editorSize;
}

// Initialize the preview canvas
function initCombinationPreviewCanvas() {
  const state = CombinationEditorState;
  const canvas = document.getElementById('combinationPreviewCanvas');
  if (!canvas) return;

  state.previewCanvas = canvas;
  state.previewCtx = canvas.getContext('2d');

  canvas.width = state.previewSize;
  canvas.height = state.previewSize;
}

// Draw the shape editor canvas
function drawCombinationShapeCanvas() {
  const state = CombinationEditorState;
  const ctx = state.shapeCtx;
  const data = state.combinationData;

  if (!ctx || !data) return;

  const canvasSize = state.editorSize;

  // Clear canvas
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // Draw background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Calculate tile size to fit the grid
  const { gridWidth, gridHeight } = data;
  const maxDim = Math.max(gridWidth, gridHeight);
  const tileSize = Math.floor((canvasSize - 40) / maxDim); // Leave some padding

  // Calculate offset to center the grid
  const offsetX = (canvasSize - gridWidth * tileSize) / 2;
  const offsetY = (canvasSize - gridHeight * tileSize) / 2;

  // Draw grid background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(offsetX, offsetY, gridWidth * tileSize, gridHeight * tileSize);

  // Draw cells
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const cell = data.cells[row] && data.cells[row][col];
      const cellX = offsetX + col * tileSize;
      const cellY = offsetY + row * tileSize;

      if (cell && cell.enabled) {
        // Draw shape with optional pattern mask
        ctx.fillStyle = '#333333';

        if (cell.pattern) {
          // Draw shape with pattern mask
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = tileSize;
          tempCanvas.height = tileSize;
          const tempCtx = tempCanvas.getContext('2d');

          tempCtx.fillStyle = '#333333';
          drawShape(0, 0, tileSize, tempCtx, cell.shape || 'square');

          tempCtx.globalCompositeOperation = 'destination-in';
          tempCtx.fillStyle = '#000000';
          drawPattern(0, 0, tileSize, tempCtx, cell.pattern);

          ctx.drawImage(tempCanvas, cellX, cellY);
        } else {
          drawShape(cellX, cellY, tileSize, ctx, cell.shape || 'square');
        }
      } else {
        // Draw disabled cell (light gray dashed border)
        ctx.strokeStyle = '#cccccc';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, tileSize - 1, tileSize - 1);
        ctx.setLineDash([]);
      }
    }
  }

  // Draw red bounding box around the active grid
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, gridWidth * tileSize, gridHeight * tileSize);
  ctx.lineWidth = 1;

  // Draw grid lines
  ctx.strokeStyle = '#dddddd';
  for (let row = 1; row < gridHeight; row++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + row * tileSize);
    ctx.lineTo(offsetX + gridWidth * tileSize, offsetY + row * tileSize);
    ctx.stroke();
  }
  for (let col = 1; col < gridWidth; col++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + col * tileSize, offsetY);
    ctx.lineTo(offsetX + col * tileSize, offsetY + gridHeight * tileSize);
    ctx.stroke();
  }

  // Highlight selected cell in pattern mode
  if (state.activeTab === 'pattern') {
    const { x, y } = state.selectedCell;
    const cell = getCombinationCell(x, y);
    if (cell && cell.enabled) {
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        offsetX + x * tileSize + 1,
        offsetY + y * tileSize + 1,
        tileSize - 2,
        tileSize - 2
      );
      ctx.lineWidth = 1;
    }
  }
}

// Draw the pattern editor canvas (shows pattern applied to selected cell's shape)
function drawCombinationPatternCanvas() {
  const state = CombinationEditorState;
  const ctx = state.patternCtx;
  const data = state.combinationData;

  if (!ctx || !data) return;

  const canvasSize = state.editorSize;

  // Clear canvas
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // Draw background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Get the selected cell
  const { x, y } = state.selectedCell;
  const cell = getCombinationCell(x, y);

  if (!cell || !cell.enabled) {
    // Show message to select an enabled cell
    ctx.fillStyle = '#999999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select an enabled cell', canvasSize / 2, canvasSize / 2);
    return;
  }

  // Draw the shape large in the center
  const shapeSize = canvasSize - 60;
  const offsetX = (canvasSize - shapeSize) / 2;
  const offsetY = (canvasSize - shapeSize) / 2;

  // Draw white background for the shape area
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(offsetX, offsetY, shapeSize, shapeSize);

  // Draw the shape with pattern
  ctx.fillStyle = '#333333';

  if (cell.pattern) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = shapeSize;
    tempCanvas.height = shapeSize;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.fillStyle = '#333333';
    drawShape(0, 0, shapeSize, tempCtx, cell.shape || 'square');

    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.fillStyle = '#000000';
    drawPattern(0, 0, shapeSize, tempCtx, cell.pattern);

    ctx.drawImage(tempCanvas, offsetX, offsetY);
  } else {
    drawShape(offsetX, offsetY, shapeSize, ctx, cell.shape || 'square');
  }

  // Draw border
  ctx.strokeStyle = '#cccccc';
  ctx.strokeRect(offsetX, offsetY, shapeSize, shapeSize);

  // Show current pattern name
  const patternName = cell.pattern || 'None';
  ctx.fillStyle = '#666666';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Pattern: ' + patternName, canvasSize / 2, canvasSize - 10);
}

// Draw the preview canvas
function drawCombinationPreviewCanvas() {
  const state = CombinationEditorState;
  const ctx = state.previewCtx;
  const data = state.combinationData;

  if (!ctx || !data) return;

  const canvasSize = state.previewSize;

  // Clear canvas
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // Draw checkered background
  const checkSize = 8;
  for (let row = 0; row < canvasSize / checkSize; row++) {
    for (let col = 0; col < canvasSize / checkSize; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#e0e0e0';
      ctx.fillRect(col * checkSize, row * checkSize, checkSize, checkSize);
    }
  }

  // Calculate tile size to fit the preview
  const { gridWidth, gridHeight } = data;
  const maxDim = Math.max(gridWidth, gridHeight);
  const padding = 10;
  const tileSize = Math.floor((canvasSize - padding * 2) / maxDim);

  // Calculate offset to center
  const offsetX = (canvasSize - gridWidth * tileSize) / 2;
  const offsetY = (canvasSize - gridHeight * tileSize) / 2;

  // Draw the combination
  ctx.fillStyle = '#333333';
  drawCombination(offsetX, offsetY, tileSize, ctx, data);
}

// Render all canvases
function renderCombinationEditor() {
  const state = CombinationEditorState;

  if (state.activeTab === 'shape') {
    drawCombinationShapeCanvas();
  } else {
    drawCombinationPatternCanvas();
  }

  drawCombinationPreviewCanvas();
}

// Get cell position from canvas coordinates
function getCellFromCanvasPosition(canvasX, canvasY) {
  const state = CombinationEditorState;
  const data = state.combinationData;

  if (!data) return null;

  const canvasSize = state.editorSize;
  const { gridWidth, gridHeight } = data;
  const maxDim = Math.max(gridWidth, gridHeight);
  const tileSize = Math.floor((canvasSize - 40) / maxDim);

  const offsetX = (canvasSize - gridWidth * tileSize) / 2;
  const offsetY = (canvasSize - gridHeight * tileSize) / 2;

  // Check if click is within the grid
  if (canvasX < offsetX || canvasX >= offsetX + gridWidth * tileSize) return null;
  if (canvasY < offsetY || canvasY >= offsetY + gridHeight * tileSize) return null;

  const col = Math.floor((canvasX - offsetX) / tileSize);
  const row = Math.floor((canvasY - offsetY) / tileSize);

  return { x: col, y: row };
}
