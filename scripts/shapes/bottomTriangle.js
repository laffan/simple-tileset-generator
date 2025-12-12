/* Bottom Triangle shape */

shapeRenderers.bottomTriangle = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.closePath();
  ctx.fill();
};
