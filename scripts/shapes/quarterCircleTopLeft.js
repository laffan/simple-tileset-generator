/* Quarter Circle Top Left shape */

// Renderer uses path data as single source of truth
shapeRenderers.quarterCircleTopLeft = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.quarterCircleTopLeft);
};

// L-shape with curved corner toward top-left
shapePathData.quarterCircleTopLeft = {
  vertices: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0, ctrlRight: { x: -BEZIER_CIRCLE, y: 0 } },
    { x: 0, y: 1, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE } }
  ],
  closed: false
};
