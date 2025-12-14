/* Waves shape */

// Renderer uses path data as single source of truth
shapeRenderers.waves = function(x, y, size, ctx) {
  drawShapeFromPath(x, y, size, ctx, shapePathData.waves);
};

// Wave shape - sine wave on top, fills to bottom
shapePathData.waves = {
  vertices: [
    { x: 0, y: 0.5, ctrlRight: { x: 0.08, y: -0.15 } },
    { x: 0.25, y: 0.25, ctrlLeft: { x: -0.08, y: 0 }, ctrlRight: { x: 0.08, y: 0 } },
    { x: 0.5, y: 0.5, ctrlLeft: { x: -0.08, y: -0.15 }, ctrlRight: { x: 0.08, y: 0.15 } },
    { x: 0.75, y: 0.75, ctrlLeft: { x: -0.08, y: 0 }, ctrlRight: { x: 0.08, y: 0 } },
    { x: 1, y: 0.5, ctrlLeft: { x: -0.08, y: 0.15 } },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ],
  closed: true
};
