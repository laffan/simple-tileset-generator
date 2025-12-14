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
  editorZoom: 4,        // This is now calculated, represents pixels per grid cell
  pixelSize: 32,        // Actual pixel size on screen

  // Fixed boundary size for the editable area (red border)
  BOUNDARY_SIZE: 256,

  // Editor canvas offset for centering
  boundaryOffsetX: 0,
  boundaryOffsetY: 0,

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
  MAX_PATTERN_SIZE: 64,
  MIN_EDITOR_ZOOM: 1,     // 1:0.25 (slider value 1 = 0.25 zoom)
  MAX_EDITOR_ZOOM: 80,    // 1:20 (slider value 80 = 20 zoom)
  HOLD_THRESHOLD: 300 // ms to trigger line mode
};
