/* Line Up (vertical) shape */

shapeRenderers.lineUp = function(x, y, size, ctx) {
  const lineUpWidth = size;
  const lineUpHeight = size / 3;
  const lineUpX = x;
  const lineUpY = y + (size - lineUpHeight) / 2;
  ctx.fillRect(lineUpX, lineUpY, lineUpWidth, lineUpHeight);
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
