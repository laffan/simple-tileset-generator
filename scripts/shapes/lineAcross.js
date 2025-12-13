/* Line Across (horizontal) shape */

shapeRenderers.lineAcross = function(x, y, size, ctx) {
  const lineAcrossWidth = size / 3;
  const lineAcrossHeight = size;
  const lineAcrossX = x + (size - lineAcrossWidth) / 2;
  const lineAcrossY = y;
  ctx.fillRect(lineAcrossX, lineAcrossY, lineAcrossWidth, lineAcrossHeight);
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
