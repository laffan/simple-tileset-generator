/* Angle Bottom Left shape */

shapeRenderers.angleBottomLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + size, y + size);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
};

shapePathData.angleBottomLeft = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};
