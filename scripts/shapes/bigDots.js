/* Big Dots shape */

shapeRenderers.bigDots = function(x, y, size, ctx) {
  const bigDotSize = size / 2;
  const bigDotSpacing = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.beginPath();
      ctx.arc(
        x + (i * bigDotSpacing) + (bigDotSize / 2),
        y + (j * bigDotSpacing) + (bigDotSize / 2),
        bigDotSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
};
