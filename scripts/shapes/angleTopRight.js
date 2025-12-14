/* Angle Top Right shape */

// Renderer uses path data as single source of truth
shapeRenderers.angleTopRight = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.angleTopRight);
};

shapePathData.angleTopRight = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 }
  ],
  closed: true
};
