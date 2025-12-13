/* Waves shape */

shapeRenderers.waves = function(x, y, size, ctx) {
  ctx.beginPath();
  const waveAmplitude = size / 8; // Wave amplitude
  const waveFrequency = 2; // Determines the number of waves
  for (let waveX = 0; waveX <= size; waveX++) {
    const waveY = Math.sin((waveX / size) * Math.PI * waveFrequency) * waveAmplitude + (size / 2);
    if (waveX === 0) ctx.moveTo(x + waveX, y + waveY);
    else ctx.lineTo(x + waveX, y + waveY);
  }
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x, y + size);
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
