/* Small Dots shape */

shapeRenderers.smallDots = function(x, y, size, ctx) {
  const smallDotSize = size / 3;
  const smallDotSpacing = size / 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.arc(
        x + (i * smallDotSpacing) + (smallDotSize / 2),
        y + (j * smallDotSpacing) + (smallDotSize / 2),
        smallDotSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
};
