/* Angle Top Left shape */

shapeRenderers.angleTopLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();
};
