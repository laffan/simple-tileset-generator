/* Combination Editor State Management
 *
 * The combination editor allows creating shapes that span multiple tiles.
 * A single shape is edited (like the shape editor) and divided into tiles
 * based on the tile rows/columns settings. An optional pattern can be
 * selected from the pattern palette to apply as a mask.
 */

var CombinationEditorState = {
  // Current editing context
  currentEditingCombinationIndex: null,

  // Combination data (working copy)
  combinationData: null,

  // Tile grid dimensions (how the shape is divided)
  tileRows: 2,
  tileCols: 2,

  // Selected pattern (from palette, not edited) - these are for currently selected path
  selectedPatternName: null,
  selectedPatternSize: 16,
  selectedPatternInvert: false,

  // Per-path pattern data: { pathIndex: { patternName, patternSize, patternInvert } }
  pathPatterns: {},

  // Shape editor state (Two.js instance for combination shape)
  two: null,
  paths: [],
  anchors: [],
  selectedAnchors: [],
  selectedPathIndices: [],
  currentPathIndex: 0,
  isDragging: false,
  newShapePoints: [],
  ghostPoint: null,
  boundingBox: null,
  fillRule: null,
  holePathIndices: [],

  // Pattern editor state (for mask pattern)
  patternCanvas: null,
  patternCtx: null,
  patternPixelData: [],
  patternSize: 16,
  patternEditorZoom: 100,
  patternPixelSize: 16,
  patternBoundarySize: 256,
  patternBoundaryOffsetX: 0,
  patternBoundaryOffsetY: 0,
  isPatternDrawing: false,
  patternDrawColor: 1,
  patternStartPixel: null,
  patternCurrentPixel: null,
  isPatternLineMode: false,
  patternPreviewData: null,
  isPatternSpacebarHeld: false,
  isPatternPanning: false,
  patternHasPanned: false,
  patternPanStartX: 0,
  patternPanStartY: 0,
  patternOffsetX: 0,
  patternOffsetY: 0,

  // Preview canvas
  previewCanvas: null,
  previewCtx: null,

  // Editor dimensions
  editorSize: 400,
  editorMargin: 40,
  previewSize: 150
};

// Constants for combination shape editor (same as shape editor)
const COMB_EDITOR_SIZE = 400;
const COMB_ANCHOR_RADIUS = 8;
const COMB_CONTROL_RADIUS = 6;
const COMB_EDITOR_MARGIN = 40;
const COMB_EDITOR_SHAPE_SIZE = COMB_EDITOR_SIZE - COMB_EDITOR_MARGIN * 2;
const COMB_HANDLE_SIZE = 8;

// Reset editor state
function resetCombinationEditorState() {
  CombinationEditorState.currentEditingCombinationIndex = null;
  CombinationEditorState.combinationData = null;
  CombinationEditorState.activeTab = 'shape';
  CombinationEditorState.pathPatterns = {};

  // Reset shape editor state
  CombinationEditorState.two = null;
  CombinationEditorState.paths = [];
  CombinationEditorState.anchors = [];
  CombinationEditorState.selectedAnchors = [];
  CombinationEditorState.selectedPathIndices = [];
  CombinationEditorState.currentPathIndex = 0;
  CombinationEditorState.isDragging = false;
  CombinationEditorState.newShapePoints = [];
  CombinationEditorState.ghostPoint = null;
  CombinationEditorState.boundingBox = null;
  CombinationEditorState.fillRule = null;
  CombinationEditorState.holePathIndices = [];

  // Reset pattern editor state
  CombinationEditorState.patternCanvas = null;
  CombinationEditorState.patternCtx = null;
  CombinationEditorState.patternPixelData = [];
  CombinationEditorState.isPatternDrawing = false;
  CombinationEditorState.patternStartPixel = null;
  CombinationEditorState.patternCurrentPixel = null;
  CombinationEditorState.isPatternLineMode = false;
  CombinationEditorState.patternPreviewData = null;
  CombinationEditorState.isPatternSpacebarHeld = false;
  CombinationEditorState.isPatternPanning = false;
  CombinationEditorState.patternOffsetX = 0;
  CombinationEditorState.patternOffsetY = 0;

  // Reset preview
  CombinationEditorState.previewCanvas = null;
  CombinationEditorState.previewCtx = null;
}

// Get the current path in the combination shape editor
function getCombCurrentPath() {
  return CombinationEditorState.paths[CombinationEditorState.currentPathIndex] || null;
}

// Get tile grid dimensions
function getCombinationTileSize() {
  return {
    rows: CombinationEditorState.tileRows,
    cols: CombinationEditorState.tileCols
  };
}

// Set tile grid dimensions
function setCombinationTileSize(rows, cols) {
  CombinationEditorState.tileRows = Math.max(1, Math.min(8, rows));
  CombinationEditorState.tileCols = Math.max(1, Math.min(8, cols));

  // Update the combination data
  if (CombinationEditorState.combinationData) {
    CombinationEditorState.combinationData.tileRows = CombinationEditorState.tileRows;
    CombinationEditorState.combinationData.tileCols = CombinationEditorState.tileCols;
  }

  // Redraw the tile grid overlay
  drawCombinationTileGridOverlay();

  // Update preview
  updateCombinationPreview();
}

// Check if crop is enabled for combination shape editor
function isCombCropEnabled() {
  const checkbox = document.getElementById('combCropToBoundsCheckbox');
  return checkbox ? checkbox.checked : true;
}
