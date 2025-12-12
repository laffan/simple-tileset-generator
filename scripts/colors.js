/* Color utilities and palette functions */

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function updateColorsPreview() {
  const colorInput = document.getElementById('colorInput');
  const colors = colorInput.value.split(',').map(color => color.trim()).filter(color => color);
  const previewContainer = document.getElementById('colorsPreviewContainer');

  // Clear the current preview
  previewContainer.innerHTML = '';

  // Create a button for each color in the input
  colors.forEach((color, index) => {
    const button = document.createElement('button');
    button.className = 'colorPreviewButton';
    button.style.backgroundColor = `#${color}`;
    button.setAttribute('title', `#${color}`); // Optional: shows color code on hover

    // Remove the color from the input when the button is clicked
    button.addEventListener('click', function () {
      // Directly manipulate array and reassign to input field
      colors.splice(index, 1); // Remove the color from array
      const cleanColorString = colors.join(', ').trim(); // Join and trim the array to string
      colorInput.value = cleanColorString + ", ";
      updateColorsPreview(); // Recursively update the preview
      generateTileset();
    });

    previewContainer.appendChild(button);
  });
}


function addColorSquareToPalette(color, palette) {
  const colorSquare = document.createElement('div');
  colorSquare.classList.add('colorSquare');
  colorSquare.style.backgroundColor = `#${color}`;
  colorSquare.setAttribute('data-color', color);
  colorSquare.addEventListener('click', function () {
    const colorInput = document.getElementById('colorInput');
    // Append selected color to colorInput value, ensuring not to leave trailing commas
    if (colorInput.value) {
      colorInput.value += `, ${this.getAttribute('data-color')}`;
    } else {
      colorInput.value = this.getAttribute('data-color');
    }
    updateColorsPreview();
    generateTileset();
  });
  palette.appendChild(colorSquare);
}


function generateColorPalette(complexity) {
  const palette = document.getElementById('colorPalette');
  palette.innerHTML = '';

  // Generate grayscales
  for (let gray = 0; gray < 256; gray += complexity) {
    const color = rgbToHex(gray, gray, gray);
    addColorSquareToPalette(color, palette);
  }

  // Generate the rest of the colors
  for (let r = 0; r < 256; r += complexity) {
    for (let g = 0; g < 256; g += complexity) {
      for (let b = 0; b < 256; b += complexity) {
        const color = rgbToHex(r, g, b);
        addColorSquareToPalette(color, palette);
      }
    }
  }
}
