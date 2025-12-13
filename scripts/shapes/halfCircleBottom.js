/* Half Circle Bottom shape */

shapeRenderers.halfCircleBottom = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y, size / 2, Math.PI, 0, true);
  ctx.lineTo(x + size / 2, y);
  ctx.fill();
};

shapePathData.halfCircleBottom = {
  vertices: [
    { x: 0, y: 0, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.5 } },
    { x: 0.5, y: 0.5, ctrlLeft: { x: -BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 1, y: 0, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.5 } }
  ],
  closed: true
};
