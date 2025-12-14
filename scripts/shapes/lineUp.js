/* Line Up (vertical) shape */

shapeRenderers.lineUp = function(x, y, size, ctx) {
  // Vertical line (full height, narrow width) matching path data
  const lineWidth = size * 0.2;  // x: 0.4 to 0.6 = 0.2 width
  const lineX = x + (size - lineWidth) / 2;  // centered horizontally
  ctx.fillRect(lineX, y, lineWidth, size);
};

shapePathData.lineUp = {
  vertices: [
    { x: 0.4, y: 0 },
    { x: 0.6, y: 0 },
    { x: 0.6, y: 1 },
    { x: 0.4, y: 1 }
  ],
  closed: true
};
