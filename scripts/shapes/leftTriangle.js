/* Left Triangle shape */

// Renderer uses path data as single source of truth
shapeRenderers.leftTriangle = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.leftTriangle);
};

shapePathData.leftTriangle = {
  vertices: [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 0, y: 1 }
  ],
  closed: true
};
