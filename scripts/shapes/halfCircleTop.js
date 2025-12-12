/* Half Circle Top shape */

shapeRenderers.halfCircleTop = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size, size / 2, Math.PI, 0, false);
  ctx.lineTo(x + size / 2, y + size);
  ctx.fill();
};
