/* Medium-Dense Dither pattern - 62.5% density */

patternPixelData.ditherMediumDense = {
  size: 4,
  pixels: [
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [1, 0, 1, 0],
    [0, 0, 0, 0]
  ]
};

patternRenderers.ditherMediumDense = function(x, y, size, ctx) {
  drawPatternFromPixelData(x, y, size, ctx, patternPixelData.ditherMediumDense);
};
