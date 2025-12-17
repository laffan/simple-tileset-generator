/* Canvas drawing functions */

// Update the drawShapes function to accommodate multiple shapes, patterns, and combinations
function drawShapes(colors, size) {
  const squaresPerRow = colors.length;  // Now depends on the number of colors
  const selectedShapes = getSelectedShapes();
  const selectedPatterns = getSelectedPatterns();
  const selectedCombinations = typeof getSelectedCombinations === 'function' ? getSelectedCombinations() : [];

  const numShapeRows = selectedShapes.length;
  const numPatternRows = selectedPatterns.length;

  // Calculate rows needed for combinations (each combination may span multiple rows)
  let combinationRowsInfo = [];
  let totalCombinationRows = 0;
  selectedCombinations.forEach((combinationName) => {
    const combinationData = getCombinationData(combinationName);
    if (combinationData) {
      const dims = getCombinationDimensions(combinationData);
      combinationRowsInfo.push({
        name: combinationName,
        data: combinationData,
        width: dims.width,
        height: dims.height,
        startRow: totalCombinationRows
      });
      totalCombinationRows += dims.height;
    }
  });

  const totalRows = numShapeRows + numPatternRows + totalCombinationRows;

  // Calculate max width needed (combinations may be wider than colors count)
  let maxWidth = squaresPerRow;
  combinationRowsInfo.forEach(info => {
    // Each combination is drawn once per color, offset horizontally
    const neededWidth = squaresPerRow * info.width;
    if (neededWidth > maxWidth) {
      maxWidth = neededWidth;
    }
  });

  // For combinations, we draw each combination once per color, similar to shapes
  // But combinations span multiple tiles, so we need to calculate differently
  // Canvas width should accommodate the widest row
  const canvasWidth = maxWidth * size;

  // Adjust canvas width and height
  canvas.width = canvasWidth;
  canvas.height = totalRows * size;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw shapes
  selectedShapes.forEach((shape, shapeIndex) => {
    colors.forEach((color, index) => {
      const x = index * size;  // X position depends on color index
      const y = shapeIndex * size;  // Y position depends on shape index
      ctx.fillStyle = `#${color.trim()}`;
      drawShape(x, y, size, ctx, shape);  // Draw each shape in its respective row
    });
  });

  // Draw patterns (after shapes)
  selectedPatterns.forEach((pattern, patternIndex) => {
    colors.forEach((color, index) => {
      const x = index * size;
      const y = (numShapeRows + patternIndex) * size;  // Offset by number of shape rows
      ctx.fillStyle = `#${color.trim()}`;
      drawPattern(x, y, size, ctx, pattern);
    });
  });

  // Draw combinations (after patterns)
  // For each combination, draw it once per color
  combinationRowsInfo.forEach((info) => {
    colors.forEach((color, colorIndex) => {
      const x = colorIndex * info.width * size;  // Offset by combination width
      const y = (numShapeRows + numPatternRows + info.startRow) * size;
      ctx.fillStyle = `#${color.trim()}`;
      drawCombination(x, y, size, ctx, info.data);
    });
  });
}

// Function to draw squares on the canvas
function drawSquares(colors, size) {
  const squaresPerRow = 10; // Maximum squares per row
  const numRows = Math.ceil(colors.length / squaresPerRow); // Calculate the number of rows needed

  // Adjust canvas size based on input
  canvas.width = squaresPerRow * size; // Width based on 10 squares per row
  canvas.height = numRows * size; // Height based on the number of rows

  // Clear the canvas before redrawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw each square
  colors.forEach((color, index) => {
    const row = Math.floor(index / squaresPerRow);
    const col = index % squaresPerRow;
    ctx.fillStyle = `#${color.trim()}`; // Ensure color is properly formatted
    ctx.fillRect(col * size, row * size, size, size);
  });
}
