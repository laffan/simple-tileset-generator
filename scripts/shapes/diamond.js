/* Diamond shape */

// Renderer uses path data as single source of truth
shapeRenderers.diamond = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.diamond);
};

shapePathData.diamond = {
  vertices: [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 0, y: 0.5 }
  ],
  closed: true
};
