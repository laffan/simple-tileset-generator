/* Spikes shape */

// Renderer uses path data as single source of truth
shapeRenderers.spikes = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.spikes);
};

shapePathData.spikes = {
  vertices: [
    { x: 0, y: 1 },
    { x: 0, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 1, y: 0.5 },
    { x: 1, y: 1 }
  ],
  closed: true
};
