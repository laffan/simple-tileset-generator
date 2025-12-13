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

shapePathData.spikes = {
  vertices: [
    { x: 0, y: 1 },
    { x: 0.25, y: 0 },
    { x: 0.5, y: 1 },
    { x: 0.75, y: 0 },
    { x: 1, y: 1 }
  ],
  closed: true
};
