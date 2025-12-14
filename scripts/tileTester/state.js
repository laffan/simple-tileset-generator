/* Tile Tester State Management */

var TileTesterState = {
  // Canvas elements
  mainCanvas: null,
  mainCtx: null,
  paletteCanvas: null,
  paletteCtx: null,

  // Grid configuration
  gridWidth: 16,    // Number of tiles horizontally
  gridHeight: 12,   // Number of tiles vertically

  // Tile data - 2D array storing tile references
  // Each cell contains: { shapeIndex, colorIndex } or null
  tiles: [],

  // Selected tile for painting
  selectedTile: null,  // { type: 'shape'|'pattern', index: number, colorIndex: number }

  // Background color
  backgroundColor: '#d0d0d0',

  // Palette window state
  palettePosition: { x: 20, y: 20 },
  paletteFitMode: false,

  // Painting state
  isPainting: false,
  lastPaintedCell: null,  // Prevent painting same cell repeatedly

  // Cached tileset image data
  tilesetImageData: null,
  tileSize: 64
};

// Initialize empty tiles grid
function initTileTesterGrid() {
  TileTesterState.tiles = [];
  for (let y = 0; y < TileTesterState.gridHeight; y++) {
    TileTesterState.tiles[y] = [];
    for (let x = 0; x < TileTesterState.gridWidth; x++) {
      TileTesterState.tiles[y][x] = null;
    }
  }
}

// Clear all tiles
function clearTileTesterGrid() {
  initTileTesterGrid();
  if (TileTesterState.mainCanvas) {
    renderTileTesterMainCanvas();
  }
}

// Get tile tester data for session saving
function getTileTesterData() {
  return {
    tiles: JSON.parse(JSON.stringify(TileTesterState.tiles)),
    gridWidth: TileTesterState.gridWidth,
    gridHeight: TileTesterState.gridHeight,
    backgroundColor: TileTesterState.backgroundColor,
    paletteFitMode: TileTesterState.paletteFitMode
  };
}

// Load tile tester data from session
function loadTileTesterData(data) {
  if (!data) return;

  if (data.gridWidth !== undefined) {
    TileTesterState.gridWidth = data.gridWidth;
  }
  if (data.gridHeight !== undefined) {
    TileTesterState.gridHeight = data.gridHeight;
  }
  if (data.backgroundColor !== undefined) {
    TileTesterState.backgroundColor = data.backgroundColor;
  }
  if (data.paletteFitMode !== undefined) {
    TileTesterState.paletteFitMode = data.paletteFitMode;
  }
  if (data.tiles !== undefined) {
    TileTesterState.tiles = JSON.parse(JSON.stringify(data.tiles));
  }
}

// Reset state when modal closes
function resetTileTesterState() {
  TileTesterState.selectedTile = null;
  TileTesterState.isPainting = false;
  TileTesterState.lastPaintedCell = null;
  TileTesterState.tilesetImageData = null;
}
