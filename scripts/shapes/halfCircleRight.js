/* Half Circle Right shape */

shapeRenderers.halfCircleRight = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI / 2, Math.PI * 1.5, true);
  ctx.lineTo(x + size / 2, y + size / 2); // Close path towards the starting point
  ctx.fill();
};

// Flat edge on right (x=1), curve bulging left (endcap for right side)
shapePathData.halfCircleRight = {
  vertices: [
    { x: 1, y: 0, ctrlRight: { x: -BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 0.5, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.5 } },
    { x: 1, y: 1, ctrlLeft: { x: -BEZIER_CIRCLE * 0.5, y: 0 } }
  ],
  closed: true
};
