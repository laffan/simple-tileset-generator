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

// Simple representation - single dot in top-left quadrant
shapePathData.bigDots = {
  vertices: [
    { x: 0.25, y: 0.1, ctrlLeft: { x: -BEZIER_CIRCLE * 0.15, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.15, y: 0 } },
    { x: 0.4, y: 0.25, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.15 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.15 } },
    { x: 0.25, y: 0.4, ctrlLeft: { x: BEZIER_CIRCLE * 0.15, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.15, y: 0 } },
    { x: 0.1, y: 0.25, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.15 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.15 } }
  ],
  closed: true
};
