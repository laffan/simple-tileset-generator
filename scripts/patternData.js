/* Pattern data helpers - pattern data is in individual files in patterns/ directory */
/* The patternPixelData is defined in patterns/registry.js */

// List of built-in patterns in order
const patterns = [
  "checkerboard",
  "diagonalStripes",
  "dots",
  "horizontalStripes",
  "verticalStripes",
  "crosshatch",
  "bricks",
  "zigzag",
  "ditherLight",
  "ditherMediumLight",
  "ditherMedium",
  "ditherMediumDense",
  "ditherDense",
  "ditherHeavy"
];

// Helper function to get pattern data, with fallback to checkerboard
function getPatternPixelData(patternName) {
  return patternPixelData[patternName] || patternPixelData.checkerboard;
}

// Check if a pattern name is a custom pattern
function isCustomPattern(patternName) {
  return patternName && patternName.startsWith('pattern_');
}

// Generate a unique ID for a custom pattern
function generateCustomPatternId() {
  return 'pattern_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Dedicated storage for custom patterns (separate from built-in patterns)
const customPatternRegistry = {};

// Register a custom pattern with its pixel data
function registerCustomPattern(patternId, pixelData) {
  // Store in dedicated custom pattern registry
  customPatternRegistry[patternId] = pixelData;
  // Also add to main pattern pixel data
  patternPixelData[patternId] = pixelData;
  // Register a renderer for this custom pattern
  patternRenderers[patternId] = function(x, y, size, ctx) {
    drawPatternFromPixelData(x, y, size, ctx, pixelData);
  };
}

// Draw a pattern from pixel data
function drawPatternFromPixelData(x, y, size, ctx, data) {
  if (!data || !data.pixels) return;

  const patternSize = data.size || data.pixels.length;
  const pixelSize = size / patternSize;

  for (let row = 0; row < patternSize; row++) {
    for (let col = 0; col < patternSize; col++) {
      if (data.pixels[row] && data.pixels[row][col] === 1) {
        ctx.fillRect(
          x + col * pixelSize,
          y + row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
}

// Get all custom pattern data for session saving
function getCustomPatternData() {
  const customData = {};
  for (const key in customPatternRegistry) {
    if (customPatternRegistry.hasOwnProperty(key)) {
      customData[key] = JSON.parse(JSON.stringify(customPatternRegistry[key]));
    }
  }
  return customData;
}

// Load custom pattern data from session
function loadCustomPatternData(customData) {
  if (!customData) return;
  for (const key in customData) {
    if (customData.hasOwnProperty(key)) {
      registerCustomPattern(key, customData[key]);
    }
  }
}

// Create an empty pattern grid of given size
function createEmptyPattern(size) {
  const pixels = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(0);
    }
    pixels.push(row);
  }
  return { size: size, pixels: pixels };
}

// Deep copy pattern data
function copyPatternData(data) {
  return JSON.parse(JSON.stringify(data));
}

// Invert pattern pixels
function invertPatternPixels(data) {
  const inverted = copyPatternData(data);
  for (let row = 0; row < inverted.pixels.length; row++) {
    for (let col = 0; col < inverted.pixels[row].length; col++) {
      inverted.pixels[row][col] = inverted.pixels[row][col] === 1 ? 0 : 1;
    }
  }
  return inverted;
}
