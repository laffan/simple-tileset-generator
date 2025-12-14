/* Half Circle Right shape */

// Renderer uses path data as single source of truth
shapeRenderers.halfCircleRight = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.halfCircleRight);
};

// Flat edge on right (x=1), curve bulging left (endcap for right side)
shapePathData.halfCircleRight = {
  vertices: [
    { x: 1, y: 0, ctrlRight: { x: -BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 0.5, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.5 } },
    { x: 1, y: 1, ctrlLeft: { x: -BEZIER_CIRCLE * 0.5, y: 0 } }
  ],
  closed: true
};
