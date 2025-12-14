/* Donut shape */

// Renderer uses path data as single source of truth
shapeRenderers.donut = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.donut);
};

// Donut with hole - uses holePathIndices for eraser-style hole cutting
shapePathData.donut = {
  fillRule: 'evenodd',
  holePathIndices: [1],  // Inner circle (index 1) is the hole
  paths: [
    // Outer circle (radius 0.4, center 0.5,0.5)
    {
      vertices: [
        { x: 0.5, y: 0.1, ctrlLeft: { x: -BEZIER_CIRCLE * 0.4, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.4, y: 0 } },
        { x: 0.9, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.4 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.4 } },
        { x: 0.5, y: 0.9, ctrlLeft: { x: BEZIER_CIRCLE * 0.4, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.4, y: 0 } },
        { x: 0.1, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.4 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.4 } }
      ],
      closed: true
    },
    // Inner circle (radius 0.2, center 0.5,0.5) - creates the hole
    {
      vertices: [
        { x: 0.5, y: 0.3, ctrlLeft: { x: -BEZIER_CIRCLE * 0.2, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.2, y: 0 } },
        { x: 0.7, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.2 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.2 } },
        { x: 0.5, y: 0.7, ctrlLeft: { x: BEZIER_CIRCLE * 0.2, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.2, y: 0 } },
        { x: 0.3, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.2 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.2 } }
      ],
      closed: true
    }
  ]
};
