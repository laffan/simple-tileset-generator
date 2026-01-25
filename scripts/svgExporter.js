/* SVG Exporter - Converts pixel tiles to SVG format for download */

// Convert shape path data to SVG path string
function shapePathDataToSVGPath(pathData, tileSize, offsetX, offsetY) {
  if (!pathData) return '';

  // Handle multi-path shapes
  if (pathData.paths && Array.isArray(pathData.paths)) {
    const holeIndices = pathData.holePathIndices || [];
    const pathStrings = [];

    pathData.paths.forEach((singlePath, index) => {
      const isHole = holeIndices.includes(index);
      const d = singlePathToSVGPath(singlePath, tileSize, offsetX, offsetY);
      if (d) {
        pathStrings.push({ d, isHole });
      }
    });

    return pathStrings;
  }

  // Single path shape
  if (pathData.vertices) {
    const d = singlePathToSVGPath(pathData, tileSize, offsetX, offsetY);
    return d ? [{ d, isHole: false }] : [];
  }

  return [];
}

// Convert a single path to SVG path string
function singlePathToSVGPath(singlePath, tileSize, offsetX, offsetY) {
  if (!singlePath || !singlePath.vertices || singlePath.vertices.length === 0) {
    return '';
  }

  const commands = [];
  const vertices = singlePath.vertices;

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const x = (offsetX + v.x * tileSize).toFixed(2);
    const y = (offsetY + v.y * tileSize).toFixed(2);

    if (i === 0) {
      commands.push(`M ${x} ${y}`);
    } else {
      const prevV = vertices[i - 1];
      const hasCtrlOut = prevV.ctrlRight && (prevV.ctrlRight.x !== 0 || prevV.ctrlRight.y !== 0);
      const hasCtrlIn = v.ctrlLeft && (v.ctrlLeft.x !== 0 || v.ctrlLeft.y !== 0);

      if (hasCtrlOut || hasCtrlIn) {
        // Bezier curve
        const prevX = offsetX + prevV.x * tileSize;
        const prevY = offsetY + prevV.y * tileSize;
        const cp1x = hasCtrlOut ? (prevX + prevV.ctrlRight.x * tileSize).toFixed(2) : prevX.toFixed(2);
        const cp1y = hasCtrlOut ? (prevY + prevV.ctrlRight.y * tileSize).toFixed(2) : prevY.toFixed(2);
        const cp2x = hasCtrlIn ? (offsetX + v.x * tileSize + v.ctrlLeft.x * tileSize).toFixed(2) : x;
        const cp2y = hasCtrlIn ? (offsetY + v.y * tileSize + v.ctrlLeft.y * tileSize).toFixed(2) : y;
        commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`);
      } else {
        commands.push(`L ${x} ${y}`);
      }
    }
  }

  // Handle closing segment with potential curve
  if (singlePath.closed !== false && vertices.length > 1) {
    const lastV = vertices[vertices.length - 1];
    const firstV = vertices[0];
    const hasCtrlOut = lastV.ctrlRight && (lastV.ctrlRight.x !== 0 || lastV.ctrlRight.y !== 0);
    const hasCtrlIn = firstV.ctrlLeft && (firstV.ctrlLeft.x !== 0 || firstV.ctrlLeft.y !== 0);

    if (hasCtrlOut || hasCtrlIn) {
      const lastX = offsetX + lastV.x * tileSize;
      const lastY = offsetY + lastV.y * tileSize;
      const firstX = (offsetX + firstV.x * tileSize).toFixed(2);
      const firstY = (offsetY + firstV.y * tileSize).toFixed(2);
      const cp1x = hasCtrlOut ? (lastX + lastV.ctrlRight.x * tileSize).toFixed(2) : lastX.toFixed(2);
      const cp1y = hasCtrlOut ? (lastY + lastV.ctrlRight.y * tileSize).toFixed(2) : lastY.toFixed(2);
      const cp2x = hasCtrlIn ? (offsetX + firstV.x * tileSize + firstV.ctrlLeft.x * tileSize).toFixed(2) : firstX;
      const cp2y = hasCtrlIn ? (offsetY + firstV.y * tileSize + firstV.ctrlLeft.y * tileSize).toFixed(2) : firstY;
      commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${firstX} ${firstY}`);
    }
    commands.push('Z');
  }

  return commands.join(' ');
}

// Convert pattern pixel data to SVG rect elements
function patternPixelsToSVGRects(pixelData, tileSize, offsetX, offsetY, color) {
  if (!pixelData || !pixelData.pixels) return [];

  const rects = [];
  const patternSize = pixelData.size || pixelData.pixels.length;
  const pixelSize = tileSize / patternSize;

  for (let row = 0; row < patternSize; row++) {
    for (let col = 0; col < patternSize; col++) {
      if (pixelData.pixels[row] && pixelData.pixels[row][col] === 1) {
        const x = (offsetX + col * pixelSize).toFixed(2);
        const y = (offsetY + row * pixelSize).toFixed(2);
        const w = pixelSize.toFixed(2);
        const h = pixelSize.toFixed(2);
        rects.push(`    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" />`);
      }
    }
  }

  return rects;
}

// Generate SVG for a single shape tile
function generateShapeSVGElements(shapeName, tileSize, offsetX, offsetY, color) {
  const pathData = getShapePathData(shapeName);
  const svgPaths = shapePathDataToSVGPath(pathData, tileSize, offsetX, offsetY);

  if (!svgPaths || svgPaths.length === 0) return [];

  const elements = [];
  const holeIndices = pathData.holePathIndices || [];

  // If there are holes, we need to use a mask
  if (holeIndices.length > 0) {
    const maskId = `mask-${shapeName}-${offsetX}-${offsetY}`.replace(/[^a-zA-Z0-9-]/g, '_');

    // Create mask definition
    let maskContent = `    <mask id="${maskId}">\n`;
    maskContent += `      <rect x="${offsetX}" y="${offsetY}" width="${tileSize}" height="${tileSize}" fill="white" />\n`;

    // Add holes to mask (black areas will be cut out)
    svgPaths.forEach((pathInfo) => {
      if (pathInfo.isHole) {
        maskContent += `      <path d="${pathInfo.d}" fill="black" />\n`;
      }
    });
    maskContent += `    </mask>`;
    elements.push({ type: 'mask', content: maskContent, maskId });

    // Draw non-hole paths with mask applied
    svgPaths.forEach((pathInfo) => {
      if (!pathInfo.isHole) {
        elements.push({
          type: 'path',
          content: `    <path d="${pathInfo.d}" fill="${color}" mask="url(#${maskId})" />`
        });
      }
    });
  } else {
    // No holes - simple paths
    svgPaths.forEach((pathInfo) => {
      elements.push({
        type: 'path',
        content: `    <path d="${pathInfo.d}" fill="${color}" />`
      });
    });
  }

  return elements;
}

// Generate SVG for a single pattern tile
function generatePatternSVGElements(patternName, tileSize, offsetX, offsetY, color) {
  const pixelData = getPatternPixelData(patternName);
  const rects = patternPixelsToSVGRects(pixelData, tileSize, offsetX, offsetY, color);
  return rects.map(r => ({ type: 'rect', content: r }));
}

// Convert combination path data to SVG path string
// Combination paths use -0.5 to 0.5 coordinate system (centered)
function combinationPathToSVGPath(pathData, width, height, offsetX, offsetY) {
  if (!pathData || pathData.length === 0) return '';

  const commands = [];

  for (let i = 0; i < pathData.length; i++) {
    const point = pathData[i];

    // Handle both array format [x, y] and object format {x, y, ctrlLeft, ctrlRight}
    let x, y, ctrlLeft, ctrlRight;
    if (Array.isArray(point)) {
      x = point[0];
      y = point[1];
    } else {
      x = point.x;
      y = point.y;
      ctrlLeft = point.ctrlLeft;
      ctrlRight = point.ctrlRight;
    }

    // Convert from -0.5..0.5 to pixel coordinates
    const px = (offsetX + (x + 0.5) * width).toFixed(2);
    const py = (offsetY + (y + 0.5) * height).toFixed(2);

    if (i === 0) {
      commands.push(`M ${px} ${py}`);
    } else {
      const prevPoint = pathData[i - 1];
      let prevX, prevY, prevCtrlRight;
      if (Array.isArray(prevPoint)) {
        prevX = prevPoint[0];
        prevY = prevPoint[1];
      } else {
        prevX = prevPoint.x;
        prevY = prevPoint.y;
        prevCtrlRight = prevPoint.ctrlRight;
      }

      const hasCtrlOut = prevCtrlRight && (prevCtrlRight.x !== 0 || prevCtrlRight.y !== 0);
      const hasCtrlIn = ctrlLeft && (ctrlLeft.x !== 0 || ctrlLeft.y !== 0);

      if (hasCtrlOut || hasCtrlIn) {
        const prevPx = offsetX + (prevX + 0.5) * width;
        const prevPy = offsetY + (prevY + 0.5) * height;
        const cp1x = hasCtrlOut ? (prevPx + prevCtrlRight.x * width).toFixed(2) : prevPx.toFixed(2);
        const cp1y = hasCtrlOut ? (prevPy + prevCtrlRight.y * height).toFixed(2) : prevPy.toFixed(2);
        const cp2x = hasCtrlIn ? (offsetX + (x + 0.5) * width + ctrlLeft.x * width).toFixed(2) : px;
        const cp2y = hasCtrlIn ? (offsetY + (y + 0.5) * height + ctrlLeft.y * height).toFixed(2) : py;
        commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${px} ${py}`);
      } else {
        commands.push(`L ${px} ${py}`);
      }
    }
  }

  // Close path - handle potential curve from last to first point
  if (pathData.length > 2) {
    const lastPoint = pathData[pathData.length - 1];
    const firstPoint = pathData[0];

    let lastX, lastY, lastCtrlRight;
    let firstX, firstY, firstCtrlLeft;

    if (Array.isArray(lastPoint)) {
      lastX = lastPoint[0];
      lastY = lastPoint[1];
    } else {
      lastX = lastPoint.x;
      lastY = lastPoint.y;
      lastCtrlRight = lastPoint.ctrlRight;
    }

    if (Array.isArray(firstPoint)) {
      firstX = firstPoint[0];
      firstY = firstPoint[1];
    } else {
      firstX = firstPoint.x;
      firstY = firstPoint.y;
      firstCtrlLeft = firstPoint.ctrlLeft;
    }

    const hasCtrlOut = lastCtrlRight && (lastCtrlRight.x !== 0 || lastCtrlRight.y !== 0);
    const hasCtrlIn = firstCtrlLeft && (firstCtrlLeft.x !== 0 || firstCtrlLeft.y !== 0);

    if (hasCtrlOut || hasCtrlIn) {
      const lastPx = offsetX + (lastX + 0.5) * width;
      const lastPy = offsetY + (lastY + 0.5) * height;
      const firstPx = (offsetX + (firstX + 0.5) * width).toFixed(2);
      const firstPy = (offsetY + (firstY + 0.5) * height).toFixed(2);
      const cp1x = hasCtrlOut ? (lastPx + lastCtrlRight.x * width).toFixed(2) : lastPx.toFixed(2);
      const cp1y = hasCtrlOut ? (lastPy + lastCtrlRight.y * height).toFixed(2) : lastPy.toFixed(2);
      const cp2x = hasCtrlIn ? (offsetX + (firstX + 0.5) * width + firstCtrlLeft.x * width).toFixed(2) : firstPx;
      const cp2y = hasCtrlIn ? (offsetY + (firstY + 0.5) * height + firstCtrlLeft.y * height).toFixed(2) : firstPy;
      commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${firstPx} ${firstPy}`);
    }
  }

  commands.push('Z');
  return commands.join(' ');
}

// Generate SVG for a combination tile
function generateCombinationSVGElements(combinationData, tileSize, offsetX, offsetY, color) {
  const elements = [];

  if (!combinationData || !combinationData.shapeData) return elements;

  const dims = getCombinationDimensions(combinationData);
  const totalWidth = dims.width * tileSize;
  const totalHeight = dims.height * tileSize;

  // Get the shape data
  const shapeData = combinationData.shapeData;
  const pathPatterns = combinationData.pathPatterns || {};
  const holeIndices = shapeData.holePathIndices || [];

  // Determine paths array - shapeData can be:
  // 1. An array of coordinate pairs (simple path)
  // 2. An object with .paths array (multi-path)
  let pathsArray;
  if (Array.isArray(shapeData)) {
    pathsArray = [shapeData];
  } else if (shapeData.paths) {
    pathsArray = shapeData.paths;
  } else {
    pathsArray = [shapeData];
  }

  // Process each path
  pathsArray.forEach((pathData, pathIndex) => {
    if (!pathData || pathData.length === 0) return;

    const isHole = holeIndices.includes(pathIndex);
    const pathPattern = pathPatterns[pathIndex];

    if (pathPattern && pathPattern.patternName && !isHole) {
      // This path uses a pattern - need to create a clip path
      const clipId = `clip-comb-${offsetX}-${offsetY}-${pathIndex}`.replace(/[^a-zA-Z0-9-]/g, '_');
      const pathD = combinationPathToSVGPath(pathData, totalWidth, totalHeight, offsetX, offsetY);

      if (pathD) {
        // Create clip path
        elements.push({
          type: 'clipPath',
          content: `    <clipPath id="${clipId}">\n      <path d="${pathD}" />\n    </clipPath>`
        });

        // Get pattern data
        const patternPixelData = getPatternPixelData(pathPattern.patternName);

        // Get pattern pixels - apply invert if needed
        let finalPixelData = patternPixelData;
        if (pathPattern.patternInvert) {
          finalPixelData = invertPatternPixels(patternPixelData);
        }

        // Create group with clip path
        let groupContent = `    <g clip-path="url(#${clipId})">\n`;

        // Fill the combination area with pattern, tiled per tile
        const tilesNeededX = dims.width;
        const tilesNeededY = dims.height;
        const patternGridSize = finalPixelData.size || 8;
        const scaledPixelSize = tileSize / patternGridSize;

        for (let ty = 0; ty < tilesNeededY; ty++) {
          for (let tx = 0; tx < tilesNeededX; tx++) {
            const tileX = offsetX + tx * tileSize;
            const tileY = offsetY + ty * tileSize;

            for (let row = 0; row < patternGridSize; row++) {
              for (let col = 0; col < patternGridSize; col++) {
                if (finalPixelData.pixels[row] && finalPixelData.pixels[row][col] === 1) {
                  const rx = (tileX + col * scaledPixelSize).toFixed(2);
                  const ry = (tileY + row * scaledPixelSize).toFixed(2);
                  const rw = scaledPixelSize.toFixed(2);
                  const rh = scaledPixelSize.toFixed(2);
                  groupContent += `      <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${color}" />\n`;
                }
              }
            }
          }
        }

        groupContent += `    </g>`;
        elements.push({ type: 'group', content: groupContent });
      }
    } else if (!isHole) {
      // Solid fill path (non-hole)
      const pathD = combinationPathToSVGPath(pathData, totalWidth, totalHeight, offsetX, offsetY);
      if (pathD) {
        elements.push({
          type: 'path',
          content: `    <path d="${pathD}" fill="${color}" />`
        });
      }
    }
  });

  // Handle holes using SVG mask
  if (holeIndices.length > 0) {
    const maskId = `mask-comb-${offsetX}-${offsetY}`.replace(/[^a-zA-Z0-9-]/g, '_');

    let maskContent = `    <mask id="${maskId}">\n`;
    maskContent += `      <rect x="${offsetX}" y="${offsetY}" width="${totalWidth}" height="${totalHeight}" fill="white" />\n`;

    holeIndices.forEach(holeIndex => {
      const pathData = pathsArray[holeIndex];
      if (pathData && pathData.length > 0) {
        const pathD = combinationPathToSVGPath(pathData, totalWidth, totalHeight, offsetX, offsetY);
        maskContent += `      <path d="${pathD}" fill="black" />\n`;
      }
    });

    maskContent += `    </mask>`;

    // We need to wrap the non-hole elements with the mask
    // This is complex in SVG, so for now we add the mask as a def
    elements.unshift({ type: 'mask', content: maskContent, maskId });
  }

  return elements;
}

// Generate complete tileset SVG
function generateTilesetSVG() {
  const colorInput = document.getElementById('colorInput').value;
  const colors = colorInput.split(',').map(c => c.trim()).filter(c => c);
  const tileSize = parseInt(document.getElementById('sizeInput').value, 10) || 64;

  const selectedShapes = getSelectedShapes();
  const selectedPatterns = getSelectedPatterns();
  const selectedCombinations = typeof getSelectedCombinations === 'function' ? getSelectedCombinations() : [];

  // Calculate dimensions (same logic as canvas.js)
  const numShapeRows = selectedShapes.length;
  const numPatternRows = selectedPatterns.length;

  let combinationRowsInfo = [];
  let totalCombinationRows = 0;
  selectedCombinations.forEach((combinationName) => {
    const combinationData = getCombinationData(combinationName);
    if (combinationData) {
      const dims = getCombinationDimensions(combinationData);
      combinationRowsInfo.push({
        name: combinationName,
        data: combinationData,
        width: dims.width,
        height: dims.height,
        startRow: totalCombinationRows
      });
      totalCombinationRows += dims.height;
    }
  });

  const totalRows = numShapeRows + numPatternRows + totalCombinationRows;

  let maxWidth = colors.length;
  combinationRowsInfo.forEach(info => {
    const neededWidth = colors.length * info.width;
    if (neededWidth > maxWidth) {
      maxWidth = neededWidth;
    }
  });

  const svgWidth = maxWidth * tileSize;
  const svgHeight = totalRows * tileSize;

  // Build SVG content
  const defs = [];
  const content = [];

  // Generate shape tiles
  selectedShapes.forEach((shapeName, shapeIndex) => {
    colors.forEach((color, colorIndex) => {
      const x = colorIndex * tileSize;
      const y = shapeIndex * tileSize;
      const hexColor = '#' + color;
      const elements = generateShapeSVGElements(shapeName, tileSize, x, y, hexColor);

      elements.forEach(el => {
        if (el.type === 'mask' || el.type === 'clipPath') {
          defs.push(el.content);
        } else {
          content.push(el.content);
        }
      });
    });
  });

  // Generate pattern tiles
  selectedPatterns.forEach((patternName, patternIndex) => {
    colors.forEach((color, colorIndex) => {
      const x = colorIndex * tileSize;
      const y = (numShapeRows + patternIndex) * tileSize;
      const hexColor = '#' + color;
      const elements = generatePatternSVGElements(patternName, tileSize, x, y, hexColor);

      elements.forEach(el => {
        content.push(el.content);
      });
    });
  });

  // Generate combination tiles
  combinationRowsInfo.forEach((info) => {
    colors.forEach((color, colorIndex) => {
      const x = colorIndex * info.width * tileSize;
      const y = (numShapeRows + numPatternRows + info.startRow) * tileSize;
      const hexColor = '#' + color;
      const elements = generateCombinationSVGElements(info.data, tileSize, x, y, hexColor);

      elements.forEach(el => {
        if (el.type === 'clipPath') {
          defs.push(el.content);
        } else {
          content.push(el.content);
        }
      });
    });
  });

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

  return svg;
}

// Generate tilemap SVG from tile tester (sparse format)
function generateTilemapSVG() {
  const tileSize = TileTesterState.tileSize;
  const backgroundColor = TileTesterState.backgroundColor;

  // Get bounds of all tiles to determine export size
  const bounds = getTileBounds();

  // If no tiles, export the current visible grid
  let svgWidth, svgHeight, offsetX, offsetY;
  if (!bounds.hasTiles) {
    svgWidth = TileTesterState.gridWidth * tileSize;
    svgHeight = TileTesterState.gridHeight * tileSize;
    offsetX = 0;
    offsetY = 0;
  } else {
    // Calculate export dimensions based on tile bounds
    const tileWidth = bounds.maxX - bounds.minX + 1;
    const tileHeight = bounds.maxY - bounds.minY + 1;
    svgWidth = tileWidth * tileSize;
    svgHeight = tileHeight * tileSize;
    offsetX = bounds.minX;
    offsetY = bounds.minY;
  }

  const defs = [];
  const content = [];

  // Add background
  content.push(`  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}" />`);

  // Process each visible layer (sparse format)
  for (const layer of TileTesterState.layers) {
    if (!layer.visible) continue;
    if (!layer.tiles || !Array.isArray(layer.tiles)) continue;

    const opacity = layer.opacity;
    const layerContent = [];

    for (const entry of layer.tiles) {
      const tile = entry.tile;
      const tileX = entry.x;
      const tileY = entry.y;

      // Get the tile's canvas coordinates
      const coords = getTileCanvasCoords(tile);
      if (!coords) continue;

      // Calculate position relative to export bounds
      const destX = (tileX - offsetX) * tileSize;
      const destY = (tileY - offsetY) * tileSize;

      // Determine what type of tile this is and generate appropriate SVG
      const tileElements = generateTileSVGFromCoords(coords, tileSize, destX, destY);

      tileElements.forEach(el => {
        if (el.type === 'mask' || el.type === 'clipPath') {
          defs.push(el.content);
        } else {
          layerContent.push(el.content);
        }
      });
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

  return svg;
}

// Generate SVG elements for a tile based on its canvas coordinates
function generateTileSVGFromCoords(coords, tileSize, destX, destY) {
  const { row, col } = coords;

  // Get current tileset structure to determine what's at this position
  const colorInput = document.getElementById('colorInput').value;
  const colors = colorInput.split(',').map(c => c.trim()).filter(c => c);

  const selectedShapes = getSelectedShapes();
  const selectedPatterns = getSelectedPatterns();
  const selectedCombinations = typeof getSelectedCombinations === 'function' ? getSelectedCombinations() : [];

  const numShapeRows = selectedShapes.length;
  const numPatternRows = selectedPatterns.length;

  // Determine which color column this is
  const colorIndex = col % colors.length;
  const hexColor = '#' + colors[colorIndex];

  // Determine if it's a shape, pattern, or combination row
  if (row < numShapeRows) {
    // Shape tile
    const shapeName = selectedShapes[row];
    return generateShapeSVGElements(shapeName, tileSize, destX, destY, hexColor);
  } else if (row < numShapeRows + numPatternRows) {
    // Pattern tile
    const patternIndex = row - numShapeRows;
    const patternName = selectedPatterns[patternIndex];
    return generatePatternSVGElements(patternName, tileSize, destX, destY, hexColor);
  } else {
    // Combination tile - more complex as combinations span multiple rows/cols
    // Need to find which combination and which sub-tile
    let combinationRowStart = numShapeRows + numPatternRows;

    for (const combinationName of selectedCombinations) {
      const combinationData = getCombinationData(combinationName);
      if (!combinationData) continue;

      const dims = getCombinationDimensions(combinationData);

      if (row >= combinationRowStart && row < combinationRowStart + dims.height) {
        // This row is part of this combination
        const localRow = row - combinationRowStart;
        const localCol = col % dims.width;

        // For combinations, we need to render the portion of the combination
        // that corresponds to this tile position
        return generateCombinationTileSVG(combinationData, tileSize, destX, destY, hexColor, localCol, localRow);
      }

      combinationRowStart += dims.height;
    }
  }

  return [];
}

// Generate SVG for a single tile portion of a combination
function generateCombinationTileSVG(combinationData, tileSize, destX, destY, color, localCol, localRow) {
  const elements = [];

  if (!combinationData || !combinationData.shapeData) return elements;

  const dims = getCombinationDimensions(combinationData);
  const totalWidth = dims.width;
  const totalHeight = dims.height;

  // Create a clip path for the tile bounds
  const clipId = `tile-clip-${destX}-${destY}`.replace(/[^a-zA-Z0-9-]/g, '_');
  elements.push({
    type: 'clipPath',
    content: `    <clipPath id="${clipId}">\n      <rect x="${destX}" y="${destY}" width="${tileSize}" height="${tileSize}" />\n    </clipPath>`
  });

  // The shape data is normalized to the full combination size
  // We need to offset by -localCol*tileSize, -localRow*tileSize and clip
  const shapeData = combinationData.shapeData;
  const pathPatterns = combinationData.pathPatterns || {};
  const holeIndices = shapeData.holePathIndices || [];

  // Determine paths array - shapeData can be:
  // 1. An array of coordinate pairs (simple path)
  // 2. An object with .paths array (multi-path)
  let pathsArray;
  if (Array.isArray(shapeData)) {
    pathsArray = [shapeData];
  } else if (shapeData.paths) {
    pathsArray = shapeData.paths;
  } else {
    pathsArray = [shapeData];
  }

  // Calculate the offset to position the full shape such that our tile portion shows correctly
  const fullWidth = totalWidth * tileSize;
  const fullHeight = totalHeight * tileSize;
  const shapeOffsetX = destX - localCol * tileSize;
  const shapeOffsetY = destY - localRow * tileSize;

  let groupContent = `    <g clip-path="url(#${clipId})">\n`;

  pathsArray.forEach((pathData, pathIndex) => {
    if (!pathData || pathData.length === 0) return;

    const isHole = holeIndices.includes(pathIndex);
    if (isHole) return; // Skip holes for now (handled separately)

    const pathPattern = pathPatterns[pathIndex];

    if (pathPattern && pathPattern.patternName) {
      // Patterned path - use combination coordinate system
      const pathD = combinationPathToSVGPath(pathData, fullWidth, fullHeight, shapeOffsetX, shapeOffsetY);
      if (pathD) {
        const innerClipId = `inner-clip-${destX}-${destY}-${pathIndex}`.replace(/[^a-zA-Z0-9-]/g, '_');

        // Add inner clip for the shape path
        elements.push({
          type: 'clipPath',
          content: `    <clipPath id="${innerClipId}">\n      <path d="${pathD}" />\n    </clipPath>`
        });

        // Get pattern data
        const patternPixelData = getPatternPixelData(pathPattern.patternName);
        let finalPixelData = patternPixelData;
        if (pathPattern.patternInvert) {
          finalPixelData = invertPatternPixels(patternPixelData);
        }

        // Draw pattern within the clipped area
        groupContent += `      <g clip-path="url(#${innerClipId})">\n`;

        // Fill the visible tile area with pattern
        const patternGridSize = finalPixelData.size || 8;
        const pixelSize = tileSize / patternGridSize;

        // Extend pattern slightly beyond tile to handle fractional positioning
        for (let py = -1; py <= Math.ceil(fullHeight / tileSize); py++) {
          for (let px = -1; px <= Math.ceil(fullWidth / tileSize); px++) {
            const patternX = shapeOffsetX + px * tileSize;
            const patternY = shapeOffsetY + py * tileSize;

            for (let row = 0; row < patternGridSize; row++) {
              for (let col = 0; col < patternGridSize; col++) {
                if (finalPixelData.pixels[row] && finalPixelData.pixels[row][col] === 1) {
                  const rx = (patternX + col * pixelSize).toFixed(2);
                  const ry = (patternY + row * pixelSize).toFixed(2);
                  const rw = pixelSize.toFixed(2);
                  const rh = pixelSize.toFixed(2);
                  groupContent += `        <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${color}" />\n`;
                }
              }
            }
          }
        }

        groupContent += `      </g>\n`;
      }
    } else {
      // Solid fill path - use combination coordinate system
      const pathD = combinationPathToSVGPath(pathData, fullWidth, fullHeight, shapeOffsetX, shapeOffsetY);
      if (pathD) {
        groupContent += `      <path d="${pathD}" fill="${color}" />\n`;
      }
    }
  });

  groupContent += `    </g>`;
  elements.push({ type: 'group', content: groupContent });

  return elements;
}

// Download SVG content as file
function downloadSVG(svgContent, filename) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Download main tileset as SVG
function downloadTilesetSVG() {
  const svg = generateTilesetSVG();
  downloadSVG(svg, 'tileset.svg');
}

// Download tile tester tilemap as SVG
function downloadTilemapSVG() {
  const svg = generateTilemapSVG();
  downloadSVG(svg, 'tilemap.svg');
}
