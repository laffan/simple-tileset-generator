/* Quarter Circle Top Right shape */

// Renderer uses path data as single source of truth
shapeRenderers.quarterCircleTopRight = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.quarterCircleTopRight);
};

// L-shape with curved corner toward top-right
shapePathData.quarterCircleTopRight = {
  vertices: [
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: 0, y: 0, ctrlRight: { x: BEZIER_CIRCLE, y: 0 } },
    { x: 1, y: 1, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE } }
  ],
  closed: false
};
