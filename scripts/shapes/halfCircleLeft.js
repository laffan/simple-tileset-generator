/* Half Circle Left shape */

shapeRenderers.halfCircleLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI * 1.5, Math.PI / 2, true);
  ctx.lineTo(x + size / 2, y + size / 2); // Close path towards the starting point
  ctx.fill();
};
