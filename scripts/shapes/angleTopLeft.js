/* Angle Top Left shape */

// Renderer uses path data as single source of truth
shapeRenderers.angleTopLeft = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.angleTopLeft);
};

shapePathData.angleTopLeft = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ],
  closed: true
};
