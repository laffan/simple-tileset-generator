/* Triangle shape */

// Renderer uses path data as single source of truth
shapeRenderers.triangle = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.triangle);
};

shapePathData.triangle = {
  vertices: [
    { x: 0.5, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};
