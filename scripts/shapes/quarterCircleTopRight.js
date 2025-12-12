/* Quarter Circle Top Right shape */

shapeRenderers.quarterCircleTopRight = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + size, y + size);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x, y);
  ctx.arc(x, y + size, size, 1.5 * Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();
};
