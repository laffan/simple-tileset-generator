/* Combination Editor State Management */

var CombinationEditorState = {
  // Current editing context
  currentEditingCombinationIndex: null,
  combinationData: null,  // Working copy of the combination being edited

  // Active editor tab: 'shape' or 'pattern'
  activeTab: 'shape',

  // Selected cell in the grid (for applying patterns)
  selectedCell: { x: 0, y: 0 },

  // Canvas elements
  shapeCanvas: null,
  shapeCtx: null,
  patternCanvas: null,
  patternCtx: null,
  previewCanvas: null,
  previewCtx: null,

  // Grid selector state (5x5 max)
  maxGridSize: 5,

  // Editor dimensions
  editorSize: 400,
  previewSize: 150,

  // Drag state for shape placement
  isDragging: false,
  draggedShape: null,
  dragOffset: { x: 0, y: 0 },

  // Pattern editor state (reuses pattern editor logic)
  patternEditorActive: false,

  // Zoom and pan for shape editor
  shapeZoom: 1,
  shapePan: { x: 0, y: 0 },
  isPanning: false,
  panStart: { x: 0, y: 0 }
};

// Reset editor state
function resetCombinationEditorState() {
  CombinationEditorState.currentEditingCombinationIndex = null;
  CombinationEditorState.combinationData = null;
  CombinationEditorState.activeTab = 'shape';
  CombinationEditorState.selectedCell = { x: 0, y: 0 };
  CombinationEditorState.shapeCanvas = null;
  CombinationEditorState.shapeCtx = null;
  CombinationEditorState.patternCanvas = null;
  CombinationEditorState.patternCtx = null;
  CombinationEditorState.previewCanvas = null;
  CombinationEditorState.previewCtx = null;
  CombinationEditorState.isDragging = false;
  CombinationEditorState.draggedShape = null;
  CombinationEditorState.shapeZoom = 1;
  CombinationEditorState.shapePan = { x: 0, y: 0 };
  CombinationEditorState.isPanning = false;
}

// Get the cell at a given position in the combination
function getCombinationCell(x, y) {
  const data = CombinationEditorState.combinationData;
  if (!data || !data.cells) return null;
  if (y < 0 || y >= data.gridHeight || x < 0 || x >= data.gridWidth) return null;
  return data.cells[y] && data.cells[y][x];
}

// Set cell enabled state
function setCombinationCellEnabled(x, y, enabled) {
  const data = CombinationEditorState.combinationData;
  if (!data || !data.cells) return;
  if (y < 0 || y >= data.gridHeight || x < 0 || x >= data.gridWidth) return;

  if (data.cells[y] && data.cells[y][x]) {
    data.cells[y][x].enabled = enabled;
  }
}

// Set cell shape
function setCombinationCellShape(x, y, shapeName) {
  const data = CombinationEditorState.combinationData;
  if (!data || !data.cells) return;
  if (y < 0 || y >= data.gridHeight || x < 0 || x >= data.gridWidth) return;

  if (data.cells[y] && data.cells[y][x]) {
    data.cells[y][x].shape = shapeName;
  }
}

// Set cell pattern
function setCombinationCellPattern(x, y, patternName) {
  const data = CombinationEditorState.combinationData;
  if (!data || !data.cells) return;
  if (y < 0 || y >= data.gridHeight || x < 0 || x >= data.gridWidth) return;

  if (data.cells[y] && data.cells[y][x]) {
    data.cells[y][x].pattern = patternName;
  }
}

// Get the currently selected cell
function getSelectedCombinationCell() {
  const { x, y } = CombinationEditorState.selectedCell;
  return getCombinationCell(x, y);
}

// Update selected cell
function selectCombinationCell(x, y) {
  const data = CombinationEditorState.combinationData;
  if (!data) return;

  // Clamp to valid range
  x = Math.max(0, Math.min(x, data.gridWidth - 1));
  y = Math.max(0, Math.min(y, data.gridHeight - 1));

  CombinationEditorState.selectedCell = { x, y };
}

// Toggle cell enabled state at position
function toggleCombinationCell(x, y) {
  const cell = getCombinationCell(x, y);
  if (cell) {
    cell.enabled = !cell.enabled;
    return cell.enabled;
  }
  return false;
}

// Resize the combination grid
function resizeCombinationGrid(newWidth, newHeight) {
  const data = CombinationEditorState.combinationData;
  if (!data) return;

  // Use the helper function from combinationData.js
  resizeCombination(data, newWidth, newHeight);

  // Update selected cell if out of bounds
  if (CombinationEditorState.selectedCell.x >= newWidth) {
    CombinationEditorState.selectedCell.x = newWidth - 1;
  }
  if (CombinationEditorState.selectedCell.y >= newHeight) {
    CombinationEditorState.selectedCell.y = newHeight - 1;
  }
}

// Get grid dimensions
function getCombinationGridSize() {
  const data = CombinationEditorState.combinationData;
  if (!data) return { width: 1, height: 1 };
  return {
    width: data.gridWidth || 1,
    height: data.gridHeight || 1
  };
}
