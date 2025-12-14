/* Tile Tester Layers Panel - Layer management UI */

// Setup the layers panel
function setupLayersPanel() {
  renderLayersList();
  setupLayersPanelEvents();
}

// Render the layers list
function renderLayersList() {
  const container = document.getElementById('tileTesterLayersList');
  if (!container) return;

  container.innerHTML = '';

  // Render layers in reverse order (top layer first in UI)
  const layers = [...TileTesterState.layers].reverse();

  layers.forEach((layer, displayIndex) => {
    const actualIndex = TileTesterState.layers.length - 1 - displayIndex;
    const layerEl = createLayerElement(layer, actualIndex);
    container.appendChild(layerEl);
  });
}

// Create a layer list item element
function createLayerElement(layer, index) {
  const div = document.createElement('div');
  div.className = 'tester-layer-item' + (layer.id === TileTesterState.activeLayerId ? ' active' : '');
  div.dataset.layerId = layer.id;
  div.dataset.index = index;
  div.draggable = true;

  div.innerHTML = `
    <div class="tester-layer-drag-handle">&#x2630;</div>
    <div class="tester-layer-info">
      <span class="tester-layer-name">${layer.name}</span>
    </div>
    <div class="tester-layer-controls">
      <input type="range" class="tester-layer-opacity"
             min="0" max="100" value="${Math.round(layer.opacity * 100)}"
             title="Opacity: ${Math.round(layer.opacity * 100)}%">
      <button class="tester-layer-delete" title="Delete layer">&times;</button>
    </div>
  `;

  // Click to select layer
  div.addEventListener('click', function(e) {
    if (e.target.closest('.tester-layer-controls')) return;
    if (e.target.closest('.tester-layer-drag-handle')) return;
    TileTesterState.activeLayerId = layer.id;
    renderLayersList();
  });

  // Opacity slider
  const opacitySlider = div.querySelector('.tester-layer-opacity');
  opacitySlider.addEventListener('input', function(e) {
    e.stopPropagation();
    setLayerOpacity(layer.id, this.value / 100);
    this.title = 'Opacity: ' + this.value + '%';
  });

  // Delete button
  const deleteBtn = div.querySelector('.tester-layer-delete');
  deleteBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (TileTesterState.layers.length > 1) {
      deleteTileTesterLayer(layer.id);
    }
  });

  return div;
}

// Setup drag and drop for layer reordering
function setupLayersPanelEvents() {
  const container = document.getElementById('tileTesterLayersList');
  const addBtn = document.getElementById('tileTesterAddLayerBtn');

  if (!container) return;

  // Add layer button
  if (addBtn) {
    addBtn.addEventListener('click', addTileTesterLayer);
  }

  // Drag and drop
  let draggedItem = null;
  let draggedIndex = null;

  container.addEventListener('dragstart', function(e) {
    const layerItem = e.target.closest('.tester-layer-item');
    if (!layerItem) return;

    draggedItem = layerItem;
    draggedIndex = parseInt(layerItem.dataset.index);
    layerItem.classList.add('dragging');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerItem.dataset.layerId);
  });

  container.addEventListener('dragend', function(e) {
    if (draggedItem) {
      draggedItem.classList.remove('dragging');
      draggedItem = null;
      draggedIndex = null;
    }

    // Remove any drop indicators
    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  });

  container.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const layerItem = e.target.closest('.tester-layer-item');
    if (!layerItem || layerItem === draggedItem) return;

    // Remove previous indicators
    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    // Determine if dragging above or below
    const rect = layerItem.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    if (e.clientY < midY) {
      layerItem.classList.add('drag-over-top');
    } else {
      layerItem.classList.add('drag-over-bottom');
    }
  });

  container.addEventListener('drop', function(e) {
    e.preventDefault();

    const layerItem = e.target.closest('.tester-layer-item');
    if (!layerItem || !draggedItem) return;

    const targetIndex = parseInt(layerItem.dataset.index);
    if (targetIndex === draggedIndex) return;

    // Determine drop position
    const rect = layerItem.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    // Since UI is reversed, we need to flip the logic
    let newIndex;
    if (e.clientY < midY) {
      // Drop above (which is below in actual array since UI is reversed)
      newIndex = targetIndex + 1;
    } else {
      // Drop below (which is above in actual array)
      newIndex = targetIndex;
    }

    // Adjust for the removal of the original item
    if (draggedIndex < newIndex) {
      newIndex--;
    }

    reorderLayers(draggedIndex, newIndex);
  });
}
