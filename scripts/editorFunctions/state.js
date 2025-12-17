/* Editor State - Shared state for all editor modules */

const EditorState = {
  two: null,
  paths: [],  // Array of Two.Path objects for multi-path shapes
  anchors: [],
  selectedAnchors: [],  // Array of selected anchor data objects
  selectedPathIndices: [],  // Array of selected path indices for multi-path operations
  currentEditingShapeIndex: null,
  currentPathIndex: 0,  // Currently selected path in multi-path shapes
  isDragging: false,
  newShapePoints: [],  // Points being created for a new shape
  ghostPoint: null,  // Preview point shown when hovering over edges
  boundingBox: null,  // Bounding box visuals for selected path
  fillRule: null,  // 'evenodd' for shapes with holes, null for normal
  holePathIndices: [],  // Indices of paths that are holes (for evenodd shapes)

  // Editor mode: 'shape' or 'combination'
  // This determines which modal/container is active
  editorMode: 'shape',

  // Combination-specific state (used when editorMode === 'combination')
  combinationIndex: null,
  combinationTileRows: 2,
  combinationTileCols: 2,
  combinationPatternData: null
};

// Constants
const EDITOR_SIZE = 400;
const ANCHOR_RADIUS = 8;
const CONTROL_RADIUS = 6;
const EDITOR_MARGIN = 40;
const EDITOR_SHAPE_SIZE = EDITOR_SIZE - EDITOR_MARGIN * 2;
const HANDLE_SIZE = 8;  // Size of bounding box handles

// Get the active editor modal element based on current mode
function getActiveEditorModal() {
  if (EditorState.editorMode === 'combination') {
    return document.getElementById('combinationEditorModal');
  }
  return document.getElementById('shapeEditorModal');
}

// Get the active editor canvas container based on current mode
function getActiveEditorCanvas() {
  if (EditorState.editorMode === 'combination') {
    return document.getElementById('combinationShapeEditorCanvas');
  }
  return document.getElementById('shapeEditorCanvas');
}

// Check if the active editor modal is open
function isActiveEditorOpen() {
  const modal = getActiveEditorModal();
  return modal && modal.classList.contains('active');
}

// Get currently selected path
function getCurrentPath() {
  return EditorState.paths[EditorState.currentPathIndex] || null;
}

// Reset editor state
function resetEditorState() {
  EditorState.paths = [];
  EditorState.currentPathIndex = 0;
  EditorState.anchors = [];
  EditorState.selectedAnchors = [];
  EditorState.selectedPathIndices = [];
  EditorState.currentEditingShapeIndex = null;
  EditorState.isDragging = false;
  EditorState.newShapePoints = [];
  EditorState.ghostPoint = null;
  EditorState.boundingBox = null;
  EditorState.fillRule = null;
  EditorState.holePathIndices = [];
  // Note: editorMode is NOT reset - it's set explicitly when opening an editor
}
