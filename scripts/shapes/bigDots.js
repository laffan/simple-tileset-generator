/* Big Dots shape */

// Renderer uses path data as single source of truth
shapeRenderers.bigDots = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.bigDots);
};

// Single centered dot as simplified representation (renderer shows 2x2 grid)
shapePathData.bigDots = {
  vertices: [
    { x: 0.5, y: 0.25, ctrlLeft: { x: -BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.25, y: 0 } },
    { x: 0.75, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.25 } },
    { x: 0.5, y: 0.75, ctrlLeft: { x: BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.25, y: 0 } },
    { x: 0.25, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.25 } }
  ],
  closed: true
};
