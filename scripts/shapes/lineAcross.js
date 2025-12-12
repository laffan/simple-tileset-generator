/* Line Across (vertical) shape */

shapeRenderers.lineAcross = function(x, y, size, ctx) {
  const lineAcrossWidth = size / 3;
  const lineAcrossHeight = size;
  const lineAcrossX = x + (size - lineAcrossWidth) / 2;
  const lineAcrossY = y;
  ctx.fillRect(lineAcrossX, lineAcrossY, lineAcrossWidth, lineAcrossHeight);
};
