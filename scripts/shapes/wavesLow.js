/* Waves Low shape - lower amplitude waves */

// Renderer uses path data as single source of truth
shapeRenderers.wavesLow = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.wavesLow);
};

// Wave shape with lower amplitude - centered around y=0.7
shapePathData.wavesLow = {
  vertices: [
    { x: 0, y: 0.7, ctrlRight: { x: 0.08, y: -0.08 } },
    { x: 0.25, y: 0.6, ctrlLeft: { x: -0.08, y: 0 }, ctrlRight: { x: 0.08, y: 0 } },
    { x: 0.5, y: 0.7, ctrlLeft: { x: -0.08, y: -0.08 }, ctrlRight: { x: 0.08, y: 0.08 } },
    { x: 0.75, y: 0.8, ctrlLeft: { x: -0.08, y: 0 }, ctrlRight: { x: 0.08, y: 0 } },
    { x: 1, y: 0.7, ctrlLeft: { x: -0.08, y: 0.08 } },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};
