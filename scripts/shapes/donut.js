/* Donut shape */

shapeRenderers.donut = function(x, y, size, ctx) {
  // Filled circle matching path data (outer circle only, no hole)
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
};

// Outer circle only - inner would need separate path
shapePathData.donut = {
  vertices: [
    { x: 0.5, y: 0.1, ctrlLeft: { x: -BEZIER_CIRCLE * 0.4, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.4, y: 0 } },
    { x: 0.9, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.4 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.4 } },
    { x: 0.5, y: 0.9, ctrlLeft: { x: BEZIER_CIRCLE * 0.4, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.4, y: 0 } },
    { x: 0.1, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.4 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.4 } }
  ],
  closed: true
};
