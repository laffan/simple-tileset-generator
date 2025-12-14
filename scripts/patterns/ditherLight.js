/* Light Dither pattern - 25% density */

patternPixelData.ditherLight = {
  size: 4,
  pixels: [
    [1, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 0]
  ]
};

patternRenderers.ditherLight = function(x, y, size, ctx) {
  drawPatternFromPixelData(x, y, size, ctx, patternPixelData.ditherLight);
};
