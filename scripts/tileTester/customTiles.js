/* Custom Tiles - User-created composite tiles from canvas selections */

// Generate unique ID for custom tile
function generateCustomTileId() {
  return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Add a custom tile from current canvas selection (sparse format)
function addCustomTileFromSelection() {
  const state = TileTesterState;
  if (!state.canvasSelection) return;

  const sel = state.canvasSelection;
  const tileSize = state.tileSize;
  const sourceCanvas = document.getElementById('canvas');

  // Calculate grid bounds (these are internal grid coordinates)
  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Collect tile references from ALL visible layers (composite view)
  // Each position can have multiple tiles from different layers
  const tileRefs = [];
  // Track positions with multiple tiles for merging
  const refsByPosition = {};

  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const internalX = minGridX + localX;
      const internalY = minGridY + localY;
      const posKey = `${localX},${localY}`;

      // Convert to tile coordinates for sparse lookup
      const tileCoords = internalToTileCoords(internalX, internalY);

      // Collect tiles from ALL visible layers at this position (bottom to top)
      for (let i = 0; i < state.layers.length; i++) {
        const layer = state.layers[i];
        if (!layer.visible) continue;

        const tile = getTileAtPosition(layer, tileCoords.x, tileCoords.y);
        if (tile) {
          // Convert to semantic reference if it's not already
          let tileRef;
          if (tile.type && tile.name) {
            // Already a semantic reference
            tileRef = { ...tile };
          } else if (tile.row !== undefined && tile.col !== undefined) {
            // Old-style {row, col} - convert to semantic reference
            tileRef = coordsToTileRef(tile.row, tile.col);
            if (!tileRef) {
              // Fallback to old format if conversion fails
              tileRef = { row: tile.row, col: tile.col };
            }
          }

          if (tileRef) {
            const refWithPos = {
              ...tileRef,
              localX: localX,
              localY: localY,
              layerIndex: i,  // Track which layer this came from (for proper ordering)
              layerOpacity: layer.opacity  // Track layer opacity for merging
            };
            tileRefs.push(refWithPos);

            // Track by position for overlap detection
            if (!refsByPosition[posKey]) {
              refsByPosition[posKey] = [];
            }
            refsByPosition[posKey].push(refWithPos);
          }
        }
      }
    }
  }

  // Only create custom tile if we have at least one tile reference
  if (tileRefs.length === 0) {
    clearCanvasSelection();
    return;
  }

  // Pre-render merged visuals for positions with multiple tiles
  const mergedPositions = {};
  for (const posKey in refsByPosition) {
    const refsAtPos = refsByPosition[posKey];
    if (refsAtPos.length > 1) {
      // This position has overlapping tiles - pre-render the merged visual
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = tileSize;
      tempCanvas.height = tileSize;
      const tempCtx = tempCanvas.getContext('2d');

      // Sort by layer index and draw in order
      const sortedRefs = [...refsAtPos].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));
      sortedRefs.forEach(ref => {
        const coords = getTileCanvasCoords(ref);
        if (!coords) return;

        const srcX = coords.col * tileSize;
        const srcY = coords.row * tileSize;

        tempCtx.globalAlpha = ref.layerOpacity !== undefined ? ref.layerOpacity : 1;
        tempCtx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          0, 0, tileSize, tileSize
        );
      });
      tempCtx.globalAlpha = 1;

      // Store as data URL
      mergedPositions[posKey] = tempCanvas.toDataURL('image/png');
    }
  }

  // Create the custom tile
  const customTile = {
    id: generateCustomTileId(),
    tileRefs: tileRefs,
    width: width,
    height: height,
    mergedPositions: Object.keys(mergedPositions).length > 0 ? mergedPositions : null
  };

  state.customTiles.push(customTile);

  // Clear selection
  clearCanvasSelection();

  // Update palette to show new custom tile
  renderCustomTilesInPalette();

  // Update main preview window custom tiles
  if (typeof renderCustomTilesPreview === 'function') {
    renderCustomTilesPreview();
  }
}

// Remove a custom tile by ID
function removeCustomTile(tileId) {
  const index = TileTesterState.customTiles.findIndex(t => t.id === tileId);
  if (index !== -1) {
    TileTesterState.customTiles.splice(index, 1);
    renderCustomTilesInPalette();

    // Update main preview window custom tiles
    if (typeof renderCustomTilesPreview === 'function') {
      renderCustomTilesPreview();
    }
  }
}

// Clear the canvas drag selection
function clearCanvasSelection() {
  TileTesterState.isCanvasSelecting = false;
  TileTesterState.isCanvasSelectionFinalized = false;
  TileTesterState.canvasSelectionStart = null;
  TileTesterState.canvasSelection = null;
  // Clear drag state
  TileTesterState.isSelectionDragging = false;
  TileTesterState.selectionDragStart = null;
  TileTesterState.selectionDragOffset = null;
  TileTesterState.selectionDragTiles = null;
  // Clear resize state
  TileTesterState.isSelectionResizing = false;
  TileTesterState.selectionResizeStart = null;
  TileTesterState.selectionOriginalBounds = null;
  TileTesterState.selectionResizeSize = null;
  hideSelectionUI();
  renderTileTesterMainCanvas();
}

// Capture tiles from visible layers within the current selection
function captureSelectionTiles() {
  const state = TileTesterState;
  if (!state.canvasSelection) return null;

  const sel = state.canvasSelection;

  // Calculate grid bounds (internal grid coordinates)
  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Collect tile references from ALL visible layers
  const tileRefs = [];

  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const internalX = minGridX + localX;
      const internalY = minGridY + localY;

      // Convert to tile coordinates for sparse lookup
      const tileCoords = internalToTileCoords(internalX, internalY);

      // Collect tiles from ALL visible layers at this position
      for (let i = 0; i < state.layers.length; i++) {
        const layer = state.layers[i];
        if (!layer.visible) continue;

        const tile = getTileAtPosition(layer, tileCoords.x, tileCoords.y);
        if (tile) {
          // Create a copy of the tile reference
          let tileRef;
          if (tile.type === 'merged' && tile.dataURL) {
            // Merged tile - copy it directly
            tileRef = { type: 'merged', dataURL: tile.dataURL };
          } else if (tile.type && tile.name) {
            tileRef = { ...tile };
          } else if (tile.row !== undefined && tile.col !== undefined) {
            tileRef = coordsToTileRef(tile.row, tile.col);
            if (!tileRef) {
              tileRef = { row: tile.row, col: tile.col };
            }
          }

          if (tileRef) {
            tileRefs.push({
              ...tileRef,
              localX: localX,
              localY: localY,
              layerIndex: i
            });
          }
        }
      }
    }
  }

  return {
    tiles: tileRefs,
    width: width,
    height: height,
    minGridX: minGridX,
    minGridY: minGridY
  };
}

// Check if a grid position is inside the current finalized selection
function isInsideSelection(gridX, gridY) {
  const sel = TileTesterState.canvasSelection;
  if (!sel || !TileTesterState.isCanvasSelectionFinalized) return false;

  const minCol = Math.min(sel.startCol, sel.endCol);
  const maxCol = Math.max(sel.startCol, sel.endCol);
  const minRow = Math.min(sel.startRow, sel.endRow);
  const maxRow = Math.max(sel.startRow, sel.endRow);

  return gridX >= minCol && gridX <= maxCol && gridY >= minRow && gridY <= maxRow;
}

// Check if a click is on the resize handle (bottom-right corner)
function isOnResizeHandle(e) {
  const handle = document.getElementById('selectionResizeHandle');
  if (!handle) return false;

  const rect = handle.getBoundingClientRect();
  return e.clientX >= rect.left && e.clientX <= rect.right &&
         e.clientY >= rect.top && e.clientY <= rect.bottom;
}

// Remove tiles from visible layers within the selection area
function removeSelectionTilesFromLayers() {
  const state = TileTesterState;
  if (!state.canvasSelection) return;

  const sel = state.canvasSelection;

  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Remove tiles from visible layers only
  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const internalX = minGridX + localX;
      const internalY = minGridY + localY;
      const tileCoords = internalToTileCoords(internalX, internalY);

      for (let i = 0; i < state.layers.length; i++) {
        const layer = state.layers[i];
        if (!layer.visible) continue;
        removeTileAtPosition(layer, tileCoords.x, tileCoords.y);
      }
    }
  }
}

// Clear tiles on the active layer within the selection area
function clearSelectionOnActiveLayer() {
  const state = TileTesterState;
  if (!state.canvasSelection) return;

  const layer = getActiveLayer();
  if (!layer) return;

  const sel = state.canvasSelection;

  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Remove tiles from active layer only
  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const internalX = minGridX + localX;
      const internalY = minGridY + localY;
      const tileCoords = internalToTileCoords(internalX, internalY);
      removeTileAtPosition(layer, tileCoords.x, tileCoords.y);
    }
  }

  // Update layer thumbnail
  updateLayerThumbnail(layer.id);

  // Clear selection and redraw
  clearCanvasSelection();
}

// Clear tiles on all layers within the selection area
function clearSelectionOnAllLayers() {
  const state = TileTesterState;
  if (!state.canvasSelection) return;

  const sel = state.canvasSelection;

  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Remove tiles from ALL layers
  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const internalX = minGridX + localX;
      const internalY = minGridY + localY;
      const tileCoords = internalToTileCoords(internalX, internalY);

      for (const layer of state.layers) {
        removeTileAtPosition(layer, tileCoords.x, tileCoords.y);
      }
    }
  }

  // Update all layer thumbnails
  for (const layer of state.layers) {
    updateLayerThumbnail(layer.id);
  }

  // Clear selection and redraw
  clearCanvasSelection();
}

// Place captured tiles at a new position
function placeSelectionTilesAt(tiles, targetGridX, targetGridY) {
  const state = TileTesterState;
  if (!tiles || tiles.length === 0) return;

  // Sort by layer index to maintain correct ordering
  const sortedTiles = [...tiles].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

  // Place each tile at its new position on its original layer
  sortedTiles.forEach(ref => {
    const destInternalX = targetGridX + ref.localX;
    const destInternalY = targetGridY + ref.localY;

    // Ensure grid is expanded if needed
    ensureGridForInternalPosition(destInternalX, destInternalY, 1);

    // Convert to tile coordinates
    const destCoords = internalToTileCoords(destInternalX, destInternalY);

    // Get the layer this tile belongs to
    const layer = state.layers[ref.layerIndex];
    if (!layer || !layer.visible) return;

    // Create new tile reference (without local position and layer info)
    let newTile;
    if (ref.type === 'merged' && ref.dataURL) {
      // Merged tile - copy it directly
      newTile = { type: 'merged', dataURL: ref.dataURL };
    } else if (ref.type && ref.name) {
      newTile = {
        type: ref.type,
        name: ref.name,
        colorIndex: ref.colorIndex,
        tileRow: ref.tileRow,
        tileCol: ref.tileCol
      };
    } else if (ref.row !== undefined && ref.col !== undefined) {
      const tileRef = coordsToTileRef(ref.row, ref.col);
      newTile = tileRef || { row: ref.row, col: ref.col };
    }

    if (newTile) {
      setTileAtPosition(layer, destCoords.x, destCoords.y, newTile);
    }
  });

  // Update thumbnails for all visible layers
  for (const layer of state.layers) {
    if (layer.visible) {
      updateLayerThumbnail(layer.id);
    }
  }
}

// Place repeated/tiled selection at the current resize dimensions
function placeRepeatedSelectionTiles(originalTiles, originalWidth, originalHeight, targetGridX, targetGridY, newWidth, newHeight) {
  const state = TileTesterState;
  if (!originalTiles || originalTiles.length === 0) return;

  // Calculate how many times to repeat in each direction
  const repeatX = Math.ceil(newWidth / originalWidth);
  const repeatY = Math.ceil(newHeight / originalHeight);

  // Group tiles by layer for efficient placement
  const tilesByLayer = {};
  originalTiles.forEach(ref => {
    const layerIdx = ref.layerIndex || 0;
    if (!tilesByLayer[layerIdx]) {
      tilesByLayer[layerIdx] = [];
    }
    tilesByLayer[layerIdx].push(ref);
  });

  // Place repeated tiles
  for (let ry = 0; ry < repeatY; ry++) {
    for (let rx = 0; rx < repeatX; rx++) {
      Object.keys(tilesByLayer).forEach(layerIdx => {
        const layer = state.layers[parseInt(layerIdx)];
        if (!layer || !layer.visible) return;

        tilesByLayer[layerIdx].forEach(ref => {
          const destLocalX = rx * originalWidth + ref.localX;
          const destLocalY = ry * originalHeight + ref.localY;

          // Only place if within the new bounds
          if (destLocalX >= newWidth || destLocalY >= newHeight) return;

          const destInternalX = targetGridX + destLocalX;
          const destInternalY = targetGridY + destLocalY;

          // Ensure grid is expanded if needed
          ensureGridForInternalPosition(destInternalX, destInternalY, 1);

          // Convert to tile coordinates
          const destCoords = internalToTileCoords(destInternalX, destInternalY);

          // Create new tile reference
          let newTile;
          if (ref.type === 'merged' && ref.dataURL) {
            // Merged tile - copy it directly
            newTile = { type: 'merged', dataURL: ref.dataURL };
          } else if (ref.type && ref.name) {
            newTile = {
              type: ref.type,
              name: ref.name,
              colorIndex: ref.colorIndex,
              tileRow: ref.tileRow,
              tileCol: ref.tileCol
            };
          } else if (ref.row !== undefined && ref.col !== undefined) {
            const tileRef = coordsToTileRef(ref.row, ref.col);
            newTile = tileRef || { row: ref.row, col: ref.col };
          }

          if (newTile) {
            setTileAtPosition(layer, destCoords.x, destCoords.y, newTile);
          }
        });
      });
    }
  }

  // Update thumbnails for all visible layers
  for (const layer of state.layers) {
    if (layer.visible) {
      updateLayerThumbnail(layer.id);
    }
  }
}

// Setup canvas selection events - called from setupMainCanvasEvents
function setupCanvasSelectionEvents() {
  const mainCanvas = document.getElementById('tileTesterMainCanvas');
  if (!mainCanvas) return;

  // Store original mousedown handler
  const originalMouseDown = tileTesterEventHandlers.mainCanvasMouseDown;

  // Replace with enhanced version that handles Cmd/Ctrl+drag, selection dragging, and resizing
  tileTesterEventHandlers.mainCanvasMouseDown = function(e) {
    // Don't process if space panning
    if (TileTesterState.isSpacePanning) {
      if (originalMouseDown) originalMouseDown.call(this, e);
      return;
    }

    // Check for resize handle click first (this takes priority)
    if (e.button === 0 && TileTesterState.isCanvasSelectionFinalized && isOnResizeHandle(e)) {
      e.preventDefault();
      e.stopPropagation();

      const pos = getGridPositionFromCanvasClick(e);
      if (!pos) return;

      // Capture tiles and start resize operation
      const captured = captureSelectionTiles();
      if (captured && captured.tiles.length > 0) {
        TileTesterState.isSelectionResizing = true;
        TileTesterState.selectionResizeStart = { gridX: pos.gridX, gridY: pos.gridY };
        TileTesterState.selectionDragTiles = captured.tiles;
        TileTesterState.selectionOriginalBounds = {
          minCol: captured.minGridX,
          minRow: captured.minGridY,
          width: captured.width,
          height: captured.height
        };
        TileTesterState.selectionResizeSize = {
          width: captured.width,
          height: captured.height
        };

        // Remove original tiles from layers
        removeSelectionTilesFromLayers();

        hideSelectionUI();
        mainCanvas.style.cursor = 'nwse-resize';
        renderTileTesterMainCanvas();
      }
      return;
    }

    // Check for click inside finalized selection (for dragging)
    if (e.button === 0 && TileTesterState.isCanvasSelectionFinalized && !e.metaKey && !e.ctrlKey) {
      const pos = getGridPositionFromCanvasClick(e);
      if (pos && isInsideSelection(pos.gridX, pos.gridY)) {
        e.preventDefault();
        e.stopPropagation();

        // Capture tiles and start drag operation
        const captured = captureSelectionTiles();
        if (captured && captured.tiles.length > 0) {
          TileTesterState.isSelectionDragging = true;
          TileTesterState.selectionDragStart = { gridX: pos.gridX, gridY: pos.gridY };
          TileTesterState.selectionDragOffset = { x: 0, y: 0 };
          TileTesterState.selectionDragTiles = captured.tiles;
          TileTesterState.selectionOriginalBounds = {
            minCol: captured.minGridX,
            minRow: captured.minGridY,
            width: captured.width,
            height: captured.height
          };

          // Remove original tiles from layers
          removeSelectionTilesFromLayers();

          hideSelectionUI();
          mainCanvas.style.cursor = 'grabbing';
          renderTileTesterMainCanvas();
        }
        return;
      }
    }

    // Check for Cmd/Ctrl+click for new canvas selection
    if (e.button === 0 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();

      const pos = getGridPositionFromCanvasClick(e);
      if (!pos) return;

      // Clear any existing drag/resize state
      TileTesterState.isSelectionDragging = false;
      TileTesterState.isSelectionResizing = false;
      TileTesterState.selectionDragTiles = null;

      TileTesterState.isCanvasSelecting = true;
      TileTesterState.isCanvasSelectionFinalized = false;
      TileTesterState.canvasSelectionStart = { row: pos.gridY, col: pos.gridX };
      TileTesterState.canvasSelection = {
        startRow: pos.gridY,
        startCol: pos.gridX,
        endRow: pos.gridY,
        endCol: pos.gridX
      };

      hideSelectionUI();
      renderTileTesterMainCanvas();
      return;
    }

    // Clear canvas selection if clicking outside without Cmd/Ctrl
    if (TileTesterState.canvasSelection && !e.metaKey && !e.ctrlKey) {
      clearCanvasSelection();
    }

    // Call original handler for normal painting
    if (originalMouseDown) {
      originalMouseDown.call(this, e);
    }
  };

  // Store original mousemove handler
  const originalMouseMove = tileTesterEventHandlers.mainCanvasMouseMove;

  tileTesterEventHandlers.mainCanvasMouseMove = function(e) {
    // Handle selection resize
    if (TileTesterState.isSelectionResizing && TileTesterState.selectionOriginalBounds) {
      const pos = getGridPositionFromCanvasClick(e);
      if (pos) {
        const bounds = TileTesterState.selectionOriginalBounds;

        // Calculate new size based on mouse position relative to selection origin
        const newWidth = Math.max(1, pos.gridX - bounds.minCol + 1);
        const newHeight = Math.max(1, pos.gridY - bounds.minRow + 1);

        TileTesterState.selectionResizeSize = { width: newWidth, height: newHeight };
        renderTileTesterMainCanvas();
      }
      return;
    }

    // Handle selection drag
    if (TileTesterState.isSelectionDragging && TileTesterState.selectionDragStart) {
      const pos = getGridPositionFromCanvasClick(e);
      if (pos) {
        const offsetX = pos.gridX - TileTesterState.selectionDragStart.gridX;
        const offsetY = pos.gridY - TileTesterState.selectionDragStart.gridY;

        TileTesterState.selectionDragOffset = { x: offsetX, y: offsetY };
        renderTileTesterMainCanvas();
      }
      return;
    }

    // Handle canvas selection creation drag
    if (TileTesterState.isCanvasSelecting && TileTesterState.canvasSelectionStart) {
      const pos = getGridPositionFromCanvasClick(e);
      if (pos) {
        TileTesterState.canvasSelection = {
          startRow: TileTesterState.canvasSelectionStart.row,
          startCol: TileTesterState.canvasSelectionStart.col,
          endRow: pos.gridY,
          endCol: pos.gridX
        };
        renderTileTesterMainCanvas();
      }
      return;
    }

    // Update cursor when hovering over finalized selection
    if (TileTesterState.isCanvasSelectionFinalized && !TileTesterState.isPainting) {
      if (isOnResizeHandle(e)) {
        mainCanvas.style.cursor = 'nwse-resize';
      } else {
        const pos = getGridPositionFromCanvasClick(e);
        if (pos && isInsideSelection(pos.gridX, pos.gridY)) {
          mainCanvas.style.cursor = 'grab';
        } else {
          mainCanvas.style.cursor = '';
        }
      }
    }

    // Call original handler
    if (originalMouseMove) {
      originalMouseMove.call(this, e);
    }
  };

  // Store original mouseup handler
  const originalMouseUp = tileTesterEventHandlers.mainCanvasMouseUp;

  tileTesterEventHandlers.mainCanvasMouseUp = function(e) {
    // Handle selection resize end
    if (TileTesterState.isSelectionResizing) {
      const bounds = TileTesterState.selectionOriginalBounds;
      const newSize = TileTesterState.selectionResizeSize;

      if (bounds && newSize && TileTesterState.selectionDragTiles) {
        // Place the repeated tiles at the new size
        placeRepeatedSelectionTiles(
          TileTesterState.selectionDragTiles,
          bounds.width,
          bounds.height,
          bounds.minCol,
          bounds.minRow,
          newSize.width,
          newSize.height
        );

        // Update the selection bounds to the new size
        TileTesterState.canvasSelection = {
          startRow: bounds.minRow,
          startCol: bounds.minCol,
          endRow: bounds.minRow + newSize.height - 1,
          endCol: bounds.minCol + newSize.width - 1
        };
      }

      // Reset resize state
      TileTesterState.isSelectionResizing = false;
      TileTesterState.selectionResizeStart = null;
      TileTesterState.selectionOriginalBounds = null;
      TileTesterState.selectionResizeSize = null;
      TileTesterState.selectionDragTiles = null;

      mainCanvas.style.cursor = '';
      showSelectionUI();
      renderTileTesterMainCanvas();
      updateCanvasTransform();
      return;
    }

    // Handle selection drag end
    if (TileTesterState.isSelectionDragging) {
      const bounds = TileTesterState.selectionOriginalBounds;
      const offset = TileTesterState.selectionDragOffset;

      if (bounds && offset && TileTesterState.selectionDragTiles) {
        // Calculate new position
        const newMinCol = bounds.minCol + offset.x;
        const newMinRow = bounds.minRow + offset.y;

        // Place the tiles at the new position
        placeSelectionTilesAt(TileTesterState.selectionDragTiles, newMinCol, newMinRow);

        // Update the selection bounds to the new position
        TileTesterState.canvasSelection = {
          startRow: newMinRow,
          startCol: newMinCol,
          endRow: newMinRow + bounds.height - 1,
          endCol: newMinCol + bounds.width - 1
        };
      }

      // Reset drag state
      TileTesterState.isSelectionDragging = false;
      TileTesterState.selectionDragStart = null;
      TileTesterState.selectionDragOffset = null;
      TileTesterState.selectionDragTiles = null;
      TileTesterState.selectionOriginalBounds = null;

      mainCanvas.style.cursor = '';
      showSelectionUI();
      renderTileTesterMainCanvas();
      updateCanvasTransform();
      return;
    }

    // Handle canvas selection creation end
    if (TileTesterState.isCanvasSelecting) {
      TileTesterState.isCanvasSelecting = false;

      // Check if we have a valid selection (at least one tile)
      if (TileTesterState.canvasSelection) {
        // Mark selection as finalized to show dashed border
        TileTesterState.isCanvasSelectionFinalized = true;
        showSelectionUI();
      }
      return;
    }

    // Call original handler
    if (originalMouseUp) {
      originalMouseUp.call(this, e);
    }
  };

  // Re-attach event listeners with new handlers
  mainCanvas.removeEventListener('mousedown', originalMouseDown);
  mainCanvas.removeEventListener('mousemove', originalMouseMove);
  mainCanvas.removeEventListener('mouseup', originalMouseUp);

  mainCanvas.addEventListener('mousedown', tileTesterEventHandlers.mainCanvasMouseDown);
  mainCanvas.addEventListener('mousemove', tileTesterEventHandlers.mainCanvasMouseMove);
  mainCanvas.addEventListener('mouseup', tileTesterEventHandlers.mainCanvasMouseUp);

  // Add document-level mousemove handler for drag/resize operations
  // This ensures smooth operations even when mouse moves outside the canvas
  document.addEventListener('mousemove', function(e) {
    // Only handle if we're actually in a drag or resize operation
    if (!TileTesterState.isSelectionDragging && !TileTesterState.isSelectionResizing) return;

    // Check if tile tester modal is active
    const modal = document.getElementById('tileTesterModal');
    if (!modal || !modal.classList.contains('active')) return;

    // Trigger the same handler as the canvas mousemove
    tileTesterEventHandlers.mainCanvasMouseMove.call(mainCanvas, e);
  });

  // Add document-level mouseup handler for drag/resize operations
  // This ensures operations complete even if mouse is released outside the canvas
  document.addEventListener('mouseup', function(e) {
    // Only handle if we're actually in a drag or resize operation
    if (!TileTesterState.isSelectionDragging && !TileTesterState.isSelectionResizing) return;

    // Check if tile tester modal is active
    const modal = document.getElementById('tileTesterModal');
    if (!modal || !modal.classList.contains('active')) return;

    // Trigger the same handler as the canvas mouseup
    tileTesterEventHandlers.mainCanvasMouseUp.call(mainCanvas, e);
  });

  // Note: Escape key handling is centralized in modalManager.js initTileTester()
  // to avoid duplicate handlers being registered each time the modal opens
}

// Render selection rectangle on canvas (blue color to differentiate from palette red)
function renderCanvasSelection() {
  const state = TileTesterState;
  const sel = state.canvasSelection;
  if (!sel) return;

  const ctx = state.mainCtx;
  const tileSize = state.tileSize;
  const sourceCanvas = document.getElementById('canvas');

  // Check if we're in drag or resize mode
  const isDragging = state.isSelectionDragging && state.selectionDragOffset;
  const isResizing = state.isSelectionResizing && state.selectionResizeSize;

  // Calculate base selection bounds
  let minRow = Math.min(sel.startRow, sel.endRow);
  let minCol = Math.min(sel.startCol, sel.endCol);
  let selWidth = Math.abs(sel.endCol - sel.startCol) + 1;
  let selHeight = Math.abs(sel.endRow - sel.startRow) + 1;

  // Render tile preview during drag or resize
  if ((isDragging || isResizing) && state.selectionDragTiles && state.selectionOriginalBounds) {
    const bounds = state.selectionOriginalBounds;
    const offset = state.selectionDragOffset || { x: 0, y: 0 };
    const newSize = state.selectionResizeSize || { width: bounds.width, height: bounds.height };

    // Calculate preview position
    const previewMinCol = bounds.minCol + offset.x;
    const previewMinRow = bounds.minRow + offset.y;
    const previewWidth = isResizing ? newSize.width : bounds.width;
    const previewHeight = isResizing ? newSize.height : bounds.height;

    // Draw ghost preview of tiles
    ctx.globalAlpha = 0.6;

    if (isResizing) {
      // Draw repeated/tiled preview
      const repeatX = Math.ceil(previewWidth / bounds.width);
      const repeatY = Math.ceil(previewHeight / bounds.height);

      for (let ry = 0; ry < repeatY; ry++) {
        for (let rx = 0; rx < repeatX; rx++) {
          state.selectionDragTiles.forEach(ref => {
            const destLocalX = rx * bounds.width + ref.localX;
            const destLocalY = ry * bounds.height + ref.localY;

            // Only draw if within the new bounds
            if (destLocalX >= previewWidth || destLocalY >= previewHeight) return;

            const destX = (previewMinCol + destLocalX) * tileSize;
            const destY = (previewMinRow + destLocalY) * tileSize;

            // Handle merged tiles
            if (ref.type === 'merged' && ref.dataURL && typeof mergedTileImageCache !== 'undefined' && mergedTileImageCache[ref.dataURL]) {
              ctx.drawImage(mergedTileImageCache[ref.dataURL], destX, destY, tileSize, tileSize);
              return;
            }

            const coords = getTileCanvasCoords(ref);
            if (!coords) return;

            const srcX = coords.col * tileSize;
            const srcY = coords.row * tileSize;

            ctx.drawImage(
              sourceCanvas,
              srcX, srcY, tileSize, tileSize,
              destX, destY, tileSize, tileSize
            );
          });
        }
      }
    } else {
      // Draw simple drag preview
      state.selectionDragTiles.forEach(ref => {
        const destX = (previewMinCol + ref.localX) * tileSize;
        const destY = (previewMinRow + ref.localY) * tileSize;

        // Handle merged tiles
        if (ref.type === 'merged' && ref.dataURL && typeof mergedTileImageCache !== 'undefined' && mergedTileImageCache[ref.dataURL]) {
          ctx.drawImage(mergedTileImageCache[ref.dataURL], destX, destY, tileSize, tileSize);
          return;
        }

        const coords = getTileCanvasCoords(ref);
        if (!coords) return;

        const srcX = coords.col * tileSize;
        const srcY = coords.row * tileSize;

        ctx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );
      });
    }

    ctx.globalAlpha = 1;

    // Draw selection rectangle around preview area
    const x = previewMinCol * tileSize;
    const y = previewMinRow * tileSize;
    const width = previewWidth * tileSize;
    const height = previewHeight * tileSize;

    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
    ctx.setLineDash([]);

    return;
  }

  // Normal selection rendering (not dragging/resizing)
  const x = minCol * tileSize;
  const y = minRow * tileSize;
  const width = selWidth * tileSize;
  const height = selHeight * tileSize;

  // Check if selection is finalized (after mouseup) or active (during drag)
  const isFinalized = state.isCanvasSelectionFinalized;

  if (isFinalized) {
    // Finalized selection: dashed blue border only, no fill
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);  // Dashed line pattern
    ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
    ctx.setLineDash([]);  // Reset to solid line
  } else {
    // Active selection (during drag): semi-transparent fill with solid border
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
  }
}

// Show the selection popup menu UI
function showSelectionUI() {
  const sel = TileTesterState.canvasSelection;
  if (!sel) return;

  // Remove existing UI if any
  hideSelectionUI();

  const tileSize = TileTesterState.tileSize;
  const zoom = TileTesterState.canvasZoom || 1;
  const pan = TileTesterState.canvasPan;

  // Calculate selection bounds
  const minRow = Math.min(sel.startRow, sel.endRow);
  const maxRow = Math.max(sel.startRow, sel.endRow);
  const minCol = Math.min(sel.startCol, sel.endCol);
  const maxCol = Math.max(sel.startCol, sel.endCol);

  // Calculate center position for the menu
  const selectionCenterX = ((minCol + maxCol + 1) / 2) * tileSize * zoom;
  const selectionTop = minRow * tileSize * zoom;

  // Get canvas position
  const canvas = document.getElementById('tileTesterMainCanvas');
  const canvasRect = canvas.getBoundingClientRect();

  // Create UI container (now a menu)
  const ui = document.createElement('div');
  ui.id = 'customTileSelectionUI';
  ui.className = 'custom-tile-selection-ui custom-tile-selection-menu';

  // Position above the selection
  ui.style.position = 'fixed';
  ui.style.left = (canvasRect.left + selectionCenterX) + 'px';
  ui.style.top = (canvasRect.top + selectionTop - 10) + 'px';
  ui.style.transform = 'translate(-50%, -100%)';
  ui.style.zIndex = '1000';

  // Menu items
  const menuItems = [
    { label: 'Add Combined Tile', action: addCustomTileFromSelection },
    { label: 'Clear Layer', action: clearSelectionOnActiveLayer },
    { label: 'Clear All', action: clearSelectionOnAllLayers },
    { label: 'Save Selection (PNG)', action: saveSelectionAsPNG },
    { label: 'Save Selection (SVG)', action: saveSelectionAsSVG }
  ];

  menuItems.forEach((item, index) => {
    const menuItem = document.createElement('button');
    menuItem.className = 'custom-tile-menu-item';
    menuItem.textContent = item.label;
    menuItem.onclick = function(e) {
      e.stopPropagation();
      item.action();
    };
    ui.appendChild(menuItem);
  });

  document.body.appendChild(ui);

  // Create resize handle at bottom-right corner of selection
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'selectionResizeHandle';
  resizeHandle.className = 'selection-resize-handle';

  // Calculate position at bottom-right corner of selection
  const selectionRight = (maxCol + 1) * tileSize * zoom;
  const selectionBottom = (maxRow + 1) * tileSize * zoom;

  resizeHandle.style.position = 'fixed';
  resizeHandle.style.left = (canvasRect.left + selectionRight - 12) + 'px';
  resizeHandle.style.top = (canvasRect.top + selectionBottom - 12) + 'px';
  resizeHandle.style.zIndex = '1001';

  // Add grid icon (3x3 dots pattern) using SVG
  resizeHandle.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3" cy="3" r="1.5"/>
      <circle cx="8" cy="3" r="1.5"/>
      <circle cx="13" cy="3" r="1.5"/>
      <circle cx="3" cy="8" r="1.5"/>
      <circle cx="8" cy="8" r="1.5"/>
      <circle cx="13" cy="8" r="1.5"/>
      <circle cx="3" cy="13" r="1.5"/>
      <circle cx="8" cy="13" r="1.5"/>
      <circle cx="13" cy="13" r="1.5"/>
    </svg>
  `;

  // Add mousedown handler directly on the resize handle
  resizeHandle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const mainCanvas = document.getElementById('tileTesterMainCanvas');
    if (!mainCanvas) return;

    // Capture tiles and start resize operation
    const captured = captureSelectionTiles();
    if (captured && captured.tiles.length > 0) {
      TileTesterState.isSelectionResizing = true;
      TileTesterState.selectionDragTiles = captured.tiles;
      TileTesterState.selectionOriginalBounds = {
        minCol: captured.minGridX,
        minRow: captured.minGridY,
        width: captured.width,
        height: captured.height
      };
      TileTesterState.selectionResizeSize = {
        width: captured.width,
        height: captured.height
      };

      // Remove original tiles from layers
      removeSelectionTilesFromLayers();

      hideSelectionUI();
      mainCanvas.style.cursor = 'nwse-resize';
      renderTileTesterMainCanvas();
    }
  });

  document.body.appendChild(resizeHandle);

  // Trigger a re-render to show the finalized selection
  renderTileTesterMainCanvas();
}

// Save selection as PNG
function saveSelectionAsPNG() {
  const sel = TileTesterState.canvasSelection;
  if (!sel) return;

  const tileSize = TileTesterState.tileSize;
  const sourceCanvas = document.getElementById('canvas');
  if (!sourceCanvas) return;

  // Calculate grid bounds (these are internal grid coordinates)
  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  // Create temporary canvas for export
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width * tileSize;
  tempCanvas.height = height * tileSize;
  const tempCtx = tempCanvas.getContext('2d');

  // Draw tiles from all visible layers (bottom to top)
  for (let localY = 0; localY < height; localY++) {
    for (let localX = 0; localX < width; localX++) {
      const internalX = minGridX + localX;
      const internalY = minGridY + localY;

      // Convert to tile coordinates for sparse lookup
      const tileCoords = internalToTileCoords(internalX, internalY);

      // Draw tiles from all visible layers at this position
      for (const layer of TileTesterState.layers) {
        if (!layer.visible) continue;

        const tile = getTileAtPosition(layer, tileCoords.x, tileCoords.y);
        if (tile) {
          const destX = localX * tileSize;
          const destY = localY * tileSize;

          tempCtx.globalAlpha = layer.opacity;

          // Check if this is a merged tile
          if (tile.type === 'merged' && tile.dataURL && mergedTileImageCache[tile.dataURL]) {
            tempCtx.drawImage(mergedTileImageCache[tile.dataURL], destX, destY, tileSize, tileSize);
            continue;
          }

          const coords = getTileCanvasCoords(tile);
          if (!coords) continue;

          const srcX = coords.col * tileSize;
          const srcY = coords.row * tileSize;

          tempCtx.drawImage(
            sourceCanvas,
            srcX, srcY, tileSize, tileSize,
            destX, destY, tileSize, tileSize
          );
        }
      }
    }
  }

  tempCtx.globalAlpha = 1;

  // Download
  const image = tempCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'custom-tile.png';
  link.href = image;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clear selection after save
  clearCanvasSelection();
}

// Save selection as SVG (vector paths)
function saveSelectionAsSVG() {
  const sel = TileTesterState.canvasSelection;
  if (!sel) return;

  const tileSize = TileTesterState.tileSize;

  // Calculate grid bounds (these are internal grid coordinates)
  const minGridX = Math.min(sel.startCol, sel.endCol);
  const maxGridX = Math.max(sel.startCol, sel.endCol);
  const minGridY = Math.min(sel.startRow, sel.endRow);
  const maxGridY = Math.max(sel.startRow, sel.endRow);

  const width = maxGridX - minGridX + 1;
  const height = maxGridY - minGridY + 1;

  const svgWidth = width * tileSize;
  const svgHeight = height * tileSize;

  const defs = [];
  const content = [];

  // Process each visible layer (bottom to top)
  for (const layer of TileTesterState.layers) {
    if (!layer.visible) continue;
    if (!layer.tiles || !Array.isArray(layer.tiles)) continue;

    const opacity = layer.opacity;
    const layerContent = [];

    // Iterate through the selection area
    for (let localY = 0; localY < height; localY++) {
      for (let localX = 0; localX < width; localX++) {
        const internalX = minGridX + localX;
        const internalY = minGridY + localY;

        // Convert to tile coordinates for sparse lookup
        const tileCoords = internalToTileCoords(internalX, internalY);

        const tile = getTileAtPosition(layer, tileCoords.x, tileCoords.y);
        if (!tile) continue;

        // Calculate destination position in the SVG
        const destX = localX * tileSize;
        const destY = localY * tileSize;

        // Check if this is a merged tile (embedded bitmap)
        if (tile.type === 'merged' && tile.dataURL) {
          // Embed as SVG image element with base64 data
          layerContent.push(`    <image x="${destX}" y="${destY}" width="${tileSize}" height="${tileSize}" href="${tile.dataURL}" />`);
          continue;
        }

        // Get the tile's canvas coordinates
        const coords = getTileCanvasCoords(tile);
        if (!coords) continue;

        // Generate SVG elements for this tile using the existing SVG exporter
        const tileElements = generateTileSVGFromCoords(coords, tileSize, destX, destY);

        tileElements.forEach(el => {
          if (el.type === 'mask' || el.type === 'clipPath') {
            defs.push(el.content);
          } else {
            layerContent.push(el.content);
          }
        });
      }
    }

    // Wrap layer content with opacity if not 1
    if (layerContent.length > 0) {
      if (opacity < 1) {
        content.push(`  <g opacity="${opacity}">`);
        layerContent.forEach(c => content.push('  ' + c));
        content.push(`  </g>`);
      } else {
        layerContent.forEach(c => content.push(c));
      }
    }
  }

  // Build final SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">\n`;

  if (defs.length > 0) {
    svg += `  <defs>\n`;
    svg += defs.join('\n') + '\n';
    svg += `  </defs>\n`;
  }

  svg += content.join('\n') + '\n';
  svg += `</svg>`;

  // Download as SVG
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'custom-tile.svg';
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Clear selection after save
  clearCanvasSelection();
}

// Hide the selection UI
function hideSelectionUI() {
  const existing = document.getElementById('customTileSelectionUI');
  if (existing) {
    existing.remove();
  }
  // Also remove resize handle
  const resizeHandle = document.getElementById('selectionResizeHandle');
  if (resizeHandle) {
    resizeHandle.remove();
  }
}

// Render custom tiles section in the palette
function renderCustomTilesInPalette() {
  const container = document.getElementById('tileTesterCustomTilesContainer');
  if (!container) return;

  const customTiles = TileTesterState.customTiles;
  const tileSize = TileTesterState.tileSize;
  const sourceCanvas = document.getElementById('canvas');

  // Clear container
  container.innerHTML = '';

  if (customTiles.length === 0) {
    container.innerHTML = '<div class="custom-tiles-empty">No custom tiles yet.<br>Cmd/Ctrl+drag on canvas to select.</div>';
    return;
  }

  // Create grid of custom tiles
  customTiles.forEach((customTile) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-tile-item';
    wrapper.dataset.customTileId = customTile.id;

    // Create canvas for preview
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = customTile.width * tileSize;
    previewCanvas.height = customTile.height * tileSize;
    const previewCtx = previewCanvas.getContext('2d');

    // Fill with transparent background indicator (checkerboard)
    drawCheckerboard(previewCtx, previewCanvas.width, previewCanvas.height);

    // Draw the tile references (sorted by layer index to maintain proper ordering)
    if (sourceCanvas) {
      // Track drawn positions to avoid drawing merged ones twice
      const drawnPositions = new Set();

      // First draw any merged positions using cached images
      if (customTile.mergedPositions) {
        for (const posKey in customTile.mergedPositions) {
          const [localX, localY] = posKey.split(',').map(Number);
          const destX = localX * tileSize;
          const destY = localY * tileSize;

          const dataURL = customTile.mergedPositions[posKey];

          // Check if image is already cached
          if (typeof mergedTileImageCache !== 'undefined' && mergedTileImageCache[dataURL]) {
            previewCtx.drawImage(mergedTileImageCache[dataURL], destX, destY, tileSize, tileSize);
          } else {
            // Load and cache the image, then re-render
            const img = new Image();
            img.onload = function() {
              if (typeof mergedTileImageCache !== 'undefined') {
                mergedTileImageCache[dataURL] = img;
              }
              // Re-render after image loads
              renderCustomTilesInPalette();
            };
            img.src = dataURL;
          }
          drawnPositions.add(posKey);
        }
      }

      // Sort by layer index to draw in correct order (bottom to top)
      const sortedRefs = [...customTile.tileRefs].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

      sortedRefs.forEach(ref => {
        const posKey = `${ref.localX},${ref.localY}`;
        if (drawnPositions.has(posKey)) return; // Skip if already drawn as merged

        // Get canvas coordinates - handles both semantic refs and old-style {row, col}
        const coords = getTileCanvasCoords(ref);
        if (!coords) return;

        const srcX = coords.col * tileSize;
        const srcY = coords.row * tileSize;
        const destX = ref.localX * tileSize;
        const destY = ref.localY * tileSize;

        // Apply layer opacity if captured
        const opacity = ref.layerOpacity !== undefined ? ref.layerOpacity : 1;
        previewCtx.globalAlpha = opacity;

        previewCtx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, tileSize, tileSize
        );

        previewCtx.globalAlpha = 1;
        drawnPositions.add(posKey);
      });
    }

    // Scale down preview for display
    const maxPreviewSize = 80;
    const scale = Math.min(maxPreviewSize / previewCanvas.width, maxPreviewSize / previewCanvas.height, 1);

    previewCanvas.style.width = (previewCanvas.width * scale) + 'px';
    previewCanvas.style.height = (previewCanvas.height * scale) + 'px';

    wrapper.appendChild(previewCanvas);

    // Add remove button (hidden by default, shown on hover)
    const removeBtn = document.createElement('button');
    removeBtn.className = 'custom-tile-remove-btn';
    removeBtn.textContent = 'REMOVE';
    removeBtn.onclick = function(e) {
      e.stopPropagation();
      removeCustomTile(customTile.id);
    };
    wrapper.appendChild(removeBtn);

    // Click to select for painting
    wrapper.addEventListener('click', function(e) {
      if (e.target === removeBtn) return;
      selectCustomTileForPainting(customTile);
    });

    container.appendChild(wrapper);
  });
}

// Draw checkerboard pattern for transparency indication
function drawCheckerboard(ctx, width, height) {
  const checkSize = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#e0e0e0';
  for (let y = 0; y < height; y += checkSize) {
    for (let x = 0; x < width; x += checkSize) {
      if ((x / checkSize + y / checkSize) % 2 === 0) {
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }
  }
}

// Select a custom tile for painting on the canvas
function selectCustomTileForPainting(customTile) {
  // Clear existing selections
  TileTesterState.selectedTile = null;
  TileTesterState.selectedTiles = null;

  // Set custom tile selection
  TileTesterState.selectedCustomTile = customTile;

  // Update palette selection visuals
  updateCustomTilePaletteSelection(customTile.id);
  updatePaletteSelection(); // Clear regular palette selection

  // Update cursor
  updateCursorPreview();
}

// Update visual selection in custom tiles palette
function updateCustomTilePaletteSelection(selectedId) {
  const items = document.querySelectorAll('.custom-tile-item');
  items.forEach(item => {
    if (item.dataset.customTileId === selectedId) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// Place custom tile at grid position (sparse format)
function placeCustomTileAt(gridX, gridY) {
  const customTile = TileTesterState.selectedCustomTile;
  if (!customTile) return;

  const layer = getActiveLayer();
  if (!layer) return;

  // Group refs by position to handle merging properly
  const refsByPosition = {};
  customTile.tileRefs.forEach(ref => {
    const posKey = `${ref.localX},${ref.localY}`;
    if (!refsByPosition[posKey]) {
      refsByPosition[posKey] = [];
    }
    refsByPosition[posKey].push(ref);
  });

  // FIRST: expand grid to fit all tiles (may shift origin)
  // Find bounds of custom tile
  let minLocalX = 0, maxLocalX = 0, minLocalY = 0, maxLocalY = 0;
  customTile.tileRefs.forEach(ref => {
    minLocalX = Math.min(minLocalX, ref.localX);
    maxLocalX = Math.max(maxLocalX, ref.localX);
    minLocalY = Math.min(minLocalY, ref.localY);
    maxLocalY = Math.max(maxLocalY, ref.localY);
  });
  // Expand for all corners
  ensureGridForInternalPosition(gridX + minLocalX, gridY + minLocalY, 1);
  ensureGridForInternalPosition(gridX + maxLocalX, gridY + maxLocalY, 1);

  // NOW place tiles using the updated origin
  // Process each unique position
  for (const posKey in refsByPosition) {
    const [localX, localY] = posKey.split(',').map(Number);
    const refsAtPos = refsByPosition[posKey];

    const destInternalX = gridX + localX;
    const destInternalY = gridY + localY;

    // Convert to tile coordinates using updated origin
    const destCoords = internalToTileCoords(destInternalX, destInternalY);
    const destTileX = destCoords.x;
    const destTileY = destCoords.y;

    // Check if this position has pre-rendered merged data
    if (customTile.mergedPositions && customTile.mergedPositions[posKey]) {
      // Use the merged tile reference
      const mergedTile = {
        type: 'merged',
        dataURL: customTile.mergedPositions[posKey]
      };
      setTileAtPosition(layer, destTileX, destTileY, mergedTile);
    } else {
      // Single tile at this position - use normal placement
      // Sort by layer index and use the top-most one (last in sort order)
      const sortedRefs = [...refsAtPos].sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));
      const ref = sortedRefs[sortedRefs.length - 1]; // Use top-most

      let newTile;
      if (ref.type && ref.name) {
        // Semantic reference - copy it (without localX/localY/layerIndex)
        newTile = {
          type: ref.type,
          name: ref.name,
          colorIndex: ref.colorIndex,
          tileRow: ref.tileRow,
          tileCol: ref.tileCol
        };
      } else if (ref.row !== undefined && ref.col !== undefined) {
        // Old-style {row, col} - convert to semantic ref
        const tileRef = coordsToTileRef(ref.row, ref.col);
        newTile = tileRef || { row: ref.row, col: ref.col };
      }

      if (newTile) {
        setTileAtPosition(layer, destTileX, destTileY, newTile);
      }
    }
  }

  // Render and update transform
  renderTileTesterMainCanvas();
  updateCanvasTransform();
  updateLayerThumbnail(layer.id);
}

// Initialize custom tiles functionality
function initCustomTiles() {
  // Add canvas selection state if not present
  if (TileTesterState.isCanvasSelecting === undefined) {
    TileTesterState.isCanvasSelecting = false;
  }
  if (TileTesterState.canvasSelectionStart === undefined) {
    TileTesterState.canvasSelectionStart = null;
  }
  if (TileTesterState.canvasSelection === undefined) {
    TileTesterState.canvasSelection = null;
  }

  // Setup the canvas selection events
  setupCanvasSelectionEvents();
}
