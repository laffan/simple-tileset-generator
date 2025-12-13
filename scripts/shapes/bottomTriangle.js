/* Bottom Triangle shape */

shapeRenderers.bottomTriangle = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.closePath();
  ctx.fill();
};

shapePathData.bottomTriangle = {
  vertices: [
    { x: 0.5, y: 0.5 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};
