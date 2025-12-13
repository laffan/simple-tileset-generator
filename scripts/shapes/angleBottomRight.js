/* Angle Bottom Right shape */

shapeRenderers.angleBottomRight = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size, y);
  ctx.closePath();
  ctx.fill();
};

shapePathData.angleBottomRight = {
  vertices: [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};
