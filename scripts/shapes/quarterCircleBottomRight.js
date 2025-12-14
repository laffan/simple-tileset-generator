/* Quarter Circle Bottom Right shape */

// Renderer uses path data as single source of truth
shapeRenderers.quarterCircleBottomRight = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.quarterCircleBottomRight);
};

// L-shape with curved corner toward bottom-right
shapePathData.quarterCircleBottomRight = {
  vertices: [
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1, ctrlRight: { x: BEZIER_CIRCLE, y: 0 } },
    { x: 1, y: 0, ctrlLeft: { x: 0, y: BEZIER_CIRCLE } }
  ],
  closed: false
};
