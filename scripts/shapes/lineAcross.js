/* Line Across (horizontal) shape */

// Renderer uses path data as single source of truth
shapeRenderers.lineAcross = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.lineAcross);
};

shapePathData.lineAcross = {
  vertices: [
    { x: 0, y: 0.4 },
    { x: 1, y: 0.4 },
    { x: 1, y: 0.6 },
    { x: 0, y: 0.6 }
  ],
  closed: true
};
