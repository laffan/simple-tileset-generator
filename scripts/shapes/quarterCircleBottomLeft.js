/* Quarter Circle Bottom Left shape */

shapeRenderers.quarterCircleBottomLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.arc(x + size, y, size, 0.5 * Math.PI, Math.PI, false);
  ctx.closePath();
  ctx.fill();
};

// L-shape with curved corner toward bottom-left
shapePathData.quarterCircleBottomLeft = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1, ctrlRight: { x: -BEZIER_CIRCLE, y: 0 } },
    { x: 0, y: 0, ctrlLeft: { x: 0, y: BEZIER_CIRCLE } }
  ],
  closed: false
};
