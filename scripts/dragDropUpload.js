/* Drag and Drop File Upload - Global file drop handling for shapes (SVG) and patterns (PNG) */

// State for tracking drag operations
const DragDropState = {
  isDragging: false,
  dragCounter: 0, // Counter to track nested dragenter/dragleave events
  activeDropZone: null, // 'shapes', 'patterns', or 'both'
  errorTimeout: null
};

// Initialize drag and drop handlers
function setupDragDropUpload() {
  // Prevent default drag behaviors on the whole document
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, preventDefaults, false);
  });

  // Handle drag enter on document
  document.addEventListener('dragenter', handleDragEnter, false);

  // Handle drag over on document
  document.addEventListener('dragover', handleDragOver, false);

  // Handle drag leave on document
  document.addEventListener('dragleave', handleDragLeave, false);

  // Handle drop on document
  document.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDragEnter(e) {
  DragDropState.dragCounter++;

  // Check if we're dragging files
  if (!e.dataTransfer || !e.dataTransfer.types.includes('Files')) {
    return;
  }

  DragDropState.isDragging = true;

  // Try to determine file type from the drag event
  // Note: File type info may not be available on all browsers during dragenter
  const items = e.dataTransfer.items;
  let detectedType = null;

  if (items && items.length > 0) {
    const item = items[0];
    if (item.kind === 'file') {
      const type = item.type;
      if (type === 'image/svg+xml') {
        detectedType = 'svg';
      } else if (type.startsWith('image/')) {
        detectedType = 'image';
      }
    }
  }

  // Show drop zones based on detected type
  // If we can't determine the type, show both zones
  if (detectedType === 'svg') {
    showDropZone('shapes');
  } else if (detectedType === 'image') {
    showDropZone('patterns');
  } else {
    // Unknown type - show both drop zones
    showDropZone('both');
  }
}

function handleDragOver(e) {
  if (!DragDropState.isDragging) return;

  // Determine which zone the cursor is over for highlighting
  const shapeSection = document.getElementById('shapeSelection');
  const patternSection = document.getElementById('patternSelection');

  const shapeBounds = shapeSection?.getBoundingClientRect();
  const patternBounds = patternSection?.getBoundingClientRect();

  const x = e.clientX;
  const y = e.clientY;

  // Update visual highlighting based on cursor position
  const shapeOverlay = shapeSection?.querySelector('.file-drop-overlay');
  const patternOverlay = patternSection?.querySelector('.file-drop-overlay');

  const isOverShapes = shapeBounds && x >= shapeBounds.left && x <= shapeBounds.right &&
      y >= shapeBounds.top && y <= shapeBounds.bottom;
  const isOverPatterns = patternBounds && x >= patternBounds.left && x <= patternBounds.right &&
      y >= patternBounds.top && y <= patternBounds.bottom;

  // Add hover class for enhanced visual feedback
  if (shapeOverlay) {
    shapeOverlay.classList.toggle('hover', isOverShapes);
  }
  if (patternOverlay) {
    patternOverlay.classList.toggle('hover', isOverPatterns);
  }
}

function handleDragLeave(e) {
  DragDropState.dragCounter--;

  // Only hide drop zone when actually leaving the document
  if (DragDropState.dragCounter === 0) {
    hideAllDropZones();
    DragDropState.isDragging = false;
  }
}

function handleDrop(e) {
  DragDropState.dragCounter = 0;
  DragDropState.isDragging = false;

  const files = e.dataTransfer.files;
  if (!files || files.length === 0) {
    hideAllDropZones();
    return;
  }

  const file = files[0];
  const fileName = file.name.toLowerCase();

  // Determine where to drop based on file type
  if (file.type === 'image/svg+xml' || fileName.endsWith('.svg')) {
    handleSVGDrop(file);
  } else if (file.type === 'image/png' || fileName.endsWith('.png')) {
    handlePNGDrop(file);
  } else if (file.type.startsWith('image/')) {
    // Other image types - try as pattern
    handlePNGDrop(file);
  } else {
    showDropError('Unsupported file type. Use SVG for shapes or PNG for patterns.');
  }

  hideAllDropZones();
}

// Show drop zone for shapes, patterns, or both
function showDropZone(zone) {
  hideAllDropZones();
  DragDropState.activeDropZone = zone;

  const zonesToShow = zone === 'both' ? ['shapes', 'patterns'] : [zone];

  zonesToShow.forEach(zoneName => {
    const targetSection = zoneName === 'shapes'
      ? document.getElementById('shapeSelection')
      : document.getElementById('patternSelection');

    if (targetSection) {
      // Create or show overlay
      let overlay = targetSection.querySelector('.file-drop-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'file-drop-overlay';
        overlay.dataset.zone = zoneName;
        overlay.innerHTML = `
          <div class="file-drop-content">
            <div class="file-drop-icon">${zoneName === 'shapes' ? '&#9670;' : '&#9638;'}</div>
            <div class="file-drop-text">Drop ${zoneName === 'shapes' ? 'SVG' : 'PNG'} to add ${zoneName === 'shapes' ? 'shape' : 'pattern'}</div>
          </div>
        `;
        targetSection.appendChild(overlay);
      }
      overlay.classList.add('active');
    }
  });
}

// Hide all drop zones
function hideAllDropZones() {
  DragDropState.activeDropZone = null;

  document.querySelectorAll('.file-drop-overlay').forEach(overlay => {
    overlay.classList.remove('active');
  });
}

// Show error message in drop zone
function showDropError(message) {
  // Clear any existing error timeout
  if (DragDropState.errorTimeout) {
    clearTimeout(DragDropState.errorTimeout);
  }

  // Show error notification
  let errorEl = document.getElementById('dropErrorNotification');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.id = 'dropErrorNotification';
    errorEl.className = 'drop-error-notification';
    document.body.appendChild(errorEl);
  }

  errorEl.textContent = message;
  errorEl.classList.add('active');

  // Hide after 4 seconds
  DragDropState.errorTimeout = setTimeout(() => {
    errorEl.classList.remove('active');
  }, 4000);
}

// Handle SVG file drop
function handleSVGDrop(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const svgContent = event.target.result;
    createShapeFromSVG(svgContent);
  };
  reader.onerror = function() {
    showDropError('Failed to read SVG file.');
  };
  reader.readAsText(file);
}

// Create a new shape from SVG content
function createShapeFromSVG(svgContent) {
  // Parse SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svg = doc.querySelector('svg');

  if (!svg) {
    showDropError('Invalid SVG file.');
    return;
  }

  // Get viewBox for coordinate transformation
  const viewBox = svg.getAttribute('viewBox');
  let svgWidth = 100, svgHeight = 100;
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(parseFloat);
    if (parts.length >= 4) {
      svgWidth = parts[2];
      svgHeight = parts[3];
    }
  }

  // Get fill-rule from SVG root
  const fillRule = svg.getAttribute('fill-rule') || 'nonzero';

  // Find all path elements
  const pathElements = svg.querySelectorAll('path');
  if (pathElements.length === 0) {
    showDropError('No paths found in SVG.');
    return;
  }

  // Parse paths and create shape data
  const pathDataList = [];
  const holePathIndices = [];

  pathElements.forEach((pathEl, index) => {
    const d = pathEl.getAttribute('d');
    if (!d) return;

    const pathData = parseSVGPathDataForDrop(d, svgWidth, svgHeight);
    if (!pathData || !pathData.vertices || pathData.vertices.length < 2) return;

    // Check if this path is marked as a hole
    const isHole = pathEl.getAttribute('data-hole') === 'true';
    if (isHole) {
      holePathIndices.push(pathDataList.length);
    }

    pathDataList.push(pathData);
  });

  if (pathDataList.length === 0) {
    showDropError('Could not parse any valid paths from SVG.');
    return;
  }

  // Scale paths to fit within 0-1 bounds
  const scaledPaths = scalePathsToFit(pathDataList);

  // Create the final shape data
  let shapeData;
  if (scaledPaths.length === 1) {
    shapeData = scaledPaths[0];
  } else {
    shapeData = { paths: scaledPaths };
    if (fillRule === 'evenodd') {
      shapeData.fillRule = 'evenodd';
    }
    if (holePathIndices.length > 0) {
      shapeData.holePathIndices = holePathIndices;
    }
  }

  // Generate unique ID and register the shape
  const customId = generateCustomShapeId();
  registerCustomShape(customId, shapeData);

  // Add to shape order and rebuild list
  shapeOrder.push(customId);
  rebuildShapeList();

  // Check the new shape
  const newCheckbox = document.querySelector(`.shapeCheckbox[data-shape="${customId}"]`);
  if (newCheckbox) {
    newCheckbox.checked = true;
  }

  generateTileset();
}

// Scale paths to fit within 0-1 normalized bounds
function scalePathsToFit(pathDataList) {
  // Find bounding box of all paths
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  pathDataList.forEach(pathData => {
    pathData.vertices.forEach(v => {
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
    });
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const maxDim = Math.max(width, height);

  if (maxDim === 0) return pathDataList;

  // Calculate scale and offset to center and fit within 0-1
  const scale = 1 / maxDim;
  const offsetX = -minX * scale + (1 - width * scale) / 2;
  const offsetY = -minY * scale + (1 - height * scale) / 2;

  // Scale all paths
  return pathDataList.map(pathData => {
    const scaledVertices = pathData.vertices.map(v => {
      const scaled = {
        x: v.x * scale + offsetX,
        y: v.y * scale + offsetY
      };

      // Scale control points if present
      if (v.ctrlLeft) {
        scaled.ctrlLeft = {
          x: v.ctrlLeft.x * scale,
          y: v.ctrlLeft.y * scale
        };
      }
      if (v.ctrlRight) {
        scaled.ctrlRight = {
          x: v.ctrlRight.x * scale,
          y: v.ctrlRight.y * scale
        };
      }

      return scaled;
    });

    return {
      vertices: scaledVertices,
      closed: pathData.closed
    };
  });
}

// Parse SVG path data (simplified version for drop handling)
function parseSVGPathDataForDrop(d, svgWidth, svgHeight) {
  // Use the existing parseSVGPathData function if available
  if (typeof parseSVGPathData === 'function') {
    return parseSVGPathData(d, svgWidth, svgHeight);
  }

  // Fallback basic parsing
  const vertices = [];
  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;
  let closed = false;

  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g) || [];

  let i = 0;
  let currentCommand = '';

  while (i < tokens.length) {
    const token = tokens[i];

    if (/^[MmLlHhVvCcSsQqTtAaZz]$/.test(token)) {
      currentCommand = token;
      i++;
      continue;
    }

    switch (currentCommand) {
      case 'M':
        currentX = parseFloat(tokens[i]);
        currentY = parseFloat(tokens[i + 1]);
        startX = currentX;
        startY = currentY;
        vertices.push({ x: currentX / svgWidth, y: currentY / svgHeight });
        currentCommand = 'L';
        i += 2;
        break;

      case 'm':
        currentX += parseFloat(tokens[i]);
        currentY += parseFloat(tokens[i + 1]);
        startX = currentX;
        startY = currentY;
        vertices.push({ x: currentX / svgWidth, y: currentY / svgHeight });
        currentCommand = 'l';
        i += 2;
        break;

      case 'L':
        currentX = parseFloat(tokens[i]);
        currentY = parseFloat(tokens[i + 1]);
        vertices.push({ x: currentX / svgWidth, y: currentY / svgHeight });
        i += 2;
        break;

      case 'l':
        currentX += parseFloat(tokens[i]);
        currentY += parseFloat(tokens[i + 1]);
        vertices.push({ x: currentX / svgWidth, y: currentY / svgHeight });
        i += 2;
        break;

      case 'H':
        currentX = parseFloat(tokens[i]);
        vertices.push({ x: currentX / svgWidth, y: currentY / svgHeight });
        i += 1;
        break;

      case 'h':
        currentX += parseFloat(tokens[i]);
        vertices.push({ x: currentX / svgWidth, y: currentY / svgHeight });
        i += 1;
        break;

      case 'V':
        currentY = parseFloat(tokens[i]);
        vertices.push({ x: currentX / svgWidth, y: currentY / svgHeight });
        i += 1;
        break;

      case 'v':
        currentY += parseFloat(tokens[i]);
        vertices.push({ x: currentX / svgWidth, y: currentY / svgHeight });
        i += 1;
        break;

      case 'C':
        {
          const cp1x = parseFloat(tokens[i]);
          const cp1y = parseFloat(tokens[i + 1]);
          const cp2x = parseFloat(tokens[i + 2]);
          const cp2y = parseFloat(tokens[i + 3]);
          const x = parseFloat(tokens[i + 4]);
          const y = parseFloat(tokens[i + 5]);

          if (vertices.length > 0) {
            const prevVertex = vertices[vertices.length - 1];
            prevVertex.ctrlRight = {
              x: (cp1x - currentX) / svgWidth,
              y: (cp1y - currentY) / svgHeight
            };
          }

          vertices.push({
            x: x / svgWidth,
            y: y / svgHeight,
            ctrlLeft: {
              x: (cp2x - x) / svgWidth,
              y: (cp2y - y) / svgHeight
            }
          });

          currentX = x;
          currentY = y;
          i += 6;
        }
        break;

      case 'c':
        {
          const cp1x = currentX + parseFloat(tokens[i]);
          const cp1y = currentY + parseFloat(tokens[i + 1]);
          const cp2x = currentX + parseFloat(tokens[i + 2]);
          const cp2y = currentY + parseFloat(tokens[i + 3]);
          const x = currentX + parseFloat(tokens[i + 4]);
          const y = currentY + parseFloat(tokens[i + 5]);

          if (vertices.length > 0) {
            const prevVertex = vertices[vertices.length - 1];
            prevVertex.ctrlRight = {
              x: (cp1x - currentX) / svgWidth,
              y: (cp1y - currentY) / svgHeight
            };
          }

          vertices.push({
            x: x / svgWidth,
            y: y / svgHeight,
            ctrlLeft: {
              x: (cp2x - x) / svgWidth,
              y: (cp2y - y) / svgHeight
            }
          });

          currentX = x;
          currentY = y;
          i += 6;
        }
        break;

      case 'Z':
      case 'z':
        closed = true;
        currentX = startX;
        currentY = startY;
        i++;
        break;

      default:
        i++;
        break;
    }
  }

  return { vertices, closed };
}

// Handle PNG file drop
function handlePNGDrop(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      validateAndCreatePattern(img);
    };
    img.onerror = function() {
      showDropError('Failed to load image.');
    };
    img.src = event.target.result;
  };
  reader.onerror = function() {
    showDropError('Failed to read image file.');
  };
  reader.readAsDataURL(file);
}

// Validate PNG and create pattern
function validateAndCreatePattern(img) {
  const width = img.width;
  const height = img.height;

  // Validation: must be square
  if (width !== height) {
    showDropError(`Image must be square. Got ${width}x${height}px.`);
    return;
  }

  // Validation: must be <= 256px
  if (width > 256) {
    showDropError(`Image must be 256px or smaller. Got ${width}px.`);
    return;
  }

  // Create pattern from image
  createPatternFromImage(img);
}

// Create a new pattern from an image
function createPatternFromImage(img) {
  const size = img.width; // Already validated as square

  // Create temporary canvas to read pixels
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = size;
  tempCanvas.height = size;

  // Draw image
  tempCtx.drawImage(img, 0, 0, size, size);

  // Read pixel data
  const imageData = tempCtx.getImageData(0, 0, size, size);
  const pixels = imageData.data;

  // Convert to binary pattern (threshold at 50% brightness)
  const patternPixels = [];
  for (let row = 0; row < size; row++) {
    patternPixels[row] = [];
    for (let col = 0; col < size; col++) {
      const i = (row * size + col) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const brightness = (r + g + b) / 3;
      patternPixels[row][col] = brightness < 128 ? 1 : 0;
    }
  }

  // Create pattern data
  const patternData = {
    size: size,
    pixels: patternPixels
  };

  // Generate unique ID and register the pattern
  const customId = generateCustomPatternId();
  registerCustomPattern(customId, patternData);

  // Add to pattern order and rebuild list
  patternOrder.push(customId);
  rebuildPatternList();

  // Check the new pattern
  const newCheckbox = document.querySelector(`.patternCheckbox[data-pattern="${customId}"]`);
  if (newCheckbox) {
    newCheckbox.checked = true;
  }

  generateTileset();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDragDropUpload);
} else {
  setupDragDropUpload();
}
