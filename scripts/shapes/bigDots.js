/* Big Dots shape */

shapeRenderers.bigDots = function(x, y, size, ctx) {
  const dotRadius = size / 4;
  const spacing = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.beginPath();
      ctx.arc(
        x + (i * spacing) + (spacing / 2),
        y + (j * spacing) + (spacing / 2),
        dotRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
};

// Single centered dot as simplified representation (renderer shows 2x2 grid)
shapePathData.bigDots = {
  vertices: [
    { x: 0.5, y: 0.25, ctrlLeft: { x: -BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: BEZIER_CIRCLE * 0.25, y: 0 } },
    { x: 0.75, y: 0.5, ctrlLeft: { x: 0, y: -BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: BEZIER_CIRCLE * 0.25 } },
    { x: 0.5, y: 0.75, ctrlLeft: { x: BEZIER_CIRCLE * 0.25, y: 0 }, ctrlRight: { x: -BEZIER_CIRCLE * 0.25, y: 0 } },
    { x: 0.25, y: 0.5, ctrlLeft: { x: 0, y: BEZIER_CIRCLE * 0.25 }, ctrlRight: { x: 0, y: -BEZIER_CIRCLE * 0.25 } }
  ],
  closed: true
};
