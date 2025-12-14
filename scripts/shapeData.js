/* Shape path data helpers - shape data is now in individual files in shapes/ directory */
/* The shapePathData and BEZIER_CIRCLE constant are defined in shapes/registry.js */

// Helper function to get shape data, with fallback to square
function getShapePathData(shapeName) {
  return shapePathData[shapeName] || shapePathData.square;
}

// Check if a shape name is a custom shape
function isCustomShape(shapeName) {
  return shapeName && shapeName.startsWith('custom_');
}

// Generate a unique ID for a custom shape
function generateCustomShapeId() {
  return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Dedicated storage for custom shapes (separate from built-in shapes)
const customShapeRegistry = {};

// Register a custom shape with its path data
function registerCustomShape(shapeId, pathData) {
  // Store in dedicated custom shape registry
  customShapeRegistry[shapeId] = pathData;
  // Also add to main shape path data for editor access
  shapePathData[shapeId] = pathData;
  // Register a renderer for this custom shape
  shapeRenderers[shapeId] = function(x, y, size, ctx) {
    drawShapeFromPath(x, y, size, ctx, pathData);
  };
}

// Draw a single path (helper function)
function drawSinglePath(x, y, size, ctx, singlePath) {
  if (!singlePath || !singlePath.vertices || singlePath.vertices.length === 0) {
    return;
  }

  ctx.beginPath();

  const vertices = singlePath.vertices;

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const px = x + v.x * size;
    const py = y + v.y * size;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      const prevV = vertices[i - 1];

      // Check if this segment uses bezier curves
      const hasCtrlOut = prevV.ctrlRight && (prevV.ctrlRight.x !== 0 || prevV.ctrlRight.y !== 0);
      const hasCtrlIn = v.ctrlLeft && (v.ctrlLeft.x !== 0 || v.ctrlLeft.y !== 0);

      if (hasCtrlOut || hasCtrlIn) {
        // Bezier curve
        const prevPx = x + prevV.x * size;
        const prevPy = y + prevV.y * size;

        // Control point 1 (from previous vertex's right control)
        const cp1x = hasCtrlOut ? prevPx + prevV.ctrlRight.x * size : prevPx;
        const cp1y = hasCtrlOut ? prevPy + prevV.ctrlRight.y * size : prevPy;

        // Control point 2 (from current vertex's left control)
        const cp2x = hasCtrlIn ? px + v.ctrlLeft.x * size : px;
        const cp2y = hasCtrlIn ? py + v.ctrlLeft.y * size : py;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px, py);
      } else {
        // Straight line
        ctx.lineTo(px, py);
      }
    }
  }

  // Close the path if needed (handle curve from last to first vertex)
  if (singlePath.closed !== false) {
    const lastV = vertices[vertices.length - 1];
    const firstV = vertices[0];

    const hasCtrlOut = lastV.ctrlRight && (lastV.ctrlRight.x !== 0 || lastV.ctrlRight.y !== 0);
    const hasCtrlIn = firstV.ctrlLeft && (firstV.ctrlLeft.x !== 0 || firstV.ctrlLeft.y !== 0);

    if (hasCtrlOut || hasCtrlIn) {
      const lastPx = x + lastV.x * size;
      const lastPy = y + lastV.y * size;
      const firstPx = x + firstV.x * size;
      const firstPy = y + firstV.y * size;

      const cp1x = hasCtrlOut ? lastPx + lastV.ctrlRight.x * size : lastPx;
      const cp1y = hasCtrlOut ? lastPy + lastV.ctrlRight.y * size : lastPy;
      const cp2x = hasCtrlIn ? firstPx + firstV.ctrlLeft.x * size : firstPx;
      const cp2y = hasCtrlIn ? firstPy + firstV.ctrlLeft.y * size : firstPy;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, firstPx, firstPy);
    }

    ctx.closePath();
  }

  ctx.fill();
}

// Draw a single path without filling (for compound paths)
function traceSinglePath(x, y, size, ctx, singlePath) {
  if (!singlePath || !singlePath.vertices || singlePath.vertices.length === 0) {
    return;
  }

  const vertices = singlePath.vertices;

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const px = x + v.x * size;
    const py = y + v.y * size;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      const prevV = vertices[i - 1];
      const hasCtrlOut = prevV.ctrlRight && (prevV.ctrlRight.x !== 0 || prevV.ctrlRight.y !== 0);
      const hasCtrlIn = v.ctrlLeft && (v.ctrlLeft.x !== 0 || v.ctrlLeft.y !== 0);

      if (hasCtrlOut || hasCtrlIn) {
        const prevPx = x + prevV.x * size;
        const prevPy = y + prevV.y * size;
        const cp1x = hasCtrlOut ? prevPx + prevV.ctrlRight.x * size : prevPx;
        const cp1y = hasCtrlOut ? prevPy + prevV.ctrlRight.y * size : prevPy;
        const cp2x = hasCtrlIn ? px + v.ctrlLeft.x * size : px;
        const cp2y = hasCtrlIn ? py + v.ctrlLeft.y * size : py;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
  }

  // Close the path if needed
  if (singlePath.closed !== false) {
    const lastV = vertices[vertices.length - 1];
    const firstV = vertices[0];
    const hasCtrlOut = lastV.ctrlRight && (lastV.ctrlRight.x !== 0 || lastV.ctrlRight.y !== 0);
    const hasCtrlIn = firstV.ctrlLeft && (firstV.ctrlLeft.x !== 0 || firstV.ctrlLeft.y !== 0);

    if (hasCtrlOut || hasCtrlIn) {
      const lastPx = x + lastV.x * size;
      const lastPy = y + lastV.y * size;
      const firstPx = x + firstV.x * size;
      const firstPy = y + firstV.y * size;
      const cp1x = hasCtrlOut ? lastPx + lastV.ctrlRight.x * size : lastPx;
      const cp1y = hasCtrlOut ? lastPy + lastV.ctrlRight.y * size : lastPy;
      const cp2x = hasCtrlIn ? firstPx + firstV.ctrlLeft.x * size : firstPx;
      const cp2y = hasCtrlIn ? firstPy + firstV.ctrlLeft.y * size : firstPy;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, firstPx, firstPy);
    }
    ctx.closePath();
  }
}

// Draw a shape from path data using Canvas 2D API
// Supports both single-path shapes (vertices array) and multi-path shapes (paths array)
// Supports holePathIndices for eraser-style holes using destination-out compositing
function drawShapeFromPath(x, y, size, ctx, pathData) {
  if (!pathData) return;

  // Check if this is a multi-path shape
  if (pathData.paths && Array.isArray(pathData.paths)) {
    const holeIndices = pathData.holePathIndices || [];

    // If using legacy evenodd without explicit holePathIndices, fall back to old behavior
    if (pathData.fillRule === 'evenodd' && holeIndices.length === 0) {
      ctx.beginPath();
      pathData.paths.forEach(singlePath => {
        traceSinglePath(x, y, size, ctx, singlePath);
      });
      ctx.fill('evenodd');
      return;
    }

    // New approach: draw non-holes first, then erase with holes
    // First pass: draw all non-hole paths
    pathData.paths.forEach((singlePath, index) => {
      if (!holeIndices.includes(index)) {
        drawSinglePath(x, y, size, ctx, singlePath);
      }
    });

    // Second pass: draw hole paths with destination-out to erase
    if (holeIndices.length > 0) {
      const savedComposite = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'destination-out';

      holeIndices.forEach(holeIndex => {
        if (pathData.paths[holeIndex]) {
          drawSinglePath(x, y, size, ctx, pathData.paths[holeIndex]);
        }
      });

      ctx.globalCompositeOperation = savedComposite;
    }
  } else if (pathData.vertices) {
    // Single path shape (backward compatible)
    drawSinglePath(x, y, size, ctx, pathData);
  }
}

// Get all custom shape data for session saving
function getCustomShapeData() {
  // Return a deep copy of the custom shape registry
  const customData = {};
  for (const key in customShapeRegistry) {
    if (customShapeRegistry.hasOwnProperty(key)) {
      // Deep copy the path data to ensure it's serializable
      customData[key] = JSON.parse(JSON.stringify(customShapeRegistry[key]));
    }
  }
  return customData;
}

// Load custom shape data from session
function loadCustomShapeData(customData) {
  if (!customData) return;
  for (const key in customData) {
    if (customData.hasOwnProperty(key)) {
      registerCustomShape(key, customData[key]);
    }
  }
}
