/* Right Triangle shape */

shapeRenderers.rightTriangle = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.closePath();
  ctx.fill();
};
