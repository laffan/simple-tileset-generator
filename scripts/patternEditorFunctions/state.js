/* Pattern Editor State - shared state object for pattern editor modules */

const PatternEditorState = {
  // Canvas elements
  editorCanvas: null,
  editorCtx: null,
  previewCanvas: null,
  previewCtx: null,

  // Pattern data
  pixelData: [],
  patternSize: 8,

  // Editor settings
  editorZoom: 4,
  previewZoom: 4,
  pixelSize: 40,

  // Interaction state
  isDrawing: false,
  isDragging: false,
  drawColor: 1, // Color to draw (0 or 1)
  startPixel: null,
  currentPixel: null,
  holdTimer: null,
  isLineMode: false,
  previewData: null,

  // Current editing context
  currentEditingPatternIndex: null,

  // Constants
  MIN_PATTERN_SIZE: 4,
  MAX_PATTERN_SIZE: 32,
  MIN_EDITOR_ZOOM: 2,
  MAX_EDITOR_ZOOM: 20,
  MIN_PREVIEW_ZOOM: 2,
  MAX_PREVIEW_ZOOM: 20,
  HOLD_THRESHOLD: 300 // ms to trigger line mode
};
