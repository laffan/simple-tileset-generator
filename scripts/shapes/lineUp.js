/* Line Up (horizontal) shape */

shapeRenderers.lineUp = function(x, y, size, ctx) {
  const lineUpWidth = size;
  const lineUpHeight = size / 3;
  const lineUpX = x;
  const lineUpY = y + (size - lineUpHeight) / 2;
  ctx.fillRect(lineUpX, lineUpY, lineUpWidth, lineUpHeight);
};
