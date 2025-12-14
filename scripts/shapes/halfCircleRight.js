/* Half Circle Right shape */

shapeRenderers.halfCircleRight = function(x, y, size, ctx) {
  // Flat edge on right (x=1), curve bulging left to x=0.5
  ctx.beginPath();
  ctx.arc(x + size, y + size / 2, size / 2, Math.PI / 2, -Math.PI / 2, false);
  ctx.closePath();
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
