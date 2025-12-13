/* Small Circle shape */

shapeRenderers.smallCircle = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 4, 0, Math.PI * 2);
  ctx.fill();
};

shapePathData.smallCircle = {
  vertices: [
    { x: 0.5, y: 0.25, ctrlLeft: { x: -BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.25, y: 0 } },
    { x: 0.75, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.25 } },
    { x: 0.5, y: 0.75, ctrlLeft: { x: BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.25, y: 0 } },
    { x: 0.25, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.25 } }
  ],
  closed: true
};
