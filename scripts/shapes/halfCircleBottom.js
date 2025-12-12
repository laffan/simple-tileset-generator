/* Half Circle Bottom shape */

shapeRenderers.halfCircleBottom = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y, size / 2, Math.PI, 0, true);
  ctx.lineTo(x + size / 2, y);
  ctx.fill();
};
