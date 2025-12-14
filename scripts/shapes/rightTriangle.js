/* Right Triangle shape */

// Renderer uses path data as single source of truth
shapeRenderers.rightTriangle = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.rightTriangle);
};

shapePathData.rightTriangle = {
  vertices: [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0.5, y: 0.5 }
  ],
  closed: true
};
