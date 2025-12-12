/* Small Circle shape */

shapeRenderers.smallCircle = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 4, 0, Math.PI * 2);
  ctx.fill();
};
