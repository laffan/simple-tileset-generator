/* Medium-Light Dither pattern - 37.5% density (Bayer 2x2 style) */

patternPixelData.ditherMediumLight = {
  size: 4,
  pixels: [
    [1, 0, 0, 0],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 1]
  ]
};

patternRenderers.ditherMediumLight = function(x, y, size, ctx) {
  drawPatternFromPixelData(x, y, size, ctx, patternPixelData.ditherMediumLight);
};
