/* Dense Dither pattern - 75% density */

patternPixelData.ditherDense = {
  size: 4,
  pixels: [
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [1, 0, 1, 0],
    [0, 1, 0, 1]
  ]
};

patternRenderers.ditherDense = function(x, y, size, ctx) {
  drawPatternFromPixelData(x, y, size, ctx, patternPixelData.ditherDense);
};
