/* Waves shape */

shapeRenderers.waves = function(x, y, size, ctx) {
  ctx.beginPath();
  const waveAmplitude = size / 4;
  const waveFrequency = 2;
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
