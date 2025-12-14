/* Half Circle Left shape */

// Renderer uses path data as single source of truth
shapeRenderers.halfCircleLeft = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.halfCircleLeft);
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
