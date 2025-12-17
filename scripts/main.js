/* Main application - initialization and event listeners */

function generateTileset() {
  const colorInput = document.getElementById('colorInput').value;
  const sizeInput = parseInt(document.getElementById('sizeInput').value, 10) || 64;
  // Split by comma, then filter out empty strings and strings that only contain whitespace
  const colors = colorInput.split(',')
    .map(color => color.trim()) // Remove whitespace from both ends of each color string
    .filter(color => color); // Filter out empty strings after trim
  drawShapes(colors, sizeInput);
}


// Add event listeners to the "all" and "none" links for shapes
document.getElementById('selectAllShapes').addEventListener('click', selectAllShapes);
document.getElementById('deselectAllShapes').addEventListener('click', deselectAllShapes);

// Add event listeners to the "all" and "none" links for patterns
document.getElementById('selectAllPatterns').addEventListener('click', selectAllPatterns);
document.getElementById('deselectAllPatterns').addEventListener('click', deselectAllPatterns);

// Add event listeners to the "all" and "none" links for combinations
document.getElementById('selectAllCombinations').addEventListener('click', selectAllCombinations);
document.getElementById('deselectAllCombinations').addEventListener('click', deselectAllCombinations);


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

  // Initialize pattern order before creating HTML
  initializePatternOrder();
  createPatternSelectionHTML();

  // Initialize combination order before creating HTML
  initializeCombinationOrder();
  createCombinationSelectionHTML();

  const defaultColors = document.getElementById('colorInput').value.split(',');
  const defaultSize = parseInt(document.getElementById('sizeInput').value, 10);
  const complexitySlider = document.getElementById('paletteComplexity');

  // Function to invert slider value (so right = more colors)
  // Slider range is 14-128, where lower step = more colors
  function getInvertedComplexity(slider) {
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const value = parseInt(slider.value);
    return max - value + min; // Invert: left=128 (few), right=14 (many)
  }

  // Draw initial shapes and generate initial palette
  drawShapes(defaultColors, defaultSize);
  generateColorPalette(getInvertedComplexity(complexitySlider));

  // Function to update slider fill
  function updateSliderFill(slider) {
    const min = slider.min || 0;
    const max = slider.max || 100;
    const value = slider.value;
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.setProperty('--slider-fill', percentage + '%');
  }

  // Initialize slider fill
  updateSliderFill(complexitySlider);

  // Add listener to the complexity slider to regenerate palette on change
  complexitySlider.addEventListener('input', function () {
    generateColorPalette(getInvertedComplexity(this));
    updateSliderFill(this);
  });

  // Shape listeners and previews
  addShapeCheckboxesListeners();
  addShapePreviews();
  addShapeButtonListeners();
  setupDragAndDrop();

  // Pattern listeners and previews
  addPatternCheckboxesListeners();
  addPatternPreviews();
  addPatternButtonListeners();
  setupPatternDragAndDrop();

  // Combination listeners and previews
  addCombinationCheckboxesListeners();
  addCombinationPreviews();
  addCombinationButtonListeners();
  setupCombinationDragAndDrop();

  // Update colors preview initially
  updateColorsPreview();
  sanitizeColorInput();

  // Initialize shape editor buttons
  setupEditorButtons();

  // Initialize pattern editor buttons
  setupPatternEditorButtons();

  // Initialize shape toolbar
  setupShapeToolbar();

  // Initialize combination editor buttons
  if (typeof setupCombinationEditorButtons === 'function') {
    setupCombinationEditorButtons();
  }

  // Initialize tile size controls and custom size modals
  setupTileSizeControls();
  setupCustomSizeModal();
  setupPatternSizeButtons();
  setupCustomPatternSizeModal();

  // Initialize color wheel (with safeguard)
  if (typeof initColorWheel === 'function') {
    initColorWheel();
  }

  // Initialize tile tester
  if (typeof initTileTester === 'function') {
    initTileTester();
  }
};


// Monitor changes in the color input textarea and update preview accordingly
document.getElementById('colorInput').addEventListener('input', () => {
  updateColorsPreview();
  generateTileset();
});

// Note: sizeInput is now controlled by tile size buttons in sizeControls.js

// Fit preview checkbox
document.getElementById('fitPreview').addEventListener('change', function() {
  const previewBox = document.getElementById('previewBox');
  if (this.checked) {
    previewBox.classList.add('fit-mode');
  } else {
    previewBox.classList.remove('fit-mode');
  }
});


// Initial palette generation (will be overwritten by window.onload)
generateColorPalette(40);
