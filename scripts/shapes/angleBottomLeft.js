/* Angle Bottom Left shape */

shapeRenderers.angleBottomLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + size, y + size);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
};
