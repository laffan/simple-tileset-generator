/* Angle Top Right shape */

shapeRenderers.angleTopRight = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
};
