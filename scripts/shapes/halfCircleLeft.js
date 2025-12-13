/* Half Circle Left shape */

shapeRenderers.halfCircleLeft = function(x, y, size, ctx) {
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI * 1.5, Math.PI / 2, true);
  ctx.lineTo(x + size / 2, y + size / 2); // Close path towards the starting point
  ctx.fill();
};

// Flat edge on left (x=0), curve bulging right (endcap for left side)
shapePathData.halfCircleLeft = {
  vertices: [
    { x: 0, y: 0, ctrlRight: { x: BEZIER_CIRCLE * 0.5, y: 0 } },
    { x: 0.5, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.5 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.5 } },
    { x: 0, y: 1, ctrlLeft: { x: BEZIER_CIRCLE * 0.5, y: 0 } }
  ],
  closed: true
};
