/* Quarter Circle Bottom Right shape */

shapeRenderers.quarterCircleBottomRight = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + size);
  ctx.arc(x, y, size, 0, 0.5 * Math.PI, false);
  ctx.closePath();
  ctx.fill();
};

// L-shape with curved corner toward bottom-right
shapePathData.quarterCircleBottomRight = {
  vertices: [
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1, ctrlRight: { x: BEZIER_CIRCLE, y: 0 } },
    { x: 1, y: 0, ctrlLeft: { x: 0, y: BEZIER_CIRCLE } }
  ],
  closed: false
};
