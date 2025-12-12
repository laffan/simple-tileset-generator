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


// Draw a shape using the registry
function drawShape(x, y, size, ctx, shape) {
  ctx.imageSmoothingEnabled = true;
  ctx.mozImageSmoothingEnabled = true;
  ctx.webkitImageSmoothingEnabled = true;
  ctx.msImageSmoothingEnabled = true;

  // Look up the renderer in the registry and call it
  if (shapeRenderers[shape]) {
    shapeRenderers[shape](x, y, size, ctx);
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
