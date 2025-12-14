/* Tile Tester State Management */

var TileTesterState = {
  // Canvas elements
  mainCanvas: null,
  mainCtx: null,
  paletteCanvas: null,
  paletteCtx: null,

  // Grid configuration - calculated based on window size
  gridWidth: 16,
  gridHeight: 12,

  // Layers - array of layer objects
  // Each layer: { id, name, tiles: [][], opacity: 1, visible: true }
  layers: [],
  activeLayerId: null,
  nextLayerId: 1,

  // Selected tile for painting
  selectedTile: null,  // { row, col }

  // Background color
  backgroundColor: '#d0d0d0',

  // Palette window state
  palettePosition: { x: 20, y: 20 },
  paletteFitMode: true,
  paletteZoom: 'fit',

  // Painting state
  isPainting: false,
  lastPaintedCell: null,

  // Cached tileset image data (without selection outline)
  tilesetImageData: null,
  tileSize: 64
};

// Create a new layer
function createTileTesterLayer(name) {
  const layer = {
    id: TileTesterState.nextLayerId++,
    name: name || 'Layer ' + TileTesterState.nextLayerId,
    tiles: [],
    opacity: 1,
    visible: true
  };

  // Initialize empty tiles grid for this layer
  for (let y = 0; y < TileTesterState.gridHeight; y++) {
    layer.tiles[y] = [];
    for (let x = 0; x < TileTesterState.gridWidth; x++) {
      layer.tiles[y][x] = null;
    }
  }

  return layer;
}

// Initialize with default layer
function initTileTesterLayers() {
  TileTesterState.layers = [];
  TileTesterState.nextLayerId = 1;
  const layer = createTileTesterLayer('Layer 1');
  TileTesterState.layers.push(layer);
  TileTesterState.activeLayerId = layer.id;
}

// Get active layer
function getActiveLayer() {
  return TileTesterState.layers.find(l => l.id === TileTesterState.activeLayerId);
}

// Add a new layer
function addTileTesterLayer() {
  const layer = createTileTesterLayer('Layer ' + (TileTesterState.layers.length + 1));
  TileTesterState.layers.push(layer);
  TileTesterState.activeLayerId = layer.id;
  renderLayersList();
  renderTileTesterMainCanvas();
}

// Delete a layer
function deleteTileTesterLayer(layerId) {
  if (TileTesterState.layers.length <= 1) return; // Keep at least one layer

  const index = TileTesterState.layers.findIndex(l => l.id === layerId);
  if (index === -1) return;

  TileTesterState.layers.splice(index, 1);

  // Update active layer if needed
  if (TileTesterState.activeLayerId === layerId) {
    TileTesterState.activeLayerId = TileTesterState.layers[0].id;
  }

  renderLayersList();
  renderTileTesterMainCanvas();
}

// Update layer opacity
function setLayerOpacity(layerId, opacity) {
  const layer = TileTesterState.layers.find(l => l.id === layerId);
  if (layer) {
    layer.opacity = Math.max(0, Math.min(1, opacity));
    renderTileTesterMainCanvas();
  }
}

// Reorder layers (for drag and drop)
function reorderLayers(fromIndex, toIndex) {
  const layer = TileTesterState.layers.splice(fromIndex, 1)[0];
  TileTesterState.layers.splice(toIndex, 0, layer);
  renderLayersList();
  renderTileTesterMainCanvas();
}

// Clear all tiles on active layer
function clearTileTesterGrid() {
  const layer = getActiveLayer();
  if (layer) {
    for (let y = 0; y < TileTesterState.gridHeight; y++) {
      layer.tiles[y] = [];
      for (let x = 0; x < TileTesterState.gridWidth; x++) {
        layer.tiles[y][x] = null;
      }
    }
  }
  if (TileTesterState.mainCanvas) {
    renderTileTesterMainCanvas();
  }
}

// Get tile tester data for session saving
function getTileTesterData() {
  return {
    layers: JSON.parse(JSON.stringify(TileTesterState.layers)),
    activeLayerId: TileTesterState.activeLayerId,
    nextLayerId: TileTesterState.nextLayerId,
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
  if (data.layers !== undefined) {
    TileTesterState.layers = JSON.parse(JSON.stringify(data.layers));
  }
  if (data.activeLayerId !== undefined) {
    TileTesterState.activeLayerId = data.activeLayerId;
  }
  if (data.nextLayerId !== undefined) {
    TileTesterState.nextLayerId = data.nextLayerId;
  }
}

// Reset state when modal closes
function resetTileTesterState() {
  TileTesterState.selectedTile = null;
  TileTesterState.isPainting = false;
  TileTesterState.lastPaintedCell = null;
  TileTesterState.tilesetImageData = null;
}

// Calculate grid size based on window dimensions
function calculateGridSize() {
  const tileSize = TileTesterState.tileSize;

  // Fill entire window with no padding
  TileTesterState.gridWidth = Math.floor(window.innerWidth / tileSize);
  TileTesterState.gridHeight = Math.floor(window.innerHeight / tileSize);

  // Ensure minimum size
  TileTesterState.gridWidth = Math.max(8, TileTesterState.gridWidth);
  TileTesterState.gridHeight = Math.max(6, TileTesterState.gridHeight);
}
