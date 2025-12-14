/* Big Dots shape */

// Renderer uses path data as single source of truth
shapeRenderers.bigDots = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.bigDots);
};

// 2x2 grid of circles filling the square
// Each circle: radius 0.25, centers at (0.25,0.25), (0.75,0.25), (0.25,0.75), (0.75,0.75)
shapePathData.bigDots = {
  paths: [
    // Top-left circle (center 0.25, 0.25)
    {
      vertices: [
        { x: 0.25, y: 0, ctrlLeft: { x: -BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.25, y: 0 } },
        { x: 0.5, y: 0.25, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.25 } },
        { x: 0.25, y: 0.5, ctrlLeft: { x: BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.25, y: 0 } },
        { x: 0, y: 0.25, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.25 } }
      ],
      closed: true
    },
    // Top-right circle (center 0.75, 0.25)
    {
      vertices: [
        { x: 0.75, y: 0, ctrlLeft: { x: -BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.25, y: 0 } },
        { x: 1, y: 0.25, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.25 } },
        { x: 0.75, y: 0.5, ctrlLeft: { x: BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.25, y: 0 } },
        { x: 0.5, y: 0.25, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.25 } }
      ],
      closed: true
    },
    // Bottom-left circle (center 0.25, 0.75)
    {
      vertices: [
        { x: 0.25, y: 0.5, ctrlLeft: { x: -BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.25, y: 0 } },
        { x: 0.5, y: 0.75, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.25 } },
        { x: 0.25, y: 1, ctrlLeft: { x: BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.25, y: 0 } },
        { x: 0, y: 0.75, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.25 } }
      ],
      closed: true
    },
    // Bottom-right circle (center 0.75, 0.75)
    {
      vertices: [
        { x: 0.75, y: 0.5, ctrlLeft: { x: -BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.25, y: 0 } },
        { x: 1, y: 0.75, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.25 } },
        { x: 0.75, y: 1, ctrlLeft: { x: BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.25, y: 0 } },
        { x: 0.5, y: 0.75, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.25 } }
      ],
      closed: true
    }
  ]
};
