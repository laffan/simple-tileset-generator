/* Quarter Circle Top Left shape */

shapeRenderers.quarterCircleTopLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size, y);
  ctx.arc(x + size, y + size, size, Math.PI, 1.5 * Math.PI, false);
  ctx.closePath();
  ctx.fill();
};

// L-shape with curved corner toward top-left
shapePathData.quarterCircleTopLeft = {
  vertices: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0, ctrlRight: { x: -BEZIER_CIRCLE, y: 0 } },
    { x: 0, y: 1, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE } }
  ],
  closed: false
};
