/* Small Dots shape */

shapeRenderers.smallDots = function(x, y, size, ctx) {
  const smallDotSize = size / 3;
  const smallDotSpacing = size / 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.arc(
        x + (i * smallDotSpacing) + (smallDotSize / 2),
        y + (j * smallDotSpacing) + (smallDotSize / 2),
        smallDotSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
};

// Helper to create a circle path at a given center with radius
function createSmallDotsCirclePath(cx, cy, r) {
  const bc = BEZIER_CIRCLE * r;
  return {
    vertices: [
      { x: cx, y: cy - r, ctrlLeft: { x: -bc, y: 0 }, ctrlRight: { x: bc, y: 0 } },
      { x: cx + r, y: cy, ctrlLeft: { x: 0, y: -bc }, ctrlRight: { x: 0, y: bc } },
      { x: cx, y: cy + r, ctrlLeft: { x: bc, y: 0 }, ctrlRight: { x: -bc, y: 0 } },
      { x: cx - r, y: cy, ctrlLeft: { x: 0, y: bc }, ctrlRight: { x: 0, y: -bc } }
    ],
    closed: true
  };
}

// 3x3 grid of circles (multi-path shape)
shapePathData.smallDots = {
  paths: (function() {
    const paths = [];
    const dotRadius = 1/6;  // Each dot has radius of 1/6 of tile
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = col / 3 + 1/6;  // Center x
        const cy = row / 3 + 1/6;  // Center y
        paths.push(createSmallDotsCirclePath(cx, cy, dotRadius * 0.8));  // Slightly smaller for spacing
      }
    }
    return paths;
  })()
};
