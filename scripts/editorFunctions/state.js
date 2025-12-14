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
  holePathIndices: []  // Indices of paths that are holes (for evenodd shapes)
};

// Constants
const EDITOR_SIZE = 400;
const ANCHOR_RADIUS = 8;
const CONTROL_RADIUS = 6;
const EDITOR_MARGIN = 40;
const EDITOR_SHAPE_SIZE = EDITOR_SIZE - EDITOR_MARGIN * 2;
const HANDLE_SIZE = 8;  // Size of bounding box handles

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
}
