/* Half Circle Bottom shape */

// Renderer uses path data as single source of truth
shapeRenderers.halfCircleBottom = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.halfCircleBottom);
};

shapePathData.halfCircleBottom = {
  vertices: [
    { x: 0, y: 0, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.5 } },
    { x: 0.5, y: 0.5, ctrlLeft: { x: -BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 1, y: 0, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.5 } }
  ],
  closed: true
};
