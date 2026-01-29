/* Color utilities and palette functions */

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// HSL to RGB conversion
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// Color wheel state
let colorWheelState = {
  hue: 0,
  saturation: 100,
  lightness: 50,
  opacity: 100
};

// Initialize color tabs
function initColorTabs() {
  const tabs = document.querySelectorAll('.color-tab');
  const contents = document.querySelectorAll('.color-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active content
      contents.forEach(c => c.classList.remove('active'));
      document.getElementById(`${targetTab}-tab`).classList.add('active');

      // Initialize color field when wheel tab is shown
      if (targetTab === 'wheel') {
        initColorField();
      }

      // Load palettes when palettes tab is shown (lazy loading)
      if (targetTab === 'palettes') {
        loadPalettes();
      }
    });
  });
}

// Palettes data cache
let palettesLoaded = false;
const paletteSources = [
  'swatches/muzli.json',
  'swatches/adobe.json',
  'swatches/colourlovers.json',
  'swatches/coolors.json',
  'swatches/colorhunt.json'
];

// Load and display palettes
async function loadPalettes() {
  if (palettesLoaded) return;

  const container = document.getElementById('palettesContainer');
  if (!container) return;

  container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading palettes...</div>';

  try {
    const results = await Promise.all(
      paletteSources.map(src => fetch(src).then(r => r.json()))
    );

    container.innerHTML = '';

    results.forEach(source => {
      const sourceDiv = document.createElement('div');
      sourceDiv.className = 'palette-source';

      // Palette rows
      source.palettes.forEach(palette => {
        const row = document.createElement('div');
        row.className = 'palette-row';

        // Color swatches
        palette.forEach(color => {
          const swatch = document.createElement('div');
          swatch.className = 'palette-color';
          swatch.style.backgroundColor = color;
          swatch.title = color;
          swatch.addEventListener('click', () => addColorToSelection(color));
          row.appendChild(swatch);
        });

        // Use button
        const useBtn = document.createElement('button');
        useBtn.className = 'palette-use-btn';
        useBtn.textContent = 'Use';
        useBtn.addEventListener('click', () => addPaletteToSelection(palette));
        row.appendChild(useBtn);

        sourceDiv.appendChild(row);
      });

      // Footer with credit link (above divider)
      const footer = document.createElement('div');
      footer.className = 'palette-source-footer';
      footer.innerHTML = `<a href="${source.url}" target="_blank">${source.url}</a>`;
      sourceDiv.appendChild(footer);

      container.appendChild(sourceDiv);
    });

    palettesLoaded = true;
  } catch (error) {
    console.error('Error loading palettes:', error);
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error loading palettes</div>';
  }
}

// Add a single color to the selection
function addColorToSelection(color) {
  // Remove # if present
  const hexColor = color.replace('#', '');
  const colorInput = document.getElementById('colorInput');

  if (colorInput.value) {
    colorInput.value += `, ${hexColor}`;
  } else {
    colorInput.value = hexColor;
  }

  updateColorsPreview();
  generateTileset();
}

// Add an entire palette to the selection
function addPaletteToSelection(palette) {
  const colorInput = document.getElementById('colorInput');
  const hexColors = palette.map(c => c.replace('#', ''));

  if (colorInput.value) {
    colorInput.value += `, ${hexColors.join(', ')}`;
  } else {
    colorInput.value = hexColors.join(', ');
  }

  updateColorsPreview();
  generateTileset();
}

// Initialize color field canvas
function initColorField() {
  const canvas = document.getElementById('colorFieldCanvas');
  if (!canvas) return;

  // Use requestAnimationFrame to ensure element is rendered
  requestAnimationFrame(() => {
    const rect = canvas.getBoundingClientRect();

    // Set canvas size to match display size (with fallback)
    canvas.width = rect.width || 300;
    canvas.height = rect.height || 150;

    drawColorField();
    updateWheelPreview();
    updateColorFieldCursor();
  });
}

// Draw the saturation/lightness color field
function drawColorField() {
  const canvas = document.getElementById('colorFieldCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Create gradients for the color field
  // Base color (full saturation at current hue)
  const hueColor = `hsl(${colorWheelState.hue}, 100%, 50%)`;

  // Horizontal gradient: white to hue color
  const gradientH = ctx.createLinearGradient(0, 0, width, 0);
  gradientH.addColorStop(0, 'white');
  gradientH.addColorStop(1, hueColor);

  ctx.fillStyle = gradientH;
  ctx.fillRect(0, 0, width, height);

  // Vertical gradient: transparent to black
  const gradientV = ctx.createLinearGradient(0, 0, 0, height);
  gradientV.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradientV.addColorStop(1, 'black');

  ctx.fillStyle = gradientV;
  ctx.fillRect(0, 0, width, height);
}

// Update the color preview
function updateWheelPreview() {
  const preview = document.getElementById('wheelColorPreview');
  const opacitySlider = document.getElementById('opacitySlider');
  if (!preview) return;

  const [r, g, b] = hslToRgb(colorWheelState.hue, colorWheelState.saturation, colorWheelState.lightness);
  const opacity = colorWheelState.opacity / 100;

  preview.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  // Update opacity slider background
  if (opacitySlider) {
    opacitySlider.style.background = `linear-gradient(to right, transparent, rgb(${r}, ${g}, ${b}))`;
  }
}

// Update cursor position on color field
function updateColorFieldCursor() {
  const cursor = document.getElementById('colorFieldCursor');
  const canvas = document.getElementById('colorFieldCanvas');
  if (!cursor || !canvas) return;

  // Convert saturation/lightness to x/y position
  // x: saturation (0 = left/white, 100 = right/color)
  // y: lightness inverse (0 = top/light, 100 = bottom/dark)
  const x = (colorWheelState.saturation / 100) * canvas.width;
  const y = ((100 - colorWheelState.lightness) / 100) * canvas.height;

  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
}

// Initialize color wheel controls
function initColorWheel() {
  const hueSlider = document.getElementById('hueSlider');
  const opacitySlider = document.getElementById('opacitySlider');
  const canvas = document.getElementById('colorFieldCanvas');
  const addBtn = document.getElementById('wheelAddBtn');

  if (hueSlider) {
    hueSlider.addEventListener('input', (e) => {
      colorWheelState.hue = parseInt(e.target.value);
      drawColorField();
      updateWheelPreview();
    });
  }

  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      colorWheelState.opacity = parseInt(e.target.value);
      updateWheelPreview();
    });
  }

  if (canvas) {
    let isDragging = false;

    const handleColorFieldClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert position to saturation/lightness
      colorWheelState.saturation = Math.max(0, Math.min(100, (x / canvas.width) * 100));
      colorWheelState.lightness = Math.max(0, Math.min(100, 100 - (y / canvas.height) * 100));

      updateWheelPreview();
      updateColorFieldCursor();
    };

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleColorFieldClick(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        handleColorFieldClick(e);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const [r, g, b] = hslToRgb(colorWheelState.hue, colorWheelState.saturation, colorWheelState.lightness);
      const hexColor = rgbToHex(r, g, b);

      const colorInput = document.getElementById('colorInput');
      if (colorInput.value) {
        colorInput.value += `, ${hexColor}`;
      } else {
        colorInput.value = hexColor;
      }

      updateColorsPreview();
      generateTileset();
    });
  }

  // Initialize tabs
  initColorTabs();

  // Load palettes on initial load (palettes tab is active by default)
  loadPalettes();
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
    button.setAttribute('title', `#${color} (Click to remove)`); // Shows color code and action hint

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


function generateColorPalette() {
  const palette = document.getElementById('colorPalette');
  palette.innerHTML = '';

  // Configuration for rainbow grid
  const hueSteps = 36;          // Rows: hue from 0-360 in 10-degree steps
  const saturationSteps = 3;    // Saturation levels: 100%, 66%, 33%
  const lightnessSteps = 9;     // Columns: lightness from 10% to 90%

  // Create rows organized by hue
  for (let hueIndex = 0; hueIndex < hueSteps; hueIndex++) {
    const hue = (hueIndex / hueSteps) * 360;
    const row = document.createElement('div');
    row.className = 'swatch-row';

    // For each hue, add columns with varying lightness and saturation
    for (let satIndex = 0; satIndex < saturationSteps; satIndex++) {
      const saturation = 100 - (satIndex * 33); // 100, 67, 34

      for (let lightIndex = 0; lightIndex < lightnessSteps; lightIndex++) {
        const lightness = 10 + (lightIndex * 10); // 10 to 90

        const [r, g, b] = hslToRgb(hue, saturation, lightness);
        const color = rgbToHex(r, g, b);

        const swatch = document.createElement('div');
        swatch.className = 'colorSquare';
        swatch.style.backgroundColor = `#${color}`;
        swatch.setAttribute('data-color', color);
        swatch.title = `#${color}`;
        swatch.addEventListener('click', function () {
          const colorInput = document.getElementById('colorInput');
          if (colorInput.value) {
            colorInput.value += `, ${this.getAttribute('data-color')}`;
          } else {
            colorInput.value = this.getAttribute('data-color');
          }
          updateColorsPreview();
          generateTileset();
        });
        row.appendChild(swatch);
      }
    }

    palette.appendChild(row);
  }

  // Add grayscale row at the end
  const grayRow = document.createElement('div');
  grayRow.className = 'swatch-row swatch-row-gray';

  for (let i = 0; i < 27; i++) {
    const gray = Math.round((i / 26) * 255);
    const color = rgbToHex(gray, gray, gray);

    const swatch = document.createElement('div');
    swatch.className = 'colorSquare';
    swatch.style.backgroundColor = `#${color}`;
    swatch.setAttribute('data-color', color);
    swatch.title = `#${color}`;
    swatch.addEventListener('click', function () {
      const colorInput = document.getElementById('colorInput');
      if (colorInput.value) {
        colorInput.value += `, ${this.getAttribute('data-color')}`;
      } else {
        colorInput.value = this.getAttribute('data-color');
      }
      updateColorsPreview();
      generateTileset();
    });
    grayRow.appendChild(swatch);
  }

  palette.appendChild(grayRow);
}
