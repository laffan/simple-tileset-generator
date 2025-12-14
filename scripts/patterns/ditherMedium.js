/* Medium Dither pattern - 50% ordered dither */

patternPixelData.ditherMedium = {
  size: 4,
  pixels: [
    [1, 0, 1, 0],
    [0, 0, 0, 0],
    [1, 0, 1, 0],
    [0, 0, 0, 0]
  ]
};

patternRenderers.ditherMedium = function(x, y, size, ctx) {
  drawPatternFromPixelData(x, y, size, ctx, patternPixelData.ditherMedium);
};
