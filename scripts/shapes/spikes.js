/* Spikes shape */

shapeRenderers.spikes = function(x, y, size, ctx) {
  // Left Spike
  ctx.beginPath();
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x + size / 2, y + size);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();

  // Right Spike
  ctx.beginPath();
  ctx.moveTo(x + size, y + size / 2);
  ctx.lineTo(x + size / 2, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
};
