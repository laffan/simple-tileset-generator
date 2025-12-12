/* Quarter Circle Top Left shape */

shapeRenderers.quarterCircleTopLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size, y);
  ctx.arc(x + size, y + size, size, Math.PI, 1.5 * Math.PI, false);
  ctx.closePath();
  ctx.fill();
};
