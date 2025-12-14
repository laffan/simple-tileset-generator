/* Top Triangle shape */

// Renderer uses path data as single source of truth
shapeRenderers.topTriangle = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.topTriangle);
};

shapePathData.topTriangle = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0.5, y: 0.5 }
  ],
  closed: true
};
