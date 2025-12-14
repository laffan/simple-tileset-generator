/* Square shape */

// Renderer uses path data as single source of truth
shapeRenderers.square = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.square);
};

shapePathData.square = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};
