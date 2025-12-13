/* Editor State - Shared state for all editor modules */

const EditorState = {
  two: null,
  paths: [],  // Array of Two.Path objects for multi-path shapes
  anchors: [],
  selectedAnchor: null,
  currentEditingShapeIndex: null,
  currentPathIndex: 0,  // Currently selected path in multi-path shapes
  isDragging: false
};

// Constants
const EDITOR_SIZE = 400;
const ANCHOR_RADIUS = 8;
const CONTROL_RADIUS = 6;
const EDITOR_MARGIN = 40;
const EDITOR_SHAPE_SIZE = EDITOR_SIZE - EDITOR_MARGIN * 2;

// Get currently selected path
function getCurrentPath() {
  return EditorState.paths[EditorState.currentPathIndex] || null;
}

// Reset editor state
function resetEditorState() {
  EditorState.paths = [];
  EditorState.currentPathIndex = 0;
  EditorState.anchors = [];
  EditorState.selectedAnchor = null;
  EditorState.currentEditingShapeIndex = null;
  EditorState.isDragging = false;
}
