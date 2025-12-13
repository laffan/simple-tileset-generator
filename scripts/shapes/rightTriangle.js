/* Right Triangle shape */

shapeRenderers.rightTriangle = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.closePath();
  ctx.fill();
};

shapePathData.rightTriangle = {
  vertices: [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0.5, y: 0.5 }
  ],
  closed: true
};
