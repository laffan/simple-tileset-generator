/* Big Dots shape */

shapeRenderers.bigDots = function(x, y, size, ctx) {
  // Single large dot in top-left quadrant to match path data
  ctx.beginPath();
  ctx.arc(
    x + size * 0.25,  // center x at 0.25
    y + size * 0.25,  // center y at 0.25
    size * 0.15,      // radius matching path data (0.1 to 0.4 = 0.3 diameter, so 0.15 radius)
    0,
    Math.PI * 2
  );
  ctx.fill();
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
