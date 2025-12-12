/* Quarter Circle Bottom Left shape */

shapeRenderers.quarterCircleBottomLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.arc(x + size, y, size, 0.5 * Math.PI, Math.PI, false);
  ctx.closePath();
  ctx.fill();
};
