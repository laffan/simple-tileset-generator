/* Tile Reference Utilities
 * Converts between canvas coordinates (row, col) and semantic tile references
 * Semantic refs survive tileset changes (adding/removing shapes/patterns/combos)
 */

// Get current tileset layout info
function getTilesetLayout() {
  const selectedShapes = getSelectedShapes();
  const selectedPatterns = getSelectedPatterns();
  const selectedCombinations = typeof getSelectedCombinations === 'function' ? getSelectedCombinations() : [];
  const colors = typeof selectedColors !== 'undefined' ? selectedColors : [];

  const numShapeRows = selectedShapes.length;
  const numPatternRows = selectedPatterns.length;

  // Calculate combination layout (each combo spans multiple rows/cols)
  let combinationRowsInfo = [];
  let totalCombinationRows = 0;
  selectedCombinations.forEach((combinationName) => {
    const combinationData = getCombinationData(combinationName);
    if (combinationData) {
      const dims = getCombinationDimensions(combinationData);
      combinationRowsInfo.push({
        name: combinationName,
        width: dims.width,
        height: dims.height,
        startRow: totalCombinationRows
      });
      totalCombinationRows += dims.height;
    }
  });

  return {
    shapes: selectedShapes,
    patterns: selectedPatterns,
    combinations: selectedCombinations,
    combinationRowsInfo: combinationRowsInfo,
    numShapeRows: numShapeRows,
    numPatternRows: numPatternRows,
    numCombinationRows: totalCombinationRows,
    numColors: colors.length
  };
}

// Convert canvas (row, col) to semantic tile reference
// Returns: { type: 'shape'|'pattern'|'combination', name: string, colorIndex: number, tileRow?: number, tileCol?: number }
// tileRow/tileCol are only for combinations (which tile within the multi-tile combo)
function coordsToTileRef(row, col) {
  const layout = getTilesetLayout();

  // Check if it's a shape
  if (row < layout.numShapeRows) {
    const shapeName = layout.shapes[row];
    if (!shapeName) return null;
    return {
      type: 'shape',
      name: shapeName,
      colorIndex: col
    };
  }

  // Check if it's a pattern
  const patternRow = row - layout.numShapeRows;
  if (patternRow < layout.numPatternRows) {
    const patternName = layout.patterns[patternRow];
    if (!patternName) return null;
    return {
      type: 'pattern',
      name: patternName,
      colorIndex: col
    };
  }

  // Check if it's a combination
  const combinationRow = row - layout.numShapeRows - layout.numPatternRows;
  if (combinationRow < layout.numCombinationRows) {
    // Find which combination this row belongs to
    for (const info of layout.combinationRowsInfo) {
      if (combinationRow >= info.startRow && combinationRow < info.startRow + info.height) {
        // This row belongs to this combination
        const tileRow = combinationRow - info.startRow;
        // Calculate tileCol based on column and combination width
        const colorIndex = Math.floor(col / info.width);
        const tileCol = col % info.width;

        return {
          type: 'combination',
          name: info.name,
          colorIndex: colorIndex,
          tileRow: tileRow,
          tileCol: tileCol
        };
      }
    }
  }

  return null; // Invalid coordinates
}

// Convert semantic tile reference back to canvas (row, col)
// Returns: { row: number, col: number } or null if tile not found in current tileset
function tileRefToCoords(tileRef) {
  if (!tileRef || !tileRef.type || !tileRef.name) return null;

  const layout = getTilesetLayout();

  if (tileRef.type === 'shape') {
    const shapeIndex = layout.shapes.indexOf(tileRef.name);
    if (shapeIndex === -1) return null; // Shape not in current tileset
    return {
      row: shapeIndex,
      col: tileRef.colorIndex
    };
  }

  if (tileRef.type === 'pattern') {
    const patternIndex = layout.patterns.indexOf(tileRef.name);
    if (patternIndex === -1) return null; // Pattern not in current tileset
    return {
      row: layout.numShapeRows + patternIndex,
      col: tileRef.colorIndex
    };
  }

  if (tileRef.type === 'combination') {
    // Find the combination info
    const info = layout.combinationRowsInfo.find(i => i.name === tileRef.name);
    if (!info) return null; // Combination not in current tileset

    const row = layout.numShapeRows + layout.numPatternRows + info.startRow + (tileRef.tileRow || 0);
    const col = tileRef.colorIndex * info.width + (tileRef.tileCol || 0);

    return { row, col };
  }

  return null;
}

// Convert old-style {row, col} tile to new semantic reference
// Used for migration and when selecting from palette
function convertToTileRef(oldTile) {
  if (!oldTile) return null;

  // If it's already a semantic reference, return as-is
  if (oldTile.type && oldTile.name) {
    return oldTile;
  }

  // Convert from coordinates
  return coordsToTileRef(oldTile.row, oldTile.col);
}

// Get canvas coordinates for rendering a tile
// Accepts either old-style {row, col} or new semantic reference
function getTileCanvasCoords(tile) {
  if (!tile) return null;

  // If it's a semantic reference, convert to coordinates
  if (tile.type && tile.name) {
    return tileRefToCoords(tile);
  }

  // If it's old-style {row, col}, return as-is (backwards compatibility)
  if (tile.row !== undefined && tile.col !== undefined) {
    return { row: tile.row, col: tile.col };
  }

  return null;
}

// Check if a tile reference is valid in the current tileset
function isTileRefValid(tileRef) {
  return getTileCanvasCoords(tileRef) !== null;
}
