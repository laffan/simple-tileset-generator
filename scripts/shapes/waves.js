/* Waves shape */

shapeRenderers.waves = function(x, y, size, ctx) {
  ctx.beginPath();
  const waveAmplitude = size * 0.1; // Wave amplitude (0.2 total swing)
  const centerY = size * 0.5;
  const bandOffset = size * 0.2; // Distance from center to band edge

  // Draw top edge of wave band (y oscillates between 0.3 and 0.5)
  ctx.moveTo(x, y + centerY - bandOffset); // Start at (0, 0.3)
  ctx.quadraticCurveTo(x + size * 0.125, y + centerY, x + size * 0.25, y + centerY); // to (0.25, 0.5)
  ctx.quadraticCurveTo(x + size * 0.375, y + centerY - bandOffset, x + size * 0.5, y + centerY - bandOffset); // to (0.5, 0.3)
  ctx.quadraticCurveTo(x + size * 0.625, y + centerY, x + size * 0.75, y + centerY); // to (0.75, 0.5)
  ctx.quadraticCurveTo(x + size * 0.875, y + centerY - bandOffset, x + size, y + centerY - bandOffset); // to (1, 0.3)

  // Draw bottom edge of wave band (y oscillates between 0.7 and 0.5)
  ctx.lineTo(x + size, y + centerY + bandOffset); // to (1, 0.7)
  ctx.quadraticCurveTo(x + size * 0.875, y + centerY, x + size * 0.75, y + centerY); // to (0.75, 0.5)
  ctx.quadraticCurveTo(x + size * 0.625, y + centerY + bandOffset, x + size * 0.5, y + centerY + bandOffset); // to (0.5, 0.7)
  ctx.quadraticCurveTo(x + size * 0.375, y + centerY, x + size * 0.25, y + centerY); // to (0.25, 0.5)
  ctx.quadraticCurveTo(x + size * 0.125, y + centerY + bandOffset, x, y + centerY + bandOffset); // to (0, 0.7)

  ctx.closePath();
  ctx.fill();
};

// Wavy band across the middle
shapePathData.waves = {
  vertices: [
    { x: 0, y: 0.3, ctrlRight: { x: 0.1, y: 0 } },
    { x: 0.25, y: 0.5, ctrlLeft: { x: -0.1, y: 0 }, ctrlRight: { x: 0.1, y: 0 } },
    { x: 0.5, y: 0.3, ctrlLeft: { x: -0.1, y: 0 }, ctrlRight: { x: 0.1, y: 0 } },
    { x: 0.75, y: 0.5, ctrlLeft: { x: -0.1, y: 0 }, ctrlRight: { x: 0.1, y: 0 } },
    { x: 1, y: 0.3, ctrlLeft: { x: -0.1, y: 0 } },
    { x: 1, y: 0.7, ctrlRight: { x: -0.1, y: 0 } },
    { x: 0.75, y: 0.5, ctrlLeft: { x: 0.1, y: 0 }, ctrlRight: { x: -0.1, y: 0 } },
    { x: 0.5, y: 0.7, ctrlLeft: { x: 0.1, y: 0 }, ctrlRight: { x: -0.1, y: 0 } },
    { x: 0.25, y: 0.5, ctrlLeft: { x: 0.1, y: 0 }, ctrlRight: { x: -0.1, y: 0 } },
    { x: 0, y: 0.7, ctrlLeft: { x: 0.1, y: 0 } }
  ],
  closed: true
};
