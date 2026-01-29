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

  // Origin offset - tracks where (0,0) in tile coordinates is within the internal grid
  // Tiles are stored relative to this origin, allowing infinite expansion in all directions
  gridOrigin: { x: 0, y: 0 },

  // Layers - array of layer objects
  // Each layer: { id, name, tiles: [] (sparse array of {tile, x, y}), opacity: 1, visible: true }
  layers: [],
  activeLayerId: null,
  nextLayerId: 1,

  // Selected tile for painting
  selectedTile: null,  // { row, col }

  // Multi-tile selection for combinations (rectangular selection)
  selectedTiles: null, // { startRow, startCol, endRow, endCol, tiles: [[{row,col}]] }
  isSelectingMultiple: false,
  selectionStart: null, // { row, col } - starting point for drag selection

  // Background color
  backgroundColor: '#d0d0d0',

  // Palette window state
  palettePosition: { x: 20, y: 20 },
  paletteFitMode: false,

  // Canvas zoom and pan state
  canvasZoom: 1,
  canvasPan: { x: 0, y: 0 },
  isSpacePanning: false,

  // Painting state
  isPainting: false,
  lastPaintedCell: null,

  // Cached tileset image data (without selection outline)
  tilesetImageData: null,
  tileSize: 64,

  // Custom tiles - created from canvas selections
  // Each custom tile: { id, tileRefs: [{row, col, localX, localY}], width, height }
  customTiles: [],

  // Currently selected custom tile for painting
  selectedCustomTile: null,

  // Canvas selection state for creating custom tiles (grid-based like palette selection)
  isCanvasSelecting: false,
  isCanvasSelectionFinalized: false,  // true when selection is complete (after mouseup)
  canvasSelectionStart: null,  // {row, col}
  canvasSelection: null,       // {startRow, startCol, endRow, endCol}

  // Ghost preview state - shows tile preview before placing
  hoverPosition: null  // {gridX, gridY} - current hover position for ghost preview
};

// Create a new layer with sparse tile storage
function createTileTesterLayer(name) {
  const layer = {
    id: TileTesterState.nextLayerId++,
    name: name || 'Layer ' + TileTesterState.nextLayerId,
    tiles: [],  // Sparse array: [{tile: tileRef, x: gridX, y: gridY}, ...]
    opacity: 1,
    visible: true
  };

  return layer;
}

// Initialize with default layer
function initTileTesterLayers() {
  TileTesterState.layers = [];
  TileTesterState.nextLayerId = 1;
  TileTesterState.gridOrigin = { x: 0, y: 0 };
  const layer = createTileTesterLayer('Layer 1');
  TileTesterState.layers.push(layer);
  TileTesterState.activeLayerId = layer.id;
}

// Get active layer
function getActiveLayer() {
  return TileTesterState.layers.find(l => l.id === TileTesterState.activeLayerId);
}

// Add a new layer above the currently selected layer
function addTileTesterLayer() {
  const layer = createTileTesterLayer('Layer ' + (TileTesterState.layers.length + 1));

  // Find the index of the currently active layer
  const activeIndex = TileTesterState.layers.findIndex(l => l.id === TileTesterState.activeLayerId);

  if (activeIndex !== -1) {
    // Insert above the active layer (higher index = renders on top)
    TileTesterState.layers.splice(activeIndex + 1, 0, layer);
  } else {
    // No active layer, add to top
    TileTesterState.layers.push(layer);
  }

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

// Toggle layer visibility
function toggleLayerVisibility(layerId) {
  const layer = TileTesterState.layers.find(l => l.id === layerId);
  if (layer) {
    layer.visible = !layer.visible;
    renderLayersList();
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

// Get tile at position from sparse array
function getTileAtPosition(layer, x, y) {
  if (!layer || !layer.tiles) return null;
  const entry = layer.tiles.find(t => t.x === x && t.y === y);
  return entry ? entry.tile : null;
}

// Set tile at position in sparse array
function setTileAtPosition(layer, x, y, tile) {
  if (!layer) return;
  if (!layer.tiles) layer.tiles = [];

  // Remove existing tile at position
  const existingIndex = layer.tiles.findIndex(t => t.x === x && t.y === y);
  if (existingIndex !== -1) {
    layer.tiles.splice(existingIndex, 1);
  }

  // Add new tile if not null
  if (tile !== null) {
    layer.tiles.push({ tile: tile, x: x, y: y });
  }
}

// Remove tile at position from sparse array
function removeTileAtPosition(layer, x, y) {
  if (!layer || !layer.tiles) return;
  const index = layer.tiles.findIndex(t => t.x === x && t.y === y);
  if (index !== -1) {
    layer.tiles.splice(index, 1);
  }
}

// Get the bounding box of all tiles across all layers
function getTileBounds() {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  let hasTiles = false;

  for (const layer of TileTesterState.layers) {
    if (!layer.tiles) continue;
    for (const entry of layer.tiles) {
      hasTiles = true;
      minX = Math.min(minX, entry.x);
      minY = Math.min(minY, entry.y);
      maxX = Math.max(maxX, entry.x);
      maxY = Math.max(maxY, entry.y);
    }
  }

  if (!hasTiles) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, hasTiles: false };
  }

  return { minX, minY, maxX, maxY, hasTiles: true };
}

// Shift all existing tile coordinates to compensate for origin change
// This keeps tiles at their visual positions when the grid expands
function shiftAllTileCoordinates(deltaX, deltaY) {
  if (deltaX === 0 && deltaY === 0) return;

  for (const layer of TileTesterState.layers) {
    if (!layer.tiles) continue;
    for (const entry of layer.tiles) {
      entry.x -= deltaX;
      entry.y -= deltaY;
    }
  }

  // Also shift custom tile references if they exist
  if (TileTesterState.customTiles) {
    for (const customTile of TileTesterState.customTiles) {
      if (customTile.tileRefs) {
        // Custom tiles store relative positions, no need to shift
      }
    }
  }
}

// Ensure grid is large enough for internal grid position with margin
// This version takes internal grid coordinates (from click position) directly
// and expands the grid BEFORE tile coordinate conversion, so tiles render where clicked
// Returns true if grid was expanded
function ensureGridForInternalPosition(internalX, internalY, margin) {
  margin = margin || 1;  // Reduced from 5 to 1 for minimal expansion
  let expanded = false;

  // Store original values to measure actual shift after expansion
  const originalOriginX = TileTesterState.gridOrigin.x;
  const originalOriginY = TileTesterState.gridOrigin.y;

  // Check if we need to expand in any direction
  // We need margin squares available beyond the position

  // Expand left (need to shift origin)
  if (internalX < margin) {
    const expandBy = margin - internalX;
    TileTesterState.gridOrigin.x += expandBy;
    TileTesterState.gridWidth += expandBy;
    expanded = true;
  }

  // Expand right
  if (internalX >= TileTesterState.gridWidth - margin) {
    const expandBy = internalX - TileTesterState.gridWidth + margin + 1;
    TileTesterState.gridWidth += expandBy;
    expanded = true;
  }

  // Expand top (need to shift origin)
  if (internalY < margin) {
    const expandBy = margin - internalY;
    TileTesterState.gridOrigin.y += expandBy;
    TileTesterState.gridHeight += expandBy;
    expanded = true;
  }

  // Expand bottom
  if (internalY >= TileTesterState.gridHeight - margin) {
    const expandBy = internalY - TileTesterState.gridHeight + margin + 1;
    TileTesterState.gridHeight += expandBy;
    expanded = true;
  }

  // Measure actual origin shift after expansion
  const measuredShiftX = TileTesterState.gridOrigin.x - originalOriginX;
  const measuredShiftY = TileTesterState.gridOrigin.y - originalOriginY;

  // Shift existing tile coordinates to compensate for origin change
  shiftAllTileCoordinates(measuredShiftX, measuredShiftY);

  // Adjust pan to keep the view stable after left/top expansion
  // When origin shifts, new canvas pixels are added at position 0,
  // so we shift the view by the same amount to keep content in place
  if (measuredShiftX !== 0 || measuredShiftY !== 0) {
    const tileSize = TileTesterState.tileSize;
    TileTesterState.canvasPan.x -= measuredShiftX * tileSize;
    TileTesterState.canvasPan.y -= measuredShiftY * tileSize;
  }

  return expanded;
}

// Legacy wrapper - takes tile coordinates
// Returns true if grid was expanded
function ensureGridForPosition(x, y, margin) {
  const origin = TileTesterState.gridOrigin;
  const internalX = x + origin.x;
  const internalY = y + origin.y;
  return ensureGridForInternalPosition(internalX, internalY, margin);
}

// Convert tile coordinates to internal grid coordinates
function tileToInternalCoords(tileX, tileY) {
  return {
    x: tileX + TileTesterState.gridOrigin.x,
    y: tileY + TileTesterState.gridOrigin.y
  };
}

// Convert internal grid coordinates to tile coordinates
function internalToTileCoords(internalX, internalY) {
  return {
    x: internalX - TileTesterState.gridOrigin.x,
    y: internalY - TileTesterState.gridOrigin.y
  };
}

// Clear all tiles on active layer
function clearTileTesterGrid() {
  const layer = getActiveLayer();
  if (layer) {
    layer.tiles = [];
  }
  if (TileTesterState.mainCanvas) {
    renderTileTesterMainCanvas();
  }
}

// Get tile tester data for session saving (sparse format v2)
function getTileTesterData() {
  // Convert layers to sparse format for saving
  const sparseLayers = TileTesterState.layers.map(layer => ({
    id: layer.id,
    name: layer.name,
    tiles: layer.tiles ? layer.tiles.map(entry => ({
      tile: entry.tile,
      x: entry.x,
      y: entry.y
    })) : [],
    opacity: layer.opacity,
    visible: layer.visible
  }));

  return {
    version: 2,  // Tile tester data format version
    layers: sparseLayers,
    activeLayerId: TileTesterState.activeLayerId,
    nextLayerId: TileTesterState.nextLayerId,
    gridOrigin: { ...TileTesterState.gridOrigin },
    backgroundColor: TileTesterState.backgroundColor,
    paletteFitMode: TileTesterState.paletteFitMode,
    customTiles: JSON.parse(JSON.stringify(TileTesterState.customTiles))
  };
}

// Convert old 2D array layer format to sparse format
function convertLegacyLayerToSparse(layer) {
  const sparseTiles = [];

  if (layer.tiles && Array.isArray(layer.tiles)) {
    // Check if it's already sparse format (array of {tile, x, y} objects)
    if (layer.tiles.length > 0 && layer.tiles[0] &&
        typeof layer.tiles[0].x === 'number' &&
        typeof layer.tiles[0].y === 'number') {
      // Already sparse format
      return layer.tiles;
    }

    // Convert from 2D array format
    for (let y = 0; y < layer.tiles.length; y++) {
      const row = layer.tiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        if (tile !== null && tile !== undefined) {
          sparseTiles.push({ tile: tile, x: x, y: y });
        }
      }
    }
  }

  return sparseTiles;
}

// Load tile tester data from session (handles both old and new formats)
function loadTileTesterData(data) {
  if (!data) return;

  // Handle background color
  if (data.backgroundColor !== undefined) {
    TileTesterState.backgroundColor = data.backgroundColor;
    const bgColorPicker = document.getElementById('tileTesterBgColorPicker');
    if (bgColorPicker) {
      bgColorPicker.value = data.backgroundColor;
    }
    if (typeof updateClearBackgroundVisibility === 'function') {
      updateClearBackgroundVisibility();
    }
  }

  if (data.paletteFitMode !== undefined) {
    TileTesterState.paletteFitMode = data.paletteFitMode;
  }

  // Load grid origin (v2 format) or reset to 0,0 (v1 format)
  if (data.gridOrigin !== undefined) {
    TileTesterState.gridOrigin = { ...data.gridOrigin };
  } else {
    TileTesterState.gridOrigin = { x: 0, y: 0 };
  }

  // Load layers and convert from legacy format if needed
  if (data.layers !== undefined) {
    const loadedLayers = JSON.parse(JSON.stringify(data.layers));

    // Convert each layer's tiles to sparse format if needed
    TileTesterState.layers = loadedLayers.map(layer => ({
      id: layer.id,
      name: layer.name,
      tiles: convertLegacyLayerToSparse(layer),
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      visible: layer.visible !== undefined ? layer.visible : true
    }));

    // For legacy format, calculate grid size from tile positions
    if (data.version === undefined || data.version < 2) {
      const bounds = getTileBounds();
      if (bounds.hasTiles) {
        // Set grid to encompass all tiles with margin
        TileTesterState.gridWidth = Math.max(16, bounds.maxX + 6);
        TileTesterState.gridHeight = Math.max(12, bounds.maxY + 6);
      }
    }
  }

  if (data.activeLayerId !== undefined) {
    TileTesterState.activeLayerId = data.activeLayerId;
  }
  if (data.nextLayerId !== undefined) {
    TileTesterState.nextLayerId = data.nextLayerId;
  }
  if (data.customTiles !== undefined) {
    TileTesterState.customTiles = JSON.parse(JSON.stringify(data.customTiles));
  }
}

// Reset state when modal closes
function resetTileTesterState() {
  TileTesterState.selectedTile = null;
  TileTesterState.selectedTiles = null;
  TileTesterState.selectedCustomTile = null;
  TileTesterState.isSelectingMultiple = false;
  TileTesterState.selectionStart = null;
  TileTesterState.isPainting = false;
  TileTesterState.lastPaintedCell = null;
  TileTesterState.tilesetImageData = null;
  TileTesterState.isCanvasSelecting = false;
  TileTesterState.isCanvasSelectionFinalized = false;
  TileTesterState.canvasSelectionStart = null;
  TileTesterState.canvasSelection = null;
  TileTesterState.hoverPosition = null;
}

// Center the view on existing tiles
function centerViewOnTiles() {
  const bounds = getTileBounds();
  if (!bounds.hasTiles) return;

  const tileSize = TileTesterState.tileSize;
  const origin = TileTesterState.gridOrigin;
  const zoom = TileTesterState.canvasZoom || 1;

  // Calculate center of tile bounds in internal grid coordinates
  const centerTileX = (bounds.minX + bounds.maxX) / 2;
  const centerTileY = (bounds.minY + bounds.maxY) / 2;

  // Convert to internal grid coordinates
  const centerInternalX = centerTileX + origin.x;
  const centerInternalY = centerTileY + origin.y;

  // Calculate pixel position of center
  const centerPixelX = centerInternalX * tileSize;
  const centerPixelY = centerInternalY * tileSize;

  // Calculate pan to center this in the viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  TileTesterState.canvasPan = {
    x: (viewportWidth / 2 / zoom) - centerPixelX - (tileSize / 2),
    y: (viewportHeight / 2 / zoom) - centerPixelY - (tileSize / 2)
  };
}

// Calculate grid size based on window dimensions and existing tiles
function calculateGridSize() {
  const tileSize = TileTesterState.tileSize;

  // Calculate minimum grid size to fill window
  let minWidth = Math.floor(window.innerWidth / tileSize);
  let minHeight = Math.floor(window.innerHeight / tileSize);

  // Ensure minimum size
  minWidth = Math.max(8, minWidth);
  minHeight = Math.max(6, minHeight);

  // Get bounds of existing tiles
  const bounds = getTileBounds();

  if (bounds.hasTiles) {
    // Calculate grid size needed to encompass all tiles with margin
    const margin = 5;
    const origin = TileTesterState.gridOrigin;

    // Calculate internal grid positions of tile bounds
    const minInternalX = bounds.minX + origin.x;
    const maxInternalX = bounds.maxX + origin.x;
    const minInternalY = bounds.minY + origin.y;
    const maxInternalY = bounds.maxY + origin.y;

    // Expand origin if tiles are in negative internal coordinates
    if (minInternalX < margin) {
      const expandBy = margin - minInternalX;
      TileTesterState.gridOrigin.x += expandBy;
    }
    if (minInternalY < margin) {
      const expandBy = margin - minInternalY;
      TileTesterState.gridOrigin.y += expandBy;
    }

    // Recalculate after origin adjustment
    const newOrigin = TileTesterState.gridOrigin;
    const neededWidth = (bounds.maxX + newOrigin.x) + margin + 1;
    const neededHeight = (bounds.maxY + newOrigin.y) + margin + 1;

    // Use the larger of window size or needed size
    TileTesterState.gridWidth = Math.max(minWidth, neededWidth);
    TileTesterState.gridHeight = Math.max(minHeight, neededHeight);
  } else {
    TileTesterState.gridWidth = minWidth;
    TileTesterState.gridHeight = minHeight;
  }
}
