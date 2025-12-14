/* Half Circle Top shape */

// Renderer uses path data as single source of truth
shapeRenderers.halfCircleTop = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.halfCircleTop);
};

shapePathData.halfCircleTop = {
  vertices: [
    { x: 0, y: 1, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.5 } },
    { x: 0.5, y: 0.5, ctrlLeft: { x: -BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 1, y: 1, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.5 } }
  ],
  closed: true
};
