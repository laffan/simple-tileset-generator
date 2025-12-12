/* Shape-related functions */

function createShapeSelectionHTML() {
  const shapeSelectionContainer = document.getElementById('shapeSelection');
  const ul = document.createElement('ul');
  ul.style.listStyleType = 'none';
  ul.style.padding = '0';

  shapes.forEach(shape => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    const preview = document.createElement('span');
    checkbox.type = 'checkbox';
    checkbox.className = 'shapeCheckbox';
    checkbox.id = shape;
    checkbox.checked = shape === 'square'; // Check 'square' by default
    preview.className = 'shapePreview'
    const label = document.createElement('label');
    label.appendChild(checkbox);
    label.appendChild(preview);
    // label.appendChild(document.createTextNode(shape));

    li.appendChild(label);
    ul.appendChild(li);
  });

  shapeSelectionContainer.appendChild(ul);
}


function createShapePreview(shape) {
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 40;
  previewCanvas.height = 40;
  const previewCtx = previewCanvas.getContext('2d');
  previewCtx.fillStyle = 'black';
  drawShape(0, 0, 40, previewCtx, shape);
  return previewCanvas;
}


// Helper function to collect selected shapes
function getSelectedShapes() {
  return shapes.filter(shape => document.getElementById(shape).checked);
}


// Update the drawShape function to handle different shapes
function drawShape(x, y, size, ctx, shape) {
  ctx.imageSmoothingEnabled = true;
  ctx.mozImageSmoothingEnabled = true;
  ctx.webkitImageSmoothingEnabled = true;
  ctx.msImageSmoothingEnabled = true;

  // Adjust x, y for centering non-square shapes if necessary
  switch (shape) {
    case "square":
      ctx.fillRect(x, y, size, size);
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y + size);
      ctx.closePath();
      ctx.fill();
      break;
    case "topTriangle":
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "bottomTriangle":
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "leftTriangle":
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "rightTriangle":
      ctx.beginPath();
      ctx.moveTo(x + size, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "smallCircle":
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y);
      ctx.lineTo(x + size, y + size / 2);
      ctx.lineTo(x + size / 2, y + size);
      ctx.lineTo(x, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "halfCircleTop":
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size, size / 2, Math.PI, 0, false);
      ctx.lineTo(x + size / 2, y + size);
      ctx.fill();
      break;
    case "halfCircleBottom":
      ctx.beginPath();
      ctx.arc(x + size / 2, y, size / 2, Math.PI, 0, true);
      ctx.lineTo(x + size / 2, y);
      ctx.fill();
      break;
    case "halfCircleLeft":
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI * 1.5, Math.PI / 2, true);
      ctx.lineTo(x + size / 2, y + size / 2); // Close path towards the starting point
      ctx.fill();
      break;
    case "halfCircleRight":
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI / 2, Math.PI * 1.5, true);
      ctx.lineTo(x + size / 2, y + size / 2); // Close path towards the starting point
      ctx.fill();
      break;
    case "waves":
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
      break;

    case "spikes":
      // Left Spike
      ctx.beginPath();
      ctx.moveTo(x, y + size / 2);
      ctx.lineTo(x + size / 2, y + size);
      ctx.lineTo(x, y + size);
      ctx.closePath();
      ctx.fill();

      // Right Spike
      ctx.beginPath();
      ctx.moveTo(x + size, y + size / 2);
      ctx.lineTo(x + size / 2, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.closePath();
      ctx.fill();
      break;
    case "quarterCircleTopLeft":
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x + size, y);
      ctx.arc(x + size, y + size, size, Math.PI, 1.5 * Math.PI, false);
      ctx.closePath();
      ctx.fill();
      break;
    case "quarterCircleTopRight":
      ctx.beginPath();
      ctx.moveTo(x + size, y + size);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x, y);
      ctx.arc(x, y + size, size, 1.5 * Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      break;
    case "quarterCircleBottomLeft":
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size, y + size);
      ctx.arc(x + size, y, size, 0.5 * Math.PI, Math.PI, false);
      ctx.closePath();
      ctx.fill();
      break;
    case "quarterCircleBottomRight":
      ctx.beginPath();
      ctx.moveTo(x + size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + size);
      ctx.arc(x, y, size, 0, 0.5 * Math.PI, false);
      ctx.closePath();
      ctx.fill();
      break;

    case "angleTopLeft":
      ctx.beginPath();
      ctx.moveTo(x + size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + size);
      ctx.closePath();
      ctx.fill();
      break;
    case "angleTopRight":
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size, y + size);
      ctx.closePath();
      ctx.fill();
      break;

    case "angleBottomLeft":
      ctx.beginPath();
      ctx.moveTo(x + size, y + size);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();
      break;
    case "angleBottomRight":
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x + size, y);
      ctx.closePath();
      ctx.fill();
      break;

    case "bigDots":
      const bigDotSize = size / 2;
      const bigDotSpacing = size / 2;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.beginPath();
          ctx.arc(
            x + (i * bigDotSpacing) + (bigDotSize / 2),
            y + (j * bigDotSpacing) + (bigDotSize / 2),
            bigDotSize / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      break;
    case "smallDots":
      const smallDotSize = size / 3;
      const smallDotSpacing = size / 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(
            x + (i * smallDotSpacing) + (smallDotSize / 2),
            y + (j * smallDotSpacing) + (smallDotSize / 2),
            smallDotSize / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      break;
    case "donut":
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      break;

    case "lineAcross":
      const lineAcrossWidth = size / 3;
      const lineAcrossHeight = size;
      const lineAcrossX = x + (size - lineAcrossWidth) / 2;
      const lineAcrossY = y;
      ctx.fillRect(lineAcrossX, lineAcrossY, lineAcrossWidth, lineAcrossHeight);
      break;

    case "lineUp":
      const lineUpWidth = size;
      const lineUpHeight = size / 3;
      const lineUpX = x;
      const lineUpY = y + (size - lineUpHeight) / 2;
      ctx.fillRect(lineUpX, lineUpY, lineUpWidth, lineUpHeight);
      break;
  }
}

// Function to select all shape checkboxes
function selectAllShapes() {
  const shapeCheckboxes = document.querySelectorAll('.shapeCheckbox');
  shapeCheckboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  generateTileset();
}

// Function to deselect all shape checkboxes
function deselectAllShapes() {
  const shapeCheckboxes = document.querySelectorAll('.shapeCheckbox');
  shapeCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  generateTileset();
}

// Function to add event listeners to shape checkboxes
function addShapeCheckboxesListeners() {
  const shapeCheckboxes = document.querySelectorAll('.shapeCheckbox');
  shapeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {

      // Grab the current color selections and size
      const colorInput = document.getElementById('colorInput').value;
      const sizeInput = parseInt(document.getElementById('sizeInput').value, 10) || 50;

      const colors = colorInput.split(',').map(color => color.trim()).filter(color => color);

      // Redraw the shapes based on selected colors, size, and shapes
      drawShapes(colors, sizeInput);

    });
  });
}


function addShapePreviews() {
  const shapePreviewContainers = document.querySelectorAll('.shapePreview');
  shapePreviewContainers.forEach((container, index) => {
    const shape = container.parentElement.querySelector('input').id;
    const previewCanvas = createShapePreview(shape);
    container.appendChild(previewCanvas);
  });
}
