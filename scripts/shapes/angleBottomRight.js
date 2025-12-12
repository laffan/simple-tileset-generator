/* Angle Bottom Right shape */

shapeRenderers.angleBottomRight = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size, y);
  ctx.closePath();
  ctx.fill();
};
