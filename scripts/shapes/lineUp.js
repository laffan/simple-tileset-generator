/* Line Up (vertical) shape */

// Renderer uses path data as single source of truth
shapeRenderers.lineUp = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.lineUp);
};

shapePathData.lineUp = {
  vertices: [
    { x: 0.4, y: 0 },
    { x: 0.6, y: 0 },
    { x: 0.6, y: 1 },
    { x: 0.4, y: 1 }
  ],
  closed: true
};
