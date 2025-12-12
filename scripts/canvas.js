/* Canvas drawing functions */

// Update the drawShapes function to accommodate multiple shapes in separate rows
function drawShapes(colors, size) {
  const squaresPerRow = colors.length;  // Now depends on the number of colors
  const selectedShapes = getSelectedShapes();
  const numRows = selectedShapes.length;  // A single row per selected shape

  // Adjust canvas width and height based on the number of colors and selected shapes
  canvas.width = squaresPerRow * size;
  canvas.height = numRows * size;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  selectedShapes.forEach((shape, shapeIndex) => {
    colors.forEach((color, index) => {
      const x = index * size;  // X position depends on color index
      const y = shapeIndex * size;  // Y position depends on shape index
      ctx.fillStyle = `#${color.trim()}`;
      drawShape(x, y, size, ctx, shape);  // Draw each shape in its respective row
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
