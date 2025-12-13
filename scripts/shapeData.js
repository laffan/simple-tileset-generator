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
