/* Left Triangle shape */

shapeRenderers.leftTriangle = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.closePath();
  ctx.fill();
};
