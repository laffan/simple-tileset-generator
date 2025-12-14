/* Line Across (horizontal) shape */

shapeRenderers.lineAcross = function(x, y, size, ctx) {
  // Horizontal line (full width, narrow height) matching path data
  const lineHeight = size * 0.2;  // y: 0.4 to 0.6 = 0.2 height
  const lineY = y + (size - lineHeight) / 2;  // centered vertically
  ctx.fillRect(x, lineY, size, lineHeight);
};

shapePathData.lineAcross = {
  vertices: [
    { x: 0, y: 0.4 },
    { x: 1, y: 0.4 },
    { x: 1, y: 0.6 },
    { x: 0, y: 0.6 }
  ],
  closed: true
};
