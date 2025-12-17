/* Pattern Editor State - shared state object for pattern editor modules */

const PatternEditorState = {
  // Canvas elements
  editorCanvas: null,
  editorCtx: null,
  previewCanvas: null,
  previewCtx: null,

  // Pattern data
  pixelData: [],
  patternSize: 16,

  // Editor settings
  editorZoom: 100,      // Slider value (1-100), default to max (1:1 zoom)
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
  isLineMode: false,
  previewData: null,

  // Panning state (spacebar + drag)
  isSpacebarHeld: false,
  isPanning: false,
  hasPanned: false,   // Track if any panning occurred during spacebar hold
  panStartX: 0,
  panStartY: 0,
  patternOffsetX: 0,  // Current offset in pixels (snapped to grid)
  patternOffsetY: 0,

  // Current editing context
  currentEditingPatternIndex: null,

  // Constants
  MIN_PATTERN_SIZE: 4,
  MAX_PATTERN_SIZE: 64,
  MIN_EDITOR_ZOOM: 1,     // Slider value 1 = 0.25 zoom
  MAX_EDITOR_ZOOM: 100    // Slider value 100 = 1 zoom (pattern fills boundary)
};
