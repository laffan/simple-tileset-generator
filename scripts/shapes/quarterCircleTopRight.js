/* Quarter Circle Top Right shape */

shapeRenderers.quarterCircleTopRight = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + size, y + size);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x, y);
  ctx.arc(x, y + size, size, 1.5 * Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();
};

// L-shape with curved corner toward top-right
shapePathData.quarterCircleTopRight = {
  vertices: [
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: 0, y: 0, ctrlRight: { x: BEZIER_CIRCLE, y: 0 } },
    { x: 1, y: 1, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE } }
  ],
  closed: false
};
