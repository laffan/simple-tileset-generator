/* Main application - initialization and event listeners */

function generateTileset() {
  const colorInput = document.getElementById('colorInput').value;
  const sizeInput = parseInt(document.getElementById('sizeInput').value, 10) || 50;
  // Split by comma, then filter out empty strings and strings that only contain whitespace
  const colors = colorInput.split(',')
    .map(color => color.trim()) // Remove whitespace from both ends of each color string
    .filter(color => color); // Filter out empty strings after trim
  drawShapes(colors, sizeInput);
}


// Add event listeners to the "all" and "none" links
document.getElementById('selectAllShapes').addEventListener('click', selectAllShapes);
document.getElementById('deselectAllShapes').addEventListener('click', deselectAllShapes);


// Function to trigger download
document.getElementById('downloadBtn').onclick = function () {
  const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
  const link = document.createElement('a');
  link.download = 'tileset.png';
  link.href = image;
  document.body.appendChild(link); // Temporarily add link to body for Firefox compatibility
  link.click();
  document.body.removeChild(link); // Remove the link when done
};


// Initial update on page load
window.onload = function () {
  // Initialize shape order before creating HTML
  initializeShapeOrder();
  createShapeSelectionHTML();
  const defaultColors = document.getElementById('colorInput').value.split(',');
  const defaultSize = parseInt(document.getElementById('sizeInput').value, 10);
  const complexitySlider = document.getElementById('paletteComplexity');

  // Draw initial shapes and generate initial palette
  drawShapes(defaultColors, defaultSize);
  generateColorPalette(parseInt(complexitySlider.value));

  // Add listener to the complexity slider to regenerate palette on change
  complexitySlider.addEventListener('input', function () {
    generateColorPalette(parseInt(this.value));
  });
  addShapeCheckboxesListeners();
  // Update colors preview initially
  updateColorsPreview();
  addShapePreviews();
  sanitizeColorInput();

  // Initialize hover buttons and drag-and-drop
  addShapeButtonListeners();
  setupDragAndDrop();

  // Initialize editor buttons
  setupEditorButtons();
};


// Monitor changes in the color input textarea and update preview accordingly
document.getElementById('colorInput').addEventListener('input', () => {
  updateColorsPreview();
  generateTileset();
});

document.getElementById('sizeInput').addEventListener('input', () => {
  updateColorsPreview();
  generateTileset();
});

// Fit preview checkbox
document.getElementById('fitPreview').addEventListener('change', function() {
  const previewBox = document.getElementById('previewBox');
  if (this.checked) {
    previewBox.classList.add('fit-mode');
  } else {
    previewBox.classList.remove('fit-mode');
  }
});


generateColorPalette();
