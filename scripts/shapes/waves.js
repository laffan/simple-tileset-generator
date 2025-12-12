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
