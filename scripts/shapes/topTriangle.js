/* Top Triangle shape */

shapeRenderers.topTriangle = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.closePath();
  ctx.fill();
};
