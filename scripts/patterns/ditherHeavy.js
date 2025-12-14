/* Heavy Dither pattern - 87.5% density */

patternPixelData.ditherHeavy = {
  size: 4,
  pixels: [
    [1, 1, 1, 0],
    [0, 1, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 1, 1]
  ]
};

patternRenderers.ditherHeavy = function(x, y, size, ctx) {
  drawPatternFromPixelData(x, y, size, ctx, patternPixelData.ditherHeavy);
};
