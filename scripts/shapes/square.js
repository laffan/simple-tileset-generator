/* Square shape */

shapeRenderers.square = function(x, y, size, ctx) {
  ctx.fillRect(x, y, size, size);
};

shapePathData.square = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};
