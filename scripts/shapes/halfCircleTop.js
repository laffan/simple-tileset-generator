/* Half Circle Top shape */

shapeRenderers.halfCircleTop = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size, size / 2, Math.PI, 0, false);
  ctx.lineTo(x + size / 2, y + size);
  ctx.fill();
};

shapePathData.halfCircleTop = {
  vertices: [
    { x: 0, y: 1, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.5 } },
    { x: 0.5, y: 0.5, ctrlLeft: { x: -BEZIER_CIRCLE * 0.5, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 1, y: 1, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.5 } }
  ],
  closed: true
};
