/* Quarter Circle Bottom Left shape */

// Renderer uses path data as single source of truth
shapeRenderers.quarterCircleBottomLeft = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.quarterCircleBottomLeft);
};

// L-shape with curved corner toward bottom-left
shapePathData.quarterCircleBottomLeft = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1, ctrlRight: { x: -BEZIER_CIRCLE, y: 0 } },
    { x: 0, y: 0, ctrlLeft: { x: 0, y: BEZIER_CIRCLE } }
  ],
  closed: false
};
