/* Shape path data for editor - coordinates normalized to 0-1 range */

const shapePathData = {};

// Square - simple 4 corner shape
shapePathData.square = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};

// Triangle - pointing up
shapePathData.triangle = {
  vertices: [
    { x: 0.5, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};

// Diamond
shapePathData.diamond = {
  vertices: [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 0, y: 0.5 }
  ],
  closed: true
};

// Circle - approximated with bezier curves (4 points)
// Using the standard bezier circle approximation constant: 0.552284749831
const BEZIER_CIRCLE = 0.552284749831;
shapePathData.circle = {
  vertices: [
    { x: 0.5, y: 0, ctrlLeft: { x: -BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 1, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.5 } },
    { x: 0.5, y: 1, ctrlLeft: { x: BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 0, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.5 } }
  ],
  closed: true
};

// Top Triangle
shapePathData.topTriangle = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0.5, y: 0.5 }
  ],
  closed: true
};

// Bottom Triangle
shapePathData.bottomTriangle = {
  vertices: [
    { x: 0.5, y: 0.5 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};

// Left Triangle
shapePathData.leftTriangle = {
  vertices: [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 0, y: 1 }
  ],
  closed: true
};

// Right Triangle
shapePathData.rightTriangle = {
  vertices: [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0.5, y: 0.5 }
  ],
  closed: true
};

// Angle Top Left (right triangle in corner)
shapePathData.angleTopLeft = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ],
  closed: true
};

// Angle Top Right
shapePathData.angleTopRight = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 }
  ],
  closed: true
};

// Angle Bottom Left
shapePathData.angleBottomLeft = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};

// Angle Bottom Right
shapePathData.angleBottomRight = {
  vertices: [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};

// Half Circle Bottom
shapePathData.halfCircleBottom = {
  vertices: [
    { x: 0, y: 0.5 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: 0 } },
    { x: 0.5, y: 0, ctrlLeft: { x: BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 0, y: 0.5, ctrlLeft: { x: 0, y: 0 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.5 } }
  ],
  closed: true
};

// Half Circle Top
shapePathData.halfCircleTop = {
  vertices: [
    { x: 0, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: 0 } },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 0.5, ctrlLeft: { x: 0, y: 0 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.5 } },
    { x: 0.5, y: 1, ctrlLeft: { x: BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.5, y: 0 } }
  ],
  closed: true
};

// Half Circle Left
shapePathData.halfCircleLeft = {
  vertices: [
    { x: 0.5, y: 0, ctrlLeft: { x: 0, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 0, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.5 } },
    { x: 0.5, y: 1, ctrlLeft: { x: -BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: 0, y: 0 } },
    { x: 1, y: 1 },
    { x: 1, y: 0 }
  ],
  closed: true
};

// Half Circle Right
shapePathData.halfCircleRight = {
  vertices: [
    { x: 0.5, y: 0, ctrlLeft: { x: 0, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0.5, y: 1, ctrlLeft: { x: 0, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 1, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.5 } }
  ],
  closed: true
};

// Quarter Circle Top Left
shapePathData.quarterCircleTopLeft = {
  vertices: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: 0, ctrlLeft: { x: BEZIER_CIRCLE, y: 0 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE } }
  ],
  closed: true
};

// Quarter Circle Top Right
shapePathData.quarterCircleTopRight = {
  vertices: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0, ctrlLeft: { x: 0, y: BEZIER_CIRCLE }, ctrlRight: { x: -BEZIER_CIRCLE, y: 0 } }
  ],
  closed: true
};

// Quarter Circle Bottom Left
shapePathData.quarterCircleBottomLeft = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1, ctrlLeft: { x: BEZIER_CIRCLE, y: 0 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE } }
  ],
  closed: true
};

// Quarter Circle Bottom Right
shapePathData.quarterCircleBottomRight = {
  vertices: [
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1, ctrlLeft: { x: -BEZIER_CIRCLE, y: 0 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE } }
  ],
  closed: true
};

// Small Circle (centered, smaller)
shapePathData.smallCircle = {
  vertices: [
    { x: 0.5, y: 0.25, ctrlLeft: { x: -BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.25, y: 0 } },
    { x: 0.75, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.25 } },
    { x: 0.5, y: 0.75, ctrlLeft: { x: BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.25, y: 0 } },
    { x: 0.25, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.25 } }
  ],
  closed: true
};

// Donut (outer circle only - inner would need separate path)
shapePathData.donut = {
  vertices: [
    { x: 0.5, y: 0.1, ctrlLeft: { x: -BEZIER_CIRCLE * 0.4, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.4, y: 0 } },
    { x: 0.9, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.4 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.4 } },
    { x: 0.5, y: 0.9, ctrlLeft: { x: BEZIER_CIRCLE * 0.4, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.4, y: 0 } },
    { x: 0.1, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.4 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.4 } }
  ],
  closed: true
};

// Line Up (vertical line)
shapePathData.lineUp = {
  vertices: [
    { x: 0.4, y: 0 },
    { x: 0.6, y: 0 },
    { x: 0.6, y: 1 },
    { x: 0.4, y: 1 }
  ],
  closed: true
};

// Line Across (horizontal line)
shapePathData.lineAcross = {
  vertices: [
    { x: 0, y: 0.4 },
    { x: 1, y: 0.4 },
    { x: 1, y: 0.6 },
    { x: 0, y: 0.6 }
  ],
  closed: true
};

// Big Dots (simple representation - 4 circles would need multiple paths)
shapePathData.bigDots = {
  vertices: [
    { x: 0.25, y: 0.1, ctrlLeft: { x: -BEZIER_CIRCLE * 0.15, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.15, y: 0 } },
    { x: 0.4, y: 0.25, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.15 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.15 } },
    { x: 0.25, y: 0.4, ctrlLeft: { x: BEZIER_CIRCLE * 0.15, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.15, y: 0 } },
    { x: 0.1, y: 0.25, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.15 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.15 } }
  ],
  closed: true
};

// Small Dots (simple representation)
shapePathData.smallDots = {
  vertices: [
    { x: 0.25, y: 0.15, ctrlLeft: { x: -BEZIER_CIRCLE * 0.1, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.1, y: 0 } },
    { x: 0.35, y: 0.25, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.1 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.1 } },
    { x: 0.25, y: 0.35, ctrlLeft: { x: BEZIER_CIRCLE * 0.1, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.1, y: 0 } },
    { x: 0.15, y: 0.25, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.1 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.1 } }
  ],
  closed: true
};

// Waves
shapePathData.waves = {
  vertices: [
    { x: 0, y: 0.3 },
    { x: 0.25, y: 0.5, ctrlLeft: { x: -0.1, y: 0 }, ctrlRight: { x: 0.1, y: 0 } },
    { x: 0.5, y: 0.3, ctrlLeft: { x: -0.1, y: 0 }, ctrlRight: { x: 0.1, y: 0 } },
    { x: 0.75, y: 0.5, ctrlLeft: { x: -0.1, y: 0 }, ctrlRight: { x: 0.1, y: 0 } },
    { x: 1, y: 0.3 },
    { x: 1, y: 0.7 },
    { x: 0.75, y: 0.5, ctrlLeft: { x: 0.1, y: 0 }, ctrlRight: { x: -0.1, y: 0 } },
    { x: 0.5, y: 0.7, ctrlLeft: { x: 0.1, y: 0 }, ctrlRight: { x: -0.1, y: 0 } },
    { x: 0.25, y: 0.5, ctrlLeft: { x: 0.1, y: 0 }, ctrlRight: { x: -0.1, y: 0 } },
    { x: 0, y: 0.7 }
  ],
  closed: true
};

// Spikes
shapePathData.spikes = {
  vertices: [
    { x: 0, y: 1 },
    { x: 0.25, y: 0 },
    { x: 0.5, y: 1 },
    { x: 0.75, y: 0 },
    { x: 1, y: 1 }
  ],
  closed: true
};

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

// Draw a shape from path data using Canvas 2D API
function drawShapeFromPath(x, y, size, ctx, pathData) {
  if (!pathData || !pathData.vertices || pathData.vertices.length === 0) {
    return;
  }

  ctx.beginPath();

  const vertices = pathData.vertices;

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
  if (pathData.closed !== false) {
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
